// Indian Railways berth-position rules. Berth type follows a fixed repeating
// pattern within each class, so it can be computed from the berth number alone —
// this holds for both ICF and LHB builds (coach length varies, the pattern does
// not). Pure functions only; the page renders bay diagrams from these tables.

const TYPE_LABELS = {
  LB: 'Lower Berth',
  MB: 'Middle Berth',
  UB: 'Upper Berth',
  SL: 'Side Lower Berth',
  SU: 'Side Upper Berth'
};

// cycle: berth types in order within one repeating bay.
// maxBerth: highest berth number worth accepting (longest common coach build).
const CLASS_LAYOUTS = {
  SL: {
    label: 'Sleeper (SL)',
    cycle: ['LB', 'MB', 'UB', 'LB', 'MB', 'UB', 'SL', 'SU'],
    typicalBerths: 72,
    maxBerth: 81,
    coachNote: 'ICF sleeper coaches have 72 berths; newer LHB builds go up to 78–81 with the same repeating bay pattern.'
  },
  '3A': {
    label: 'AC 3-Tier (3A)',
    cycle: ['LB', 'MB', 'UB', 'LB', 'MB', 'UB', 'SL', 'SU'],
    typicalBerths: 64,
    maxBerth: 72,
    coachNote: 'ICF AC 3-Tier coaches have 64 berths; LHB builds have 72 with the same repeating bay pattern.'
  },
  '2A': {
    label: 'AC 2-Tier (2A)',
    cycle: ['LB', 'UB', 'LB', 'UB', 'SL', 'SU'],
    typicalBerths: 46,
    maxBerth: 54,
    coachNote: 'ICF AC 2-Tier coaches have 46 berths; LHB builds have 52–54 with the same repeating bay pattern.'
  },
  '1A': {
    label: 'AC First Class (1A)',
    cycle: ['LB', 'UB'],
    typicalBerths: 22,
    maxBerth: 24,
    coachNote: 'AC First has lettered cabins (coupés of 2 and cabins of 4) rather than open bays — odd berth numbers are lower, even are upper. Cabin letters vary by coach build.'
  }
};

const BERTH_TIPS = {
  LB: [
    'Doubles as the daytime seat for the whole bay — expect co-passengers sitting on it between roughly 6 AM and 9 PM.',
    'Easiest access to luggage space underneath, and the practical choice for senior citizens and passengers with reduced mobility.'
  ],
  MB: [
    'Folds down during the day — you can only lie down once the bay agrees to raise the berths, typically after 9 PM and until 6 AM.',
    'Check the chain/latch before sleeping; a middle berth takes its weight on two brackets and should click fully into place.'
  ],
  UB: [
    'Yours around the clock — no daytime seat-sharing, which makes it the best pick for sleeping through a long journey.',
    'The climb is the trade-off; avoid it for elderly travellers or with heavy hand luggage you want within reach.'
  ],
  SL: [
    'In Sleeper class, side lower is the berth most commonly shared with RAC passengers — two RAC holders can be allotted the same side lower.',
    'Slightly shorter than main-bay berths on ICF coaches; tall passengers may prefer a main-bay berth.'
  ],
  SU: [
    'No daytime seat-sharing and a corridor-side view, but the shortest headroom in the coach.',
    'On LHB coaches the side upper sits noticeably higher — keep essentials in a small bag hooked at the berth rather than climbing down at night.'
  ]
};

// Returns null for out-of-range input, else the berth's type, bay, and
// position-within-bay details.
const computeBerthPosition = ({ classCode, berthNumber }) => {
  const layout = CLASS_LAYOUTS[classCode];
  if (!layout) throw new Error(`Unknown class code: ${classCode}`);
  const n = Number(berthNumber);
  if (!Number.isInteger(n) || n < 1 || n > layout.maxBerth) return null;

  const cycleLength = layout.cycle.length;
  const indexInBay = (n - 1) % cycleLength; // 0-based position within the bay
  const type = layout.cycle[indexInBay];
  const bay = Math.floor((n - 1) / cycleLength) + 1;

  return {
    type,
    typeLabel: TYPE_LABELS[type],
    bay,
    indexInBay,
    cycle: layout.cycle,
    bayStart: (bay - 1) * cycleLength + 1,
    isSide: type === 'SL' || type === 'SU',
    aboveTypical: n > layout.typicalBerths,
    tips: BERTH_TIPS[type],
    layout
  };
};

module.exports = { CLASS_LAYOUTS, TYPE_LABELS, BERTH_TIPS, computeBerthPosition };
