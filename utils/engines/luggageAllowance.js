// How much luggage you may carry, and what it costs when you exceed it.
//
// Indian Railways defines three weights per class, not one, and almost every
// answer online collapses them into a single "allowance" that is then wrong:
//
//   free      — carried in the compartment at no charge
//   marginal  — a small band above the free allowance that may still be carried
//               in the compartment, on payment
//   max       — the ceiling for anything travelling with you at all; beyond it,
//               the excess must be booked into the brake van as luggage
//
// The quirk worth knowing is AC 3-Tier and AC Chair Car, where `max` equals
// `free`. There is no headroom: 41 kg in 3A is already a booking job, even
// though the marginal allowance exists on paper. The engine derives that from
// the numbers rather than special-casing it, so the two cannot disagree.
//
// On rupee figures. The charge for excess luggage comes from the published
// distance-and-weight luggage scale, which this file does not reproduce — the
// full tariff table is impractical to carry and would go stale silently. What is
// modelled instead is a calibrated per-kg-per-100km rate, and every rupee amount
// the engine returns carries `estimated: true` so no caller can present it as
// authoritative. The *multipliers* are the durable, checkable part and are what
// the tool leads with: declared excess in the compartment at 1.5× the luggage
// rate, and undeclared excess found in the coach at 6× — the figure that turns a
// forgotten suitcase into a real penalty.

const CLASSES = {
  '1A': { code: '1A', label: 'AC First (1A)', free: 70, marginal: 15, max: 150 },
  '2A': { code: '2A', label: 'AC 2-Tier (2A)', free: 50, marginal: 10, max: 100 },
  FC: { code: 'FC', label: 'First Class (FC)', free: 50, marginal: 10, max: 100 },
  '3A': { code: '3A', label: 'AC 3-Tier (3A)', free: 40, marginal: 10, max: 40 },
  CC: { code: 'CC', label: 'AC Chair Car (CC)', free: 40, marginal: 10, max: 40 },
  SL: { code: 'SL', label: 'Sleeper (SL)', free: 40, marginal: 10, max: 80 },
  '2S': { code: '2S', label: 'Second Sitting (2S)', free: 35, marginal: 10, max: 70 },
};

// Charge multipliers on the ordinary luggage rate. These are the rule, and they
// are what the page should foreground — unlike the rate itself, they do not move
// with the tariff.
const MARGINAL_MULTIPLIER = 1.5;
const UNDECLARED_MULTIPLIER = 6;
const MIN_UNDECLARED_CHARGE = 50;

// Modelled luggage rate, in rupees per kg per 100 km, with a floor. Calibrated
// against typical booked-luggage charges rather than lifted from the tariff
// table. Treat anything derived from it as an estimate — see the note above.
const RATE_PER_KG_PER_100KM = 0.6;
const MIN_LUGGAGE_CHARGE = 30;

// Children pay half the adult free allowance, capped. Under-fives carry nothing
// of their own — their belongings count against the accompanying adult.
const CHILD_MIN_AGE = 5;
const CHILD_MAX_AGE = 11;
const CHILD_ALLOWANCE_CAP = 50;

// Maximum dimensions for a single piece carried inside the coach. Anything
// larger goes to the brake van however light it is — a bulky, empty box fails
// this test while a dense 60 kg trunk passes it, which is why size is assessed
// separately from weight rather than folded into one verdict.
const SIZE_LIMITS = {
  standard: { label: '100 × 60 × 25 cm', cm: [100, 60, 25], classes: ['1A', '2A', 'FC', 'SL', '2S'] },
  compact: { label: '55 × 45 × 22.5 cm', cm: [55, 45, 22.5], classes: ['3A', 'CC'] },
};

const sizeLimitFor = (classCode) =>
  SIZE_LIMITS.compact.classes.includes(classCode) ? SIZE_LIMITS.compact : SIZE_LIMITS.standard;

const round = (n) => Math.round(n);

/**
 * The three weights for a class, adjusted for a child.
 * Returns null for an unknown class rather than a silent default.
 */
