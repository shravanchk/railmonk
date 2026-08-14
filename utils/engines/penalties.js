// What it costs when the TTE finds an irregularity.
//
// Two quite different things get called "the fine" and conflating them is why
// most advice on this is useless:
//
//   1. An **excess charge** under Section 138 of the Railways Act 1989. This is
//      not a punishment and no court is involved — it is the fare you should
//      have paid, plus a charge of the same amount subject to a floor. The TTE
//      collects it, writes a receipt, and you carry on travelling. Almost every
//      real case is this one, and it is arithmetic, so this engine computes it.
//
//   2. A **statutory penalty** under one of the Act's offence sections — s.137
//      for fraudulent travel, s.141 for the alarm chain, s.164 for dangerous
//      goods. These are criminal provisions with a maximum set by statute and
//      an actual amount set by a magistrate. They are not arithmetic and this
//      engine does not pretend to compute them; they are carried below as a
//      reference table with the ceiling each section allows.
//
// Where the fare is needed, it comes from `trainFare.js` and where the luggage
// multiple is needed it comes from `luggageAllowance.js`, rather than being
// restated. A penalty is defined in terms of the fare, so the two must move
// together or the site will eventually quote a penalty that no longer matches
// its own fare calculator.
//
// Every rupee amount that depends on a fare inherits that engine's uncertainty
// and is flagged `estimated: true`. The statutory ceilings are not estimates.

const { estimateFare, CLASSES } = require('./trainFare');
const { assessLuggage, UNDECLARED_MULTIPLIER } = require('./luggageAllowance');

// The floor on a Section 138 excess charge. The section makes the excess charge
// equal to the fare due, subject to a minimum — and in day-to-day practice a
// TTE collects the fare plus this figure, which is what the calculator models.
const MIN_EXCESS_CHARGE = 250;

// How confident the site is about each figure, mirroring the `confidence` field
// in ruleUpdates.js. 'act' means the number is written into the Railways Act
// 1989; 'practice' means it is how the rule is actually applied on the ground,
// which is the honest label for the ₹250 and for the ID rule.
const CONFIDENCE = {
  act: { id: 'act', label: 'Set by statute', note: 'The figure appears in the Railways Act 1989 itself.' },
  practice: { id: 'practice', label: 'As applied in practice', note: 'How the rule is enforced by ticket checking staff and IRCTC, rather than a figure quoted verbatim from the Act.' },
};

// ── Calculable scenarios ────────────────────────────────────────────────────

const SCENARIOS = [
  {
    id: 'no-ticket',
    label: 'Travelling with no ticket',
    section: 'Section 138',
    confidence: 'practice',
    needs: ['classCode', 'distanceKm'],
    summary:
      'You pay the fare for the distance travelled in the class you are found in, plus an excess charge. It is settled with the TTE against a receipt, not in court — prosecution under Section 137 only follows if you refuse to pay.',
  },
  {
    id: 'no-id',
    label: 'E-ticket but no original photo ID',
    section: 'Section 138',
    confidence: 'practice',
    needs: ['classCode', 'distanceKm'],
    summary:
      'An e-ticket is only valid alongside one of the accepted original photo IDs for a passenger named on it. Without one the whole ticket is treated as invalid and every passenger on it is charged as ticketless — a photograph or photocopy of the ID is not accepted.',
  },
  {
    id: 'higher-class',
    label: 'Travelling in a higher class than your ticket',
    section: 'Section 138',
    confidence: 'practice',
    needs: ['classCode', 'ticketedClassCode', 'distanceKm'],
    summary:
      'You pay the difference between the two fares, plus an excess charge on top. Upgrading with the TTE on board is only possible if a berth is genuinely free after charting.',
  },
  {
    id: 'beyond-destination',
    label: 'Travelling beyond your ticketed station',
    section: 'Section 138',
    confidence: 'practice',
    needs: ['classCode', 'distanceKm', 'ticketedDistanceKm'],
    summary:
      'Charged on the extra distance only, plus the excess charge. Telling the TTE before you pass your station is the difference between an ordinary extension and being treated as ticketless.',
  },
  {
    id: 'unbooked-luggage',
    label: 'Excess luggage found unbooked',
    section: 'Luggage rules',
    confidence: 'act',
    needs: ['classCode', 'distanceKm', 'luggageKg'],
    summary:
      `Charged at ${UNDECLARED_MULTIPLIER} times the ordinary luggage rate on the excess weight. Booking the same bag at the parcel office beforehand costs a fraction of that.`,
  },
];

const SCENARIO_INDEX = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
const getScenario = (id) => SCENARIO_INDEX[id] || null;

const fareFor = ({ classCode, distanceKm, trainCategory }) => {
  const r = estimateFare({ classCode, distanceKm, trainCategory, passengers: 1 });
  return r ? r.totalPerPassenger : null;
};

