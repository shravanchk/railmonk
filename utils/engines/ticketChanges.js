// What you can still change on a ticket you have already booked — and until when.
//
// Indian Railways allows five kinds of change to a reserved ticket, and each
// one has its own rule, its own deadline and its own counter. They are almost
// always described separately, which is how people end up cancelling a ticket
// that could simply have been moved. This engine evaluates all five at once,
// against one ticket and one clock, so the answer reads "you can still do
// this, until then, there, for this much".
//
//   1. Boarding point change — online or at a counter, free, once.
//   2. Name transfer         — only to listed relations or groups, in writing,
//                               at a counter, 24 or 48 hours ahead.
//   3. Date change           — postponement / preponement, counter tickets only.
//   4. Class upgrade         — fare difference, subject to a vacancy.
//   5. Journey extension     — fare for the extra distance, via the TTE.
//
// Each rule carries a `confidence`, the same idea as `ruleUpdates.js`:
//
//   • 'rule'      — read from the rule text Indian Railways publishes itself on
//                   indianrail.gov.in (Rule 213.9 on postponement/preponement,
//                   the change-of-name rules, the Tatkal scheme page).
//   • 'notice'    — an official railway press notice, not the rule text.
//   • 'reported'  — consistent across secondary sources, or from a draft
//                   clarification, but not a published rule we could read.
//   • 'announced' — announced by the Ministry, with no official confirmation
//                   that it is live. Never presented as available.
//
// Where a fee depends on a fare it comes from `trainFare.js`, the clerkage from
// `irctcCancellation.js`, the chart times from `chartPreparation.js` and the
// cost of doing it wrong from `penalties.js` — never restated, so this page
// cannot drift from the calculators it sits beside.
//
// Sources:
//   • Rule 213.9, revised w.e.f. 20 January 2006 — "Revision of rules for
//     postponement and preponement of journey", indianrail.gov.in (New Rules).
//   • Change in the Name of Passenger Holding Confirmed Reservation —
//     indianrail.gov.in, reproducing the Passengers (Change of Names) Rules
//     1990 (GSR 708(E), 16.8.1990; NCC clause GSR 704(E), 16.12.1997).
//   • Tatkal Scheme — indianrail.gov.in: "The facility of change of name is not
//     permitted on the bookings made under Tatkal scheme".
//   • Southern Railway press release 02/2026-27, 2 April 2026 — boarding point
//     change up to the second/final chart w.e.f. 1 April 2026 (previously 24
//     hours before departure). Announced by the Railways Minister on 24 March
//     2026. Confirmed/RAC only and once per PNR are as widely reported.
//   • Lok Sabha answer (2003) — an extended journey is charged as a fresh
//     journey; draft Railway Board clarification on charging (Oct 2022) — no
//     excess charge when a TTE permits an upgrade into a genuine vacancy.

const { CLASSES, estimateFare } = require('./trainFare');
const { clerkagePerPassenger } = require('./irctcCancellation');
const { computeChartTimes, FINAL_CHART_LEAD_MINUTES } = require('./chartPreparation');
const { assessPenalty, MIN_EXCESS_CHARGE } = require('./penalties');

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const IST_OFFSET_MINUTES = 330;

// ── Rule constants ──────────────────────────────────────────────────────────

/** Before 1 April 2026 a boarding point change closed 24 hours before departure. */
const BOARDING_CHANGE_EFFECTIVE = '2026-04-01';
const OLD_BOARDING_LEAD_HOURS = 24;

/** Rule 213.9(1)(a)(ii): postponing a confirmed ticket this early costs only a fresh reservation fee. */
const POSTPONE_FEE_ONLY_HOURS = 48;

/** Rule 213.9(2)(b): preponement must be asked for at least this long before the earlier train leaves. */
const PREPONE_MIN_HOURS = 6;

/** Rule 213.9(1)(b)(ii), via rule 213.6: how long after departure an RAC/WL ticket may still be postponed. */
const POSTPONE_AFTER_DEPARTURE = [
  { maxKm: 200, hours: 3 },
  { maxKm: 500, hours: 6 },
  { maxKm: Infinity, hours: 12 },
];

