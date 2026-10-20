// One read ticket → everything the rules say about it, against one clock.
//
// This engine restates no rule. The refund at each cut-off comes from
// irctcCancellation, chart times from chartPreparation, TDR deadlines from the
// tdrRules table; this file only decides which of them apply to the ticket in
// hand and when. The page (components/rail/ticketReader) turns the result into
// words in English or Hindi, so everything here is codes, numbers and dates.
//
// All times are wall-clock IST in UTC-backed Dates, the convention every
// engine here shares (see chartPreparation.js). Pass `now` from
// ticketChanges.istWallNow().
//
// What this deliberately does not do: tell anyone their PNR's live status.
// The statuses are the ones printed on the ticket, as of when it was printed.

const { computeCancellationRefund } = require('./irctcCancellation');
const { computeChartTimes, wallClock } = require('./chartPreparation');
const { getScenario } = require('./tdrRules');
const { CHARGE_CLASS, AC_CLASSES, effectiveStatus, quotaRecord } = require('./ticketParser');

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** The cut-offs at which a refund changes, in hours before departure. */
const CUTOFFS = {
  confirmed: [72, 24, 8],
  'rac-wl': [0.5],
  'tatkal-confirmed': [],
};

/** TDR filing windows that count from the train's actual arrival. */
const AC_FAILURE_TDR_HOURS = 20;
const PARTY_TDR_HOURS = 72;

/** The ticket type irctcCancellation expects, from a printed status and the quota. */
const ticketTypeFor = (status, tatkal) => {
  if (!status) return null;
  if (status.kind === 'CNF') return tatkal ? 'tatkal-confirmed' : 'confirmed';
  if (status.kind === 'RAC') return tatkal ? 'tatkal-rac-wl' : 'rac';
  if (status.kind === 'WL') return tatkal ? 'tatkal-rac-wl' : 'waitlisted';
  return null; // cancelled, or a code we do not price (NOSB, NR)
};

const cutoffFamily = (ticketType) => {
  if (ticketType === 'confirmed') return 'confirmed';
  if (ticketType === 'tatkal-confirmed') return 'tatkal-confirmed';
  return 'rac-wl';
};

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Apply what the reader typed over what the ticket printed. Only fields the
 * page lets people edit are accepted, and blanks leave the ticket alone.
 */
const applyEdits = (ticket, edits = {}) => {
  if (!ticket) return null;
  const next = { ...ticket, departure: { ...(ticket.departure || {}) }, fare: { ...(ticket.fare || {}) } };
  if (edits.departureDate) next.departure.date = edits.departureDate;
  if (edits.departureTime) next.departure.time = edits.departureTime;
  if (edits.classCode) next.classCode = edits.classCode;
  if (edits.quotaCode) next.quota = quotaRecord(edits.quotaCode) || next.quota;
  if (Number(edits.fare) > 0) next.fare.ticket = Number(edits.fare);
  return next;
};

/** Passengers grouped by the ticket type their status puts them in. */
const groupPassengers = (ticket) => {
  const tatkal = Boolean(ticket.quota && ticket.quota.tatkal);
  const groups = new Map();
  let excluded = 0;
  (ticket.passengers || []).forEach((p) => {
    const type = ticketTypeFor(effectiveStatus(p), tatkal);
    if (!type) {
      excluded += 1;
      return;
    }
    groups.set(type, (groups.get(type) || 0) + 1);
  });
  return { groups: [...groups.entries()].map(([ticketType, passengers]) => ({ ticketType, passengers })), excluded };
};

/** The refund for the whole ticket at a given number of hours before departure. */
const refundAt = ({ groups, classCode, fare, hours }) => {
  const total = groups.reduce((n, g) => n + g.passengers, 0);
  const parts = groups.map((g) => {
    const share = round2((fare * g.passengers) / total);
    const r = computeCancellationRefund({ classCode, ticketType: g.ticketType, fare: share, hoursBeforeDeparture: hours, passengers: g.passengers });
    return { ...g, fare: share, refund: r.refund, deduction: r.deduction, rule: r.rule, minChargeApplied: r.minChargeApplied };
  });
  return {
    refund: round2(parts.reduce((n, p) => n + p.refund, 0)),
    deduction: round2(parts.reduce((n, p) => n + p.deduction, 0)),
    parts,
  };
};

