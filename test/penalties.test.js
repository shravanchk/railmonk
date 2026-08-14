const test = require('node:test');
const assert = require('node:assert/strict');

const {
  MIN_EXCESS_CHARGE,
  CONFIDENCE,
  SCENARIOS,
  OFFENCES,
  getScenario,
  assessPenalty,
  offenceBySection,
  describeOffence,
} = require('../utils/engines/penalties');

const { estimateFare } = require('../utils/engines/trainFare');
const { assessLuggage, UNDECLARED_MULTIPLIER } = require('../utils/engines/luggageAllowance');

// --- Table integrity ---

test('every scenario resolves and declares its inputs and confidence', () => {
  SCENARIOS.forEach((s) => {
    assert.equal(getScenario(s.id), s);
    assert.ok(Array.isArray(s.needs) && s.needs.length > 0, `${s.id} declares no inputs`);
    assert.ok(CONFIDENCE[s.confidence], `${s.id} has unknown confidence ${s.confidence}`);
    assert.ok(s.summary.length > 60, `${s.id} has no useful summary`);
  });
});

test('scenario ids are unique', () => {
  const ids = SCENARIOS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('an unknown scenario returns null', () => {
  assert.equal(getScenario('nope'), null);
  assert.equal(assessPenalty({ scenarioId: 'nope', distanceKm: 500 }), null);
});

// --- Section 138: the ordinary case ---

test('travelling without a ticket costs the fare plus the excess charge', () => {
  const r = assessPenalty({ scenarioId: 'no-ticket', classCode: 'SL', distanceKm: 500 });
  const fare = estimateFare({ classCode: 'SL', distanceKm: 500, trainCategory: 'superfast' }).totalPerPassenger;
  assert.equal(r.fareDue, fare);
  assert.equal(r.excessCharge, MIN_EXCESS_CHARGE);
  assert.equal(r.perPassenger, fare + MIN_EXCESS_CHARGE);
});

test('the fare component tracks the fare engine rather than a copy of it', () => {
  // If trainFare changes, this must change with it — that is the point of
  // importing it instead of restating the numbers.
  const r = assessPenalty({ scenarioId: 'no-ticket', classCode: '2A', distanceKm: 1200, trainCategory: 'express' });
  const fare = estimateFare({ classCode: '2A', distanceKm: 1200, trainCategory: 'express' }).totalPerPassenger;
  assert.equal(r.fareDue, fare);
});

test('the charge multiplies across passengers', () => {
  const one = assessPenalty({ scenarioId: 'no-ticket', classCode: 'SL', distanceKm: 500, passengers: 1 });
  const four = assessPenalty({ scenarioId: 'no-ticket', classCode: 'SL', distanceKm: 500, passengers: 4 });
  assert.equal(four.total, one.perPassenger * 4);
  assert.equal(four.passengers, 4);
});

test('a longer journey in a higher class costs more', () => {
  const cheap = assessPenalty({ scenarioId: 'no-ticket', classCode: '2S', distanceKm: 100 }).perPassenger;
  const dear = assessPenalty({ scenarioId: 'no-ticket', classCode: '1A', distanceKm: 2000 }).perPassenger;
  assert.ok(dear > cheap * 5);
});

test('the breakdown always ends with the excess charge and its statutory note', () => {
  const r = assessPenalty({ scenarioId: 'no-ticket', classCode: 'SL', distanceKm: 500 });
  const last = r.breakdown[r.breakdown.length - 1];
  assert.equal(last.label, 'Excess charge');
  assert.equal(last.amount, MIN_EXCESS_CHARGE);
  assert.match(last.note, /Section 138/);
});

test('the fare is charged from the originating station, and says so', () => {
  const r = assessPenalty({ scenarioId: 'no-ticket', classCode: 'SL', distanceKm: 500 });
  assert.match(r.breakdown[0].note, /originating station/);
});

test('refusing to pay is flagged as the route to prosecution', () => {
  const r = assessPenalty({ scenarioId: 'no-ticket', classCode: 'SL', distanceKm: 500 });
  assert.match(r.notes.join(' '), /Section 137/);
});

// --- Missing ID ---

test('a missing photo ID is charged exactly like travelling ticketless', () => {
  const noTicket = assessPenalty({ scenarioId: 'no-ticket', classCode: '3A', distanceKm: 900 });
  const noId = assessPenalty({ scenarioId: 'no-id', classCode: '3A', distanceKm: 900 });
  assert.equal(noId.perPassenger, noTicket.perPassenger);
});

test('the missing-ID case warns that it invalidates the whole ticket', () => {
  const r = assessPenalty({ scenarioId: 'no-id', classCode: '3A', distanceKm: 900, passengers: 3 });
  assert.match(r.notes.join(' '), /every passenger on it/);
  assert.equal(r.total, r.perPassenger * 3);
});

test('the accepted ID list is spelled out rather than left vague', () => {
  const r = assessPenalty({ scenarioId: 'no-id', classCode: '3A', distanceKm: 900 });
  const joined = r.notes.join(' ');
  ['passport', 'Aadhaar', 'PAN', 'driving licence', 'voter ID'].forEach((id) => {
    assert.match(joined, new RegExp(id, 'i'), `${id} missing from the accepted list`);
  });
});

// --- Higher class ---

test('a class upgrade charges the difference, not the whole fare', () => {
  const r = assessPenalty({ scenarioId: 'higher-class', classCode: '2A', ticketedClassCode: 'SL', distanceKm: 800 });
  const occupied = estimateFare({ classCode: '2A', distanceKm: 800, trainCategory: 'superfast' }).totalPerPassenger;
  const ticketed = estimateFare({ classCode: 'SL', distanceKm: 800, trainCategory: 'superfast' }).totalPerPassenger;
  assert.equal(r.fareDue, occupied - ticketed);
  assert.ok(r.fareDue < occupied, 'should never charge the full higher-class fare');
  assert.equal(r.perPassenger, occupied - ticketed + MIN_EXCESS_CHARGE);
});

test('a bigger jump in class costs more', () => {
  const small = assessPenalty({ scenarioId: 'higher-class', classCode: '3A', ticketedClassCode: 'SL', distanceKm: 800 });
  const big = assessPenalty({ scenarioId: 'higher-class', classCode: '1A', ticketedClassCode: 'SL', distanceKm: 800 });
  assert.ok(big.fareDue > small.fareDue);
});

test('sitting in a lower class than your ticket recovers nothing and refunds nothing', () => {
  const r = assessPenalty({ scenarioId: 'higher-class', classCode: 'SL', ticketedClassCode: '2A', distanceKm: 800 });
  assert.equal(r.fareDue, 0);
  assert.match(r.notes.join(' '), /no refund|earns no refund/i);
});

test('the same class in both fields is a no-op difference', () => {
  const r = assessPenalty({ scenarioId: 'higher-class', classCode: 'SL', ticketedClassCode: 'SL', distanceKm: 800 });
  assert.equal(r.fareDue, 0);
  assert.equal(r.perPassenger, MIN_EXCESS_CHARGE);
});

// --- Beyond destination ---

test('travelling past your station is charged on the extra distance only', () => {
  const r = assessPenalty({ scenarioId: 'beyond-destination', classCode: 'SL', distanceKm: 700, ticketedDistanceKm: 500 });
  const extra = estimateFare({ classCode: 'SL', distanceKm: 200, trainCategory: 'superfast' }).totalPerPassenger;
  assert.equal(r.fareDue, extra);
  assert.match(r.breakdown[0].label, /extra 200 km/);
});

test('a longer overshoot costs more', () => {
  const short = assessPenalty({ scenarioId: 'beyond-destination', classCode: 'SL', distanceKm: 550, ticketedDistanceKm: 500 });
  const long = assessPenalty({ scenarioId: 'beyond-destination', classCode: 'SL', distanceKm: 900, ticketedDistanceKm: 500 });
  assert.ok(long.fareDue > short.fareDue);
});

test('the telescopic-fare consequence of extending a journey is explained', () => {
  const r = assessPenalty({ scenarioId: 'beyond-destination', classCode: 'SL', distanceKm: 700, ticketedDistanceKm: 500 });
  assert.match(r.notes.join(' '), /telescopic/);
});

test('not actually overshooting charges no fare', () => {
  const r = assessPenalty({ scenarioId: 'beyond-destination', classCode: 'SL', distanceKm: 500, ticketedDistanceKm: 500 });
  assert.equal(r.fareDue, 0);
  assert.match(r.notes.join(' '), /nothing extra to charge/);
});

// --- Unbooked luggage ---

test('unbooked luggage uses the luggage engine and carries no ₹250 excess charge', () => {
  const r = assessPenalty({ scenarioId: 'unbooked-luggage', classCode: 'SL', distanceKm: 1000, luggageKg: 90 });
  const direct = assessLuggage({ classCode: 'SL', weightKg: 90, distanceKm: 1000 });
  assert.equal(r.fareDue, direct.undeclaredPenalty);
  assert.equal(r.excessCharge, 0);
  assert.equal(r.perPassenger, direct.undeclaredPenalty);
});

test('the luggage penalty is charged on the bag, not per passenger', () => {
  const r = assessPenalty({ scenarioId: 'unbooked-luggage', classCode: 'SL', distanceKm: 1000, luggageKg: 90, passengers: 4 });
  assert.equal(r.passengers, 1);
  assert.equal(r.total, r.perPassenger);
});

test('the luggage breakdown states the multiplier it applied', () => {
  const r = assessPenalty({ scenarioId: 'unbooked-luggage', classCode: 'SL', distanceKm: 1000, luggageKg: 90 });
  assert.match(r.breakdown[0].note, new RegExp(`${UNDECLARED_MULTIPLIER}×`));
});

test('luggage within the free allowance produces nothing to pay', () => {
  const r = assessPenalty({ scenarioId: 'unbooked-luggage', classCode: 'SL', distanceKm: 1000, luggageKg: 30 });
  assert.equal(r.total, 0);
  assert.match(r.notes.join(' '), /inside the free allowance/);
});

test('the honest alternative cost is quoted alongside the penalty', () => {
  const r = assessPenalty({ scenarioId: 'unbooked-luggage', classCode: 'SL', distanceKm: 1000, luggageKg: 90 });
  assert.match(r.notes.join(' '), /parcel office/);
});

// --- Guards ---

test('a missing or nonsensical distance returns null', () => {
  assert.equal(assessPenalty({ scenarioId: 'no-ticket', classCode: 'SL' }), null);
  assert.equal(assessPenalty({ scenarioId: 'no-ticket', classCode: 'SL', distanceKm: 0 }), null);
  assert.equal(assessPenalty({ scenarioId: 'no-ticket', classCode: 'SL', distanceKm: -100 }), null);
});

test('an unknown class returns null rather than a fare of zero', () => {
  assert.equal(assessPenalty({ scenarioId: 'no-ticket', classCode: 'XX', distanceKm: 500 }), null);
});

test('fare-derived amounts are flagged as estimates', () => {
  assert.equal(assessPenalty({ scenarioId: 'no-ticket', classCode: 'SL', distanceKm: 500 }).estimated, true);
  assert.equal(assessPenalty({ scenarioId: 'unbooked-luggage', classCode: 'SL', distanceKm: 500, luggageKg: 90 }).estimated, true);
});

test('calling with no arguments does not throw', () => {
  assert.equal(assessPenalty(), null);
  assert.equal(assessPenalty({}), null);
});

// --- Statutory offences ---

test('every offence carries a section, a description and at least one ceiling', () => {
  OFFENCES.forEach((o) => {
    assert.match(o.section, /^Section \d+$/, `${o.section} is malformed`);
    assert.ok(o.offence.length > 10);
    assert.ok(o.note.length > 20, `${o.section} has no useful note`);
    assert.ok(o.maxFine || o.maxImprisonment, `${o.section} has no penalty at all`);
  });
});

test('sections are unique and resolvable', () => {
  const sections = OFFENCES.map((o) => o.section);
  assert.equal(new Set(sections).size, sections.length);
  assert.equal(offenceBySection('Section 164').offence, 'Carrying dangerous or offensive goods');
  assert.equal(offenceBySection('Section 999'), null);
});

test('offences are described as ceilings, never as fixed amounts', () => {
  OFFENCES.forEach((o) => {
    const text = describeOffence(o);
    assert.match(text, /up to|set by the court/, `${o.section} is not framed as a maximum`);
  });
});

test('a fine-and-imprisonment offence reads as either or both', () => {
  const text = describeOffence(offenceBySection('Section 141'));
  assert.match(text, /₹1,000/);
  assert.match(text, /1 year/);
  assert.match(text, /or both/);
});

test('an offence with only one kind of penalty does not say "or both"', () => {
  const text = describeOffence(offenceBySection('Section 167'));
  assert.match(text, /₹100/);
  assert.doesNotMatch(text, /or both/);
});

test('the most serious offence is imprisonment with no fine ceiling', () => {
  const s153 = offenceBySection('Section 153');
  assert.equal(s153.maxFine, null);
  assert.match(describeOffence(s153), /5 years/);
});

test('describeOffence tolerates a missing offence', () => {
  assert.equal(describeOffence(null), null);
});

test('dangerous goods appear in both engines and agree that it is criminal', () => {
  const { DANGEROUS_GOODS } = require('../utils/engines/luggageAllowance');
  assert.match(DANGEROUS_GOODS.section, /164/);
  assert.equal(offenceBySection('Section 164').maxImprisonment, '3 years');
});
