// Swiss Travel Pass or Half Fare Card — or neither?
//
// This is the most common question Indian travellers ask about Switzerland, and
// the stock answer ("the pass if you travel a lot") misses the three things that
// actually decide it:
//
//   1. Mountains are not covered like trains. The pass makes Rigi, Stoos and
//      Stanserhorn free, but only discounts the famous ones — Titlis, Pilatus,
//      Schilthorn, Gornergrat by up to 50%, and the upper Jungfraujoch section
//      by just 25%. The Half Fare Card takes 50% off all of them, Jungfraujoch
//      included. A Jungfrau-heavy trip can flip the answer on its own.
//   2. A Flex pass should be spent on your most expensive days, not your first
//      ones. We pick the days that save the most, so the comparison is against
//      the pass used well, not used naively.
//   3. Panorama-train seat reservations (Glacier Express, Bernina Express) are
//      payable in full whichever product you hold, so they belong in the total
//      but never in the saving.
//
// On prices: the pass table below is Switzerland Tourism's published 2026 price
// list, but prices reset annually, so the UI treats it as a prefill the traveller
// can overwrite. The test suite fails once VERIFIED passes STALE_AFTER_DAYS.
// Fares are always user-supplied — the SBB app shows the real one in seconds,
// and a fare table here would be wrong by the next timetable change.
const VERIFIED = '2026-09-26';
const STALE_AFTER_DAYS = 365;

const HALF_FARE_CARD = {
  priceChf: 150,
  // Sold as "one month"; 31 days is the cautious reading when working out how
  // many cards a long trip needs.
  validityDays: 31,
  discount: 0.5,
};

// Flex passes are used within one month of the first travel day.
const FLEX_WINDOW_DAYS = 31;

// Prices in CHF, from myswitzerland.com (Switzerland Tourism) for 2026. Youth
// is up to the 25th birthday. Stored per cell rather than derived by a youth
// multiplier, because the published figures are rounded and a multiplier would
// be off by a franc or two on half the table.
const PASSES = [
  { id: 'stp-3', kind: 'consecutive', days: 3, price: { second: { adult: 254, youth: 179 }, first: { adult: 405, youth: 285 } } },
  { id: 'stp-4', kind: 'consecutive', days: 4, price: { second: { adult: 309, youth: 218 }, first: { adult: 492, youth: 346 } } },
  { id: 'stp-6', kind: 'consecutive', days: 6, price: { second: { adult: 399, youth: 282 }, first: { adult: 634, youth: 447 } } },
  { id: 'stp-8', kind: 'consecutive', days: 8, price: { second: { adult: 439, youth: 311 }, first: { adult: 697, youth: 492 } } },
  { id: 'stp-15', kind: 'consecutive', days: 15, price: { second: { adult: 499, youth: 356 }, first: { adult: 778, youth: 557 } } },
  { id: 'flex-3', kind: 'flex', days: 3, price: { second: { adult: 289, youth: 204 }, first: { adult: 461, youth: 335 } } },
  { id: 'flex-4', kind: 'flex', days: 4, price: { second: { adult: 349, youth: 246 }, first: { adult: 555, youth: 390 } } },
  { id: 'flex-6', kind: 'flex', days: 6, price: { second: { adult: 424, youth: 300 }, first: { adult: 674, youth: 475 } } },
  { id: 'flex-8', kind: 'flex', days: 8, price: { second: { adult: 459, youth: 325 }, first: { adult: 729, youth: 514 } } },
  { id: 'flex-15', kind: 'flex', days: 15, price: { second: { adult: 519, youth: 370 }, first: { adult: 819, youth: 580 } } },
].map((p) => ({
  ...p,
  label: p.kind === 'flex' ? `Swiss Travel Pass Flex · ${p.days} days in a month` : `Swiss Travel Pass · ${p.days} consecutive days`,
}));

const PASS_INDEX = Object.fromEntries(PASSES.map((p) => [p.id, p]));
const getPass = (id) => PASS_INDEX[id] || null;

const TRAVELLER_TYPES = [
  { id: 'adult', label: 'Adult (25+)', note: 'Full pass price. The Half Fare Card costs the same CHF 150 at any age.' },
  { id: 'youth', label: 'Youth (under 25)', note: 'The pass is about 30% cheaper up to your 25th birthday; the Half Fare Card is not, which tilts young travellers towards the pass.' },
];

