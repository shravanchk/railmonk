// Is an Interrail / Eurail pass worth it, or are point-to-point tickets cheaper?
//
// The honest answer is almost never the one the pass seller gives, and it is not
// the one a naive "pass price ÷ number of trips" calculation gives either. Three
// things decide it, and every one of them is routinely left out:
//
//   1. Reservation fees. A pass does not get you on to a TGV, an AVE, a
//      Frecciarossa or a Eurostar — each of those sells a compulsory supplement
//      on top. A France-and-Spain itinerary can add €100 of fees to a pass that
//      was supposed to cover everything. Those fees come from
//      `reservationRules.js` rather than being restated here, so the two tools
//      cannot drift apart.
//   2. Travel-day accounting. A flexi pass sells days, not journeys. Four trains
//      in one day cost one day; four trains on four days cost four. Itineraries
//      that look identical in trip count can differ by a whole pass tier.
//   3. Operators that refuse passes outright — Italo and OUIGO — where the
//      traveller pays the full fare whether or not they hold a pass. Counting
//      those journeys as "covered" overstates a pass by an entire fare.
//
// On prices: `indicativePriceEur` is a starting figure, not an authority. Pass
// prices are reset annually and regionally, and a number hard-coded here would
// be wrong within months — which is why the field is named to make that
// impossible to forget, why the UI prefills it into an *editable* input, and why
// the test suite fails once VERIFIED passes STALE_AFTER_DAYS. The arithmetic
// below is the durable part; the price is the traveller's to supply.
const VERIFIED = '2026-08-14';
const STALE_AFTER_DAYS = 365;

const { reservationCost, getService, acceptsPass } = require('./reservationRules');

// Adult, second class, Interrail/Eurail Global Pass. Youth, senior and first
// class are derived by multiplier below rather than stored as separate rows,
// because the discounts are proportional and duplicating ten rows four times
// would guarantee they eventually disagree.
const PASSES = [
  { id: 'flexi-4-1m', label: '4 days within 1 month', kind: 'flexi', travelDays: 4, validityDays: 31, indicativePriceEur: 283 },
  { id: 'flexi-5-1m', label: '5 days within 1 month', kind: 'flexi', travelDays: 5, validityDays: 31, indicativePriceEur: 325 },
  { id: 'flexi-7-1m', label: '7 days within 1 month', kind: 'flexi', travelDays: 7, validityDays: 31, indicativePriceEur: 389 },
  { id: 'flexi-10-2m', label: '10 days within 2 months', kind: 'flexi', travelDays: 10, validityDays: 61, indicativePriceEur: 461 },
  { id: 'flexi-15-2m', label: '15 days within 2 months', kind: 'flexi', travelDays: 15, validityDays: 61, indicativePriceEur: 567 },
  { id: 'cont-15d', label: '15 days continuous', kind: 'continuous', travelDays: 15, validityDays: 15, indicativePriceEur: 502 },
  { id: 'cont-22d', label: '22 days continuous', kind: 'continuous', travelDays: 22, validityDays: 22, indicativePriceEur: 587 },
  { id: 'cont-1m', label: '1 month continuous', kind: 'continuous', travelDays: 31, validityDays: 31, indicativePriceEur: 758 },
  { id: 'cont-2m', label: '2 months continuous', kind: 'continuous', travelDays: 61, validityDays: 61, indicativePriceEur: 1043 },
  { id: 'cont-3m', label: '3 months continuous', kind: 'continuous', travelDays: 92, validityDays: 92, indicativePriceEur: 1285 },
];

const PASS_INDEX = Object.fromEntries(PASSES.map((p) => [p.id, p]));
const getPass = (id) => PASS_INDEX[id] || null;

// Proportional discounts off the adult second-class price.
const TRAVELLER_TYPES = [
  { id: 'youth', label: 'Youth (12–27)', multiplier: 0.75, note: 'The youth discount is the single biggest lever on whether a pass wins. Age is taken on the first day of travel.' },
  { id: 'adult', label: 'Adult (28–59)', multiplier: 1, note: 'The reference price.' },
  { id: 'senior', label: 'Senior (60+)', multiplier: 0.9, note: 'A modest discount — smaller than most national railways give their own seniors.' },
  { id: 'child', label: 'Child (4–11)', multiplier: 0, note: 'Children travel free on an accompanying adult pass, up to two per adult. A third child needs a youth pass.' },
];

const TRAVELLER_INDEX = Object.fromEntries(TRAVELLER_TYPES.map((t) => [t.id, t]));

const FIRST_CLASS_MULTIPLIER = 1.3;

// A pass has to beat tickets by more than a rounding error before it is worth
// the extra planning, the reservation admin and the money tied up in advance.
// Anything inside this band is reported as "too close to call", which is a more
// useful answer than a €4 difference dressed up as a recommendation.
const TOO_CLOSE_EUR = 25;

