const test = require('node:test');
const assert = require('node:assert/strict');
const { WL_TYPES, getWlType, estimateChances, wlNumberFactor } = require('../utils/engines/waitlistChances');

test('WL_TYPES covers the six codes with all rendered fields', () => {
  assert.deepEqual(WL_TYPES.map((t) => t.code).sort(), ['GNWL', 'PQWL', 'RAC', 'RLWL', 'RSWL', 'TQWL'].sort());
  WL_TYPES.forEach((t) => {
    ['code', 'name', 'meaning', 'chartingNote'].forEach((field) => {
      assert.ok(t[field], `${t.code} missing ${field}`);
    });
    assert.equal(typeof t.baseScore, 'number');
  });
});

test('GNWL with a low number and long lead time lands in a strong band', () => {
  const r = estimateChances({ wlCode: 'GNWL', wlNumber: 4, daysToJourney: 30 });
  assert.ok(['very-high', 'high'].includes(r.band), `got ${r.band}`);
});

test('TQWL is never better than moderate', () => {
  [1, 5, 12, 40].forEach((n) => {
    const r = estimateChances({ wlCode: 'TQWL', wlNumber: n, daysToJourney: 1 });
    assert.ok(['moderate', 'low', 'very-low'].includes(r.band), `TQWL ${n} gave ${r.band}`);
  });
});

test('PQWL deep in the queue is very unlikely', () => {
  const r = estimateChances({ wlCode: 'PQWL', wlNumber: 45, daysToJourney: 5 });
  assert.equal(r.band, 'very-low');
});

test('RAC scores at the top of the scale', () => {
  const r = estimateChances({ wlCode: 'RAC', wlNumber: 8, daysToJourney: 10 });
  assert.ok(['very-high', 'high'].includes(r.band), `got ${r.band}`);
});

test('higher waitlist number never increases the score', () => {
  let prev = Infinity;
  [1, 6, 16, 31, 61, 120].forEach((n) => {
    const { score } = estimateChances({ wlCode: 'GNWL', wlNumber: n, daysToJourney: 10 });
    assert.ok(score <= prev, `score rose from ${prev} to ${score} at WL ${n}`);
    prev = score;
  });
});

test('peak season lowers the score', () => {
  const base = estimateChances({ wlCode: 'RLWL', wlNumber: 10, daysToJourney: 15 });
  const peak = estimateChances({ wlCode: 'RLWL', wlNumber: 10, daysToJourney: 15, peakSeason: true });
  assert.ok(peak.score < base.score);
});

test('score stays clamped to [3, 97] and factors are non-empty', () => {
  const worst = estimateChances({ wlCode: 'TQWL', wlNumber: 300, daysToJourney: 0, peakSeason: true });
  const best = estimateChances({ wlCode: 'RAC', wlNumber: 1, daysToJourney: 60 });
  assert.ok(worst.score >= 3 && best.score <= 97);
  assert.ok(worst.factors.length > 0 && best.factors.length > 0);
});

test('unknown code returns null and getWlType resolves codes', () => {
  assert.equal(estimateChances({ wlCode: 'XYZ', wlNumber: 1 }), null);
  assert.equal(getWlType('GNWL').name, 'General Waitlist');
  assert.equal(wlNumberFactor(3), 1.15);
});