// What each product does to a leg's fare. `stp` and `hfc` are the share of the
// fare each one takes off. `confidence` follows ruleUpdates.js: 'official' is on
// the operator or Switzerland Tourism's own pages; 'reported' is consistent
// across independent sources but not stated as a figure officially.
const LEG_TYPES = [
  {
    id: 'transport',
    label: 'Train, bus, boat or city transport',
    examples: 'Zurich–Lucerne, Lake Geneva boats, Zurich trams, the Glacier Express fare itself',
    stp: 1,
    hfc: 0.5,
    confidence: 'official',
  },
  {
    id: 'included-summit',
    label: 'Rigi, Stoos or Stanserhorn',
    examples: 'The three summits the pass includes outright',
    stp: 1,
    hfc: 0.5,
    confidence: 'official',
  },
  {
    id: 'mountain-50',
    label: 'Other mountain excursion',
    examples: 'Titlis, Pilatus, Schilthorn, Gornergrat, Matterhorn Glacier Paradise, Harder Kulm',
    stp: 0.5,
    hfc: 0.5,
    confidence: 'reported',
    note: 'Officially "up to 50%". Most major summits give the full 50%; check the operator for yours.',
  },
  {
    id: 'jungfraujoch',
    label: 'Jungfraujoch, above Wengen or Grindelwald',
    examples: 'Enter Interlaken to Grindelwald or Wengen as an ordinary train leg, and only the section above it here',
    stp: 0.25,
    hfc: 0.5,
    confidence: 'reported',
    note: 'The pass is free up to Wengen or Grindelwald and 25% off above; the Half Fare Card is 50% off the whole route.',
  },
  {
    id: 'no-discount',
    label: 'Not discounted by either',
    examples: 'Private lifts, adventure activities, anything the operator excludes',
    stp: 0,
    hfc: 0,
    confidence: 'official',
  },
];

const LEG_INDEX = Object.fromEntries(LEG_TYPES.map((t) => [t.id, t]));
const getLegType = (id) => LEG_INDEX[id] || LEG_INDEX.transport;

// Below this gap between the two cheapest options, flexibility should decide,
// not the calculator.
const TOO_CLOSE_CHF = 20;

const round2 = (n) => Math.round(n * 100) / 100;
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const dayIndex = (iso) => {
  const t = new Date(`${iso}T00:00:00Z`).getTime();
  return Number.isNaN(t) ? null : Math.round(t / 86400000);
};

/** Published pass price, or the traveller's override when one is supplied. */
const passPrice = ({ passId, travellerType = 'adult', firstClass = false, priceOverride }) => {
  const override = num(priceOverride);
  if (override) return override;
  const pass = getPass(passId);
  if (!pass) return null;
  const who = travellerType === 'youth' ? 'youth' : 'adult';
  return pass.price[firstClass ? 'first' : 'second'][who];
};

const normaliseLegs = (legs = []) =>
  legs.filter(Boolean).map((leg, i) => {
    const type = getLegType(leg.type);
    const day = leg.date ? dayIndex(leg.date) : null;
    return {
      index: i,
      from: leg.from || '',
      to: leg.to || '',
      date: day === null ? null : leg.date,
      day,
      // Undated legs cannot share a day with anything, so each gets its own key.
      dayKey: day === null ? `undated-${i}` : `d${day}`,
      fare: num(leg.fare),
      supplement: num(leg.supplement),
      type,
    };
  });

/** Distinct travel days. Undated legs count as a day each — the cautious reading. */
const travelDays = (legs) => new Set(normaliseLegs(legs).map((l) => l.dayKey)).size;

/** Calendar span from the first to the last dated leg, inclusive, or null. */
const spanDays = (legs) => {
  const days = normaliseLegs(legs).map((l) => l.day).filter((d) => d !== null);
  if (days.length === 0) return null;
  return Math.max(...days) - Math.min(...days) + 1;
};

/**
 * Which days a pass should cover to save the most.
 *
 * Consecutive: the best contiguous window of `pass.days` calendar days. Undated
 * legs are assumed to fall inside it — the page warns when that assumption is
 * being made.
 * Flex: the `pass.days` days with the highest saving, all within one month of
 * the first chosen day. Choosing the most expensive days rather than the first
 * ones is how people actually use a Flex pass, and is the fair comparison.
 */
