const test = require('node:test');
const assert = require('node:assert/strict');

const {
  MIN_DISTANCE_KM,
  CHILD_HALF_SHARE,
  CONFIDENCE,
  GENERAL_RULES,
  CATEGORIES,
  GROUPS,
  WITHDRAWN,
  getCategory,
  categoriesInGroup,
  rateFor,
  assessFare,
  assessParty,
} = require('../utils/engines/concessions');

const { CLASSES, estimateFare } = require('../utils/engines/trainFare');

// --- Table integrity ---

test('every category resolves, is uniquely identified and declares its confidence', () => {
  const ids = CATEGORIES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  CATEGORIES.forEach((c) => {
    assert.equal(getCategory(c.id), c);
    assert.ok(CONFIDENCE[c.confidence], `${c.id} has unknown confidence ${c.confidence}`);
    assert.ok(c.label.length > 3, `${c.id} has no label`);
  });
});

test('every rate table only uses class codes the fare engine knows', () => {
  CATEGORIES.filter((c) => c.rates).forEach((c) => {
    Object.entries(c.rates).forEach(([code, pct]) => {
      assert.ok(CLASSES[code], `${c.id} references unknown class ${code}`);
      assert.ok(pct > 0 && pct <= 100, `${c.id} has an implausible rate for ${code}: ${pct}`);
    });
  });
});

test('every group is populated and every non-general category belongs to one', () => {
  GROUPS.forEach((g) => assert.ok(categoriesInGroup(g.id).length > 0, `${g.id} is empty`));
  const groupIds = new Set(GROUPS.map((g) => g.id));
  CATEGORIES.filter((c) => c.group !== 'general').forEach((c) => {
    assert.ok(groupIds.has(c.group), `${c.id} is in unknown group ${c.group}`);
  });
});

test('the withdrawn list still names the senior citizen concession', () => {
  assert.ok(WITHDRAWN.some((w) => w.id === 'senior'));
  assert.ok(GENERAL_RULES.length >= 5);
});

test('an unknown category or a bad distance returns null', () => {
  assert.equal(getCategory('nope'), null);
  assert.equal(assessFare({ categoryId: 'nope', distanceKm: 500 }), null);
  assert.equal(assessFare({ categoryId: 'adult', distanceKm: 0 }), null);
  assert.equal(assessFare({ categoryId: 'adult', classCode: 'XX', distanceKm: 500 }), null);
  assert.equal(assessParty({ travellers: [{ categoryId: 'adult' }], distanceKm: -1 }), null);
  assert.equal(assessParty({ travellers: [], distanceKm: 500 }), null);
});

test('rateFor is 0 for a class the category does not cover', () => {
  assert.equal(rateFor(getCategory('student-general'), 'SL'), 50);
  assert.equal(rateFor(getCategory('student-general'), '3A'), 0);
  assert.equal(rateFor(getCategory('adult'), 'SL'), 0);
});

// --- The reference case ---

test('an adult pays exactly what the fare engine says', () => {
  const r = assessFare({ categoryId: 'adult', classCode: 'SL', distanceKm: 800 });
  const fare = estimateFare({ classCode: 'SL', distanceKm: 800, trainCategory: 'superfast' });
  assert.equal(r.payable, fare.totalPerPassenger);
  assert.equal(r.fullFare, fare.totalPerPassenger);
  assert.equal(r.saving, 0);
  assert.equal(r.percent, 0);
});

// --- Children ---

test('a child under 5 without a berth pays nothing and is not an estimate', () => {
  const r = assessFare({ categoryId: 'child-under-5', classCode: '3A', distanceKm: 1200 });
  assert.equal(r.payable, 0);
  assert.equal(r.percent, 100);
  assert.equal(r.estimated, false);
  assert.equal(r.saving, r.fullFare);
});

test('a berth for an under-5 costs the full adult fare', () => {
  const child = assessFare({ categoryId: 'child-under-5-berth', classCode: 'SL', distanceKm: 900 });
  const adult = assessFare({ categoryId: 'adult', classCode: 'SL', distanceKm: 900 });
  assert.equal(child.payable, adult.payable);
});

test('a 5-to-11 child without a berth pays half the basic fare, other charges in full', () => {
  const km = 700;
  const fare = estimateFare({ classCode: 'SL', distanceKm: km, trainCategory: 'superfast' });
  const r = assessFare({ categoryId: 'child-5-11', classCode: 'SL', distanceKm: km });

  assert.equal(r.percent, CHILD_HALF_SHARE * 100);
  // Half of the basic fare, then the untouched reservation and superfast charges.
  const expectedBase = Math.round(fare.baseFare * 0.5);
  assert.equal(r.breakdown[0].amount, expectedBase);
  assert.ok(r.breakdown.some((b) => b.amount === fare.reservationFee));
  assert.ok(r.breakdown.some((b) => b.amount === fare.superfastCharge));
});

test('the 2016 rule: a berth for a 5-to-11 child costs full fare, half fare buys none', () => {
  const withBerth = assessFare({ categoryId: 'child-5-11-berth', classCode: 'SL', distanceKm: 700 });
  const noBerth = assessFare({ categoryId: 'child-5-11', classCode: 'SL', distanceKm: 700 });
  const adult = assessFare({ categoryId: 'adult', classCode: 'SL', distanceKm: 700 });

  assert.equal(withBerth.payable, adult.payable);
  assert.ok(noBerth.payable < adult.payable);
  assert.ok(noBerth.notes.some((n) => /no berth/i.test(n)));
});

