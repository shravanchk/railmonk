// Who still pays less on an Indian train, and how much less.
//
// Two things get muddled together as "the discount" and neither is what most
// pages on the subject say it is:
//
//   1. The **child fare rule**. Arithmetic, entirely determinate, and changed
//      on 21 April 2016 in a way half the internet still has not caught up
//      with: a child aged 5 to under 12 pays half fare only if they take no
//      berth of their own. Ask for a berth and the fare is an adult's.
//
//   2. A **concession** proper. Roughly fifty categories existed until March
//      2020; all of them were withdrawn, and only Divyangjan, eleven patient
//      categories and students were brought back. The senior citizen
//      concession — the one people still ask for by name — was not.
//
// Both work the same way once you know the general rule, and that rule is the
// reason this engine exists rather than a table of percentages: **a concession
// applies to the basic fare only.** The reservation fee, the superfast
// surcharge and GST are charged in full. A "75% concession" therefore never
// takes 75% off the ticket, and on a short journey in an AC class it can take
// closer to half that. Showing the two halves separately is the whole point.
//
// Fares come from `trainFare.js` rather than being restated, so a concession
// and the fare it discounts can never drift apart. Everything fare-derived
// inherits that engine's ~10% uncertainty and is flagged `estimated: true`.
//
// Sources:
//   • General Rules for Concession, Indian Railways (IRCA Coaching Tariff
//     Part I Vol. II) — https://refunds.indianrail.gov.in/con_rules/conrules_general.pdf
//     Basic-fare-only rule, the 300 km minimum and its exemptions, one
//     concession at a time, counter-issue only.
//   • PIB, Ministry of Railways — revised child fare rule effective
//     21 April 2016.
//   • Category percentages are reproduced from the IRCA table as published on
//     secondary sources and corroborated across two of them; they carry
//     `confidence: 'reported'` and the UI says so.

const { CLASSES, estimateFare, roundTo5 } = require('./trainFare');

// ── The rules that decide whether you get a concession at all ───────────────

/** Minimum journey length for a concession, unless the category is exempt. */
const MIN_DISTANCE_KM = 300;

/** Child fare boundaries. Age is reckoned on the date of the journey. */
const CHILD_FREE_UNDER = 5;
const CHILD_FARE_UNDER = 12;
const CHILD_HALF_SHARE = 0.5;
const CHILD_RULE_EFFECTIVE = '2016-04-21';

/** When the general concession withdrawal took effect. Nothing has restored it. */
const CONCESSIONS_WITHDRAWN = '2020-03-20';

// Mirrors the `confidence` vocabulary used in ruleUpdates.js and penalties.js.
const CONFIDENCE = {
  rule: {
    id: 'rule',
    label: 'From the published rules',
    note: 'Taken from the Indian Railways general rules for concession and the 2016 child fare notification.',
  },
  reported: {
    id: 'reported',
    label: 'Reproduced from the tariff table',
    note: 'The percentage comes from the IRCA Coaching Tariff as reproduced by secondary sources rather than a circular we could retrieve. Confirm the exact figure at the reservation counter.',
  },
};

const GENERAL_RULES = [
  {
    id: 'basic-fare-only',
    label: 'Concession applies to the basic fare only',
    detail:
      'The reservation fee, superfast surcharge and GST are charged in full. Where a concession is allowed on a Rajdhani, Shatabdi or Jan Shatabdi, it applies instead to the all-inclusive charge including catering.',
  },
  {
    id: 'min-distance',
    label: `Minimum journey of ${MIN_DISTANCE_KM} km`,
    detail:
      'Waived for students, blind and orthopaedically handicapped passengers, and for the listed patient categories — which is most of the people who still hold a concession.',
  },
  {
    id: 'mail-express-basis',
    label: 'Always calculated on Mail/Express fares',
    detail: 'Whatever the train actually is, the concessional fare is worked out from the Mail/Express scale.',
  },
  {
    id: 'one-at-a-time',
    label: 'Only one concession at a time',
    detail: 'Two entitlements cannot be combined, and the passenger chooses which one to use.',
  },
  {
    id: 'counter-only',
    label: 'Granted at the counter, never on the train',
    detail:
      'Concessional tickets are issued at reservation and booking offices. A ticket checker cannot grant one on board, however genuine the entitlement, and a concession ticket cannot be upgraded to a higher class by paying the difference.',
  },
  {
    id: 'certificate',
    label: 'The certificate has to exist before you book',
    detail:
      'Every surviving category needs paperwork — a railway-issued Divyangjan photo ID, a hospital certificate on the prescribed form, or a certificate from the institution — and documents issued outside India are not accepted.',
  },
];