// Reservation fees worth this share of the pass price mean the itinerary is
// concentrated on compulsory-supplement operators — France, Spain, Italy — and
// the traveller should know before buying, not at the ticket window. Three TGV
// legs on a four-day pass already clear it, which is the case worth catching.
const FEE_HEAVY_SHARE = 0.2;

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Price of a pass for a given traveller, before any reservation fees.
 * `priceOverride` wins over the indicative table whenever it is supplied —
 * which is the normal case, because the traveller can see today's real price
 * and this file cannot.
 */
const passPrice = ({ passId, priceOverride, travellerType = 'adult', firstClass = false }) => {
  const pass = getPass(passId);
  const base = Number.isFinite(Number(priceOverride)) && Number(priceOverride) > 0
    ? Number(priceOverride)
    : pass?.indicativePriceEur;
  if (!Number.isFinite(base)) return null;

  const traveller = TRAVELLER_INDEX[travellerType] || TRAVELLER_INDEX.adult;
  const classFactor = firstClass ? FIRST_CLASS_MULTIPLIER : 1;
  return round2(base * traveller.multiplier * classFactor);
};

/**
 * Distinct travel days across an itinerary.
 *
 * A flexi pass sells days, not journeys, so several trains on one date consume
 * one day. Journeys with no date cannot be grouped and are counted individually
 * — the conservative reading, since assuming undated journeys share a day would
 * understate the pass tier the traveller needs.
 */
const travelDaysUsed = (journeys = []) => {
  const dated = new Set();
  let undated = 0;
  journeys.forEach((j) => {
    if (j?.date) dated.add(j.date);
    else undated += 1;
  });
  return dated.size + undated;
};

/** The date span an itinerary occupies, in days, or null if it cannot be known. */
const itinerarySpanDays = (journeys = []) => {
  const times = journeys.map((j) => (j?.date ? new Date(`${j.date}T00:00:00Z`).getTime() : NaN)).filter((t) => !Number.isNaN(t));
  if (times.length === 0) return null;
  return Math.round((Math.max(...times) - Math.min(...times)) / 86400000) + 1;
};

/**
 * Compare a pass against buying the same journeys as tickets.
 *
 * @param {{
 *   passId?: string, priceOverride?: number,
 *   travellerType?: string, firstClass?: boolean,
 *   journeys?: Array<{ from?: string, to?: string, date?: string, fare?: number, serviceId?: string }>
 * }} input
 *
 * @returns {null | {
 *   pass, passPriceEur, ticketTotalEur, reservationEur: {min,max},
 *   uncoveredFaresEur, passTotalEur: {min,max}, savingEur: {min,max},
 *   breakEvenEur: {min,max}, verdict: 'pass'|'tickets'|'close',
 *   daysUsed, daysIncluded, daysSpare, overTravelDays, spanDays, overValidity,
 *   costPerTravelDay: {min,max}, otherCurrencies, notCovered, unpricedReservations,
 *   warnings: string[]
 * }}
 */