const allowanceFor = ({ classCode, ageYears = null }) => {
  const cls = CLASSES[classCode];
  if (!cls) return null;

  const age = Number(ageYears);
  const isChild = Number.isFinite(age) && age >= CHILD_MIN_AGE && age <= CHILD_MAX_AGE;

  const free = isChild ? Math.min(cls.free / 2, CHILD_ALLOWANCE_CAP) : cls.free;
  const marginal = isChild ? cls.marginal / 2 : cls.marginal;
  const max = isChild ? Math.min(cls.max / 2, CHILD_ALLOWANCE_CAP) : cls.max;

  // The marginal band cannot reach past the class ceiling. In 3A and CC the
  // ceiling *is* the free allowance, so the band collapses to nothing.
  const marginalCeiling = Math.min(free + marginal, max);

  return {
    classCode: cls.code,
    label: cls.label,
    free,
    marginal,
    max,
    marginalCeiling,
    hasMarginalHeadroom: marginalCeiling > free,
    isChild,
    sizeLimit: sizeLimitFor(cls.code),
  };
};

/** Estimated ordinary luggage charge for a weight over a distance. */
const luggageCharge = ({ excessKg, distanceKm }) => {
  const kg = Math.max(0, Number(excessKg) || 0);
  const km = Math.max(0, Number(distanceKm) || 0);
  if (kg === 0 || km === 0) return 0;
  return Math.max(MIN_LUGGAGE_CHARGE, round((kg * RATE_PER_KG_PER_100KM * km) / 100));
};

/**
 * Assess a passenger's luggage against their class.
 *
 * @param {{ classCode: string, weightKg: number, distanceKm?: number,
 *           ageYears?: number|null, pieceCm?: number[]|null }} input
 *
 * @returns {null | {
 *   allowance, weightKg, excessKg, band: 'free'|'marginal'|'book'|'over-max',
 *   verdict: string, mustBookIntoBrakeVan: boolean,
 *   declaredCharge: number, undeclaredPenalty: number, estimated: true,
 *   oversizePiece: boolean, sizeNote: string|null, notes: string[]
 * }}
 */
const assessLuggage = ({ classCode, weightKg, distanceKm = 0, ageYears = null, pieceCm = null }) => {
  const allowance = allowanceFor({ classCode, ageYears });
  const weight = Number(weightKg);
  if (!allowance || !Number.isFinite(weight) || weight < 0) return null;

  const excessKg = Math.max(0, round(weight - allowance.free));

  let band;
  if (weight <= allowance.free) band = 'free';
  else if (weight <= allowance.marginalCeiling) band = 'marginal';
  else if (weight <= allowance.max) band = 'book';
  else band = 'over-max';

  const base = luggageCharge({ excessKg, distanceKm });

  // Declared excess inside the compartment is charged at the marginal rate;
  // once it has to be booked into the brake van it is the ordinary rate.
  const declaredCharge = band === 'free' ? 0 : band === 'marginal' ? round(base * MARGINAL_MULTIPLIER) : base;

  // The number that matters: what it costs if the TTE finds it unbooked.
  const undeclaredPenalty = band === 'free'
    ? 0
    : Math.max(MIN_UNDECLARED_CHARGE, round(base * UNDECLARED_MULTIPLIER));

  // Size is judged piece by piece against the class limit, in a way that does
  // not care which way round the traveller measured the box.
  let oversizePiece = false;
  let sizeNote = null;
  if (Array.isArray(pieceCm) && pieceCm.length === 3 && pieceCm.every((d) => Number.isFinite(Number(d)) && Number(d) > 0)) {
    const piece = pieceCm.map(Number).sort((a, b) => b - a);
    const limit = [...allowance.sizeLimit.cm].sort((a, b) => b - a);
    oversizePiece = piece.some((d, i) => d > limit[i]);
    sizeNote = oversizePiece
      ? `This piece is larger than the ${allowance.sizeLimit.label} limit for ${allowance.label}, so it has to travel in the brake van however much it weighs.`
      : `This piece is within the ${allowance.sizeLimit.label} limit for ${allowance.label}.`;
  }

  const mustBookIntoBrakeVan = band === 'book' || band === 'over-max' || oversizePiece;

  const VERDICTS = {
    free: 'Within your free allowance. Nothing to declare and nothing to pay.',
    marginal: 'Over the free allowance but inside the marginal band — you may keep it with you if you book and pay for the excess.',
    book: 'Past what may be carried in the compartment. The excess has to be booked as luggage into the brake van.',
    'over-max': 'Above the maximum this class permits at all. It must be booked and sent as luggage or parcel.',
  };

  const notes = [];
  if (band !== 'free' && !allowance.hasMarginalHeadroom) {
    notes.push(
      `${allowance.label} is the strict case: the maximum permitted equals the free allowance, so there is no ` +
        'in-compartment band above it. Anything over the free allowance has to be booked.'
    );
  }
  if (allowance.isChild) {
    notes.push(
      `Counted as a child (${CHILD_MIN_AGE}–${CHILD_MAX_AGE} years): half the adult allowance, capped at ` +
        `${CHILD_ALLOWANCE_CAP} kg. Children under ${CHILD_MIN_AGE} get no allowance of their own — their bags count ` +
        'against the accompanying adult.'
    );
  }
  if (oversizePiece && band === 'free') {
    notes.push('The weight is fine; it is the size that fails. A single oversized piece goes to the brake van on its own account.');
  }
  if (band !== 'free' && !distanceKm) {
    notes.push('Enter the journey distance to see what the excess would cost — the luggage rate is charged by weight and distance together.');
  }

  return {
    allowance,
    weightKg: weight,
    excessKg,
    band,
    verdict: VERDICTS[band],
    mustBookIntoBrakeVan,
    declaredCharge,
    undeclaredPenalty,
    estimated: true,
    oversizePiece,
    sizeNote,
    notes,
  };
};