const chooseCoveredDays = (pass, list) => {
  const savingByDay = new Map();
  list.forEach((l) => {
    savingByDay.set(l.dayKey, (savingByDay.get(l.dayKey) || 0) + l.fare * l.type.stp);
  });

  if (pass.kind === 'consecutive') {
    const dated = [...new Set(list.map((l) => l.day).filter((d) => d !== null))].sort((a, b) => a - b);
    const undatedKeys = list.filter((l) => l.day === null).map((l) => l.dayKey);
    if (dated.length === 0) return new Set(undatedKeys);

    let best = null;
    dated.forEach((start) => {
      const end = start + pass.days - 1;
      const inWindow = dated.filter((d) => d >= start && d <= end);
      const saving = inWindow.reduce((s, d) => s + (savingByDay.get(`d${d}`) || 0), 0);
      if (!best || saving > best.saving) best = { saving, days: inWindow };
    });
    return new Set([...best.days.map((d) => `d${d}`), ...undatedKeys]);
  }

  // Flex. Try each dated day as the start of the one-month window and take the
  // highest-saving days inside it; undated legs compete on saving alone.
  const candidates = [...savingByDay.entries()].map(([key, saving]) => ({
    key,
    saving,
    day: key.startsWith('d') ? Number(key.slice(1)) : null,
  }));
  const starts = [...new Set(candidates.filter((c) => c.day !== null).map((c) => c.day))];
  if (starts.length === 0) starts.push(null);

  let best = null;
  starts.forEach((start) => {
    const pool = candidates
      .filter((c) => c.day === null || start === null || (c.day >= start && c.day < start + FLEX_WINDOW_DAYS))
      .sort((a, b) => b.saving - a.saving)
      .slice(0, pass.days);
    const saving = pool.reduce((s, c) => s + c.saving, 0);
    if (!best || saving > best.saving) best = { saving, keys: pool.map((c) => c.key) };
  });
  return new Set(best.keys);
};

/**
 * Cost the trip three ways — no card, Half Fare Card, each Swiss Travel Pass —
 * and rank them.
 *
 * @param {{
 *   legs?: Array<{ from?: string, to?: string, date?: string, fare?: number, supplement?: number, type?: string }>,
 *   travellerType?: 'adult'|'youth', firstClass?: boolean,
 *   museumsChf?: number, halfFarePriceChf?: number,
 *   passPriceOverrides?: Record<string, number>,
 * }} input
 */
