const test = require('node:test');
const assert = require('node:assert/strict');

const {
  VERIFIED,
  STALE_AFTER_DAYS,
  PASSES,
  TRAVELLER_TYPES,
  FIRST_CLASS_MULTIPLIER,
  TOO_CLOSE_EUR,
  getPass,
  passPrice,
  travelDaysUsed,
  itinerarySpanDays,
  comparePass,
  recommendPass,
} = require('../utils/engines/railPasses');

// --- Table integrity ---

test('pass ids are unique and resolvable', () => {
  const ids = PASSES.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  PASSES.forEach((p) => assert.equal(getPass(p.id), p));
});

test('a continuous pass has as many travel days as it has validity days', () => {
  PASSES.filter((p) => p.kind === 'continuous').forEach((p) => {
    assert.equal(p.travelDays, p.validityDays, `${p.id} is continuous but sells fewer days than it is valid for`);
  });
});

test('a flexi pass is valid for longer than the days it sells', () => {
  PASSES.filter((p) => p.kind === 'flexi').forEach((p) => {
    assert.ok(p.validityDays > p.travelDays, `${p.id} sells as many days as it is valid for — that is a continuous pass`);
  });
});

test('more travel days never costs less', () => {
  const flexi = PASSES.filter((p) => p.kind === 'flexi');
  for (let i = 1; i < flexi.length; i += 1) {
    assert.ok(
      flexi[i].indicativePriceEur > flexi[i - 1].indicativePriceEur,
      `${flexi[i].id} is not dearer than ${flexi[i - 1].id}`
    );
  }
});

// --- Pricing ---

test('the traveller multiplier is applied to the base price', () => {
  const adult = passPrice({ passId: 'flexi-7-1m', travellerType: 'adult' });
  const youth = passPrice({ passId: 'flexi-7-1m', travellerType: 'youth' });
  const senior = passPrice({ passId: 'flexi-7-1m', travellerType: 'senior' });
  assert.equal(youth, Math.round(adult * 0.75 * 100) / 100);
  assert.equal(senior, Math.round(adult * 0.9 * 100) / 100);
  assert.ok(youth < senior && senior < adult);
});

test('a child pass costs nothing — they travel on the adult pass', () => {
  assert.equal(passPrice({ passId: 'flexi-7-1m', travellerType: 'child' }), 0);
});

test('first class scales the price and stacks with the traveller discount', () => {
  const second = passPrice({ passId: 'cont-1m', travellerType: 'youth' });
  const first = passPrice({ passId: 'cont-1m', travellerType: 'youth', firstClass: true });
  assert.equal(first, Math.round(second * FIRST_CLASS_MULTIPLIER * 100) / 100);
});

test('an explicit price override beats the indicative table', () => {
  assert.equal(passPrice({ passId: 'flexi-4-1m', priceOverride: 400 }), 400);
  assert.equal(passPrice({ passId: 'flexi-4-1m', priceOverride: 400, travellerType: 'youth' }), 300);
});

test('a nonsense override falls back to the table rather than producing zero', () => {
  const table = getPass('flexi-4-1m').indicativePriceEur;
  assert.equal(passPrice({ passId: 'flexi-4-1m', priceOverride: 0 }), table);
  assert.equal(passPrice({ passId: 'flexi-4-1m', priceOverride: -50 }), table);
  assert.equal(passPrice({ passId: 'flexi-4-1m', priceOverride: 'abc' }), table);
});

test('an override alone prices a pass even with no pass id', () => {
  assert.equal(passPrice({ passId: 'nope', priceOverride: 250 }), 250);
  assert.equal(passPrice({ passId: 'nope' }), null);
});

// --- Travel-day accounting ---

test('several journeys on one date consume a single travel day', () => {
  const j = [
    { date: '2026-09-01', fare: 40 },
    { date: '2026-09-01', fare: 25 },
    { date: '2026-09-01', fare: 15 },
  ];
  assert.equal(travelDaysUsed(j), 1);
});