// Things people ask about that are not weighed at all, and things that are never
// allowed regardless of weight. Reference data, not arithmetic — but it is the
// half of the question a calculator alone does not answer.
const FREE_ITEMS = [
  'A small handbag, ladies’ handbag or briefcase kept with you',
  'Tiffin carriers, water bottles and food for the journey',
  'A walking stick, umbrella or pair of crutches',
  'A wheelchair or other mobility aid used by the passenger travelling with it',
  'Bedding you have hired or been issued in AC classes',
];

const PROHIBITED_ITEMS = [
  { item: 'Petrol, kerosene, LPG cylinders and any inflammable liquid or gas', why: 'Classed as dangerous goods. Carrying them is a criminal offence, not a luggage matter.' },
  { item: 'Explosives, fireworks and crackers', why: 'Same category, and the one most often carried by accident around festivals.' },
  { item: 'Acids, corrosives and compressed gases', why: 'Dangerous goods; also grounds for removal from the train.' },
  { item: 'Dead poultry, game, and offensive or leaking articles', why: 'Refused as offensive goods.' },
  { item: 'Oversized trunks and furniture beyond the class dimensions', why: 'Not prohibited as such, but cannot travel in the coach — book it into the brake van.' },
];

// Carrying dangerous goods is dealt with by the Railways Act, not the luggage
// tariff, and the difference in scale is the point: the excess-luggage penalty
// is tens or hundreds of rupees, this is a prosecution.
const DANGEROUS_GOODS = {
  section: 'Section 164, Railways Act 1989',
  penalty: 'Imprisonment of up to three years, a fine, or both — plus liability for any loss or injury caused.',
  note:
    'This sits outside the luggage rules entirely. No weight allowance, no payable excess, and it applies whether or ' +
    'not the goods were declared.',
};

const PETS = [
  { rule: 'Dogs may travel in an AC First coupé or cabin', detail: 'Booked and charged as luggage, and only if the whole coupé is taken. Fellow passengers can object, and the dog is then moved to the brake van.' },
  { rule: 'Dogs may otherwise travel in the brake van dog box', detail: 'Booked in advance at the parcel office, charged at the luggage rate, with the owner responsible for feeding and water.' },
  { rule: 'Dogs are not allowed in AC 2-Tier, AC 3-Tier, Chair Car or Sleeper', detail: 'Carrying one there is treated as unbooked luggage and charged at six times the rate.' },
  { rule: 'Small birds and other pets go as parcels', detail: 'They cannot travel in the passenger compartment at all.' },
];

module.exports = {
  CLASSES,
  MARGINAL_MULTIPLIER,
  UNDECLARED_MULTIPLIER,
  MIN_UNDECLARED_CHARGE,
  MIN_LUGGAGE_CHARGE,
  RATE_PER_KG_PER_100KM,
  CHILD_MIN_AGE,
  CHILD_MAX_AGE,
  CHILD_ALLOWANCE_CAP,
  SIZE_LIMITS,
  FREE_ITEMS,
  PROHIBITED_ITEMS,
  DANGEROUS_GOODS,
  PETS,
  sizeLimitFor,
  allowanceFor,
  luggageCharge,
  assessLuggage,
};
