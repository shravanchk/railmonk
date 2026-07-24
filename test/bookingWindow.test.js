const test = require('node:test');
const assert = require('node:assert/strict');
const { QUOTAS, computeBookingWindow, furthestBookableDate, toIsoDate, parseIsoDate } = require('../utils/engines/bookingWindow');

test('general booking opens 60 days before the journey at 08:00 IST', () => {
  const r = computeBookingWindow({ journeyDate: '2026-09-22', quotaId: 'general' });
  assert.equal(r.opensDate, '2026-07-24');
  assert.equal(r.opensTime, '08:00');
  assert.equal(r.opensWallIso, '2026-07-24T08:00');
  assert.equal(r.advanceDays, 60);
});

test('Tatkal opens the day before — 10:00 for AC, 11:00 for non-AC', () => {
  const ac = computeBookingWindow({ journeyDate: '2026-09-22', quotaId: 'tatkal-ac' });
  assert.equal(ac.opensDate, '2026-09-21');
  assert.equal(ac.opensTime, '10:00');
  const nonAc = computeBookingWindow({ journeyDate: '2026-09-22', quotaId: 'tatkal-non-ac' });
  assert.equal(nonAc.opensDate, '2026-09-21');
  assert.equal(nonAc.opensTime, '11:00');
});

test('the Foreign Tourist quota keeps its 365-day window', () => {
  const r = computeBookingWindow({ journeyDate: '2027-09-22', quotaId: 'foreign-tourist' });
  assert.equal(r.advanceDays, 365);
  assert.equal(r.opensDate, '2026-09-22');
});

test('an unknown quota falls back to general rather than throwing', () => {
  const r = computeBookingWindow({ journeyDate: '2026-09-22', quotaId: 'not-a-quota' });
  assert.equal(r.quota.id, 'general');
});

test('status and countdown are derived from the supplied "today"', () => {
  const upcoming = computeBookingWindow({ journeyDate: '2026-09-22', today: '2026-07-20' });
  assert.equal(upcoming.status, 'upcoming');
  assert.equal(upcoming.daysUntilOpen, 4);

  const openToday = computeBookingWindow({ journeyDate: '2026-09-22', today: '2026-07-24' });
  assert.equal(openToday.status, 'open-today');
  assert.equal(openToday.daysUntilOpen, 0);

  const alreadyOpen = computeBookingWindow({ journeyDate: '2026-09-22', today: '2026-08-01' });
  assert.equal(alreadyOpen.status, 'window-open');

  const past = computeBookingWindow({ journeyDate: '2026-06-01', today: '2026-07-24' });
  assert.equal(past.status, 'journey-passed');
});

test('without a "today" there is no countdown to report', () => {
  const r = computeBookingWindow({ journeyDate: '2026-09-22' });
  assert.equal(r.daysUntilOpen, null);
  assert.equal(r.status, null);
});

test('month, year and leap-day boundaries are exact', () => {
  assert.equal(computeBookingWindow({ journeyDate: '2027-01-01', quotaId: 'tatkal-ac' }).opensDate, '2026-12-31');
  assert.equal(computeBookingWindow({ journeyDate: '2028-03-01', quotaId: 'tatkal-ac' }).opensDate, '2028-02-29');
  assert.equal(computeBookingWindow({ journeyDate: '2028-04-29' }).opensDate, '2028-02-29');
});

test('invalid journey dates return null', () => {
  assert.equal(computeBookingWindow({ journeyDate: '' }), null);
  assert.equal(computeBookingWindow({ journeyDate: '22-09-2026' }), null);
  assert.equal(computeBookingWindow({ journeyDate: 'today' }), null);
});

test('furthest bookable date is today plus the ARP', () => {
  assert.equal(furthestBookableDate('2026-07-24'), '2026-09-22');
  assert.equal(furthestBookableDate('2026-07-24', 365), '2027-07-24');
  assert.equal(furthestBookableDate('bad-input'), null);
});

test('every quota exposes the fields the UI renders', () => {
  QUOTAS.forEach((q) => {
    assert.ok(q.id && q.label && q.hint && q.openTimeLabel);
    assert.ok(Number.isInteger(q.advanceDays) && q.advanceDays > 0);
    assert.match(q.openTime, /^\d{2}:\d{2}$/);
  });
});

test('date helpers round-trip', () => {
  assert.equal(toIsoDate(parseIsoDate('2026-07-24')), '2026-07-24');
});