/**
 * What you would be asked to pay.
 *
 * @param {{
 *   scenarioId: string, classCode?: string, ticketedClassCode?: string,
 *   distanceKm?: number, ticketedDistanceKm?: number,
 *   trainCategory?: string, passengers?: number, luggageKg?: number
 * }} input
 *
 * @returns {null | {
 *   scenario, fareDue: number, excessCharge: number,
 *   perPassenger: number, total: number, passengers: number,
 *   breakdown: Array<{ label: string, amount: number, note?: string }>,
 *   estimated: boolean, notes: string[]
 * }}
 */
const assessPenalty = ({
  scenarioId,
  classCode = 'SL',
  ticketedClassCode = 'SL',
  distanceKm,
  ticketedDistanceKm = 0,
  trainCategory = 'superfast',
  passengers = 1,
  luggageKg = 0,
} = {}) => {
  const scenario = getScenario(scenarioId);
  if (!scenario) return null;

  const km = Number(distanceKm);
  if (!Number.isFinite(km) || km <= 0) return null;

  const pax = Math.max(1, Math.floor(Number(passengers) || 1));
  const notes = [];
  const breakdown = [];

  let fareDue = 0;
  let excessCharge = MIN_EXCESS_CHARGE;
  let estimated = true;

  if (scenario.id === 'unbooked-luggage') {
    // Luggage is charged on the bag, not per passenger, and it is not a
    // Section 138 excess charge at all — so there is no ₹250 component.
    const assessment = assessLuggage({ classCode, weightKg: Number(luggageKg) || 0, distanceKm: km });
    if (!assessment) return null;

    excessCharge = 0;
    fareDue = assessment.undeclaredPenalty;

    breakdown.push({
      label: `Excess luggage (${assessment.excessKg} kg over the ${assessment.allowance.free} kg free allowance)`,
      amount: assessment.undeclaredPenalty,
      note: `${UNDECLARED_MULTIPLIER}× the ordinary luggage rate, because it was not booked.`,
    });

    if (assessment.band === 'free') {
      notes.push('This weight is inside the free allowance for the class — there would be nothing to charge.');
    } else {
      notes.push(
        `Booked in advance at the parcel office the same excess would cost about ₹${assessment.declaredCharge} — ` +
          `roughly a ${UNDECLARED_MULTIPLIER}th of the penalty.`
      );
    }

    return {
      scenario,
      fareDue,
      excessCharge,
      perPassenger: fareDue,
      total: fareDue,
      passengers: 1,
      breakdown,
      estimated: true,
      notes,
    };
  }

  if (scenario.id === 'higher-class') {
    const occupied = fareFor({ classCode, distanceKm: km, trainCategory });
    const ticketed = fareFor({ classCode: ticketedClassCode, distanceKm: km, trainCategory });
    if (occupied === null || ticketed === null) return null;

    if (occupied <= ticketed) {
      notes.push(
        `${CLASSES[classCode]?.label || classCode} is not a higher class than ${CLASSES[ticketedClassCode]?.label || ticketedClassCode}, ` +
          'so there is no fare difference to recover. Travelling in a *lower* class than your ticket earns no refund either.'
      );
    }

    fareDue = Math.max(0, occupied - ticketed);
    excessCharge = MIN_EXCESS_CHARGE;

    breakdown.push({
      label: `Fare difference (${CLASSES[ticketedClassCode]?.label || ticketedClassCode} → ${CLASSES[classCode]?.label || classCode})`,
      amount: fareDue,
      note: `${CLASSES[classCode]?.label || classCode} costs about ₹${occupied} over ${km} km; your ticket covered about ₹${ticketed}.`,
    });
  } else if (scenario.id === 'beyond-destination') {
    const ticketedKm = Math.max(0, Number(ticketedDistanceKm) || 0);
    const extraKm = km - ticketedKm;

    if (extraKm <= 0) {
      notes.push('The distance travelled is not beyond the ticketed distance, so there is nothing extra to charge.');
      fareDue = 0;
    } else {
      const extra = fareFor({ classCode, distanceKm: extraKm, trainCategory });
      if (extra === null) return null;
      fareDue = extra;
      breakdown.push({
        label: `Fare for the extra ${extraKm} km beyond your ticketed station`,
        amount: fareDue,
      });
      notes.push(
        'Because the base fare is telescopic, the fare for the extra stretch on its own is higher than the same ' +
          'kilometres would have cost inside a single longer ticket. Extending a journey always costs more than booking it through.'
      );
    }
    excessCharge = MIN_EXCESS_CHARGE;
  } else {
    // no-ticket and no-id: the full fare for the distance travelled.
    const fare = fareFor({ classCode, distanceKm: km, trainCategory });
    if (fare === null) return null;
    fareDue = fare;
    excessCharge = MIN_EXCESS_CHARGE;

    breakdown.push({
      label: `Fare for ${km} km in ${CLASSES[classCode]?.label || classCode}`,
      amount: fareDue,
      note: 'Charged from the originating station, not from where you were checked.',
    });

    if (scenario.id === 'no-id') {
      notes.push(
        'The accepted IDs are the original passport, Aadhaar, PAN card, driving licence, voter ID, a photo ID issued ' +
          'by a government or public sector employer, a student photo ID with a photograph, or a nationalised bank ' +
          'passbook with a photograph. One passenger named on the ticket must carry one.'
      );
      notes.push(
        'A single missing ID invalidates the whole e-ticket, so the charge below applies to every passenger on it, ' +
          'not only the one without the card.'
      );
    }
  }

  breakdown.push({
    label: 'Excess charge',
    amount: excessCharge,
    note: `Section 138 sets the excess charge at the fare due subject to a minimum of ₹${MIN_EXCESS_CHARGE}; ₹${MIN_EXCESS_CHARGE} is what is collected in practice.`,
  });

  const perPassenger = fareDue + excessCharge;

  notes.push(
    'Paid to the TTE against a receipt (an EFT). Refusing to pay is what converts this from a charge into a ' +
      'prosecution under Section 137, where a magistrate sets the fine.'
  );

  return {
    scenario,
    fareDue,
    excessCharge,
    perPassenger,
    total: perPassenger * pax,
    passengers: pax,
    breakdown,
    estimated,
    notes,
  };
};

