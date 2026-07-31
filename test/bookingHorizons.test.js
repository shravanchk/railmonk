const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REGIONS,
  OPERATORS,
  getOperator,
  operatorsInRegion,
  computeBookingOpening,
  compareHorizons,
  formatDate,
} = require('../utils/engines/bookingHorizons');

// --- The opening date itself ---

test('Amtrak opens 330 days before travel', () => {
  const r = computeBookingOpening({ operatorId: 'amtrak', travelDate: '2027-06-01', today: '2026-07-31' });
  assert.equal(r.openIso, '2026-07-06');
  assert.equal(r.status, 'open');
});

test('Deutsche Bahn domestic opens a full year out', () => {
  const r = computeBookingOpening({ operatorId: 'db-domestic', travelDate: '2027-07-31', today: '2026-07-31' });
  assert.equal(r.openIso, '2026-07-31');
  assert.equal(r.daysUntilOpen, 0);
  assert.equal(r.status, 'open');
});

test('a window that has not opened yet reports the wait in days', () => {
  const r = computeBookingOpening({ operatorId: 'renfe', travelDate: '2026-12-01', today: '2026-07-31' });
  assert.equal(r.openIso, '2026-10-02');
  assert.equal(r.status, 'not-yet');
  assert.equal(r.daysUntilOpen, 63);
});

test('the day the window opens counts as open, not as one more day of waiting', () => {
  const r = computeBookingOpening({ operatorId: 'sbb', travelDate: '2027-01-27', today: '2026-07-31' });
  assert.equal(r.openIso, '2026-07-31');
  assert.equal(r.daysUntilOpen, 0);
  assert.equal(r.status, 'open');
});

test('a travel date in the past is reported as past, not as bookable', () => {
  const r = computeBookingOpening({ operatorId: 'amtrak', travelDate: '2026-07-30', today: '2026-07-31' });
  assert.equal(r.status, 'past');
  assert.equal(r.daysUntilTravel, -1);
});

test('travelling today is still open, not past', () => {
  const r = computeBookingOpening({ operatorId: 'uk-advance', travelDate: '2026-07-31', today: '2026-07-31' });
  assert.equal(r.status, 'open');
  assert.equal(r.daysUntilTravel, 0);
});

test('date arithmetic crosses a leap day correctly', () => {
  const r = computeBookingOpening({ operatorId: 'db-domestic', travelDate: '2028-03-01', today: '2027-01-01' });
  // 2028 is a leap year, so 365 days back from 1 March 2028 lands on 2 March 2027.
  assert.equal(r.openIso, '2027-03-02');
});

test('date arithmetic crosses a year boundary correctly', () => {
  const r = computeBookingOpening({ operatorId: 'cee-60', travelDate: '2027-01-10', today: '2026-11-01' });
  assert.equal(r.openIso, '2026-11-11');
});

test('India comes out at the 60-day ARP the rest of the site uses', () => {
  const r = computeBookingOpening({ operatorId: 'irctc', travelDate: '2026-10-01', today: '2026-07-31' });
  assert.equal(r.openIso, '2026-08-02');
});

// --- Input handling ---

test('an unknown operator returns null', () => {
  assert.equal(computeBookingOpening({ operatorId: 'nope', travelDate: '2026-10-01' }), null);
});

test('a malformed or empty travel date returns null', () => {
  assert.equal(computeBookingOpening({ operatorId: 'amtrak', travelDate: '01-10-2026' }), null);
  assert.equal(computeBookingOpening({ operatorId: 'amtrak', travelDate: '' }), null);
});

// --- The comparison view ---

test('comparing every operator sorts by which window opens first', () => {
  const rows = compareHorizons({ travelDate: '2027-06-01', today: '2026-07-31' });
  assert.equal(rows.length, OPERATORS.length);
  for (let i = 1; i < rows.length; i += 1) {
    assert.ok(
      rows[i].opensOn.getTime() >= rows[i - 1].opensOn.getTime(),
      'rows must be ordered by opening date'
    );
  }
  // The longest horizons lead, so a planner sees what to book first.
  assert.ok(['db-domestic', 'journey-beyond'].includes(rows[0].operator.id));
});

test('the comparison can be narrowed to one region', () => {
  const rows = compareHorizons({ travelDate: '2027-06-01', today: '2026-07-31', regionId: 'australia' });
  assert.equal(rows.length, operatorsInRegion('australia').length);
  rows.forEach((row) => assert.equal(row.operator.region, 'australia'));
});

// --- Operator data integrity ---

test('every operator has a usable horizon, label and source', () => {
  OPERATORS.forEach((o) => {
    assert.ok(Number.isInteger(o.horizonDays) && o.horizonDays > 0, `${o.id} has no usable horizonDays`);
    assert.ok(o.horizonLabel, `${o.id} has no horizonLabel`);
    assert.ok(o.note, `${o.id} has no note`);
    assert.match(o.source.url, /^https:\/\//, `${o.id} needs an https source`);
  });
});

test('every operator sits in a declared region', () => {
  const regionIds = new Set(REGIONS.map((r) => r.id));
  OPERATORS.forEach((o) => assert.ok(regionIds.has(o.region), `${o.id} is in unknown region ${o.region}`));
});

test('every declared region has at least one operator', () => {
  REGIONS.forEach((r) => assert.ok(operatorsInRegion(r.id).length > 0, `region ${r.id} is empty`));
});

test('operator ids are unique', () => {
  assert.equal(new Set(OPERATORS.map((o) => o.id)).size, OPERATORS.length);
});

test('an operator whose horizon is a range is marked unreliable, so the page can hedge', () => {
  ['renfe', 'ouigo', 'journey-beyond', 'uk-advance'].forEach((id) => {
    assert.equal(getOperator(id).reliable, false, `${id} should be flagged as variable`);
  });
});

// --- Formatting ---

test('dates read back in full, in wall-clock terms', () => {
  const r = computeBookingOpening({ operatorId: 'amtrak', travelDate: '2027-06-01', today: '2026-07-31' });
  assert.equal(formatDate(r.opensOn), 'Monday, 6 July 2026');
  assert.equal(formatDate(r.travelDate), 'Tuesday, 1 June 2027');
});