/** Change-of-name rules: who may receive a transferred reservation, and how far ahead to ask. */
const TRANSFER_REASONS = [
  {
    id: 'family',
    label: 'To a family member',
    leadHours: 24,
    requestBy: 'The passenger, in writing',
    to: 'Father, mother, brother, sister, son, daughter, husband or wife — no one else counts as family under the rule.',
    groupCap: false,
  },
  {
    id: 'government-duty',
    label: 'Government servant on duty',
    leadHours: 24,
    requestBy: 'The authority that approved the official journey, in writing',
    to: 'Another government servant proceeding on duty.',
    groupCap: false,
  },
  {
    id: 'student',
    label: 'Student of the same institution',
    leadHours: 48,
    requestBy: 'The head of the recognised educational institution, in writing',
    to: 'Another student of the same institution.',
    groupCap: true,
  },
  {
    id: 'marriage-party',
    label: 'Member of a marriage party',
    leadHours: 48,
    requestBy: 'The person deemed head of the marriage party, in writing',
    to: 'Any other person, in place of a member of the party.',
    groupCap: true,
  },
  {
    id: 'ncc',
    label: 'NCC cadet',
    leadHours: 24,
    requestBy: 'The officer heading the NCC group, in writing',
    to: 'Another cadet.',
    groupCap: true,
  },
];

const GROUP_CAP_PERCENT = 10;

const CONFIDENCE = {
  rule: {
    id: 'rule',
    label: 'From the published rules',
    note: 'Read from the rule text Indian Railways publishes on indianrail.gov.in.',
  },
  notice: {
    id: 'notice',
    label: 'Official railway notice',
    note: 'From an official railway press notice announcing the change, rather than the rule text itself.',
  },
  reported: {
    id: 'reported',
    label: 'As reported and applied',
    note: 'Consistent across reports and how staff apply it, but not a published rule we could read. Confirm at the counter or with the TTE.',
  },
  announced: {
    id: 'announced',
    label: 'Announced, not confirmed',
    note: 'Announced by the Ministry of Railways; we could not find an official notice confirming it is live.',
  },
};

const STATUSES = [
  { id: 'CNF', label: 'Confirmed (CNF)' },
  { id: 'RAC', label: 'RAC' },
  { id: 'WL', label: 'Waitlisted (WL)' },
];

const QUOTAS = [
  { id: 'general', label: 'General / ladies / other ordinary quota' },
  { id: 'tatkal', label: 'Tatkal or Premium Tatkal' },
  { id: 'concession', label: 'Concession ticket (Divyangjan, patient, student)' },
];

const CHANNELS = [
  { id: 'eticket', label: 'E-ticket (booked on IRCTC or an app)' },
  { id: 'counter', label: 'Counter ticket (PRS, printed)' },
];

