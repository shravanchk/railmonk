const test = require('node:test');
const assert = require('node:assert/strict');
const {
  FESTIVALS,
  getFestival,
  currentOccurrence,
  travelWindows,
  festivalPlan,
  upcomingFestivals,
  addDays,
  OUTBOUND_DAYS_BEFORE,
  RETURN_DAYS_AFTER,
} = require('../utils/festivals');
const { computeBookingWindow } = require('../utils/engines/bookingWindow');

const ISO = /^\d{4}-\d{2}-\d{2}$/;

test('every festival is well-formed and its occurrences are in date order', () => {
  const slugs = new Set();
  for (const f of FESTIVALS) {
    assert.match(f.slug, /^[a-z0-9-]+$/, `${f.name} slug`);
    assert.ok(!slugs.has(f.slug), `duplicate slug ${f.slug}`);
    slugs.add(f.slug);
    assert.ok(['fixed', 'lunar', 'moon'].includes(f.confidence), `${f.slug} confidence`);
    assert.ok(f.occurrences.length >= 1, `${f.slug} has no occurrences`);
    let prev = '';
    for (const o of f.occurrences) {
      for (const k of ['main', 'from', 'to', 'peak']) assert.match(o[k], ISO, `${f.slug} ${o.year} ${k}`);
      assert.ok(o.from <= o.main && o.main <= o.to, `${f.slug} ${o.year}: from ≤ main ≤ to`);
      assert.ok(o.peak <= o.main, `${f.slug} ${o.year}: peak must not be after the main day`);
      assert.ok(o.main > prev, `${f.slug}: occurrences out of order`);
      prev = o.main;
      for (const d of o.days || []) {
        assert.ok(d.date >= o.from && d.date <= o.to, `${f.slug} ${o.year}: named day ${d.date} outside period`);
      }
    }
  }
});

test('dates that were checked against the panchang are what the module says', () => {
  // A regression net for the handful of dates people search most. If one of
  // these fails, either the calendar was corrected or a typo crept in — check
  // before "fixing" the test.
  assert.equal(getFestival('diwali').occurrences[0].main, '2026-11-08');
  assert.equal(getFestival('chhath-puja').occurrences[0].main, '2026-11-15');
  assert.equal(getFestival('durga-puja-dussehra').occurrences[0].main, '2026-10-20');
  assert.equal(getFestival('holi').occurrences[0].main, '2027-03-22');
  assert.equal(getFestival('diwali').occurrences[1].main, '2027-10-29');
});

test('the booking date for a journey is the engine’s, not restated', () => {
  const plan = festivalPlan(getFestival('diwali'), '2026-09-15');
  for (const row of [...plan.outbound, ...plan.inbound]) {
    const expected = computeBookingWindow({ journeyDate: row.journeyDate, quotaId: 'general', today: '2026-09-15' });
    assert.equal(row.general.opensDate, expected.opensDate);
    assert.equal(row.general.opensTime, '08:00');
    assert.equal(row.tatkalAc.opensDate, addDays(row.journeyDate, -1));
    assert.equal(row.tatkalAc.opensTime, '10:00');
    assert.equal(row.tatkalNonAc.opensTime, '11:00');
  }
});

test('Diwali 2026: travelling on 7 November opens on 8 September at 08:00', () => {
  const plan = festivalPlan(getFestival('diwali'), '2026-09-15');
  assert.equal(plan.peak.journeyDate, '2026-11-07');
  assert.equal(plan.peak.general.opensDate, '2026-09-08');
  assert.equal(plan.peak.status, 'window-open');
});

test('travel windows run from three days before the period to three days after', () => {
  const occ = getFestival('chhath-puja').occurrences[0];
  const { outbound, inbound } = travelWindows(occ);
  assert.equal(outbound[0], addDays(occ.from, -OUTBOUND_DAYS_BEFORE));
  assert.equal(outbound[outbound.length - 1], occ.main);
  assert.equal(inbound[0], occ.to);
  assert.equal(inbound[inbound.length - 1], addDays(occ.to, RETURN_DAYS_AFTER));
});

test('the current occurrence rolls over once the return rush is finished', () => {
  const diwali = getFestival('diwali');
  assert.equal(currentOccurrence(diwali, '2026-09-15').year, 2026);
  assert.equal(currentOccurrence(diwali, '2026-11-13').year, 2026, 'still the return rush');
  assert.equal(currentOccurrence(diwali, '2026-11-14').year, 2027);
  // Past every listed year: the last one, so the page renders rather than 404s.
  assert.equal(currentOccurrence(diwali, '2030-01-01').year, 2027);
  // Unknown today (build time): the first, deterministically.
  assert.equal(currentOccurrence(diwali, null).year, 2026);
});

test('phase summarises where the booking calendar stands', () => {
  const diwali = getFestival('diwali');
  assert.equal(festivalPlan(diwali, '2026-08-01').phase, 'before');
  assert.equal(festivalPlan(diwali, '2026-09-10').phase, 'opening');
  assert.equal(festivalPlan(diwali, '2026-09-20').phase, 'open');
  assert.equal(festivalPlan(diwali, null).phase, 'unknown');
  // Once the 2026 rush is over the plan moves to 2027, which is 'before'.
  assert.equal(festivalPlan(diwali, '2026-12-01').phase, 'before');
  assert.equal(festivalPlan(diwali, '2026-12-01').occurrence.year, 2027);
});

test('upcoming festivals are sorted soonest first and exclude finished ones', () => {
  const list = upcomingFestivals('2026-11-20');
  const mains = list.map((p) => p.occurrence.main);
  assert.deepEqual(mains, [...mains].sort());
  assert.ok(list.every((p) => p.phase !== 'over'));
  assert.equal(list[0].festival.slug, 'christmas-new-year');
});

test('the same list without a known date is deterministic', () => {
  assert.deepEqual(
    upcomingFestivals(null).map((p) => p.festival.slug),
    upcomingFestivals(null).map((p) => p.festival.slug)
  );
});
