const test = require('node:test');
const assert = require('node:assert/strict');

const {
  VERIFIED,
  STALE_AFTER_DAYS,
  HALF_FARE_CARD,
  PASSES,
  LEG_TYPES,
  getPass,
  passPrice,
  travelDays,
  spanDays,
  compareSwissOptions,
} = require('../utils/engines/swissPasses');

const option = (result, id) => result.options.find((o) => o.id === id);

// --- Table integrity ---

test('pass ids are unique and resolvable', () => {
  const ids = PASSES.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  PASSES.forEach((p) => assert.equal(getPass(p.id), p));
});

test('more days never costs less, in every class and age column', () => {
  ['consecutive', 'flex'].forEach((kind) => {
    const tier = PASSES.filter((p) => p.kind === kind);
    ['first', 'second'].forEach((cls) => ['adult', 'youth'].forEach((who) => {
      for (let i = 1; i < tier.length; i += 1) {
        assert.ok(tier[i].price[cls][who] > tier[i - 1].price[cls][who], `${tier[i].id} ${cls}/${who} is not dearer`);
      }
    }));
  });
});

test('flex costs more than consecutive for the same number of days', () => {
  PASSES.filter((p) => p.kind === 'flex').forEach((flex) => {
    const cons = getPass(`stp-${flex.days}`);
    assert.ok(flex.price.second.adult > cons.price.second.adult, `${flex.id} is not dearer than ${cons.id}`);
  });
});

test('youth is roughly 30% off and first class is dearer, everywhere', () => {
  PASSES.forEach((p) => {
    ['first', 'second'].forEach((cls) => {
      const ratio = p.price[cls].youth / p.price[cls].adult;
      assert.ok(ratio > 0.66 && ratio < 0.74, `${p.id} ${cls} youth ratio ${ratio.toFixed(2)}`);
    });
    assert.ok(p.price.first.adult > p.price.second.adult);
  });
});

test('every leg type discount is a share between 0 and 1', () => {
  LEG_TYPES.forEach((t) => {
    assert.ok(t.stp >= 0 && t.stp <= 1 && t.hfc >= 0 && t.hfc <= 1, t.id);
  });
});

