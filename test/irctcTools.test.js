const test = require('node:test');
const assert = require('node:assert/strict');
const { TATKAL_RULES, computeTatkalCharge } = require('../utils/engines/tatkalCharges');
const { TDR_SCENARIOS, getScenario } = require('../utils/engines/tdrRules');
const { CLASS_LAYOUTS, computeBerthPosition } = require('../utils/engines/berthPosition');

test('Tatkal 3A charge is 30% of basic fare inside the caps', () => {
  const r = computeTatkalCharge({ classCode: '3A', basicFare: 1200, passengers: 2 });
  assert.equal(r.chargePerPassenger, 360); // 30% of 1200, between 300 and 400
  assert.equal(r.minApplied, false);
  assert.equal(r.maxApplied, false);
  assert.equal(r.totalCharge, 720);
  assert.equal(r.totalFare, (1200 + 360) * 2);
});

test('Tatkal minimum cap binds on cheap fares', () => {
  const r = computeTatkalCharge({ classCode: 'SL', basicFare: 400, passengers: 1 });
  assert.equal(r.chargePerPassenger, 100); // 10% = 40, floored at ₹100
  assert.equal(r.minApplied, true);
});

test('Tatkal maximum cap binds on expensive fares', () => {
  const r = computeTatkalCharge({ classCode: '2A', basicFare: 3000, passengers: 1 });
  assert.equal(r.chargePerPassenger, 500); // 30% = 900, capped at ₹500
  assert.equal(r.maxApplied, true);
});

test('Tatkal rules table covers the six Tatkal classes and no 1A', () => {
  assert.deepEqual(Object.keys(TATKAL_RULES).sort(), ['2A', '2S', '3A', 'CC', 'EC', 'SL'].sort());
});

test('TDR scenarios all carry the fields the checker renders', () => {
  assert.ok(TDR_SCENARIOS.length >= 8);
  TDR_SCENARIOS.forEach((s) => {
    ['id', 'label', 'refundText', 'deadlineText', 'detail'].forEach((field) => {
      assert.ok(s[field], `${s.id} missing ${field}`);
    });
    assert.equal(typeof s.eligible, 'boolean');
    assert.equal(typeof s.needsTdr, 'boolean');
  });
  assert.equal(getScenario('delay-3h').refundExtent, 'full');
  assert.equal(getScenario('nope'), null);
});

test('Sleeper berth types follow the 8-berth bay pattern', () => {
  assert.equal(computeBerthPosition({ classCode: 'SL', berthNumber: 1 }).type, 'LB');
  assert.equal(computeBerthPosition({ classCode: 'SL', berthNumber: 2 }).type, 'MB');
  assert.equal(computeBerthPosition({ classCode: 'SL', berthNumber: 7 }).type, 'SL');
  assert.equal(computeBerthPosition({ classCode: 'SL', berthNumber: 8 }).type, 'SU');
  assert.equal(computeBerthPosition({ classCode: 'SL', berthNumber: 23 }).type, 'SL');
  assert.equal(computeBerthPosition({ classCode: 'SL', berthNumber: 23 }).bay, 3);
});

test('2A berth types follow the 6-berth bay pattern', () => {
  assert.equal(computeBerthPosition({ classCode: '2A', berthNumber: 2 }).type, 'UB');
  assert.equal(computeBerthPosition({ classCode: '2A', berthNumber: 5 }).type, 'SL');
  assert.equal(computeBerthPosition({ classCode: '2A', berthNumber: 6 }).type, 'SU');
  assert.equal(computeBerthPosition({ classCode: '2A', berthNumber: 7 }).type, 'LB');
});

test('1A alternates lower/upper', () => {
  assert.equal(computeBerthPosition({ classCode: '1A', berthNumber: 3 }).type, 'LB');
  assert.equal(computeBerthPosition({ classCode: '1A', berthNumber: 4 }).type, 'UB');
});

test('berth finder rejects out-of-range numbers', () => {
  assert.equal(computeBerthPosition({ classCode: 'SL', berthNumber: 0 }), null);
  assert.equal(computeBerthPosition({ classCode: 'SL', berthNumber: 99 }), null);
  assert.equal(computeBerthPosition({ classCode: '3A', berthNumber: 2.5 }), null);
});

test('every layout cycle only uses known berth types', () => {
  Object.values(CLASS_LAYOUTS).forEach((layout) => {
    layout.cycle.forEach((t) => assert.ok(['LB', 'MB', 'UB', 'SL', 'SU'].includes(t)));
  });
});
