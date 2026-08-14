const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CLASSES,
  MARGINAL_MULTIPLIER,
  UNDECLARED_MULTIPLIER,
  MIN_UNDECLARED_CHARGE,
  CHILD_ALLOWANCE_CAP,
  SIZE_LIMITS,
  FREE_ITEMS,
  PROHIBITED_ITEMS,
  DANGEROUS_GOODS,
  PETS,
  sizeLimitFor,
  allowanceFor,
  luggageCharge,
  assessLuggage,
} = require('../utils/engines/luggageAllowance');

// --- Table integrity ---

test('every class declares free, marginal and max weights', () => {
  Object.values(CLASSES).forEach((c) => {
    assert.ok(c.free > 0, `${c.code} has no free allowance`);
    assert.ok(c.marginal > 0, `${c.code} has no marginal allowance`);
    assert.ok(c.max >= c.free, `${c.code} has a maximum below its free allowance`);
  });
});

test('the free allowance rises with the class', () => {
  assert.ok(CLASSES['1A'].free > CLASSES['2A'].free);
  assert.ok(CLASSES['2A'].free > CLASSES['3A'].free);
  assert.ok(CLASSES.SL.free > CLASSES['2S'].free);
});

test('every class maps to exactly one size limit', () => {
  const listed = [...SIZE_LIMITS.standard.classes, ...SIZE_LIMITS.compact.classes];
  assert.deepEqual(listed.sort(), Object.keys(CLASSES).sort());
  Object.keys(CLASSES).forEach((code) => assert.ok(sizeLimitFor(code)));
});

test('the AC 3-Tier and Chair Car pieces limit is the tighter one', () => {
  assert.equal(sizeLimitFor('3A'), SIZE_LIMITS.compact);
  assert.equal(sizeLimitFor('CC'), SIZE_LIMITS.compact);
  assert.equal(sizeLimitFor('SL'), SIZE_LIMITS.standard);
  assert.equal(sizeLimitFor('1A'), SIZE_LIMITS.standard);
});

// --- Allowances ---

test('an adult gets the published class weights unchanged', () => {
  const a = allowanceFor({ classCode: 'SL' });
  assert.equal(a.free, 40);
  assert.equal(a.marginal, 10);
  assert.equal(a.max, 80);
  assert.equal(a.marginalCeiling, 50);
  assert.equal(a.isChild, false);
});

test('AC 3-Tier has no marginal headroom, because its maximum is its free allowance', () => {
  const a = allowanceFor({ classCode: '3A' });
  assert.equal(a.free, 40);
  assert.equal(a.max, 40);
  assert.equal(a.marginalCeiling, 40);
  assert.equal(a.hasMarginalHeadroom, false);
});

test('classes with headroom report it', () => {
  assert.equal(allowanceFor({ classCode: '1A' }).hasMarginalHeadroom, true);
  assert.equal(allowanceFor({ classCode: 'SL' }).hasMarginalHeadroom, true);
  assert.equal(allowanceFor({ classCode: 'CC' }).hasMarginalHeadroom, false);
});

test('a child aged 5–11 gets half the allowance', () => {
  const a = allowanceFor({ classCode: 'SL', ageYears: 8 });
  assert.equal(a.free, 20);
  assert.equal(a.max, 40);
  assert.equal(a.isChild, true);
});

test('the child allowance is capped rather than simply halved', () => {
  const a = allowanceFor({ classCode: '1A', ageYears: 10 });
  assert.equal(a.free, 35); // half of 70, under the cap
  assert.equal(a.max, CHILD_ALLOWANCE_CAP); // half of 150 would be 75, capped to 50
});

test('under-fives and adults are both treated as full-fare adults for luggage', () => {
  assert.equal(allowanceFor({ classCode: 'SL', ageYears: 3 }).isChild, false);
  assert.equal(allowanceFor({ classCode: 'SL', ageYears: 12 }).isChild, false);
  assert.equal(allowanceFor({ classCode: 'SL', ageYears: 40 }).free, 40);
});

