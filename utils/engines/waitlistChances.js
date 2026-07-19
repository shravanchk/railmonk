// Waitlist decoder + heuristic confirmation-chance estimator.
//
// The quota definitions (what each code means, how it behaves at charting) are
// factual per Indian Railways quota rules. The chance estimate is a HEURISTIC:
// Indian Railways publishes no per-train confirmation probabilities, so the
// score models the widely observed ordering of quotas (GNWL clears best, PQWL
// and Tatkal worst) adjusted for waitlist number, lead time, and season. The UI
// must always present it as an indicative band, never a promise.

const WL_TYPES = [
  {
    code: 'GNWL',
    name: 'General Waitlist',
    baseScore: 75,
    meaning:
      'Issued when the journey starts at (or near) the train’s originating station. Draws from the largest quota pool, so it clears from the full set of cancellations — the best-confirming waitlist by far.',
    chartingNote:
      'If still fully waitlisted at charting, an e-ticket is auto-cancelled and refunded minus clerkage.'
  },
  {
    code: 'RLWL',
    name: 'Remote Location Waitlist',
    baseScore: 45,
    meaning:
      'Issued for journeys between intermediate stations. Clears only against cancellations in that remote-location quota — a much smaller pool than GNWL, so identical waitlist numbers confirm noticeably less often.',
    chartingNote:
      'Same charting behaviour as GNWL: fully waitlisted e-tickets drop automatically with a refund minus clerkage.'
  },
  {
    code: 'PQWL',
    name: 'Pooled Quota Waitlist',
    baseScore: 30,
    meaning:
      'A single small pool shared by several intermediate stations (typically origin-to-midway or midway-to-destination legs). Many stations competing for one tiny quota makes PQWL one of the weakest waitlists.',
    chartingNote:
      'Fully waitlisted e-tickets are auto-cancelled at charting with a refund minus clerkage.'
  },
  {
    code: 'RSWL',
    name: 'Roadside Station Waitlist',
    baseScore: 40,
    meaning:
      'Issued when booking from the originating station to a smaller “roadside” station en route. The quota is modest and cancellations against it are few, so it clears slower than GNWL.',
    chartingNote:
      'Fully waitlisted e-tickets are auto-cancelled at charting with a refund minus clerkage.'
  },
  {
    code: 'TQWL',
    name: 'Tatkal Waitlist',
    baseScore: 15,
    meaning:
      'Waitlist against the Tatkal quota (older PNRs show CKWL). Tatkal tickets are booked at a premium a day before travel and cancelled confirmed Tatkal tickets get no refund — so almost nobody cancels, and TQWL barely moves. During charting, GNWL is also cleared into vacant Tatkal berths before TQWL.',
    chartingNote:
      'A still-waitlisted Tatkal e-ticket is auto-cancelled at charting and refunded minus clerkage (the Tatkal charge component is part of the refunded fare only when the ticket never confirmed).'
  },
  {
    code: 'RAC',
    name: 'Reservation Against Cancellation',
    baseScore: 92,
    meaning:
      'Not a waitlist — RAC guarantees you can board and travel, initially on a shared side-lower berth (two RAC passengers per berth). A full berth is allotted on board as confirmed passengers cancel or no-show.',
    chartingNote:
      'RAC tickets are NOT auto-cancelled at charting. If you decide not to travel, cancel (or file a TDR) at least 30 minutes before departure or the fare is forfeited.'
  }
];

const BANDS = [
  { id: 'very-high', min: 78, label: 'Very likely to confirm', pctText: 'indicatively 80–95%+' },
  { id: 'high', min: 60, label: 'Good chance', pctText: 'indicatively 60–80%' },
  { id: 'moderate', min: 40, label: 'Uncertain — could go either way', pctText: 'indicatively 40–60%' },
  { id: 'low', min: 22, label: 'Unlikely to confirm', pctText: 'indicatively 20–40%' },
  { id: 'very-low', min: 0, label: 'Very unlikely to confirm', pctText: 'indicatively under 20%' }
];

const getWlType = (code) => WL_TYPES.find((t) => t.code === code) || null;

// Multiplier for how deep in the queue the ticket is.
const wlNumberFactor = (n) => {
  if (n <= 5) return 1.15;
  if (n <= 15) return 1.0;
  if (n <= 30) return 0.85;
  if (n <= 60) return 0.65;
  return 0.45;
};

// Additive adjustment for booking lead time (days until journey).
const leadTimeAdj = (days) => {
  if (days >= 20) return 10;
  if (days >= 8) return 5;
  if (days >= 3) return 0;
  return -10;
};

const SEASON_PEAK_PENALTY = 15;

/**
 * estimateChances({ wlCode, wlNumber, daysToJourney, peakSeason })
 * Returns { score, band, label, pctText, factors: string[] } or null for unknown codes.
 */
const estimateChances = ({ wlCode, wlNumber, daysToJourney = 7, peakSeason = false }) => {
  const type = getWlType(wlCode);
  if (!type) return null;
  const n = Math.max(1, Math.floor(Number(wlNumber) || 1));
  const days = Math.max(0, Math.floor(Number(daysToJourney) || 0));

  const factors = [];
  let score = type.baseScore * wlNumberFactor(n);

  if (n <= 5) factors.push(`${type.code} ${n} is near the front of the queue — only a handful of cancellations needed.`);
  else if (n <= 15) factors.push(`${type.code} ${n} is a typical clearing depth for this quota when there is time left.`);
  else if (n <= 30) factors.push(`${type.code} ${n} needs a sustained run of cancellations to clear.`);
  else factors.push(`${type.code} ${n} is deep in the queue — most trains do not see that many cancellations in one quota.`);

  const adj = leadTimeAdj(days);
  score += adj;
  if (days >= 20) factors.push(`${days} days to departure leaves plenty of time for cancellations to accumulate.`);
  else if (days >= 8) factors.push(`${days} days to departure is a reasonable window for movement.`);
  else if (days >= 3) factors.push(`${days} days to departure — most movement now happens at chart preparation.`);
  else factors.push('With departure this close, the main clearing event left is the final chart, where unclaimed quotas are released.');

  if (peakSeason) {
    score -= SEASON_PEAK_PENALTY;
    factors.push('Festival / holiday-season demand cuts cancellations sharply — waitlists move much less than usual.');
  }

  if (type.code === 'TQWL') {
    factors.push('Tatkal cancellations are rare (confirmed Tatkal tickets are non-refundable), and vacant Tatkal berths go to GNWL first at charting.');
  }
  if (type.code === 'RAC') {
    factors.push('RAC already guarantees travel on a shared berth — the estimate here is for getting a full berth to yourself.');
  }

  score = Math.max(3, Math.min(97, Math.round(score)));
  const band = BANDS.find((b) => score >= b.min);
  return { score, band: band.id, label: band.label, pctText: band.pctText, factors };
};

module.exports = { WL_TYPES, getWlType, estimateChances, wlNumberFactor, leadTimeAdj };