const compareSwissOptions = ({
  legs = [],
  travellerType = 'adult',
  firstClass = false,
  museumsChf = 0,
  halfFarePriceChf,
  passPriceOverrides = {},
} = {}) => {
  const list = normaliseLegs(legs);
  if (list.length === 0) return null;

  const fullFares = round2(list.reduce((s, l) => s + l.fare, 0));
  const supplements = round2(list.reduce((s, l) => s + l.supplement, 0));
  const museums = num(museumsChf);
  const span = spanDays(legs);
  const daysNeeded = travelDays(legs);

  const options = [];

  options.push({
    id: 'none',
    kind: 'none',
    label: 'No card — ordinary tickets',
    productChf: 0,
    faresChf: fullFares,
    supplementsChf: supplements,
    museumsChf: museums,
    totalChf: round2(fullFares + supplements + museums),
    uncoveredLegs: [],
  });

  const hfcUnit = num(halfFarePriceChf) || HALF_FARE_CARD.priceChf;
  const hfcCards = span === null ? 1 : Math.max(1, Math.ceil(span / HALF_FARE_CARD.validityDays));
  const hfcFares = round2(list.reduce((s, l) => s + l.fare * (1 - l.type.hfc), 0));
  options.push({
    id: 'half-fare',
    kind: 'half-fare',
    label: hfcCards > 1 ? `Swiss Half Fare Card × ${hfcCards}` : 'Swiss Half Fare Card',
    cards: hfcCards,
    productChf: round2(hfcUnit * hfcCards),
    faresChf: hfcFares,
    supplementsChf: supplements,
    museumsChf: museums,
    totalChf: round2(hfcUnit * hfcCards + hfcFares + supplements + museums),
    uncoveredLegs: [],
  });

  PASSES.forEach((pass) => {
    const price = passPrice({ passId: pass.id, travellerType, firstClass, priceOverride: passPriceOverrides[pass.id] });
    const covered = chooseCoveredDays(pass, list);
    const uncoveredLegs = list.filter((l) => !covered.has(l.dayKey));
    const fares = round2(
      list.reduce((s, l) => s + (covered.has(l.dayKey) ? l.fare * (1 - l.type.stp) : l.fare), 0)
    );
    // Museum entry is free on every pass day; on a Flex pass the visit has to
    // fall on a travel day, which is the traveller's to arrange, so it is taken
    // as free here and flagged in the notes.
    options.push({
      id: pass.id,
      kind: pass.kind,
      label: pass.label,
      pass,
      productChf: price,
      faresChf: fares,
      supplementsChf: supplements,
      museumsChf: 0,
      totalChf: round2(price + fares + supplements),
      coveredDays: [...covered].filter((k) => k.startsWith('d')).map((k) => Number(k.slice(1))).sort((a, b) => a - b),
      uncoveredLegs,
    });
  });

  // Ties go to the simpler product: no card, then Half Fare, then the pass list order.
  const ranked = options
    .map((o, order) => ({ ...o, order, savingVsNoneChf: round2(options[0].totalChf - o.totalChf) }))
    .sort((a, b) => a.totalChf - b.totalChf || a.order - b.order);

  const best = ranked[0];
  const bestPass = ranked.find((o) => o.kind === 'consecutive' || o.kind === 'flex');
  const halfFare = ranked.find((o) => o.kind === 'half-fare');
  const runnerUp = ranked[1];
  const verdict = runnerUp && runnerUp.totalChf - best.totalChf <= TOO_CLOSE_CHF ? 'close' : best.kind === 'none' ? 'none' : best.kind === 'half-fare' ? 'half-fare' : 'pass';

  const mountainFares = round2(list.filter((l) => l.type.stp < 1 && l.type.id !== 'no-discount').reduce((s, l) => s + l.fare, 0));
  const warnings = [];

  if (list.some((l) => l.day === null) && list.some((l) => l.day !== null)) {
    warnings.push('Some legs have no date. Each is counted as its own travel day, and a consecutive pass is assumed to cover them — add dates for an exact answer.');
  }
  if (bestPass && bestPass.uncoveredLegs.length > 0 && bestPass.id === best.id) {
    warnings.push(
      `The cheapest pass leaves ${bestPass.uncoveredLegs.length} ${bestPass.uncoveredLegs.length === 1 ? 'leg' : 'legs'} outside its days, charged at full fare above. That is still cheaper than a bigger pass here.`
    );
  }
  if (hfcCards > 1) {
    warnings.push(`The trip spans ${span} days, longer than one Half Fare Card lasts, so ${hfcCards} cards are counted.`);
  }
  if (fullFares > 0 && mountainFares / fullFares >= 0.4) {
    warnings.push('Mountain excursions are a large share of this trip. The pass only discounts most of them, while the Half Fare Card halves them all — which is why the gap between the two is narrower than it looks on the train fares alone.');
  }
  if (museums > 0) {
    warnings.push('Museum entry is free only on a pass day. On a Flex pass, visit museums on days you have activated.');
  }
  if (supplements > 0) {
    warnings.push('Panorama-train seat reservations are payable in full whichever product you choose, so they are in every total but never in the saving.');
  }

  return {
    options: ranked,
    best,
    bestPass,
    halfFare,
    none: ranked.find((o) => o.kind === 'none'),
    verdict,
    fullFaresChf: fullFares,
    supplementsChf: supplements,
    daysNeeded,
    spanDays: span,
    warnings,
  };
};

module.exports = {
  VERIFIED,
  STALE_AFTER_DAYS,
  HALF_FARE_CARD,
  FLEX_WINDOW_DAYS,
  PASSES,
  TRAVELLER_TYPES,
  LEG_TYPES,
  TOO_CLOSE_CHF,
  getPass,
  getLegType,
  passPrice,
  travelDays,
  spanDays,
  compareSwissOptions,
};