test('an unknown class returns null rather than a default allowance', () => {
  assert.equal(allowanceFor({ classCode: 'XX' }), null);
  assert.equal(assessLuggage({ classCode: 'XX', weightKg: 30 }), null);
});

// --- Banding ---

test('weight inside the free allowance is free and needs no booking', () => {
  const r = assessLuggage({ classCode: 'SL', weightKg: 35, distanceKm: 800 });
  assert.equal(r.band, 'free');
  assert.equal(r.excessKg, 0);
  assert.equal(r.declaredCharge, 0);
  assert.equal(r.undeclaredPenalty, 0);
  assert.equal(r.mustBookIntoBrakeVan, false);
});

test('the free allowance boundary is inclusive', () => {
  assert.equal(assessLuggage({ classCode: 'SL', weightKg: 40, distanceKm: 500 }).band, 'free');
  assert.equal(assessLuggage({ classCode: 'SL', weightKg: 41, distanceKm: 500 }).band, 'marginal');
});

test('the marginal band keeps luggage in the compartment on payment', () => {
  const r = assessLuggage({ classCode: 'SL', weightKg: 48, distanceKm: 500 });
  assert.equal(r.band, 'marginal');
  assert.equal(r.excessKg, 8);
  assert.equal(r.mustBookIntoBrakeVan, false);
});

test('past the marginal ceiling the excess must be booked into the brake van', () => {
  const r = assessLuggage({ classCode: 'SL', weightKg: 65, distanceKm: 500 });
  assert.equal(r.band, 'book');
  assert.equal(r.mustBookIntoBrakeVan, true);
});

test('above the class maximum it cannot travel with the passenger at all', () => {
  const r = assessLuggage({ classCode: 'SL', weightKg: 95, distanceKm: 500 });
  assert.equal(r.band, 'over-max');
  assert.equal(r.mustBookIntoBrakeVan, true);
  assert.match(r.verdict, /maximum this class permits/);
});

test('AC 3-Tier jumps straight from free to bookable, skipping the marginal band', () => {
  const r = assessLuggage({ classCode: '3A', weightKg: 45, distanceKm: 500 });
  assert.equal(r.band, 'over-max');
  assert.match(r.notes.join(' '), /maximum permitted equals the free allowance/);
});

// --- Charges ---

test('the undeclared penalty is six times the ordinary rate', () => {
  const r = assessLuggage({ classCode: 'SL', weightKg: 90, distanceKm: 1000 });
  const ordinary = luggageCharge({ excessKg: r.excessKg, distanceKm: 1000 });
  assert.equal(r.undeclaredPenalty, ordinary * UNDECLARED_MULTIPLIER);
  assert.ok(r.undeclaredPenalty > r.declaredCharge * 3, 'the penalty should dwarf the honest charge');
});

test('declared excess in the marginal band is charged at one and a half times', () => {
  const r = assessLuggage({ classCode: '1A', weightKg: 80, distanceKm: 1000 });
  assert.equal(r.band, 'marginal');
  const ordinary = luggageCharge({ excessKg: r.excessKg, distanceKm: 1000 });
  assert.equal(r.declaredCharge, Math.round(ordinary * MARGINAL_MULTIPLIER));
});

test('the undeclared penalty never falls below the floor', () => {
  const r = assessLuggage({ classCode: 'SL', weightKg: 41, distanceKm: 20 });
  assert.ok(r.undeclaredPenalty >= MIN_UNDECLARED_CHARGE);
});

test('charges rise with both distance and excess weight', () => {
  const near = assessLuggage({ classCode: 'SL', weightKg: 90, distanceKm: 200 });
  const far = assessLuggage({ classCode: 'SL', weightKg: 90, distanceKm: 2000 });
  assert.ok(far.undeclaredPenalty > near.undeclaredPenalty);

  const light = assessLuggage({ classCode: 'SL', weightKg: 60, distanceKm: 1000 });
  const heavy = assessLuggage({ classCode: 'SL', weightKg: 120, distanceKm: 1000 });
  assert.ok(heavy.undeclaredPenalty > light.undeclaredPenalty);
});