test('journeys on different dates consume a day each', () => {
  assert.equal(travelDaysUsed([{ date: '2026-09-01' }, { date: '2026-09-04' }, { date: '2026-09-09' }]), 3);
});

test('undated journeys are counted individually rather than merged', () => {
  // Merging them would understate the pass tier the traveller needs.
  assert.equal(travelDaysUsed([{ fare: 30 }, { fare: 30 }]), 2);
  assert.equal(travelDaysUsed([{ date: '2026-09-01' }, { fare: 30 }]), 2);
});

test('an empty itinerary uses no days and has no span', () => {
  assert.equal(travelDaysUsed([]), 0);
  assert.equal(itinerarySpanDays([]), null);
});

test('the span is inclusive of both end dates', () => {
  assert.equal(itinerarySpanDays([{ date: '2026-09-01' }, { date: '2026-09-01' }]), 1);
  assert.equal(itinerarySpanDays([{ date: '2026-09-01' }, { date: '2026-09-10' }]), 10);
});

test('the span is unaffected by the order journeys are listed in', () => {
  const forward = itinerarySpanDays([{ date: '2026-09-01' }, { date: '2026-09-20' }]);
  const backward = itinerarySpanDays([{ date: '2026-09-20' }, { date: '2026-09-01' }]);
  assert.equal(forward, backward);
});

// --- The comparison itself ---

const GERMAN_TRIP = [
  { from: 'Berlin', to: 'Munich', date: '2026-09-01', fare: 120, serviceId: 'db-ice' },
  { from: 'Munich', to: 'Hamburg', date: '2026-09-04', fare: 140, serviceId: 'db-ice' },
  { from: 'Hamburg', to: 'Köln', date: '2026-09-07', fare: 95, serviceId: 'db-ice' },
  { from: 'Köln', to: 'Berlin', date: '2026-09-10', fare: 110, serviceId: 'db-ice' },
];

test('a pass wins on an expensive German itinerary with no compulsory fees', () => {
  const r = comparePass({ passId: 'flexi-4-1m', priceOverride: 283, journeys: GERMAN_TRIP });
  assert.equal(r.ticketTotalEur, 465);
  assert.equal(r.verdict, 'pass');
  assert.ok(r.savingEur.min > 0);
});

test('German ICE fees are optional, so they do not inflate the pass side', () => {
  // db-ice is 'recommended', not 'compulsory' — but the fee is still real if
  // you choose to reserve, so it appears in the range, not as a fixed cost.
  const r = comparePass({ passId: 'flexi-4-1m', priceOverride: 283, journeys: GERMAN_TRIP });
  assert.equal(r.passTotalEur.min, round(283 + 6 * 4));
  assert.equal(r.uncoveredFaresEur, 0);
});

const FRENCH_TRIP = [
  { from: 'Paris', to: 'Lyon', date: '2026-09-01', fare: 45, serviceId: 'tgv-inoui' },
  { from: 'Lyon', to: 'Marseille', date: '2026-09-03', fare: 35, serviceId: 'tgv-inoui' },
  { from: 'Marseille', to: 'Barcelona', date: '2026-09-06', fare: 55, serviceId: 'tgv-inoui' },
];

test('compulsory French fees push a cheap-fare itinerary towards tickets', () => {
  const r = comparePass({ passId: 'flexi-4-1m', priceOverride: 283, journeys: FRENCH_TRIP });
  assert.equal(r.ticketTotalEur, 135);
  assert.equal(r.reservationEur.min, 30); // 3 × €10
  assert.equal(r.reservationEur.max, 60); // 3 × €20
  assert.equal(r.verdict, 'tickets');
  assert.ok(r.savingEur.max < 0, 'even the best case should lose');
});

test('the break-even figure is the pass total, including its fees', () => {
  const r = comparePass({ passId: 'flexi-4-1m', priceOverride: 283, journeys: FRENCH_TRIP });
  assert.deepEqual(r.breakEvenEur, r.passTotalEur);
  assert.equal(r.breakEvenEur.min, 313);
});

