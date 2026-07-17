// Tatkal charge rules per the published Indian Railways table (in force since
// 2015 and unchanged through the April 2026 fare revision). Charges are per
// passenger, computed on the basic fare, and clamped to a class-wise min/max.
// Pure functions only — the page derives all displayed figures from here.

const TATKAL_RULES = {
  '2S': { label: 'Second Sitting (2S)', rate: 0.1, min: 10, max: 15 },
  SL: { label: 'Sleeper (SL)', rate: 0.1, min: 100, max: 200 },
  CC: { label: 'AC Chair Car (CC)', rate: 0.3, min: 125, max: 225 },
  '3A': { label: 'AC 3-Tier (3A)', rate: 0.3, min: 300, max: 400 },
  '2A': { label: 'AC 2-Tier (2A)', rate: 0.3, min: 400, max: 500 },
  EC: { label: 'Executive Chair Car (EC)', rate: 0.3, min: 400, max: 500 }
};

// basicFare: basic fare per passenger (before reservation/superfast/GST add-ons).
// Returns per-passenger and total figures, flagging whether the min or max cap bound.
const computeTatkalCharge = ({ classCode, basicFare, passengers = 1 }) => {
  const rule = TATKAL_RULES[classCode];
  if (!rule) throw new Error(`Unknown Tatkal class code: ${classCode}`);
  if (!(basicFare > 0) || !(passengers >= 1)) {
    return { valid: false };
  }

  const raw = basicFare * rule.rate;
  const chargePerPassenger = Math.min(Math.max(raw, rule.min), rule.max);

  return {
    valid: true,
    rate: rule.rate,
    chargePerPassenger,
    minApplied: raw < rule.min,
    maxApplied: raw > rule.max,
    totalCharge: chargePerPassenger * passengers,
    farePerPassenger: basicFare + chargePerPassenger,
    totalFare: (basicFare + chargePerPassenger) * passengers,
    percentOfFare: (chargePerPassenger / basicFare) * 100
  };
};

module.exports = { TATKAL_RULES, computeTatkalCharge };
