const test = require('node:test');
const assert = require('node:assert/strict');

const { applyEdits, buildJourneyCard, calendarEvents, ticketTypeFor } = require('../utils/engines/journeyCard');
const { parseTicketText } = require('../utils/engines/ticketParser');
const { computeCancellationRefund, flatChargePerPassenger, clerkagePerPassenger } = require('../utils/engines/irctcCancellation');
const { computeChartTimes, wallClock } = require('../utils/engines/chartPreparation');
const { toStored, fromStored } = require('../utils/storedTicket');
const { buildIcsCalendar } = require('../utils/reminders');
const f = require('./fixtures/tickets');

const at = (date, time) => wallClock(date, time);
const HOUR = 3600 * 1000;
const read = (k) => parseTicketText(f[k]);

// ── Refunds ─────────────────────────────────────────────────────────────────

test('the refund now is exactly what the cancellation engine gives', () => {
  const card = buildJourneyCard(read('ERS_CURRENT'), { now: at('2026-11-01', '10:00') });
  const expected = computeCancellationRefund({ classCode: '3A', ticketType: 'confirmed', fare: 3945, hoursBeforeDeparture: 300, passengers: 2 });
  assert.equal(card.refundNow.refund, expected.refund);
  assert.equal(card.refundNow.deduction, round2(flatChargePerPassenger('3A') * 2));
});

test('a confirmed ticket steps down at 72, 24 and 8 hours, and each step ends at its cut-off', () => {
  const card = buildJourneyCard(read('ERS_CURRENT'), { now: at('2026-11-01', '10:00') });
  const dep = at('2026-11-15', '16:55').getTime();
  assert.deepEqual(card.timeline.map((b) => b.untilHours), [72, 24, 8, 0]);
  assert.deepEqual(card.timeline.map((b) => b.ends.getTime()), [dep - 72 * HOUR, dep - 24 * HOUR, dep - 8 * HOUR, dep]);
  assert.deepEqual(card.timeline.map((b) => b.parts[0].rule), ['flat', 'slab-25', 'slab-50', 'no-refund']);
  assert.equal(card.timeline[1].refund, 3945 - 3945 * 0.25);
  assert.equal(card.timeline[3].refund, 0);
});

test('the current band follows the clock, and the next drop is the band after it', () => {
  const t = read('ERS_CURRENT');
  const at30h = buildJourneyCard(t, { now: new Date(at('2026-11-15', '16:55').getTime() - 30 * HOUR) });
  assert.equal(at30h.refundNow.untilHours, 24);
  assert.equal(at30h.nextDrop.untilHours, 8);
  assert.equal(at30h.nextDrop.refund, 3945 / 2);
  assert.ok(at30h.timeline[0].passed);

  const inside8 = buildJourneyCard(t, { now: at('2026-11-15', '12:00') });
  assert.equal(inside8.refundNow.refund, 0);
  assert.equal(inside8.nextDrop, null);
});

test('exactly at a cut-off the earlier, better slab still applies', () => {
  const card = buildJourneyCard(read('ERS_CURRENT'), { now: new Date(at('2026-11-15', '16:55').getTime() - 72 * HOUR) });
  assert.equal(card.refundNow.parts[0].rule, 'flat');
});

test('once the train has left there is no cancellation refund, only TDR', () => {
  const card = buildJourneyCard(read('ERS_CURRENT'), { now: at('2026-11-15', '17:00') });
  assert.equal(card.departed, true);
  assert.equal(card.refundNow, null);
  assert.equal(card.nextDrop, null);
});

test('Tatkal: confirmed passengers get nothing, RAC and waitlisted pay clerkage until 30 minutes', () => {
  const card = buildJourneyCard(read('ERS_OLDER'), { now: at('2026-12-24', '09:00') });
  assert.deepEqual(card.timeline.map((b) => b.untilHours), [0.5, 0]);
  const now = card.refundNow;
  const confirmed = now.parts.find((p) => p.ticketType === 'tatkal-confirmed');
  const racWl = now.parts.find((p) => p.ticketType === 'tatkal-rac-wl');
  assert.equal(confirmed.refund, 0);
  assert.equal(racWl.passengers, 2);
  assert.equal(racWl.deduction, round2(clerkagePerPassenger() * 2));
  assert.equal(card.fareSplit, true);
  assert.equal(card.timeline[1].refund, 0);
});