test('an operator that refuses passes has its full fare charged to the pass side', () => {
  const r = comparePass({
    passId: 'flexi-4-1m',
    priceOverride: 300,
    journeys: [{ date: '2026-09-01', fare: 90, serviceId: 'italo' }],
  });
  assert.equal(r.uncoveredFaresEur, 90);
  assert.equal(r.passTotalEur.min, 390);
  assert.equal(r.notCovered.length, 1);
  assert.match(r.warnings.join(' '), /do(es)? not accept rail passes/);
});

test('a near-tie is reported as too close to call rather than a false winner', () => {
  const r = comparePass({
    passId: 'flexi-4-1m',
    priceOverride: 200,
    journeys: [{ date: '2026-09-01', fare: 210, serviceId: 'sbb-domestic' }],
  });
  assert.equal(r.verdict, 'close');
  assert.ok(Math.abs((r.savingEur.min + r.savingEur.max) / 2) <= TOO_CLOSE_EUR);
});

test('non-euro fees are kept out of the euro total and surfaced separately', () => {
  const r = comparePass({
    passId: 'flexi-4-1m',
    priceOverride: 283,
    journeys: [{ date: '2026-09-01', fare: 100, serviceId: 'glacier-bernina' }],
  });
  assert.equal(r.reservationEur.min, 0);
  assert.equal(r.otherCurrencies.CHF.min, 24);
  assert.match(r.warnings.join(' '), /currency other than the euro/);
});

// --- Warnings ---

test('an itinerary needing more days than the pass sells is flagged', () => {
  const j = ['01', '02', '03', '04', '05', '06'].map((d) => ({ date: `2026-09-${d}`, fare: 50, serviceId: 'db-ice' }));
  const r = comparePass({ passId: 'flexi-4-1m', priceOverride: 283, journeys: j });
  assert.equal(r.daysUsed, 6);
  assert.equal(r.overTravelDays, 2);
  assert.match(r.warnings.join(' '), /needs 6 travel days but the pass covers 4/);
});

test('an itinerary spanning longer than the pass is valid for is flagged', () => {
  const r = comparePass({
    passId: 'flexi-4-1m', // 31 days validity
    priceOverride: 283,
    journeys: [
      { date: '2026-09-01', fare: 50, serviceId: 'db-ice' },
      { date: '2026-10-20', fare: 50, serviceId: 'db-ice' },
    ],
  });
  assert.ok(r.overValidity > 0);
  assert.match(r.warnings.join(' '), /longer than this pass stays valid/);
});

test('substantially unused travel days are flagged as a waste', () => {
  const r = comparePass({
    passId: 'flexi-15-2m',
    priceOverride: 567,
    journeys: [{ date: '2026-09-01', fare: 50, serviceId: 'db-ice' }],
  });
  assert.equal(r.daysSpare, 14);
  assert.match(r.warnings.join(' '), /go unused/);
});

test('a fee-heavy route warns that the supplements are eating the pass', () => {
  const r = comparePass({ passId: 'flexi-4-1m', priceOverride: 283, journeys: FRENCH_TRIP });
  assert.match(r.warnings.join(' '), /substantial share of the pass price/);
});

test('a clean German itinerary produces no warnings at all', () => {
  const r = comparePass({ passId: 'flexi-4-1m', priceOverride: 283, journeys: GERMAN_TRIP });
  assert.deepEqual(r.warnings, []);
});

test('cost per travel day divides the full pass cost, fees included', () => {
  const r = comparePass({ passId: 'flexi-4-1m', priceOverride: 283, journeys: GERMAN_TRIP });
  assert.equal(r.costPerTravelDay.min, round(r.passTotalEur.min / 4));
});

// --- Recommendation ---