const CHANGE_TYPES = [
  { id: 'boarding', label: 'Change boarding station' },
  { id: 'name', label: 'Transfer to another person' },
  { id: 'date', label: 'Change the travel date' },
  { id: 'upgrade', label: 'Upgrade to a higher class' },
  { id: 'extension', label: 'Travel beyond your destination' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * The current moment as an IST wall-clock instant, in the same UTC-backed form
 * `chartPreparation.js` uses, so it can be compared with a departure directly.
 */
const istWallNow = (date = new Date()) => new Date(date.getTime() + IST_OFFSET_MINUTES * MINUTE);

const postponeHoursAfterDeparture = (distanceKm) => {
  const km = Number(distanceKm);
  if (!Number.isFinite(km) || km <= 0) return null;
  return POSTPONE_AFTER_DEPARTURE.find((b) => km <= b.maxKm).hours;
};

const getTransferReason = (id) => TRANSFER_REASONS.find((r) => r.id === id) || null;

const fareOf = (classCode, distanceKm) => {
  const km = Number(distanceKm);
  if (!CLASSES[classCode] || !Number.isFinite(km) || km <= 0) return null;
  const r = estimateFare({ classCode, distanceKm: km, passengers: 1 });
  return r ? r.totalPerPassenger : null;
};

const classLabel = (code) => CLASSES[code]?.label || code;

// Verdicts, from the reader's point of view:
//   'available' — you can do this now, before `deadline`.
//   'closed'    — it was possible for this ticket, but the deadline has passed.
//   'not-allowed' — the rules do not permit it for this ticket at all.
//   'on-request' — possible, but only if a berth is free; there is no fixed deadline.
const verdictFor = (deadline, now) => (deadline && now && now.getTime() >= deadline.getTime() ? 'closed' : 'available');

// ── The five changes ────────────────────────────────────────────────────────

const assessBoarding = ({ status, channel, departure, now }) => {
  const base = {
    id: 'boarding',
    label: 'Change boarding station',
    confidence: 'notice',
    cost: { label: 'Free', amount: 0 },
  };

  if (status === 'WL') {
    return {
      ...base,
      verdict: 'not-allowed',
      reason: 'Only confirmed and RAC tickets can change their boarding station. A waitlisted ticket has no berth to move yet.',
      conditions: [],
    };
  }

  const deadline = departure ? new Date(departure.getTime() - FINAL_CHART_LEAD_MINUTES * MINUTE) : null;
  return {
    ...base,
    verdict: verdictFor(deadline, now),
    deadline,
    deadlineRule: `Until the final chart, about ${FINAL_CHART_LEAD_MINUTES} minutes before departure`,
    where:
      channel === 'eticket'
        ? 'Online: IRCTC website or Rail Connect app → My Transactions → Booked Ticket History → Change Boarding Point.'
        : 'At any PRS reservation counter, with the ticket.',
    conditions: [
      'Allowed once per PNR. There is no second change, and no changing back.',
      'The new station must be a stop on the same train between your original boarding station and your destination.',
      'Once changed, you cannot board at the original station — your berth there is no longer held for you.',
      'The fare is not reduced for the stretch you no longer travel.',
      `Before 1 April 2026 this closed ${OLD_BOARDING_LEAD_HOURS} hours before departure; many pages still say so.`,
    ],
  };
};

const assessName = ({ status, quota, transferReason, departure, now }) => {
  const reason = getTransferReason(transferReason) || TRANSFER_REASONS[0];
  const base = {
    id: 'name',
    label: 'Transfer to another person',
    confidence: 'rule',
    cost: { label: 'No transfer fee is prescribed by the rules', amount: null },
    transferReason: reason,
  };

  if (quota === 'tatkal') {
    return {
      ...base,
      verdict: 'not-allowed',
      reason: 'The Tatkal scheme rules say in terms that a change of name is not permitted on Tatkal bookings.',
      conditions: [],
    };
  }
  if (status !== 'CNF') {
    return {
      ...base,
      verdict: 'not-allowed',
      reason: 'The rule covers a passenger holding a confirmed reservation. An RAC or waitlisted ticket cannot be transferred.',
      conditions: [],
    };
  }
  if (quota === 'concession') {
    return {
      ...base,
      confidence: 'reported',
      verdict: 'not-allowed',
      reason:
        'A concession belongs to the person whose certificate earned it, so a concessional ticket is not transferred to anyone else.',
      conditions: [],
    };
  }

  const deadline = departure ? new Date(departure.getTime() - reason.leadHours * HOUR) : null;
  const conditions = [
    `Who may receive it: ${reason.to}`,
    `Who must ask: ${reason.requestBy}.`,
    'Granted only once per ticket.',
    'It cannot be done online. E-ticket holders take a printout of the ticket to the counter.',
    'Carry the original photo ID of both the booked passenger and the person who will travel, and proof of the relationship for a family transfer.',
  ];
  if (reason.groupCap) {
    conditions.push(`For a group, no more than ${GROUP_CAP_PERCENT}% of its total strength can be changed.`);
  }

  return {
    ...base,
    verdict: verdictFor(deadline, now),
    deadline,
    deadlineRule: `At least ${reason.leadHours} hours before scheduled departure`,
    where: 'In writing to the Chief Reservation Supervisor at a major station’s reservation office.',
    conditions,
  };
};

const assessDate = ({ status, quota, channel, classCode, distanceKm, departure, now }) => {
  const base = {
    id: 'date',
    label: 'Change the travel date',
    confidence: 'rule',
  };

  if (quota === 'tatkal') {
    return {
      ...base,
      verdict: 'not-allowed',
      reason: 'Rule 213.9 excludes Tatkal tickets from postponement and preponement, even on payment of the Tatkal charges.',
      cost: null,
      conditions: ['Cancelling is the only route, and a confirmed Tatkal ticket earns no refund when cancelled.'],
    };
  }

  if (channel === 'eticket') {
    return {
      ...base,
      verdict: 'not-allowed',
      reason:
        'Postponement and preponement are counter procedures under Rule 213.9. An e-ticket cannot be moved to another date at a counter or on IRCTC — it has to be cancelled and a new ticket booked.',
      cost: null,
      conditions: [
        'In October 2025 the Railways Minister announced that confirmed e-tickets could be moved to a new date online, paying only any fare difference, from January 2026. We have not found an official notice confirming it is live. If your IRCTC booking history shows a reschedule option, it has reached your account.',
      ],
      announced: { confidence: 'announced', label: 'Online date change for e-tickets' },
    };
  }

  const isConfirmed = status === 'CNF';
  const fee = isConfirmed ? CLASSES[classCode]?.reservationFee ?? null : Math.round(clerkagePerPassenger() * 100) / 100;
  const feeOnlyUntil = isConfirmed && departure ? new Date(departure.getTime() - POSTPONE_FEE_ONLY_HOURS * HOUR) : null;
  const lateHours = postponeHoursAfterDeparture(distanceKm);
  const latestPostpone = departure && lateHours ? new Date(departure.getTime() + lateHours * HOUR) : null;

  const conditions = [
    'Allowed once. The ticket cannot be moved a second time.',
    'Same destination, in the same class or a higher one, on any train — later for postponement, earlier for preponement.',
    'Only if a confirmed, RAC or waitlisted berth is available on the new train.',
    'Any fare difference between the two trains is refunded or collected.',
    `Preponement must be asked for at least ${PREPONE_MIN_HOURS} hours before the earlier train leaves, or before its chart, whichever is later.`,
    'If the moved ticket is later cancelled, you pay the charge the original would have attracted plus the charge on the new one.',
  ];

  const pastFeeOnly = Boolean(feeOnlyUntil && now && now.getTime() >= feeOnlyUntil.getTime());
  const lateChargeNote =
    'The 2006 rule set it at 25% of the fare within 24–4 hours and 50% inside 4 hours; cancellation slabs have been revised since, so confirm the figure at the counter.';

  let cost;
  if (isConfirmed && pastFeeOnly) {
    cost = {
      label: 'A cancellation charge on the original ticket',
      amount: null,
      detail: `You are inside ${POSTPONE_FEE_ONLY_HOURS} hours, so postponing now costs a cancellation charge rather than just a fresh reservation fee. ${lateChargeNote} Preponement still costs only the reservation fee.`,
    };
  } else if (isConfirmed) {
    cost = {
      label: fee !== null ? `₹${fee} fresh reservation fee per passenger` : 'A fresh reservation fee per passenger',
      amount: fee,
      detail: `Applies when you postpone ${POSTPONE_FEE_ONLY_HOURS} hours or more before departure, and to every preponement. Closer than ${POSTPONE_FEE_ONLY_HOURS} hours, postponement costs a cancellation charge on the original ticket instead. ${lateChargeNote}`,
    };
  } else {
    cost = {
      label: `₹${fee} clerkage per passenger`,
      amount: fee,
      detail: 'RAC and waitlisted tickets pay clerkage, not a cancellation charge, whenever they are moved.',
    };
  }

  // A confirmed ticket's first deadline is the end of the fee-only window; past
  // it the ticket can still be postponed, at a cancellation charge, up to the
  // same after-departure limit as RAC/WL. That limit is only reported when the
  // distance tells us which of the three applies.
  const lateRule = lateHours
    ? `Postponement until ${lateHours} hours after the train leaves`
    : 'Postponement until 3, 6 or 12 hours after the train leaves, depending on distance';
  const showFeeOnly = isConfirmed && !pastFeeOnly;
  const deadline = showFeeOnly ? feeOnlyUntil : latestPostpone;
  return {
    ...base,
    verdict: deadline ? verdictFor(deadline, now) : 'available',
    deadline,
    deadlineRule: showFeeOnly ? `Cheapest until ${POSTPONE_FEE_ONLY_HOURS} hours before departure` : lateRule,
    lateDeadline: showFeeOnly ? latestPostpone : null,
    lateRule: showFeeOnly ? lateRule : null,
    where: 'At a PRS reservation counter, during its working hours, with the original ticket.',
    cost,
    conditions,
  };
};

const assessUpgrade = ({ status, quota, classCode, upgradeClassCode, distanceKm }) => {
  const base = {
    id: 'upgrade',
    label: 'Upgrade to a higher class',
    confidence: 'reported',
  };

  if (quota === 'concession') {
    return {
      ...base,
      confidence: 'rule',
      verdict: 'not-allowed',
      reason: 'A concession ticket cannot be upgraded to a higher class by paying the difference. You would need a fresh ticket.',
      cost: null,
      conditions: [],
    };
  }

  let cost = { label: 'The fare difference between the two classes', amount: null };
  let penalty = null;
  const from = fareOf(classCode, distanceKm);
  const to = fareOf(upgradeClassCode, distanceKm);
  if (from !== null && to !== null) {
    if (to <= from) {
      cost = {
        label: `${classLabel(upgradeClassCode)} is not a higher class than ${classLabel(classCode)}`,
        amount: 0,
      };
    } else {
      cost = {
        label: `About ₹${to - from} per passenger`,
        amount: to - from,
        estimated: true,
        detail: `${classLabel(upgradeClassCode)} costs about ₹${to} over ${distanceKm} km against about ₹${from} for ${classLabel(classCode)}, reservation fee and superfast charge included.`,
      };
      const p = assessPenalty({
        scenarioId: 'higher-class',
        classCode: upgradeClassCode,
        ticketedClassCode: classCode,
        distanceKm: Number(distanceKm),
      });
      if (p) penalty = { perPassenger: p.perPassenger, excessCharge: p.excessCharge };
    }
  }

  const conditions = [
    'Before the journey: ask at a reservation counter to move to a higher class, paying the difference, if a berth is available.',
    'On the train: ask the TTE first. If a berth in the higher class is vacant all the way to your destination, you pay only the difference — no excess charge.',
    `Moving into a higher-class coach without the TTE’s permission is treated as travelling without a proper ticket: the difference plus an excess charge of at least ₹${MIN_EXCESS_CHARGE}.`,
    'Free auto-upgradation is separate: it only applies if you ticked “consider for auto upgradation” when booking, and the system does it, not the TTE.',
  ];
  if (status === 'WL') {
    conditions.unshift('A waitlisted e-ticket that is still waitlisted at charting is cancelled automatically, so there is no ticket left to upgrade.');
  }

  return {
    ...base,
    verdict: 'on-request',
    deadlineRule: 'Until you reach your destination, if a berth is free',
    where: 'At a reservation counter before the journey, or with the TTE on board.',
    cost,
    penalty,
    conditions,
  };
};

const assessExtension = ({ status, classCode, extraKm }) => {
  const base = {
    id: 'extension',
    label: 'Travel beyond your destination',
    confidence: 'reported',
  };

  let cost = { label: 'The fare for the extra distance, charged as a fresh journey', amount: null };
  let penalty = null;
  const extra = fareOf(classCode, extraKm);
  if (extra !== null) {
    cost = {
      label: `About ₹${extra} per passenger for ${extraKm} km more`,
      amount: extra,
      estimated: true,
      detail:
        'The extra stretch is priced as a journey of its own, so it costs more than the same kilometres would have inside one longer ticket. Booking through is always cheaper when you know in advance.',
    };
    const p = assessPenalty({
      scenarioId: 'beyond-destination',
      classCode,
      distanceKm: Number(extraKm),
      ticketedDistanceKm: 0,
    });
    if (p) penalty = { perPassenger: p.perPassenger, excessCharge: p.excessCharge };
  }

  const conditions = [
    'Tell the TTE before the train reaches your ticketed destination. They issue an excess fare ticket (EFT) for the extra stretch, payable by card or cash.',
    'Your berth is only yours to the original destination. Beyond it you get whatever is vacant, possibly in a different coach.',
    `Carrying on past your station without telling anyone is treated as travelling without a ticket for that stretch: the fare plus an excess charge of at least ₹${MIN_EXCESS_CHARGE}.`,
  ];
  if (status === 'WL') {
    conditions.unshift('A ticket still waitlisted at charting does not entitle you to board, so there is nothing to extend.');
  }

  return {
    ...base,
    verdict: 'on-request',
    deadlineRule: 'Before the train reaches your ticketed destination',
    where: 'With the TTE on board.',
    cost,
    penalty,
    conditions,
  };
};

/**
 * Evaluate every change that could be made to one ticket.
 *
 * @param {{
 *   departureDate?: string, departureTime?: string,   // scheduled departure, IST
 *   now?: Date,                                       // IST wall-clock instant (see istWallNow)
 *   channel?: 'eticket' | 'counter',
 *   status?: 'CNF' | 'RAC' | 'WL',
 *   quota?: 'general' | 'tatkal' | 'concession',
 *   transferReason?: string,
 *   classCode?: string, upgradeClassCode?: string,
 *   distanceKm?: number, extraKm?: number
 * }} input
 *
 * @returns {{ departure: Date|null, firstChart: Date|null, changes: object[], openCount: number }}
 */
const assessTicketChanges = ({
  departureDate,
  departureTime,
  now = null,
  channel = 'eticket',
  status = 'CNF',
  quota = 'general',
  transferReason = 'family',
  classCode = 'SL',
  upgradeClassCode = '3A',
  distanceKm,
  extraKm,
} = {}) => {
  const charts = departureDate && departureTime ? computeChartTimes({ departureDate, departureTime }) : null;
  const departure = charts ? charts.departure : null;
  const ctx = {
    status,
    quota,
    channel,
    transferReason,
    classCode,
    upgradeClassCode,
    distanceKm,
    extraKm,
    departure,
    now,
  };

  const changes = [
    assessBoarding(ctx),
    assessName(ctx),
    assessDate(ctx),
    assessUpgrade(ctx),
    assessExtension(ctx),
  ].map((c) => {
    const left = c.deadline && now ? c.deadline.getTime() - now.getTime() : null;
    return { ...c, msLeft: left };
  });

  return {
    departure,
    firstChart: charts ? charts.firstChart : null,
    changes,
    openCount: changes.filter((c) => c.verdict === 'available' || c.verdict === 'on-request').length,
  };
};

/** "2 days 4 hours", "3 hours 10 minutes", "25 minutes" — for a positive duration. */
const formatTimeLeft = (ms) => {
  if (!Number.isFinite(ms) || ms <= 0) return '';
  const totalMinutes = Math.floor(ms / MINUTE);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const part = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  if (days > 0) return hours ? `${part(days, 'day')} ${part(hours, 'hour')}` : part(days, 'day');
  if (hours > 0) return minutes ? `${part(hours, 'hour')} ${part(minutes, 'minute')}` : part(hours, 'hour');
  return part(Math.max(1, minutes), 'minute');
};

module.exports = {
  BOARDING_CHANGE_EFFECTIVE,
  OLD_BOARDING_LEAD_HOURS,
  POSTPONE_FEE_ONLY_HOURS,
  PREPONE_MIN_HOURS,
  POSTPONE_AFTER_DEPARTURE,
  TRANSFER_REASONS,
  GROUP_CAP_PERCENT,
  CONFIDENCE,
  STATUSES,
  QUOTAS,
  CHANNELS,
  CHANGE_TYPES,
  istWallNow,
  postponeHoursAfterDeparture,
  getTransferReason,
  assessTicketChanges,
  formatTimeLeft,
};