test('VERIFIED is a real ISO date and not in the future', () => {
  assert.match(VERIFIED, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(new Date(VERIFIED).getTime() <= Date.now());
});

test('Swiss pass prices have been checked within STALE_AFTER_DAYS', () => {
  const ageDays = (Date.now() - new Date(VERIFIED).getTime()) / 86400000;
  assert.ok(
    ageDays <= STALE_AFTER_DAYS,
    `Swiss pass prices last verified ${Math.round(ageDays)} days ago (limit ${STALE_AFTER_DAYS}). ` +
      'Swiss Travel System resets prices annually — re-check them, then move VERIFIED in utils/engines/swissPasses.js.'
  );
});

// --- Pricing ---

test('pass price picks the right cell and honours an override', () => {
  assert.equal(passPrice({ passId: 'stp-3' }), 254);
  assert.equal(passPrice({ passId: 'stp-3', travellerType: 'youth', firstClass: true }), 285);
  assert.equal(passPrice({ passId: 'flex-15', firstClass: true }), 819);
  assert.equal(passPrice({ passId: 'stp-3', priceOverride: 300 }), 300);
  assert.equal(passPrice({ passId: 'stp-3', priceOverride: 'abc' }), 254);
});

// --- Day accounting ---

test('legs on one date share a travel day; undated legs count separately', () => {
  const legs = [
    { date: '2026-06-01', fare: 10 },
    { date: '2026-06-01', fare: 10 },
    { date: '2026-06-03', fare: 10 },
    { fare: 10 },
  ];
  assert.equal(travelDays(legs), 3);
  assert.equal(spanDays(legs), 3);
});

// --- Comparison ---

test('a train-heavy week makes the consecutive pass win', () => {
  const legs = [
    { date: '2026-06-01', fare: 110, type: 'transport' },
    { date: '2026-06-02', fare: 90, type: 'transport' },
    { date: '2026-06-03', fare: 120, type: 'transport' },
    { date: '2026-06-04', fare: 100, type: 'transport' },
  ];
  const r = compareSwissOptions({ legs });
  assert.equal(r.best.id, 'stp-4');
  assert.equal(r.best.totalChf, 309);
  assert.equal(r.verdict, 'pass');
  assert.equal(option(r, 'none').totalChf, 420);
  assert.equal(option(r, 'half-fare').totalChf, 150 + 210);
});

test('a light, mountain-heavy trip favours the Half Fare Card', () => {
  const legs = [
    { date: '2026-06-01', fare: 70, type: 'transport' },
    { date: '2026-06-02', fare: 190, type: 'jungfraujoch' },
    { date: '2026-06-03', fare: 92, type: 'mountain-50' },
    { date: '2026-06-04', fare: 70, type: 'transport' },
  ];
  const r = compareSwissOptions({ legs });
  // Half Fare: 150 + 211. Best pass (4 days): 309 + 190*0.75 + 92*0.5 = 497.5.
  assert.equal(option(r, 'half-fare').totalChf, 361);
  assert.equal(option(r, 'stp-4').totalChf, 497.5);
  assert.equal(r.best.id, 'half-fare');
});

test('Jungfraujoch is 25% off with the pass and half off with the card', () => {
  const legs = [{ date: '2026-06-01', fare: 200, type: 'jungfraujoch' }];
  const r = compareSwissOptions({ legs });
  assert.equal(option(r, 'stp-3').faresChf, 150);
  assert.equal(option(r, 'half-fare').faresChf, 100);
});

test('Rigi is free on the pass, half price on the card', () => {
  const legs = [{ date: '2026-06-01', fare: 80, type: 'included-summit' }];
  const r = compareSwissOptions({ legs });
  assert.equal(option(r, 'stp-3').faresChf, 0);
  assert.equal(option(r, 'half-fare').faresChf, 40);
});

test('a flex pass is spent on the most expensive days, not the first ones', () => {
  const legs = [
    { date: '2026-06-01', fare: 10 },
    { date: '2026-06-05', fare: 150 },
    { date: '2026-06-09', fare: 20 },
    { date: '2026-06-12', fare: 140 },
    { date: '2026-06-15', fare: 160 },
    { date: '2026-06-18', fare: 15 },
  ];
  const r = compareSwissOptions({ legs });
  const flex3 = option(r, 'flex-3');
  assert.equal(flex3.faresChf, 10 + 20 + 15);
  assert.equal(flex3.uncoveredLegs.length, 3);
});

test('a consecutive pass covers the best window and charges full fare outside it', () => {
  const legs = [
    { date: '2026-06-01', fare: 20 },
    { date: '2026-06-10', fare: 100 },
    { date: '2026-06-11', fare: 100 },
  ];
  const r = compareSwissOptions({ legs });
  const stp3 = option(r, 'stp-3');
  assert.equal(stp3.faresChf, 20);
  assert.deepEqual(stp3.uncoveredLegs.map((l) => l.index), [0]);
});

test('a flex pass cannot reach days more than a month apart', () => {
  const legs = [
    { date: '2026-06-01', fare: 100 },
    { date: '2026-07-15', fare: 100 },
  ];
  const r = compareSwissOptions({ legs });
  assert.equal(option(r, 'flex-3').faresChf, 100);
});

test('reservation supplements are paid in full under every option', () => {
  const legs = [{ date: '2026-06-01', fare: 150, supplement: 49, type: 'transport' }];
  const r = compareSwissOptions({ legs });
  r.options.forEach((o) => assert.equal(o.supplementsChf, 49, o.id));
});

test('museum entry is free on the pass and paid otherwise', () => {
  const legs = [{ date: '2026-06-01', fare: 50 }];
  const r = compareSwissOptions({ legs, museumsChf: 60 });
  assert.equal(option(r, 'none').museumsChf, 60);
  assert.equal(option(r, 'half-fare').museumsChf, 60);
  assert.equal(option(r, 'stp-3').museumsChf, 0);
});

test('a trip longer than a month needs a second Half Fare Card', () => {
  const legs = [
    { date: '2026-06-01', fare: 50 },
    { date: '2026-07-10', fare: 50 },
  ];
  const r = compareSwissOptions({ legs });
  const hfc = option(r, 'half-fare');
  assert.equal(hfc.cards, 2);
  assert.equal(hfc.productChf, HALF_FARE_CARD.priceChf * 2);
});

test('the youth pass price is used for young travellers', () => {
  const legs = [{ date: '2026-06-01', fare: 10 }];
  const r = compareSwissOptions({ legs, travellerType: 'youth' });
  assert.equal(option(r, 'stp-3').productChf, 179);
});

test('options inside TOO_CLOSE_CHF of each other are called close', () => {
  // No card 250 vs a 3-day pass at 254.
  const r = compareSwissOptions({ legs: [{ date: '2026-06-01', fare: 250 }] });
  assert.equal(r.verdict, 'close');
});

test('an empty trip returns null rather than a meaningless ranking', () => {
  assert.equal(compareSwissOptions({ legs: [] }), null);
});