test('the recommender picks the cheapest tier that actually fits', () => {
  const j = ['01', '03', '05', '07', '09'].map((d) => ({ date: `2026-09-${d}`, fare: 90, serviceId: 'db-ice' }));
  const r = recommendPass({ journeys: j });
  assert.equal(r.needDays, 5);
  assert.equal(r.best.pass.id, 'flexi-5-1m');
  // Nothing smaller than the days needed may be offered.
  r.viable.forEach((v) => assert.ok(v.pass.travelDays >= 5));
});

test('the recommender rejects a tier that expires before the last journey', () => {
  const r = recommendPass({
    journeys: [
      { date: '2026-09-01', fare: 80, serviceId: 'db-ice' },
      { date: '2026-10-25', fare: 80, serviceId: 'db-ice' },
    ],
  });
  // 55-day span rules out every 31-day pass regardless of how few days are used.
  r.viable.forEach((v) => assert.ok(v.pass.validityDays >= 55, `${v.pass.id} expires too soon`));
  assert.ok(r.best.pass.validityDays >= 55);
});

test('the recommender says so when nothing fits', () => {
  // 100 undated journeys count as 100 separate travel days — more than the
  // largest pass sells, so there is honestly nothing to recommend.
  const r = recommendPass({ journeys: Array.from({ length: 100 }, () => ({ fare: 10 })) });
  assert.equal(r.best, null);
  assert.deepEqual(r.viable, []);
  assert.match(r.reason, /No single pass/);
});

test('the recommender carries the traveller discount into every option', () => {
  const j = [{ date: '2026-09-01', fare: 90, serviceId: 'db-ice' }];
  const adult = recommendPass({ journeys: j, travellerType: 'adult' });
  const youth = recommendPass({ journeys: j, travellerType: 'youth' });
  assert.ok(youth.best.passPriceEur < adult.best.passPriceEur);
});

test('an empty itinerary has nothing to recommend', () => {
  assert.equal(recommendPass({ journeys: [] }), null);
});

// --- Guards ---

test('an unknown pass with no override returns null rather than a bogus total', () => {
  assert.equal(comparePass({ passId: 'not-a-pass', journeys: GERMAN_TRIP }), null);
  assert.equal(comparePass({}), null);
});

test('a pass with no journeys still prices itself', () => {
  const r = comparePass({ passId: 'flexi-4-1m', priceOverride: 283, journeys: [] });
  assert.equal(r.ticketTotalEur, 0);
  assert.equal(r.verdict, 'tickets');
  assert.deepEqual(r.costPerTravelDay, { min: 0, max: 0 });
});

test('journeys without a fare are treated as zero, not as NaN', () => {
  const r = comparePass({
    passId: 'flexi-4-1m',
    priceOverride: 283,
    journeys: [{ date: '2026-09-01', serviceId: 'db-ice' }, { date: '2026-09-02', fare: 50, serviceId: 'db-ice' }],
  });
  assert.equal(r.ticketTotalEur, 50);
  assert.ok(Number.isFinite(r.savingEur.min));
});

// --- Freshness ---

test('VERIFIED is a real ISO date and not in the future', () => {
  assert.match(VERIFIED, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(new Date(VERIFIED).getTime() <= Date.now(), 'VERIFIED is in the future');
});

test('indicative pass prices have been checked within STALE_AFTER_DAYS', () => {
  const ageDays = (Date.now() - new Date(VERIFIED).getTime()) / 86400000;
  assert.ok(
    ageDays <= STALE_AFTER_DAYS,
    `Pass prices last verified ${Math.round(ageDays)} days ago (limit ${STALE_AFTER_DAYS}). ` +
      'Interrail resets prices annually — re-check them, then move VERIFIED in utils/engines/railPasses.js.'
  );
});

test('every traveller type is a proportional discount, never a markup', () => {
  TRAVELLER_TYPES.forEach((t) => {
    assert.ok(t.multiplier >= 0 && t.multiplier <= 1, `${t.id} is not a discount`);
  });
});

function round(n) {
  return Math.round(n * 100) / 100;
}