test('an SMS without a quota is not priced until the quota is chosen', () => {
  const t = read('SMS_NO_QUOTA');
  const before = buildJourneyCard(t, { now: at('2027-03-01', '10:00') });
  assert.equal(before.canPrice, false);
  assert.equal(before.unpricedReason, 'quota');
  assert.deepEqual(before.timeline, []);

  const general = buildJourneyCard(applyEdits(t, { quotaCode: 'GN' }), { now: at('2027-03-01', '10:00') });
  assert.equal(general.canPrice, true);
  assert.equal(general.refundNow.parts[0].ticketType, 'confirmed');

  const tatkal = buildJourneyCard(applyEdits(t, { quotaCode: 'TQ' }), { now: at('2027-03-01', '10:00') });
  assert.equal(tatkal.refundNow.refund, 0);
});

test('classes without a sourced charge are left unpriced rather than guessed', () => {
  const t = applyEdits(read('ERS_CURRENT'), { classCode: 'FC' });
  const card = buildJourneyCard(t, { now: at('2026-11-01', '10:00') });
  assert.equal(card.canPrice, false);
  assert.equal(card.unpricedReason, 'class');
});

test('edits override what the ticket printed, and blanks leave it alone', () => {
  const t = read('SMS_CONFIRMED');
  const edited = applyEdits(t, { departureTime: '17:10', fare: '4000', quotaCode: 'GN', classCode: '' });
  assert.equal(edited.departure.time, '17:10');
  assert.equal(edited.departure.date, '2026-11-15');
  assert.equal(edited.fare.ticket, 4000);
  assert.equal(edited.classCode, '3A');
  assert.equal(edited.quota.code, 'GN');
  assert.equal(t.departure.time, '16:55', 'the parsed ticket is not mutated');
});

test('ticket types map from printed status and quota', () => {
  assert.equal(ticketTypeFor({ kind: 'CNF' }, false), 'confirmed');
  assert.equal(ticketTypeFor({ kind: 'CNF' }, true), 'tatkal-confirmed');
  assert.equal(ticketTypeFor({ kind: 'RAC' }, false), 'rac');
  assert.equal(ticketTypeFor({ kind: 'WL' }, true), 'tatkal-rac-wl');
  assert.equal(ticketTypeFor({ kind: 'CAN' }, false), null);
});

// ── Charts ──────────────────────────────────────────────────────────────────

test('chart times are the chart engine’s, from the ticket departure by default', () => {
  const card = buildJourneyCard(read('ERS_CURRENT'), { now: at('2026-11-01', '10:00') });
  const expected = computeChartTimes({ departureDate: '2026-11-15', departureTime: '16:55' });
  assert.equal(card.charts.firstChart.getTime(), expected.firstChart.getTime());
  assert.equal(card.charts.finalChart.getTime(), expected.finalChart.getTime());
  assert.equal(card.chartBasis, 'ticket');
});

test('a train that started the day before is flagged, and the origin departure takes over when given', () => {
  const t = read('ERS_MIDROUTE');
  const card = buildJourneyCard(t, { now: at('2027-01-01', '09:00') });
  assert.equal(card.startedEarlier, true);
  assert.equal(card.chartBasis, 'ticket');

  const exact = buildJourneyCard(t, { now: at('2027-01-01', '09:00'), originDate: '2027-01-09', originTime: '11:15' });
  assert.equal(exact.chartBasis, 'origin');
  // 11:15 is in the morning band: chart by 20:00 the evening before.
  assert.equal(exact.charts.firstChart.getTime(), at('2027-01-08', '20:00').getTime());
});

// ── TDR ─────────────────────────────────────────────────────────────────────

const tdrIds = (card) => card.tdr.map((d) => d.scenarioId);

test('TDR deadlines: AC class and a party ticket count from arrival', () => {
  const card = buildJourneyCard(read('ERS_CURRENT'), { now: at('2026-11-01', '10:00') });
  assert.deepEqual(tdrIds(card), ['train-cancelled', 'delay-3h', 'ac-failure', 'partial-party-travelled']);
  const arrival = at('2026-11-16', '08:35').getTime();
  assert.equal(card.tdr.find((d) => d.scenarioId === 'ac-failure').at.getTime(), arrival + 20 * HOUR);
  assert.equal(card.tdr.find((d) => d.scenarioId === 'partial-party-travelled').at.getTime(), arrival + 72 * HOUR);
  assert.equal(card.tdr.find((d) => d.scenarioId === 'delay-3h').basis, 'before-actual-departure');
  card.tdr.forEach((d) => assert.ok(d.scenario, `${d.scenarioId} is in the TDR table`));
});

