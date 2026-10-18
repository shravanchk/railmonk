const test = require('node:test');
const assert = require('node:assert/strict');

const {
  POSTPONE_FEE_ONLY_HOURS,
  TRANSFER_REASONS,
  CONFIDENCE,
  istWallNow,
  postponeHoursAfterDeparture,
  assessTicketChanges,
  formatTimeLeft,
} = require('../utils/engines/ticketChanges');
const { CLASSES, estimateFare } = require('../utils/engines/trainFare');
const { clerkagePerPassenger } = require('../utils/engines/irctcCancellation');
const { wallClock } = require('../utils/engines/chartPreparation');

const DEPART = { departureDate: '2026-12-20', departureTime: '22:00' };
const at = (date, time) => wallClock(date, time);
const byId = (result, id) => result.changes.find((c) => c.id === id);

test('every change carries a known confidence and a verdict', () => {
  const r = assessTicketChanges({ ...DEPART, now: at('2026-12-01', '10:00') });
  assert.equal(r.changes.length, 5);
  r.changes.forEach((c) => {
    assert.ok(CONFIDENCE[c.confidence], `${c.id} has unknown confidence ${c.confidence}`);
    assert.ok(['available', 'closed', 'not-allowed', 'on-request'].includes(c.verdict), `${c.id}: ${c.verdict}`);
  });
});

test('istWallNow shifts a UTC instant to IST wall clock', () => {
  const now = istWallNow(new Date(Date.UTC(2026, 9, 18, 20, 0)));
  assert.equal(now.getUTCDate(), 19);
  assert.equal(now.getUTCHours(), 1);
  assert.equal(now.getUTCMinutes(), 30);
});

// --- Boarding point ---

test('boarding point change closes at the final chart, 30 minutes before departure', () => {
  const b = byId(assessTicketChanges({ ...DEPART, now: at('2026-12-20', '21:00') }), 'boarding');
  assert.equal(b.verdict, 'available');
  assert.equal(b.deadline.getTime(), at('2026-12-20', '21:30').getTime());
  assert.equal(b.msLeft, 30 * 60 * 1000);

  const late = byId(assessTicketChanges({ ...DEPART, now: at('2026-12-20', '21:30') }), 'boarding');
  assert.equal(late.verdict, 'closed');
});

test('boarding point change is still open inside the old 24-hour cut-off', () => {
  const b = byId(assessTicketChanges({ ...DEPART, now: at('2026-12-20', '12:00') }), 'boarding');
  assert.equal(b.verdict, 'available');
});

test('waitlisted tickets cannot change boarding point; RAC can', () => {
  assert.equal(byId(assessTicketChanges({ ...DEPART, status: 'WL' }), 'boarding').verdict, 'not-allowed');
  assert.equal(byId(assessTicketChanges({ ...DEPART, status: 'RAC' }), 'boarding').verdict, 'available');
});

test('boarding point change is online for e-tickets and at a counter for counter tickets', () => {
  assert.match(byId(assessTicketChanges({ ...DEPART, channel: 'eticket' }), 'boarding').where, /IRCTC/);
  assert.match(byId(assessTicketChanges({ ...DEPART, channel: 'counter' }), 'boarding').where, /counter/);
});

// --- Name transfer ---

test('family transfer needs 24 hours, student and marriage party 48', () => {
  const lead = (transferReason) =>
    (at('2026-12-20', '22:00').getTime() -
      byId(assessTicketChanges({ ...DEPART, transferReason }), 'name').deadline.getTime()) /
    3600000;
  assert.equal(lead('family'), 24);
  assert.equal(lead('government-duty'), 24);
  assert.equal(lead('ncc'), 24);
  assert.equal(lead('student'), 48);
  assert.equal(lead('marriage-party'), 48);
});

test('a name transfer request inside the window is closed', () => {
  const n = byId(assessTicketChanges({ ...DEPART, now: at('2026-12-19', '23:00') }), 'name');
  assert.equal(n.verdict, 'closed');
});

test('only group transfers carry the 10% cap', () => {
  TRANSFER_REASONS.forEach((reason) => {
    const n = byId(assessTicketChanges({ ...DEPART, transferReason: reason.id }), 'name');
    assert.equal(n.conditions.some((c) => c.includes('10%')), reason.groupCap, reason.id);
  });
});

test('Tatkal, RAC, waitlisted and concession tickets cannot be transferred', () => {
  assert.equal(byId(assessTicketChanges({ ...DEPART, quota: 'tatkal' }), 'name').verdict, 'not-allowed');
  assert.equal(byId(assessTicketChanges({ ...DEPART, status: 'RAC' }), 'name').verdict, 'not-allowed');
  assert.equal(byId(assessTicketChanges({ ...DEPART, status: 'WL' }), 'name').verdict, 'not-allowed');
  const c = byId(assessTicketChanges({ ...DEPART, quota: 'concession' }), 'name');
  assert.equal(c.verdict, 'not-allowed');
  assert.equal(c.confidence, 'reported');
});