/**
 * The refund timeline: one band per stretch of time in which the refund holds
 * steady, ending at departure. Bands come from the cut-offs of every status on
 * the ticket, so a confirmed-plus-RAC ticket gets 72 h, 24 h, 8 h and 30 min.
 */
const refundTimeline = ({ groups, classCode, fare, departure, now }) => {
  const cuts = [...new Set(groups.flatMap((g) => CUTOFFS[cutoffFamily(g.ticketType)]))].sort((a, b) => b - a);
  const edges = [Infinity, ...cuts, 0];
  const hoursLeft = now ? (departure.getTime() - now.getTime()) / HOUR : null;

  const bands = [];
  for (let i = 0; i < edges.length - 1; i += 1) {
    const hi = edges[i];
    const lo = edges[i + 1];
    // Any point inside a band gives that band's refund; the engine's rules are
    // flat between cut-offs.
    const probe = hi === Infinity ? lo + 1 : (hi + lo) / 2;
    const r = refundAt({ groups, classCode, fare, hours: probe });
    bands.push({
      fromHours: hi,
      untilHours: lo,
      starts: hi === Infinity ? null : new Date(departure.getTime() - hi * HOUR),
      ends: new Date(departure.getTime() - lo * HOUR),
      ...r,
      current: hoursLeft !== null && hoursLeft >= lo && hoursLeft < hi,
      passed: hoursLeft !== null && hoursLeft < lo,
    });
  }

  // Neighbouring bands that pay the same are one band to a reader.
  const merged = [];
  bands.forEach((b) => {
    const prev = merged[merged.length - 1];
    if (prev && prev.refund === b.refund && prev.deduction === b.deduction) {
      merged[merged.length - 1] = { ...prev, untilHours: b.untilHours, ends: b.ends, current: prev.current || b.current, passed: b.passed };
    } else {
      merged.push(b);
    }
  });
  return merged;
};

/**
 * TDR situations this ticket could end up in, with the deadline where the
 * ticket gives enough to compute one. `at` is null when the deadline depends
 * on something that has not happened yet (the train's actual departure).
 */
const tdrDeadlines = ({ ticket, departure, arrival, charts, groups, allWaitlisted }) => {
  const kinds = new Set(groups.map((g) => g.ticketType));
  const isAc = AC_CLASSES.has(ticket.classCode);
  const passengers = groups.reduce((n, g) => n + g.passengers, 0);
  const out = [];
  const add = (scenarioId, at, basis) => out.push({ scenarioId, scenario: getScenario(scenarioId), at, basis });

  add('train-cancelled', null, 'automatic');
  add('delay-3h', departure, 'before-actual-departure');
  if (kinds.has('rac') || kinds.has('tatkal-rac-wl')) add('rac-not-travelled', new Date(departure.getTime() - 30 * MINUTE), 'scheduled');
  // Only a fully waitlisted e-ticket is dropped at charting; on a party ticket
  // with someone confirmed or RAC, the waitlisted names stay on it.
  if (allWaitlisted) add('wl-not-travelled', charts ? charts.firstChart : null, 'automatic');
  if (isAc) add('ac-failure', arrival ? new Date(arrival.getTime() + AC_FAILURE_TDR_HOURS * HOUR) : null, 'after-arrival');
  if (passengers > 1) add('partial-party-travelled', arrival ? new Date(arrival.getTime() + PARTY_TDR_HOURS * HOUR) : null, 'after-arrival');
  return out;
};

/**
 * @param {object} ticket       from ticketParser.parseTicketText (after applyEdits)
 * @param {{ now?: Date, originDate?: string, originTime?: string }} [opts]
 *   originDate/originTime: the train's departure from its originating station,
 *   if the reader knows it. Charts count from there, not from where they board.
 */