// ── Categories ──────────────────────────────────────────────────────────────
//
// `rates` is percent off the basic fare, per class code. A class absent from
// the map carries no concession for that category — 3E and EC appear in none
// of them, which is itself worth telling the reader rather than hiding.
//
// `escort: 'same'` means one accompanying attendant gets the same concession;
// `'capped'` means the escort's concession is capped at 75% where the
// passenger's own is 100%.

const CATEGORIES = [
  {
    id: 'adult',
    group: 'general',
    label: 'Adult — no concession',
    blurb: 'The reference fare everything else is measured against.',
    rates: null,
    confidence: 'rule',
  },

  // Children — arithmetic, not a concession, and not subject to the 300 km rule.
  {
    id: 'child-under-5',
    group: 'child',
    label: 'Child under 5, no berth',
    blurb: 'Travels free and is not issued a ticket. No berth of their own — they share yours.',
    free: true,
    minDistanceExempt: true,
    tatkal: true,
    proof: 'Declare the age at booking. Carry an Aadhaar card or birth certificate for a child near the 5-year line.',
    confidence: 'rule',
  },
  {
    id: 'child-under-5-berth',
    group: 'child',
    label: 'Child under 5, with a berth',
    blurb: 'A berth for an under-5 is optional, and booking one costs the full adult fare.',
    rates: null,
    minDistanceExempt: true,
    tatkal: true,
    proof: 'Booked as an ordinary passenger at full fare.',
    confidence: 'rule',
  },
  {
    id: 'child-5-11',
    group: 'child',
    label: 'Child 5 to under 12, no berth (NOSB)',
    blurb: 'Half the basic fare, and the child shares your berth. Other charges are levied in full.',
    childHalf: true,
    minDistanceExempt: true,
    tatkal: true,
    proof: 'Declared at booking as "no separate berth". Age is reckoned on the date of the journey.',
    confidence: 'rule',
  },
  {
    id: 'child-5-11-berth',
    group: 'child',
    label: 'Child 5 to under 12, with a berth',
    blurb: 'Full adult fare since 21 April 2016 — the change that ended half fare with a berth.',
    rates: null,
    minDistanceExempt: true,
    tatkal: true,
    proof: 'Booked as an ordinary passenger at full fare.',
    confidence: 'rule',
  },

  // Divyangjan — four categories.
  {
    id: 'divyangjan-orthopaedic',
    group: 'divyangjan',
    label: 'Orthopaedically handicapped / paraplegic',
    blurb: 'For passengers who cannot travel without an escort. One escort travels on the same concession.',
    rates: { '2S': 75, SL: 75, '3A': 75, CC: 75, '2A': 50, '1A': 50 },
    escort: 'same',
    minDistanceExempt: true,
    tatkal: true,
    proof: 'Railway-issued Divyangjan concession photo ID, registered against your IRCTC account before booking.',
    confidence: 'reported',
  },
  {
    id: 'divyangjan-blind',
    group: 'divyangjan',
    label: 'Blindness',
    blurb: 'Travelling alone or with an escort. One escort travels on the same concession.',
    rates: { '2S': 75, SL: 75, '3A': 75, CC: 75, '2A': 50, '1A': 50 },
    escort: 'same',
    minDistanceExempt: true,
    tatkal: true,
    proof: 'Railway-issued Divyangjan concession photo ID, registered against your IRCTC account before booking.',
    confidence: 'reported',
  },
  {
    id: 'divyangjan-intellectual',
    group: 'divyangjan',
    label: 'Intellectual disability',
    blurb: 'Added as a separate category with effect from 1 June 2025, on the same rates as the orthopaedic category.',
    rates: { '2S': 75, SL: 75, '3A': 75, CC: 75, '2A': 50, '1A': 50 },
    escort: 'same',
    minDistanceExempt: true,
    tatkal: true,
    proof: 'Railway-issued Divyangjan concession photo ID, registered against your IRCTC account before booking.',
    confidence: 'reported',
  },
  {
    id: 'divyangjan-hearing-speech',
    group: 'divyangjan',
    label: 'Hearing and speech impairment (both together)',
    blurb: 'A narrower entitlement than the other three — Sleeper and Second Sitting only, at half fare.',
    rates: { '2S': 50, SL: 50 },
    escort: 'same',
    minDistanceExempt: false,
    tatkal: true,
    proof: 'Railway-issued Divyangjan concession photo ID, registered against your IRCTC account before booking.',
    confidence: 'reported',
  },

  // Patients — eleven categories; the common ones are modelled here.
  {
    id: 'patient-cancer',
    group: 'patient',
    label: 'Cancer patient',
    blurb: 'Travelling for treatment or check-up. Free in Sleeper and AC 3-Tier; an escort is capped at 75% there.',
    rates: { '2S': 75, CC: 75, SL: 100, '3A': 100, '2A': 50, '1A': 50 },
    escort: 'capped',
    minDistanceExempt: true,
    tatkal: true,
    proof: 'Certificate from the treating hospital on the prescribed form, naming the journey.',
    confidence: 'reported',
  },
  {
    id: 'patient-kidney',
    group: 'patient',
    label: 'Kidney patient (transplant or dialysis)',
    blurb: 'For travel to and from treatment, with or without an escort.',
    rates: { '2S': 75, SL: 75, '3A': 75, CC: 75, '2A': 50, '1A': 50 },
    escort: 'same',
    minDistanceExempt: true,
    tatkal: true,
    proof: 'Certificate from the treating hospital on the prescribed form.',
    confidence: 'reported',
  },
  {
    id: 'patient-heart',
    group: 'patient',
    label: 'Heart patient (surgery or treatment)',
    blurb: 'For travel to and from treatment, with or without an escort.',
    rates: { '2S': 75, SL: 75, '3A': 75, CC: 75, '2A': 50, '1A': 50 },
    escort: 'same',
    minDistanceExempt: true,
    tatkal: false,
    proof: 'Certificate from the treating hospital on the prescribed form.',
    confidence: 'reported',
  },
  {
    id: 'patient-thalassaemia',
    group: 'patient',
    label: 'Thalassaemia major',
    blurb: 'For travel to and from treatment, with or without an escort.',
    rates: { '2S': 75, SL: 75, '3A': 75, CC: 75, '2A': 50, '1A': 50 },
    escort: 'same',
    minDistanceExempt: true,
    tatkal: true,
    proof: 'Certificate from the treating hospital on the prescribed form.',
    confidence: 'reported',
  },
  {
    id: 'patient-tb',
    group: 'patient',
    label: 'TB or lupus vulgaris patient',
    blurb: 'Sleeper and Second Sitting only, for travel to and from treatment.',
    rates: { '2S': 75, SL: 75 },
    escort: 'same',
    minDistanceExempt: true,
    tatkal: false,
    proof: 'Certificate from the treating hospital on the prescribed form.',
    confidence: 'reported',
  },
  {
    id: 'patient-anaemia',
    group: 'patient',
    label: 'Sickle cell or aplastic anaemia',
    blurb: 'Half fare, and the only patient category that reaches AC 2-Tier at the same rate as Sleeper.',
    rates: { SL: 50, CC: 50, '3A': 50, '2A': 50 },
    escort: 'same',
    minDistanceExempt: true,
    tatkal: false,
    proof: 'Certificate from the treating hospital on the prescribed form.',
    confidence: 'reported',
  },

  // Students.
  {
    id: 'student-general',
    group: 'student',
    label: 'Student — home town or educational tour',
    blurb: 'Half the basic fare in Sleeper and Second Sitting. No AC class carries a student concession.',
    rates: { '2S': 50, SL: 50 },
    minDistanceExempt: true,
    tatkal: false,
    proof: 'Certificate from the head of the institution, on the prescribed form, before booking.',
    confidence: 'reported',
  },
  {
    id: 'student-sc-st',
    group: 'student',
    label: 'Student (SC/ST) — home town or educational tour',
    blurb: '75% off the basic fare in Sleeper and Second Sitting.',
    rates: { '2S': 75, SL: 75 },
    minDistanceExempt: true,
    tatkal: false,
    proof: 'Certificate from the head of the institution together with proof of category.',
    confidence: 'reported',
  },
  {
    id: 'student-research',
    group: 'student',
    label: 'Research scholar up to 35',
    blurb: 'Half the basic fare in Sleeper and Second Sitting, for travel connected to the research itself.',
    rates: { '2S': 50, SL: 50 },
    minDistanceExempt: true,
    tatkal: false,
    proof: 'Certificate from the institution stating the purpose of the journey.',
    confidence: 'reported',
  },
  {
    id: 'student-exam',
    group: 'student',
    label: 'UPSC or SSC main examination candidate',
    blurb: 'Half the basic fare in Second Sitting, for travel to the examination.',
    rates: { '2S': 50 },
    minDistanceExempt: true,
    tatkal: false,
    proof: 'The examination call letter.',
    confidence: 'reported',
  },
];