test('every rupee figure is flagged as an estimate', () => {
  assert.equal(assessLuggage({ classCode: 'SL', weightKg: 90, distanceKm: 500 }).estimated, true);
});

test('with no distance given, the tool asks for one instead of inventing a charge', () => {
  const r = assessLuggage({ classCode: 'SL', weightKg: 90 });
  assert.equal(r.declaredCharge, 0);
  assert.match(r.notes.join(' '), /Enter the journey distance/);
});

test('luggageCharge is zero for zero weight or zero distance', () => {
  assert.equal(luggageCharge({ excessKg: 0, distanceKm: 500 }), 0);
  assert.equal(luggageCharge({ excessKg: 20, distanceKm: 0 }), 0);
});

// --- Size ---

test('an oversized piece must be booked even when the weight is fine', () => {
  const r = assessLuggage({ classCode: '3A', weightKg: 10, distanceKm: 500, pieceCm: [90, 50, 40] });
  assert.equal(r.band, 'free');
  assert.equal(r.oversizePiece, true);
  assert.equal(r.mustBookIntoBrakeVan, true);
  assert.match(r.notes.join(' '), /it is the size that fails/);
});

test('a piece within the limit passes regardless of how it was measured', () => {
  const a = assessLuggage({ classCode: 'SL', weightKg: 30, pieceCm: [100, 60, 25] });
  const b = assessLuggage({ classCode: 'SL', weightKg: 30, pieceCm: [25, 100, 60] });
  assert.equal(a.oversizePiece, false);
  assert.equal(b.oversizePiece, false);
});

test('the same piece can pass in Sleeper and fail in AC 3-Tier', () => {
  const piece = [90, 55, 24];
  assert.equal(assessLuggage({ classCode: 'SL', weightKg: 20, pieceCm: piece }).oversizePiece, false);
  assert.equal(assessLuggage({ classCode: '3A', weightKg: 20, pieceCm: piece }).oversizePiece, true);
});

test('no dimensions given means no size verdict, not a passing one', () => {
  const r = assessLuggage({ classCode: 'SL', weightKg: 30 });
  assert.equal(r.oversizePiece, false);
  assert.equal(r.sizeNote, null);
});

test('malformed dimensions are ignored rather than throwing', () => {
  assert.equal(assessLuggage({ classCode: 'SL', weightKg: 30, pieceCm: [10, 10] }).sizeNote, null);
  assert.equal(assessLuggage({ classCode: 'SL', weightKg: 30, pieceCm: ['a', 'b', 'c'] }).sizeNote, null);
  assert.equal(assessLuggage({ classCode: 'SL', weightKg: 30, pieceCm: [0, 10, 10] }).sizeNote, null);
});

// --- Guards ---

test('a negative or non-numeric weight returns null', () => {
  assert.equal(assessLuggage({ classCode: 'SL', weightKg: -5 }), null);
  assert.equal(assessLuggage({ classCode: 'SL', weightKg: 'heavy' }), null);
});

test('zero weight is valid and free', () => {
  const r = assessLuggage({ classCode: 'SL', weightKg: 0 });
  assert.equal(r.band, 'free');
});

// --- Reference data ---

test('the reference lists are populated and structured', () => {
  assert.ok(FREE_ITEMS.length >= 4);
  assert.ok(PROHIBITED_ITEMS.length >= 4);
  PROHIBITED_ITEMS.forEach((p) => {
    assert.ok(p.item && p.why, 'every prohibited item needs a reason');
  });
  assert.ok(PETS.length >= 3);
  PETS.forEach((p) => assert.ok(p.rule && p.detail));
});

test('dangerous goods are presented as a criminal matter, not a luggage charge', () => {
  assert.match(DANGEROUS_GOODS.section, /Railways Act/);
  assert.match(DANGEROUS_GOODS.penalty, /imprisonment/i);
});