const comparePass = ({
  passId,
  priceOverride,
  travellerType = 'adult',
  firstClass = false,
  journeys = [],
} = {}) => {
  const pass = getPass(passId);
  const price = passPrice({ passId, priceOverride, travellerType, firstClass });
  if (price === null) return null;

  const list = journeys.filter(Boolean);

  // What the same trips cost as ordinary tickets.
  const ticketTotalEur = round2(list.reduce((sum, j) => sum + (Number(j.fare) || 0), 0));

  // What a pass holder still has to pay: compulsory reservation supplements,
  // plus the full fare on any operator that refuses passes.
  const serviceIds = list.map((j) => j.serviceId).filter(Boolean);
  const reservations = reservationCost({ serviceIds, passHolder: true });

  const uncoveredFaresEur = round2(
    list.reduce((sum, j) => {
      const service = j.serviceId ? getService(j.serviceId) : null;
      return service && !acceptsPass(service) ? sum + (Number(j.fare) || 0) : sum;
    }, 0)
  );

  const passTotalEur = {
    min: round2(price + reservations.eur.min + uncoveredFaresEur),
    max: round2(price + reservations.eur.max + uncoveredFaresEur),
  };

  const savingEur = {
    min: round2(ticketTotalEur - passTotalEur.max),
    max: round2(ticketTotalEur - passTotalEur.min),
  };

  // How much point-to-point fare the itinerary needs before the pass pays for
  // itself. This is the number people actually want: "would I have spent this
  // much on tickets anyway?"
  const breakEvenEur = { min: passTotalEur.min, max: passTotalEur.max };

  // Verdict is taken on the midpoint of the saving range, so a wide reservation
  // range does not flip the answer on its worst case alone.
  const midSaving = (savingEur.min + savingEur.max) / 2;
  let verdict;
  if (Math.abs(midSaving) <= TOO_CLOSE_EUR) verdict = 'close';
  else verdict = midSaving > 0 ? 'pass' : 'tickets';

  const daysUsed = travelDaysUsed(list);
  const daysIncluded = pass ? pass.travelDays : null;
  const overTravelDays = pass ? Math.max(0, daysUsed - pass.travelDays) : 0;
  const daysSpare = pass ? Math.max(0, pass.travelDays - daysUsed) : 0;

  const spanDays = itinerarySpanDays(list);
  const overValidity = pass && spanDays !== null ? Math.max(0, spanDays - pass.validityDays) : 0;

  const costPerTravelDay = daysUsed > 0
    ? { min: round2(passTotalEur.min / daysUsed), max: round2(passTotalEur.max / daysUsed) }
    : { min: 0, max: 0 };

  // Non-euro reservation fees are reported rather than converted: a hard-coded
  // FX rate would be wrong within a month, and a wrong conversion buried inside
  // a total is worse than an honest note beside it.
  const otherCurrencies = Object.fromEntries(
    Object.entries(reservations.byCurrency).filter(([currency]) => currency !== 'EUR')
  );

  const warnings = [];
  if (overTravelDays > 0) {
    warnings.push(
      `This itinerary needs ${daysUsed} travel days but the pass covers ${pass.travelDays}. ` +
        `You would have to buy tickets for ${overTravelDays} ${overTravelDays === 1 ? 'day' : 'days'} or move up a tier.`
    );
  }
  if (overValidity > 0) {
    warnings.push(
      `The trips span ${spanDays} days, which is longer than this pass stays valid (${pass.validityDays}). ` +
        'The later journeys would fall outside the validity window.'
    );
  }
  if (daysSpare >= 3) {
    warnings.push(
      `${daysSpare} of the pass's ${pass.travelDays} travel days go unused. A smaller pass is probably better value ` +
        'unless you expect to add trips.'
    );
  }
  if (reservations.eur.max >= price * FEE_HEAVY_SHARE && reservations.eur.max > 0) {
    warnings.push(
      'Reservation fees come to a substantial share of the pass price on this itinerary — the usual sign of a ' +
        'France, Spain or Italy heavy route. Check whether slower regional trains, which need no reservation, would do.'
    );
  }
  if (reservations.notCovered.length > 0) {
    warnings.push(
      `${reservations.notCovered.map((s) => s.name).join(' and ')} ${reservations.notCovered.length === 1 ? 'does' : 'do'} ` +
        'not accept rail passes, so the full fare is still payable on those journeys. It is counted on the pass side above.'
    );
  }
  if (Object.keys(otherCurrencies).length > 0) {
    warnings.push(
      'Some reservation fees on this route are charged in a currency other than the euro and are listed separately ' +
        'rather than converted at a guessed exchange rate.'
    );
  }

  return {
    pass,
    passPriceEur: price,
    ticketTotalEur,
    reservationEur: reservations.eur,
    uncoveredFaresEur,
    passTotalEur,
    savingEur,
    breakEvenEur,
    verdict,
    daysUsed,
    daysIncluded,
    daysSpare,
    overTravelDays,
    spanDays,
    overValidity,
    costPerTravelDay,
    otherCurrencies,
    notCovered: reservations.notCovered,
    unpricedReservations: reservations.unpriced,
    warnings,
  };
};

/**
 * The cheapest pass that actually fits the itinerary.
 *
 * "Fits" is doing real work here: a tier is only a candidate if it has enough
 * travel days AND stays valid long enough to reach the last journey. Recommending
 * a cheaper pass that expires mid-trip would be worse than recommending nothing.
 * Returns the best comparison plus every viable tier, so the UI can show why.
 */
const recommendPass = ({ journeys = [], travellerType = 'adult', firstClass = false } = {}) => {
  const list = journeys.filter(Boolean);
  if (list.length === 0) return null;

  const needDays = travelDaysUsed(list);
  const span = itinerarySpanDays(list);

  const viable = PASSES.filter((p) => p.travelDays >= needDays && (span === null || p.validityDays >= span))
    .map((p) => comparePass({ passId: p.id, travellerType, firstClass, journeys: list }))
    .filter(Boolean)
    .sort((a, b) => a.passTotalEur.min - b.passTotalEur.min);

  if (viable.length === 0) {
    return { best: null, viable: [], needDays, span, reason: 'No single pass covers this many travel days over this span.' };
  }

  return { best: viable[0], viable, needDays, span, reason: null };
};

module.exports = {
  VERIFIED,
  STALE_AFTER_DAYS,
  PASSES,
  TRAVELLER_TYPES,
  FIRST_CLASS_MULTIPLIER,
  TOO_CLOSE_EUR,
  FEE_HEAVY_SHARE,
  getPass,
  passPrice,
  travelDaysUsed,
  itinerarySpanDays,
  comparePass,
  recommendPass,
};