const GROUPS = [
  { id: 'child', label: 'Children', blurb: 'Age decides the fare, and a berth decides whether the age matters.' },
  { id: 'divyangjan', label: 'Divyangjan', blurb: 'Four categories, each needing a railway-issued concession ID.' },
  { id: 'patient', label: 'Patients', blurb: 'Eleven specified conditions, on a certificate from the treating hospital.' },
  { id: 'student', label: 'Students', blurb: 'Sleeper and Second Sitting only, on an institutional certificate.' },
];

// Categories withdrawn in March 2020 and never restored. Carried deliberately:
// the commonest question this tool will be asked is about the first one.
const WITHDRAWN = [
  { id: 'senior', label: 'Senior citizens', was: '40% for men aged 60+, 50% for women aged 58+' },
  { id: 'journalist', label: 'Accredited journalists', was: '30% in most classes' },
  { id: 'teacher', label: 'National award teachers', was: '50% in Second and Sleeper' },
  { id: 'sportsperson', label: 'Sportspersons', was: '50–75% depending on the level of competition' },
  { id: 'youth', label: 'Unemployed youth travelling to interviews', was: '50% in Second Sitting' },
  { id: 'doctor', label: 'Allopathic doctors', was: '10% in all classes' },
];

const CATEGORY_INDEX = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const getCategory = (id) => CATEGORY_INDEX[id] || null;
const categoriesInGroup = (groupId) => CATEGORIES.filter((c) => c.group === groupId);