const buildJourneyCard = (ticket, { now = null, originDate = '', originTime = '' } = {}) => {
  if (!ticket) return null;
  const departure = ticket.departure ? wallClock(ticket.departure.date, ticket.departure.time) : null;
  const arrival =
    ticket.arrival && ticket.arrival.date && ticket.arrival.time ? wallClock(ticket.arrival.date, ticket.arrival.time) : null;

  const { groups, excluded } = groupPassengers(ticket);
  const counts = (ticket.passengers || []).reduce((acc, p) => {
    const s = effectiveStatus(p);
    const k = s ? s.kind : 'OTHER';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const active = (counts.CNF || 0) + (counts.RAC || 0) + (counts.WL || 0);
  const allWaitlisted = active > 0 && counts.WL === active;
  const chargeClass = CHARGE_CLASS[ticket.classCode] || null;
  const fare = ticket.fare && ticket.fare.ticket;

  // Chart times: from the origin departure when given; otherwise from the
  // ticket's own departure, flagged, because a train boarded mid-route has its
  // chart prepared against an earlier time than the one on the ticket.
  let charts = null;
  let chartBasis = null;
  if (originDate && originTime) {
    charts = computeChartTimes({ departureDate: originDate, departureTime: originTime });
    chartBasis = charts ? 'origin' : null;
  }
  if (!charts && departure) {
    charts = computeChartTimes({ departureDate: ticket.departure.date, departureTime: ticket.departure.time });
    chartBasis = 'ticket';
  }
  // The ERS prints the train's start date. When it is earlier than the
  // passenger's departure the train is already running when they board.
  const startedEarlier = Boolean(ticket.startDate && ticket.departure && ticket.departure.date && ticket.startDate < ticket.departure.date);
  const boardsAwayFromBookedStation = Boolean(
    ticket.from && ticket.boarding && ticket.from.code && ticket.boarding.code && ticket.from.code !== ticket.boarding.code
  );

  const canPrice = Boolean(departure && chargeClass && fare && groups.length && ticket.quota);
  const timeline = canPrice ? refundTimeline({ groups, classCode: chargeClass, fare, departure, now }) : [];
  const departed = Boolean(departure && now && now.getTime() >= departure.getTime());
  const currentIndex = timeline.findIndex((b) => b.current);
  const currentBand = currentIndex === -1 ? null : timeline[currentIndex];
  // Bands are merged when they pay the same, so the next band is always a drop.
  const nextDrop = currentIndex === -1 ? null : timeline[currentIndex + 1] || null;


  return {
    departure,
    arrival,
    departed,
    counts,
    allWaitlisted,
    excludedPassengers: excluded,
    // Fare is split evenly between passengers when statuses differ. A child
    // fare on the same PNR would make that split slightly wrong.
    fareSplit: groups.length > 1,
    chargeClass,
    canPrice,
    unpricedReason: canPrice
      ? null
      : !departure
        ? 'departure'
        : !ticket.quota
          ? 'quota'
          : !chargeClass
            ? 'class'
            : !fare
              ? 'fare'
              : 'passengers',
    refundNow: departed ? null : currentBand,
    nextDrop: departed ? null : nextDrop,
    timeline,
    charts,
    chartBasis,
    startedEarlier,
    boardsAwayFromBookedStation,
    tdr: departure ? tdrDeadlines({ ticket, departure, arrival, charts, groups, allWaitlisted }) : [],
  };
};

/**
 * Calendar events for a card. Wall-clock ISO starts; the page writes the
 * titles and descriptions in the reader's language.
 */
const calendarEvents = (card) => {
  if (!card || !card.departure) return [];
  const iso = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
  };
  const events = [];
  const travelMinutes = card.arrival ? Math.round((card.arrival.getTime() - card.departure.getTime()) / MINUTE) : 60;
  events.push({ id: 'journey', startWallIst: iso(card.departure), durationMinutes: Math.max(30, travelMinutes), alarmMinutesBefore: [24 * 60, 3 * 60] });
  if (card.charts) {
    events.push({ id: 'chart', startWallIst: iso(card.charts.firstChart), durationMinutes: 15, alarmMinutesBefore: [10] });
  }
  // A fully waitlisted e-ticket is refunded automatically at the chart, so its
  // 30-minute cut-off is never the one that bites.
  if (card.nextDrop && card.refundNow && !card.allWaitlisted) {
    events.push({ id: 'refund-drop', startWallIst: iso(card.refundNow.ends), durationMinutes: 15, alarmMinutesBefore: [120] });
  }
  return events;
};

module.exports = {
  CUTOFFS,
  AC_FAILURE_TDR_HOURS,
  PARTY_TDR_HOURS,
  ticketTypeFor,
  applyEdits,
  groupPassengers,
  buildJourneyCard,
  calendarEvents,
};