// --- Date change ---

test('e-tickets cannot change date, and the online option is only ever "announced"', () => {
  const d = byId(assessTicketChanges({ ...DEPART, channel: 'eticket' }), 'date');
  assert.equal(d.verdict, 'not-allowed');
  assert.equal(d.announced.confidence, 'announced');
});

test('Tatkal tickets cannot be postponed or preponed, even at a counter', () => {
  const d = byId(assessTicketChanges({ ...DEPART, channel: 'counter', quota: 'tatkal' }), 'date');
  assert.equal(d.verdict, 'not-allowed');
});

test('confirmed counter ticket: fresh reservation fee until 48 hours before departure', () => {
  const d = byId(
    assessTicketChanges({ ...DEPART, channel: 'counter', classCode: '3A', now: at('2026-12-17', '10:00') }),
    'date'
  );
  assert.equal(d.verdict, 'available');
  assert.equal(d.cost.amount, CLASSES['3A'].reservationFee);
  assert.equal(
    at('2026-12-20', '22:00').getTime() - d.deadline.getTime(),
    POSTPONE_FEE_ONLY_HOURS * 3600000
  );

  // Inside 48 hours it is still possible — it just costs a cancellation charge.
  const late = byId(
    assessTicketChanges({ ...DEPART, channel: 'counter', classCode: '3A', distanceKm: 900, now: at('2026-12-19', '10:00') }),
    'date'
  );
  assert.equal(late.verdict, 'available');
  assert.match(late.cost.label, /cancellation charge/);
  assert.equal(late.deadline.getTime(), at('2026-12-21', '10:00').getTime());

  const gone = byId(
    assessTicketChanges({ ...DEPART, channel: 'counter', distanceKm: 900, now: at('2026-12-21', '10:00') }),
    'date'
  );
  assert.equal(gone.verdict, 'closed');
});

test('RAC/WL counter ticket pays clerkage and may be postponed after departure by distance band', () => {
  const d = byId(assessTicketChanges({ ...DEPART, channel: 'counter', status: 'WL', distanceKm: 350 }), 'date');
  assert.equal(d.cost.amount, Math.round(clerkagePerPassenger() * 100) / 100);
  assert.equal(d.deadline.getTime(), at('2026-12-21', '04:00').getTime());
});

test('postponement limits after departure are 3, 6 and 12 hours', () => {
  assert.equal(postponeHoursAfterDeparture(200), 3);
  assert.equal(postponeHoursAfterDeparture(201), 6);
  assert.equal(postponeHoursAfterDeparture(500), 6);
  assert.equal(postponeHoursAfterDeparture(501), 12);
  assert.equal(postponeHoursAfterDeparture(0), null);
});

// --- Upgrade and extension ---

test('upgrade cost is the fare difference, and moving without permission adds the excess charge', () => {
  const u = byId(
    assessTicketChanges({ ...DEPART, classCode: 'SL', upgradeClassCode: '3A', distanceKm: 800 }),
    'upgrade'
  );
  const diff =
    estimateFare({ classCode: '3A', distanceKm: 800 }).totalPerPassenger -
    estimateFare({ classCode: 'SL', distanceKm: 800 }).totalPerPassenger;
  assert.equal(u.verdict, 'on-request');
  assert.equal(u.cost.amount, diff);
  assert.ok(u.penalty.perPassenger > u.cost.amount);
});

test('an "upgrade" to a lower class costs nothing and offers no penalty comparison', () => {
  const u = byId(assessTicketChanges({ ...DEPART, classCode: '2A', upgradeClassCode: 'SL', distanceKm: 800 }), 'upgrade');
  assert.equal(u.cost.amount, 0);
  assert.equal(u.penalty, null);
});

test('concession tickets cannot be upgraded by paying the difference', () => {
  assert.equal(byId(assessTicketChanges({ ...DEPART, quota: 'concession' }), 'upgrade').verdict, 'not-allowed');
});

test('extension is priced as a fresh journey; not telling the TTE costs more', () => {
  const e = byId(assessTicketChanges({ ...DEPART, classCode: 'SL', extraKm: 120 }), 'extension');
  assert.equal(e.cost.amount, estimateFare({ classCode: 'SL', distanceKm: 120 }).totalPerPassenger);
  assert.ok(e.penalty.perPassenger > e.cost.amount);
});

// --- Without a departure ---

test('without a departure time the rules still render, with no deadlines', () => {
  const r = assessTicketChanges({});
  assert.equal(r.departure, null);
  assert.equal(byId(r, 'boarding').deadline, null);
  assert.equal(byId(r, 'boarding').verdict, 'available');
});

test('formatTimeLeft', () => {
  assert.equal(formatTimeLeft(30 * 60 * 1000), '30 minutes');
  assert.equal(formatTimeLeft(3600000), '1 hour');
  assert.equal(formatTimeLeft(26 * 3600000 + 5 * 60000), '1 day 2 hours');
  assert.equal(formatTimeLeft(-1), '');
});