/** Percent off the basic fare for a category in a class, or 0 if none applies. */
const rateFor = (category, classCode) => {
  if (!category || !category.rates) return 0;
  return category.rates[classCode] || 0;
};

/**
 * What one passenger pays.
 *
 * @param {{
 *   categoryId: string, classCode?: string, distanceKm: number,
 *   trainCategory?: string, escort?: boolean
 * }} input
 *
 * @returns {null | {
 *   category, classCode: string, distanceKm: number,
 *   fullFare: number, payable: number, saving: number,
 *   percent: number, effectivePercent: number,
 *   admissible: boolean, blockedReason: string|null,
 *   breakdown: Array<{ label: string, amount: number, note?: string }>,
 *   notes: string[], estimated: boolean
 * }}
 */
const assessFare = ({ categoryId = 'adult', classCode = 'SL', distanceKm, trainCategory = 'superfast', escort = false } = {}) => {
  const category = getCategory(categoryId);
  const km = Number(distanceKm);
  if (!category || !CLASSES[classCode] || !Number.isFinite(km) || km <= 0) return null;

  const fare = estimateFare({ classCode, distanceKm: km, trainCategory, passengers: 1 });
  if (!fare) return null;

  const notes = [];
  const breakdown = [];
  const fullFare = fare.totalPerPassenger;
  const otherCharges = fare.reservationFee + fare.superfastCharge;

  // A child under 5 without a berth is not issued a ticket at all.
  if (category.free) {
    return {
      category,
      classCode,
      distanceKm: km,
      fullFare,
      payable: 0,
      saving: fullFare,
      percent: 100,
      effectivePercent: 100,
      admissible: true,
      blockedReason: null,
      breakdown: [{ label: 'No ticket issued', amount: 0, note: 'The child travels free and shares your berth.' }],
      notes: [
        'Free travel means no seat and no berth. If the journey is overnight and you want the child to have their own berth, they are booked at the full adult fare.',
        'A child under 5 gets no separate luggage allowance — their bags count against yours.',
      ],
      estimated: false,
    };
  }

  // Work out the discount on the basic fare.
  let percent = 0;
  let admissible = true;
  let blockedReason = null;

  if (category.childHalf) {
    percent = CHILD_HALF_SHARE * 100;
  } else {
    percent = rateFor(category, classCode);

    if (category.rates && percent === 0) {
      admissible = false;
      blockedReason = `This category carries no concession in ${CLASSES[classCode].label}. It applies only in ${Object.keys(category.rates)
        .map((c) => CLASSES[c]?.label || c)
        .join(', ')}.`;
    }

    if (admissible && percent > 0 && !category.minDistanceExempt && km < MIN_DISTANCE_KM) {
      admissible = false;
      percent = 0;
      blockedReason = `Concessions need a journey of at least ${MIN_DISTANCE_KM} km, and this category is not exempt from that minimum.`;
    }

    if (admissible && percent > 0 && trainCategory === 'premium') {
      admissible = false;
      percent = 0;
      blockedReason =
        'Rajdhani, Shatabdi and Duronto trains have an all-inclusive fare structure and concessions are generally not admissible on them. Where one is specifically allowed, it is a smaller rate applied to the whole charge including catering — ask at the counter rather than assuming this table applies.';
    }
  }

  // An escort travels on the passenger's concession, capped at 75% for the
  // categories where the passenger themselves travels free.
  if (escort && category.escort) {
    if (category.escort === 'capped' && percent > 75) {
      percent = 75;
      notes.push('The escort’s concession is capped at 75% in the classes where the patient travels free.');
    } else if (percent > 0) {
      notes.push('The escort travels on the same concession as the passenger, on one ticket each.');
    }
  }

  const discountedBase = Math.round(fare.baseFare * (1 - percent / 100));
  const preGst = discountedBase + otherCharges;
  const gst = CLASSES[classCode].gst ? Math.round(preGst * 0.05) : 0;
  const payable = roundTo5(preGst + gst);
  const saving = Math.max(0, fullFare - payable);

  breakdown.push({
    label: percent > 0 ? `Basic fare after ${percent}% concession` : 'Basic fare',
    amount: discountedBase,
    note: percent > 0 ? `Full basic fare is ₹${fare.baseFare}; the concession applies to this component only.` : undefined,
  });
  if (fare.reservationFee) {
    breakdown.push({ label: 'Reservation fee', amount: fare.reservationFee, note: percent > 0 ? 'Charged in full.' : undefined });
  }
  if (fare.superfastCharge) {
    breakdown.push({ label: 'Superfast surcharge', amount: fare.superfastCharge, note: percent > 0 ? 'Charged in full.' : undefined });
  }
  if (gst) {
    breakdown.push({ label: 'GST (5%, AC classes)', amount: gst });
  }

  // The gap between the headline percentage and what actually comes off the
  // ticket is the single most useful number here, so it is computed, not left
  // for the reader to notice.
  const effectivePercent = fullFare > 0 ? Math.round((saving / fullFare) * 100) : 0;

  if (percent > 0 && effectivePercent < percent) {
    notes.push(
      `A ${percent}% concession takes ${effectivePercent}% off this ticket, not ${percent}% — the reservation fee, superfast surcharge and GST are charged in full.`
    );
  }

  if (category.childHalf) {
    notes.push(
      'Half fare buys no berth. The child shares yours, which is worth thinking about on an overnight journey before choosing it over a full-fare berth.'
    );
  }

  if (category.rates && percent > 0 && category.tatkal === false) {
    notes.push('This concession cannot be used on a Tatkal or Premium Tatkal ticket.');
  }

  if (category.group !== 'child' && category.rates) {
    notes.push('Concessional tickets are issued at a reservation counter, not on board — a ticket checker cannot grant one mid-journey.');
  }

  return {
    category,
    classCode,
    distanceKm: km,
    fullFare,
    payable,
    saving,
    percent,
    effectivePercent,
    admissible,
    blockedReason,
    breakdown,
    notes,
    estimated: true,
  };
};