test('TDR deadlines: RAC must act 30 minutes before; a partly waitlisted ticket is not auto-cancelled', () => {
  const card = buildJourneyCard(read('ERS_OLDER'), { now: at('2026-12-24', '09:00') });
  assert.ok(tdrIds(card).includes('rac-not-travelled'));
  assert.ok(!tdrIds(card).includes('wl-not-travelled'));
  assert.ok(!tdrIds(card).includes('ac-failure'), 'sleeper has no AC claim');
  assert.equal(card.tdr.find((d) => d.scenarioId === 'rac-not-travelled').at.getTime(), at('2026-12-24', '18:50').getTime());
});

test('a fully waitlisted e-ticket is refunded automatically at the chart', () => {
  const t = read('SMS_TATKAL_WL');
  const card = buildJourneyCard(t, { now: at('2026-12-20', '09:00') });
  assert.equal(card.allWaitlisted, true);
  const wl = card.tdr.find((d) => d.scenarioId === 'wl-not-travelled');
  assert.equal(wl.at.getTime(), card.charts.firstChart.getTime());
  assert.ok(!calendarEvents(card).some((e) => e.id === 'refund-drop'), 'no reminder for a cut-off that never bites');
});

// ── Calendar ────────────────────────────────────────────────────────────────

test('calendar events: the journey runs to arrival, the chart and the next refund drop', () => {
  const card = buildJourneyCard(read('ERS_CURRENT'), { now: at('2026-11-01', '10:00') });
  const events = calendarEvents(card);
  assert.deepEqual(events.map((e) => e.id), ['journey', 'chart', 'refund-drop']);
  assert.equal(events[0].startWallIst, '2026-11-15T16:55');
  assert.equal(events[0].durationMinutes, (15 * 60 + 40));
  assert.equal(events[1].startWallIst, '2026-11-15T06:55');
  assert.equal(events[2].startWallIst, '2026-11-12T16:55');

  const ics = buildIcsCalendar(events.map((e) => ({ ...e, title: e.id, uid: `${e.id}@test`, stamp: '2026-10-20T00:00:00Z' })));
  assert.equal(ics.split('BEGIN:VEVENT').length - 1, 3);
  assert.equal(ics.split('BEGIN:VCALENDAR').length - 1, 1);
  // 16:55 IST is 11:25 UTC.
  assert.match(ics, /DTSTART:20261115T112500Z/);
});

test('no calendar events without a departure', () => {
  const t = applyEdits(read('ERS_CURRENT'), {});
  t.departure = { date: null, time: null };
  assert.deepEqual(calendarEvents(buildJourneyCard(t, {})), []);
});

// ── Saved tickets ───────────────────────────────────────────────────────────

test('a saved ticket keeps what the rules need and drops passenger names', () => {
  const t = read('ERS_OLDER');
  const stored = toStored(t);
  const json = JSON.stringify(stored);
  assert.ok(!json.includes('RAVI'), 'names are not stored');
  assert.ok(!/"age":\d/.test(json), 'ages are not stored');

  const back = fromStored(JSON.parse(json));
  const now = at('2026-12-24', '09:00');
  assert.deepEqual(buildJourneyCard(back, { now }).refundNow.refund, buildJourneyCard(t, { now }).refundNow.refund);
  assert.equal(back.quota.code, 'TQ');
  assert.equal(back.passengers.length, 3);
});

test('a corrupt saved ticket is rejected', () => {
  assert.equal(fromStored(null), null);
  assert.equal(fromStored({ departure: { date: 'soon' } }), null);
  const odd = fromStored({ departure: { date: '2027-01-01', time: '25:99' }, pnr: 'abc', classCode: 'ZZ', passengers: [{ booking: { kind: 'HACK' } }] });
  assert.equal(odd.pnr, null);
  assert.equal(odd.classCode, null);
  assert.equal(odd.departure.time, null);
  assert.deepEqual(odd.passengers, []);
});

function round2(n) {
  return Math.round(n * 100) / 100;
}