// ── Statutory offences: reference, not arithmetic ───────────────────────────
//
// `maxFine` and `maxImprisonment` are ceilings the Act allows, not amounts
// anybody is guaranteed to be charged — a magistrate decides within them. They
// are stored as the ceiling precisely so the UI can say "up to", which is the
// only accurate framing.

const OFFENCES = [
  {
    section: 'Section 137',
    offence: 'Fraudulently travelling without a proper ticket',
    maxFine: 1000,
    maxImprisonment: '6 months',
    note:
      'The prosecution route, reached by refusing to pay the Section 138 excess charge rather than by simply being found without a ticket. The fare is still payable on top.',
  },
  {
    section: 'Section 141',
    offence: 'Pulling the alarm chain without reasonable cause',
    maxFine: 1000,
    maxImprisonment: '1 year',
    note:
      'Reasonable cause is a real defence — a medical emergency, a fire, someone in danger. Stopping the train because a companion missed the departure is not.',
  },
  {
    section: 'Section 145',
    offence: 'Drunkenness or creating a nuisance',
    maxFine: 500,
    maxImprisonment: '6 months',
    note: 'Also grounds for being removed from the train, with no refund of the fare.',
  },
  {
    section: 'Section 147',
    offence: 'Trespassing on railway property and refusing to leave',
    maxFine: 1000,
    maxImprisonment: '6 months',
    note: 'Covers walking on the tracks and crossing the line where no crossing exists.',
  },
  {
    section: 'Section 153',
    offence: 'Endangering the safety of passengers by a wilful act or omission',
    maxFine: null,
    maxImprisonment: '5 years',
    note: 'The most serious of the passenger-facing provisions, and the one with no fine ceiling in place of imprisonment.',
  },
  {
    section: 'Section 156',
    offence: 'Travelling on the roof, step or engine of a train',
    maxFine: 500,
    maxImprisonment: '3 months',
    note: 'Enforced far more often on suburban networks than on long-distance services.',
  },
  {
    section: 'Section 162',
    offence: 'Entering a compartment reserved for women',
    maxFine: 500,
    maxImprisonment: null,
    note: 'Removal from the compartment accompanies the fine, and the ticket is not refunded.',
  },
  {
    section: 'Section 164',
    offence: 'Carrying dangerous or offensive goods',
    maxFine: 1000,
    maxImprisonment: '3 years',
    note:
      'Cylinders, fuel, fireworks and acids. Separate from — and far more serious than — the luggage rules, and the traveller is also liable for any loss or injury caused.',
  },
  {
    section: 'Section 167',
    offence: 'Smoking despite being asked to stop',
    maxFine: 100,
    maxImprisonment: null,
    note: 'The smallest figure in the Act, and unchanged since 1989.',
  },
];

const offenceBySection = (section) => OFFENCES.find((o) => o.section === section) || null;

/** "up to ₹1,000 and/or up to 6 months' imprisonment" */
const describeOffence = (offence) => {
  if (!offence) return null;
  const parts = [];
  if (offence.maxFine) parts.push(`a fine of up to ₹${offence.maxFine.toLocaleString('en-IN')}`);
  if (offence.maxImprisonment) parts.push(`imprisonment of up to ${offence.maxImprisonment}`);
  if (parts.length === 0) return 'Penalty set by the court.';
  return `${parts.join(', or ')}${parts.length > 1 ? ', or both' : ''}.`;
};

module.exports = {
  MIN_EXCESS_CHARGE,
  CONFIDENCE,
  SCENARIOS,
  OFFENCES,
  getScenario,
  assessPenalty,
  offenceBySection,
  describeOffence,
};