/**
 * What a party pays — the case that actually comes up, because a child fare is
 * only ever chosen next to the adults it is travelling with.
 *
 * @param {{ travellers: Array<{ categoryId: string, escort?: boolean }>,
 *          classCode?: string, distanceKm: number, trainCategory?: string }} input
 * @returns {null | { lines, total, fullTotal, saving, estimated }}
 */
const assessParty = ({ travellers = [], classCode = 'SL', distanceKm, trainCategory = 'superfast' } = {}) => {
  const km = Number(distanceKm);
  if (!Number.isFinite(km) || km <= 0) return null;

  const lines = travellers
    .map((t) => assessFare({ categoryId: t.categoryId, classCode, distanceKm: km, trainCategory, escort: t.escort }))
    .filter(Boolean);

  if (!lines.length) return null;

  const total = lines.reduce((sum, l) => sum + l.payable, 0);
  const fullTotal = lines.reduce((sum, l) => sum + l.fullFare, 0);

  return {
    lines,
    total,
    fullTotal,
    saving: Math.max(0, fullTotal - total),
    estimated: true,
  };
};

module.exports = {
  MIN_DISTANCE_KM,
  CHILD_FREE_UNDER,
  CHILD_FARE_UNDER,
  CHILD_HALF_SHARE,
  CHILD_RULE_EFFECTIVE,
  CONCESSIONS_WITHDRAWN,
  CONFIDENCE,
  GENERAL_RULES,
  CATEGORIES,
  GROUPS,
  WITHDRAWN,
  getCategory,
  categoriesInGroup,
  rateFor,
  assessFare,
  assessParty,
};
