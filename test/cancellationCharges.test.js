const test = require('node:test');
const assert = require('node:assert/strict');
const { CLASS_PAGES, SLABS, getClassPage, chargeTable } = require('../utils/cancellationCharges');
const { CLASS_RULES, computeCancellationRefund, flatChargePerPassenger } = require('../utils/engines/irctcCancellation');

test('there is exactly one page per engine class, and every class code is covered once', () => {
  assert.deepEqual(
    CLASS_PAGES.map((p) => p.classCode).sort(),
    Object.keys(CLASS_RULES).sort()
  );
  const covered = CLASS_PAGES.flatMap((p) => p.covers);
  assert.equal(new Set(covered).size, covered.length, 'a class is covered by two pages');
  for (const p of CLASS_PAGES) assert.ok(p.covers.includes(p.classCode));
});

test('every example figure is the engine’s figure', () => {
  for (const page of CLASS_PAGES) {
    const table = chargeTable(page);
    assert.equal(table.flatWithGst, flatChargePerPassenger(page.classCode));
    for (const slab of table.slabs) {
      for (const ex of slab.examples) {
        const r = computeCancellationRefund({
          classCode: page.classCode, ticketType: 'confirmed', fare: ex.fare, hoursBeforeDeparture: slab.hours,
        });
        assert.equal(ex.deduction, r.deduction, `${page.slug} ${slab.id} ₹${ex.fare}`);
        assert.equal(ex.refund, r.refund);
        assert.equal(ex.rule, slab.rule, `${page.slug} ${slab.id}: representative hour lands in the wrong slab`);
      }
    }
  }
});

test('slabs are ordered from earliest to latest cancellation', () => {
  const hours = SLABS.map((s) => s.hours);
  assert.deepEqual(hours, [...hours].sort((a, b) => b - a));
  assert.equal(SLABS[SLABS.length - 1].rule, 'no-refund');
});

test('the break-even fares are where the percentage overtakes the flat charge', () => {
  const t = chargeTable(getClassPage('sleeper-sl'));
  const below = computeCancellationRefund({ classCode: 'SL', ticketType: 'confirmed', fare: t.breakEven25 - 1, hoursBeforeDeparture: 48 });
  const above = computeCancellationRefund({ classCode: 'SL', ticketType: 'confirmed', fare: t.breakEven25 + 1, hoursBeforeDeparture: 48 });
  assert.equal(below.minChargeApplied, true);
  assert.equal(above.minChargeApplied, false);
});

test('example fares are large enough that at least one slab shows the percentage biting', () => {
  for (const page of CLASS_PAGES) {
    const t = chargeTable(page);
    const slab50 = t.slabs.find((s) => s.rule === 'slab-50');
    assert.ok(slab50.examples.some((e) => !e.minChargeApplied), `${page.slug}: raise the example fares`);
  }
});
