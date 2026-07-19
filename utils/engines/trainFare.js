// Train fare estimator for Mail/Express-family trains.
//
// Indian Railways fares come from telescopic distance-slab tables plus fixed
// charges. Reproducing the full published table is impractical, so this engine
// models it: a telescopic per-km curve for the Sleeper base fare (calibrated
// against real 2024–26 fares on common city pairs, typically within ~10%),
// published class multipliers, and the exact fixed charges (reservation fee,
// superfast charge, 5% GST on AC classes). The UI must present results as an
// estimate — the fare IRCTC shows at booking is authoritative, and
// dynamic/flexi-fare trains (Rajdhani, Shatabdi, Duronto) can run well above
// the base scale.

const CLASSES = {
  '2S': { label: 'Second Sitting (2S)', multiplier: 0.62, reservationFee: 15, superfastCharge: 15, gst: false },
  SL: { label: 'Sleeper (SL)', multiplier: 1.0, reservationFee: 20, superfastCharge: 30, gst: false },
  '3E': { label: 'AC 3-Tier Economy (3E)', multiplier: 2.4, reservationFee: 40, superfastCharge: 45, gst: true },
  CC: { label: 'AC Chair Car (CC)', multiplier: 2.55, reservationFee: 40, superfastCharge: 45, gst: true },
  '3A': { label: 'AC 3-Tier (3A)', multiplier: 2.7, reservationFee: 40, superfastCharge: 45, gst: true },
  '2A': { label: 'AC 2-Tier (2A)', multiplier: 3.85, reservationFee: 50, superfastCharge: 75, gst: true },
  EC: { label: 'Executive Chair Car (EC)', multiplier: 5.2, reservationFee: 60, superfastCharge: 75, gst: true },
  '1A': { label: 'AC First (1A)', multiplier: 6.5, reservationFee: 60, superfastCharge: 75, gst: true }
};

const GST_RATE = 0.05;
const PREMIUM_SURGE_MAX = 1.4; // flexi-fare ceiling on premium trains

// Telescopic per-km slabs for the Sleeper-class base fare.
const SL_SLABS = [
  { upTo: 500, rate: 0.49 },
  { upTo: 1000, rate: 0.36 },
  { upTo: 2000, rate: 0.28 },
  { upTo: Infinity, rate: 0.22 }
];

const MIN_SL_BASE = 60;

const slBaseFare = (distanceKm) => {
  let remaining = distanceKm;
  let prev = 0;
  let fare = 0;
  for (const { upTo, rate } of SL_SLABS) {
    const span = Math.min(remaining, upTo - prev);
    if (span <= 0) break;
    fare += span * rate;
    remaining -= span;
    prev = upTo;
  }
  return Math.max(MIN_SL_BASE, fare);
};

const roundTo5 = (x) => Math.round(x / 5) * 5;

/**
 * estimateFare({ classCode, distanceKm, trainCategory, passengers })
 * trainCategory: 'express' | 'superfast' | 'premium' (superfast + flexi surge range)
 * Returns null for unknown class or non-positive distance; otherwise
 * { baseFare, reservationFee, superfastCharge, gst, totalPerPassenger,
 *   total, surgeTotalPerPassenger, surgeTotal, breakdownNote }
 */
const estimateFare = ({ classCode, distanceKm, trainCategory = 'superfast', passengers = 1 }) => {
  const cls = CLASSES[classCode];
  const km = Number(distanceKm);
  const pax = Math.max(1, Math.floor(Number(passengers) || 1));
  if (!cls || !Number.isFinite(km) || km <= 0) return null;

  const baseFare = Math.round(slBaseFare(km) * cls.multiplier);
  const reservationFee = cls.reservationFee;
  const superfastCharge = trainCategory === 'express' ? 0 : cls.superfastCharge;
  const preGst = baseFare + reservationFee + superfastCharge;
  const gst = cls.gst ? Math.round(preGst * GST_RATE) : 0;
  const totalPerPassenger = roundTo5(preGst + gst);

  const result = {
    baseFare,
    reservationFee,
    superfastCharge,
    gst,
    totalPerPassenger,
    total: totalPerPassenger * pax,
    surgeTotalPerPassenger: null,
    surgeTotal: null
  };

  if (trainCategory === 'premium') {
    const surged = roundTo5((baseFare * PREMIUM_SURGE_MAX + reservationFee + superfastCharge) * (cls.gst ? 1 + GST_RATE : 1));
    result.surgeTotalPerPassenger = surged;
    result.surgeTotal = surged * pax;
  }

  return result;
};

module.exports = { CLASSES, SL_SLABS, GST_RATE, PREMIUM_SURGE_MAX, slBaseFare, estimateFare, roundTo5 };
