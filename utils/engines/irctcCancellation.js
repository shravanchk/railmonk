// IRCTC / Indian Railways cancellation-refund rules effective 1 April 2026.
// Pure functions only — no UI copy beyond machine-readable labels. The page
// component derives all displayed figures (including worked examples in the
// prose) from these functions so text can never drift from the calculator.

const GST_RATE = 0.05; // applies to AC-class cancellation charges and e-ticket clerkage

// Flat cancellation charge per passenger, by class. GST applies to AC classes only.
const CLASS_RULES = {
  '1A': { label: 'AC First Class / Executive (1A/EC)', flat: 240, gst: true },
  '2A': { label: 'AC 2-Tier (2A)', flat: 200, gst: true },
  '3A': { label: 'AC 3-Tier / AC Chair Car / AC 3 Economy (3A/CC/3E)', flat: 180, gst: true },
  SL: { label: 'Sleeper (SL)', flat: 120, gst: false },
  '2S': { label: 'Second Sitting (2S)', flat: 60, gst: false }
};

const CLERKAGE = 60; // RAC/waitlisted clerkage per passenger, plus GST

// Flat charge per passenger including GST where it applies.
const flatChargePerPassenger = (classCode) => {
  const rule = CLASS_RULES[classCode];
  if (!rule) throw new Error(`Unknown class code: ${classCode}`);
  return rule.gst ? rule.flat * (1 + GST_RATE) : rule.flat;
};

const clerkagePerPassenger = () => CLERKAGE * (1 + GST_RATE);

const round2 = (n) => Math.round(n * 100) / 100;

// ticketType: 'confirmed' | 'rac' | 'waitlisted' | 'tatkal-confirmed' | 'tatkal-rac-wl'
// fare: total fare paid for the ticket (all passengers).
// hoursBeforeDeparture: hours between cancellation and scheduled departure.
// Returns { deduction, refund, rule, minChargeApplied } where rule is one of:
// 'flat' | 'slab-25' | 'slab-50' | 'no-refund' | 'clerkage' | 'rac-wl-late' | 'tatkal-no-refund'
const computeCancellationRefund = ({ classCode, ticketType, fare, hoursBeforeDeparture, passengers = 1 }) => {
  if (!(fare > 0) || !(passengers >= 1)) {
    return { deduction: 0, refund: 0, rule: 'invalid', minChargeApplied: false };
  }

  const finish = (deduction, rule, minChargeApplied = false) => {
    const capped = Math.min(round2(deduction), fare);
    return { deduction: capped, refund: round2(fare - capped), rule, minChargeApplied };
  };

  if (ticketType === 'tatkal-confirmed') {
    return finish(fare, 'tatkal-no-refund');
  }

  if (ticketType === 'rac' || ticketType === 'waitlisted' || ticketType === 'tatkal-rac-wl') {
    if (hoursBeforeDeparture < 0.5) return finish(fare, 'rac-wl-late');
    return finish(clerkagePerPassenger() * passengers, 'clerkage');
  }

  // Confirmed (non-Tatkal): time slabs with the class flat charge as the minimum.
  const minCharge = flatChargePerPassenger(classCode) * passengers;
  if (hoursBeforeDeparture >= 72) {
    return finish(minCharge, 'flat');
  }
  if (hoursBeforeDeparture >= 24) {
    const pct = fare * 0.25;
    return finish(Math.max(pct, minCharge), 'slab-25', minCharge > pct);
  }
  if (hoursBeforeDeparture >= 8) {
    const pct = fare * 0.5;
    return finish(Math.max(pct, minCharge), 'slab-50', minCharge > pct);
  }
  return finish(fare, 'no-refund');
};

module.exports = {
  GST_RATE,
  CLASS_RULES,
  CLERKAGE,
  flatChargePerPassenger,
  clerkagePerPassenger,
  computeCancellationRefund
};