test('a child fare is admissible on a premium train — the 300 km and Rajdhani limits are concession rules, not child rules', () => {
  const r = assessFare({ categoryId: 'child-5-11', classCode: '3A', distanceKm: 120, trainCategory: 'premium' });
  assert.equal(r.admissible, true);
  assert.equal(r.percent, 50);
});

// --- The rule that makes this tool worth having ---

test('a headline concession is always bigger than what actually comes off the ticket', () => {
  const r = assessFare({ categoryId: 'divyangjan-blind', classCode: '3A', distanceKm: 400 });
  assert.equal(r.percent, 75);
  assert.ok(r.effectivePercent < r.percent, 'effective saving should be diluted by the fixed charges');
  assert.ok(r.notes.some((n) => n.includes(`${r.effectivePercent}%`)));
});

test('the concession comes off the basic fare only — fixed charges survive intact', () => {
  const km = 900;
  const fare = estimateFare({ classCode: 'SL', distanceKm: km, trainCategory: 'superfast' });
  const r = assessFare({ categoryId: 'student-general', classCode: 'SL', distanceKm: km });

  assert.equal(r.breakdown[0].amount, Math.round(fare.baseFare * 0.5));
  const fixed = r.breakdown.slice(1).reduce((s, b) => s + b.amount, 0);
  assert.equal(fixed, fare.reservationFee + fare.superfastCharge);
});

test('a 100% patient concession still leaves the fixed charges to pay', () => {
  const r = assessFare({ categoryId: 'patient-cancer', classCode: 'SL', distanceKm: 1000 });
  assert.equal(r.percent, 100);
  assert.ok(r.payable > 0, 'free travel still carries the reservation and superfast charges');
  assert.ok(r.payable < r.fullFare / 4);
});

test('an escort is capped at 75% where the patient travels free, and matches otherwise', () => {
  const escort = assessFare({ categoryId: 'patient-cancer', classCode: 'SL', distanceKm: 1000, escort: true });
  assert.equal(escort.percent, 75);
  assert.ok(escort.notes.some((n) => /capped at 75%/.test(n)));

  const kidneyEscort = assessFare({ categoryId: 'patient-kidney', classCode: 'SL', distanceKm: 1000, escort: true });
  assert.equal(kidneyEscort.percent, 75);
  assert.ok(kidneyEscort.notes.some((n) => /same concession/.test(n)));
});

// --- Where a concession is refused ---

test('a class the category does not cover is refused, and says which classes it covers', () => {
  const r = assessFare({ categoryId: 'student-general', classCode: '2A', distanceKm: 900 });
  assert.equal(r.admissible, false);
  assert.equal(r.percent, 0);
  assert.equal(r.payable, r.fullFare);
  assert.match(r.blockedReason, /Sleeper|Second Sitting/);
});

test('the 300 km minimum blocks a non-exempt category and no other', () => {
  const short = assessFare({ categoryId: 'divyangjan-hearing-speech', classCode: 'SL', distanceKm: MIN_DISTANCE_KM - 1 });
  assert.equal(short.admissible, false);
  assert.match(short.blockedReason, /300 km/);

  const long = assessFare({ categoryId: 'divyangjan-hearing-speech', classCode: 'SL', distanceKm: MIN_DISTANCE_KM });
  assert.equal(long.admissible, true);
  assert.equal(long.percent, 50);

  const exempt = assessFare({ categoryId: 'divyangjan-blind', classCode: 'SL', distanceKm: 50 });
  assert.equal(exempt.admissible, true);
});

test('premium trains block a concession rather than quietly applying one', () => {
  const r = assessFare({ categoryId: 'divyangjan-blind', classCode: '3A', distanceKm: 900, trainCategory: 'premium' });
  assert.equal(r.admissible, false);
  assert.equal(r.percent, 0);
  assert.match(r.blockedReason, /Rajdhani/);
});

test('a blocked concession never changes the amount payable', () => {
  const blocked = assessFare({ categoryId: 'student-general', classCode: '1A', distanceKm: 900 });
  const adult = assessFare({ categoryId: 'adult', classCode: '1A', distanceKm: 900 });
  assert.equal(blocked.payable, adult.payable);
  assert.equal(blocked.saving, 0);
});

test('categories barred from Tatkal say so', () => {
  const r = assessFare({ categoryId: 'student-general', classCode: 'SL', distanceKm: 900 });
  assert.ok(r.notes.some((n) => /Tatkal/.test(n)));

  const allowed = assessFare({ categoryId: 'patient-cancer', classCode: 'SL', distanceKm: 900 });
  assert.ok(!allowed.notes.some((n) => /cannot be used on a Tatkal/.test(n)));
});

// --- The party case ---

test('a party totals its lines and reports what the concessions saved', () => {
  const party = assessParty({
    travellers: [{ categoryId: 'adult' }, { categoryId: 'adult' }, { categoryId: 'child-5-11' }, { categoryId: 'child-under-5' }],
    classCode: 'SL',
    distanceKm: 800,
  });

  assert.equal(party.lines.length, 4);
  assert.equal(party.total, party.lines.reduce((s, l) => s + l.payable, 0));
  assert.equal(party.saving, party.fullTotal - party.total);
  assert.ok(party.saving > 0);
});

test('a party of adults saves nothing', () => {
  const party = assessParty({ travellers: [{ categoryId: 'adult' }, { categoryId: 'adult' }], classCode: '3A', distanceKm: 600 });
  assert.equal(party.saving, 0);
  assert.equal(party.total, party.fullTotal);
});

test('unknown travellers are dropped rather than crashing the total', () => {
  const party = assessParty({ travellers: [{ categoryId: 'adult' }, { categoryId: 'nope' }], classCode: 'SL', distanceKm: 600 });
  assert.equal(party.lines.length, 1);
});
