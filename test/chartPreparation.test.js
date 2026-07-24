const test = require('node:test');
const assert = require('node:assert/strict');
const {
  computeChartTimes,
  formatWallDate,
  formatWallTime,
  toWallIso,
  wallClock,
} = require('../utils/engines/chartPreparation');

test('morning-band departures chart at 20:00 the previous evening', () => {
  const r = computeChartTimes({ departureDate: '2026-08-10', departureTime: '06:30' });
  assert.equal(r.rule, 'previous-evening');
  assert.equal(toWallIso(r.firstChart), '2026-08-09T20:00');
  assert.equal(r.chartsOnPreviousDay, true);
});

test('band boundaries: 05:00 and 14:00 are inside, 04:59 and 14:01 are not', () => {
  assert.equal(computeChartTimes({ departureDate: '2026-08-10', departureTime: '05:00' }).rule, 'previous-evening');
  assert.equal(computeChartTimes({ departureDate: '2026-08-10', departureTime: '14:00' }).rule, 'previous-evening');
  assert.equal(computeChartTimes({ departureDate: '2026-08-10', departureTime: '04:59' }).rule, 'ten-hours');
  assert.equal(computeChartTimes({ departureDate: '2026-08-10', departureTime: '14:01' }).rule, 'ten-hours');
});

test('afternoon and evening departures chart exactly 10 hours before', () => {
  const r = computeChartTimes({ departureDate: '2026-08-10', departureTime: '18:45' });
  assert.equal(r.rule, 'ten-hours');
  assert.equal(toWallIso(r.firstChart), '2026-08-10T08:45');
  assert.equal(r.firstChartLeadHours, 10);
  assert.equal(r.chartsOnPreviousDay, false);
});

test('post-midnight departures use the 10-hour rule and roll back a day', () => {
  const r = computeChartTimes({ departureDate: '2026-08-10', departureTime: '02:15' });
  assert.equal(r.rule, 'ten-hours');
  assert.equal(toWallIso(r.firstChart), '2026-08-09T16:15');
  assert.equal(r.chartsOnPreviousDay, true);
});

test('final chart is always 30 minutes before departure', () => {
  const r = computeChartTimes({ departureDate: '2026-08-10', departureTime: '00:10' });
  assert.equal(toWallIso(r.finalChart), '2026-08-09T23:40');
  const s = computeChartTimes({ departureDate: '2026-08-10', departureTime: '18:45' });
  assert.equal(toWallIso(s.finalChart), '2026-08-10T18:15');
});

test('month and year rollovers are exact', () => {
  const r = computeChartTimes({ departureDate: '2027-01-01', departureTime: '07:00' });
  assert.equal(toWallIso(r.firstChart), '2026-12-31T20:00');
  const leap = computeChartTimes({ departureDate: '2028-03-01', departureTime: '09:00' });
  assert.equal(toWallIso(leap.firstChart), '2028-02-29T20:00');
});

test('lead time is reported, including the short lead at the 05:00 edge', () => {
  assert.equal(computeChartTimes({ departureDate: '2026-08-10', departureTime: '05:00' }).firstChartLeadHours, 9);
  assert.equal(computeChartTimes({ departureDate: '2026-08-10', departureTime: '14:00' }).firstChartLeadHours, 18);
});

test('invalid or missing input returns null rather than a bogus date', () => {
  assert.equal(computeChartTimes({ departureDate: '', departureTime: '10:00' }), null);
  assert.equal(computeChartTimes({ departureDate: '2026-08-10', departureTime: '' }), null);
  assert.equal(computeChartTimes({ departureDate: '10-08-2026', departureTime: '10:00' }), null);
  assert.equal(computeChartTimes({ departureDate: '2026-08-10', departureTime: '25:00' }), null);
  assert.equal(computeChartTimes({ departureDate: '2026-08-10', departureTime: '10:75' }), null);
});

test('formatters read back wall-clock values, not machine-local ones', () => {
  const t = wallClock('2026-07-24', '20:00');
  assert.equal(formatWallDate(t), 'Friday, 24 July 2026');
  assert.equal(formatWallTime(t), '08:00 PM');
  assert.equal(formatWallTime(wallClock('2026-07-24', '00:05')), '12:05 AM');
  assert.equal(formatWallTime(wallClock('2026-07-24', '12:00')), '12:00 PM');
});
