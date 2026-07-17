const test = require('node:test');
const assert = require('node:assert/strict');

const {
  flatChargePerPassenger,
  clerkagePerPassenger,
  computeCancellationRefund
} = require('../utils/engines/irctcCancellation');

// --- flat charge table (per passenger, GST on AC classes only) ---

test('flat charges include 5% GST for AC classes and none for SL/2S', () => {
  assert.equal(flatChargePerPassenger('1A'), 252); // 240 + 5%
  assert.equal(flatChargePerPassenger('2A'), 210); // 200 + 5%
  assert.equal(flatChargePerPassenger('3A'), 189); // 180 + 5%
  assert.equal(flatChargePerPassenger('SL'), 120);
  assert.equal(flatChargePerPassenger('2S'), 60);
});

test('RAC/WL clerkage is ₹60 + GST per passenger', () => {
  assert.equal(clerkagePerPassenger(), 63);
});

// --- confirmed-ticket slabs (April 2026 rules) ---

test('confirmed, 72h or more: only the flat charge is deducted', () => {
  const r = computeCancellationRefund({ classCode: 'SL', ticketType: 'confirmed', fare: 800, hoursBeforeDeparture: 100 });
  assert.equal(r.rule, 'flat');
  assert.equal(r.deduction, 120);
  assert.equal(r.refund, 680);
});

test('confirmed, exactly 72h: still the flat-charge slab (boundary is inclusive)', () => {
  const r = computeCancellationRefund({ classCode: '2A', ticketType: 'confirmed', fare: 3000, hoursBeforeDeparture: 72 });
  assert.equal(r.rule, 'flat');
  assert.equal(r.deduction, 210);
});

test('confirmed, 72–24h: 25% of fare when it exceeds the flat minimum', () => {
  const r = computeCancellationRefund({ classCode: '3A', ticketType: 'confirmed', fare: 2400, hoursBeforeDeparture: 48, passengers: 2 });
  assert.equal(r.rule, 'slab-25');
  assert.equal(r.deduction, 600); // 25% of 2400 > 189 × 2 = 378
  assert.equal(r.refund, 1800);
  assert.equal(r.minChargeApplied, false);
});

test('confirmed, 72–24h: flat minimum wins on a cheap ticket', () => {
  const r = computeCancellationRefund({ classCode: '1A', ticketType: 'confirmed', fare: 900, hoursBeforeDeparture: 48 });
  assert.equal(r.rule, 'slab-25');
  assert.equal(r.deduction, 252); // 25% of 900 = 225 < 252
  assert.equal(r.minChargeApplied, true);
});

test('confirmed, 24–8h: 50% of fare deducted', () => {
  const r = computeCancellationRefund({ classCode: 'SL', ticketType: 'confirmed', fare: 1000, hoursBeforeDeparture: 12 });
  assert.equal(r.rule, 'slab-50');
  assert.equal(r.deduction, 500);
  assert.equal(r.refund, 500);
});

test('confirmed, exactly 8h: still the 50% slab (no-refund starts below 8h)', () => {
  const r = computeCancellationRefund({ classCode: 'SL', ticketType: 'confirmed', fare: 1000, hoursBeforeDeparture: 8 });
  assert.equal(r.rule, 'slab-50');
});

test('confirmed, under 8h: no refund', () => {
  const r = computeCancellationRefund({ classCode: '2A', ticketType: 'confirmed', fare: 2500, hoursBeforeDeparture: 5 });
  assert.equal(r.rule, 'no-refund');
  assert.equal(r.refund, 0);
  assert.equal(r.deduction, 2500);
});

// --- RAC / waitlisted ---

test('RAC cancelled 40h out: flat ₹63 clerkage per passenger, slabs do not apply', () => {
  const r = computeCancellationRefund({ classCode: '3A', ticketType: 'rac', fare: 1500, hoursBeforeDeparture: 40, passengers: 2 });
  assert.equal(r.rule, 'clerkage');
  assert.equal(r.deduction, 126);
  assert.equal(r.refund, 1374);
});

test('waitlisted cancelled 20 minutes before departure: no refund', () => {
  const r = computeCancellationRefund({ classCode: 'SL', ticketType: 'waitlisted', fare: 600, hoursBeforeDeparture: 20 / 60 });
  assert.equal(r.rule, 'rac-wl-late');
  assert.equal(r.refund, 0);
});

// --- Tatkal ---

test('confirmed Tatkal: no refund regardless of timing', () => {
  const r = computeCancellationRefund({ classCode: '3A', ticketType: 'tatkal-confirmed', fare: 2000, hoursBeforeDeparture: 120 });
  assert.equal(r.rule, 'tatkal-no-refund');
  assert.equal(r.refund, 0);
});

test('Tatkal RAC/WL follows the clerkage rule', () => {
  const r = computeCancellationRefund({ classCode: '2A', ticketType: 'tatkal-rac-wl', fare: 1800, hoursBeforeDeparture: 10 });
  assert.equal(r.rule, 'clerkage');
  assert.equal(r.deduction, 63);
});

// --- guards ---

test('deduction never exceeds the fare', () => {
  const r = computeCancellationRefund({ classCode: '1A', ticketType: 'confirmed', fare: 200, hoursBeforeDeparture: 80 });
  assert.equal(r.deduction, 200); // flat 252 capped at fare
  assert.equal(r.refund, 0);
});

test('invalid fare returns the invalid marker', () => {
  const r = computeCancellationRefund({ classCode: 'SL', ticketType: 'confirmed', fare: 0, hoursBeforeDeparture: 80 });
  assert.equal(r.rule, 'invalid');
});
