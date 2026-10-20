const test = require('node:test');
const assert = require('node:assert/strict');

const { parseTicketText, parseDate, parseStation, parseStatuses, effectiveStatus } = require('../utils/engines/ticketParser');
const { itemsToLines } = require('../utils/pdfLines');
const f = require('./fixtures/tickets');

const statusesOf = (t) => t.passengers.map((p) => effectiveStatus(p));

// ── ERS, current layout ─────────────────────────────────────────────────────

test('current ERS: header rows are paired with the values under them', () => {
  const t = parseTicketText(f.ERS_CURRENT);
  assert.equal(t.source, 'ers');
  assert.equal(t.pnr, '2345678901');
  assert.deepEqual(t.train, { number: '12952', name: 'MMCT TEJAS RAJ' });
  assert.equal(t.classCode, '3A');
  assert.equal(t.quota.code, 'GN');
  assert.deepEqual(t.from, { name: 'NEW DELHI', code: 'NDLS' });
  assert.deepEqual(t.boarding, { name: 'NEW DELHI', code: 'NDLS' });
  assert.deepEqual(t.to, { name: 'MUMBAI CENTRAL', code: 'MMCT' });
  assert.equal(t.distanceKm, 1386);
  assert.deepEqual(t.missing, []);
});

test('current ERS: departure, arrival and start date with time-first cells', () => {
  const t = parseTicketText(f.ERS_CURRENT);
  assert.deepEqual(t.departure, { date: '2026-11-15', time: '16:55' });
  assert.deepEqual(t.arrival, { date: '2026-11-16', time: '08:35' });
  assert.equal(t.startDate, '2026-11-15');
});

test('current ERS: fare lines are read by label, with or without the rupee sign', () => {
  const t = parseTicketText(f.ERS_CURRENT);
  assert.deepEqual(t.fare, { ticket: 3945, convenience: 35.4, insurance: 0.9, total: 3981.3 });
  const noSign = parseTicketText(f.ERS_CURRENT.replace(/₹ /g, ''));
  assert.equal(noSign.fare.ticket, 3945);
});

test('current ERS: each passenger keeps booking and current status, coach and berth', () => {
  const t = parseTicketText(f.ERS_CURRENT);
  assert.equal(t.passengers.length, 2);
  const [a, b] = t.passengers;
  assert.equal(a.name, 'ASHA VERMA');
  assert.equal(a.age, 34);
  assert.equal(a.gender, 'F');
  assert.deepEqual(
    { kind: a.current.kind, coach: a.current.coach, berth: a.current.berth, berthType: a.current.berthType },
    { kind: 'CNF', coach: 'B4', berth: 23, berthType: 'LOWER' }
  );
  assert.equal(b.booking.berthType, 'MIDDLE');
});

test('Tatkal in the ERS small print does not make a general ticket Tatkal', () => {
  const t = parseTicketText(f.ERS_CURRENT);
  assert.match(f.ERS_CURRENT, /Tatkal/);
  assert.equal(t.quota.tatkal, false);
});

test('mid-route ERS: the start date is earlier than the departure date', () => {
  const t = parseTicketText(f.ERS_MIDROUTE);
  assert.equal(t.startDate, '2027-01-09');
  assert.deepEqual(t.departure, { date: '2027-01-10', time: '05:40' });
  assert.equal(t.classCode, '2A');
  const [a, b] = statusesOf(t);
  assert.deepEqual({ kind: a.kind, number: a.number }, { kind: 'RAC', number: 7 });
  assert.deepEqual({ kind: b.kind, list: b.list, number: b.number }, { kind: 'WL', list: 'WL', number: 3 });
  assert.equal(t.passengers[0].booking.list, 'GNWL');
});

// ── ERS, older layout ───────────────────────────────────────────────────────

test('older ERS: "Label : value" fields across three columns', () => {
  const t = parseTicketText(f.ERS_OLDER);
  assert.equal(t.pnr, '4512345678');
  assert.deepEqual(t.train, { number: '12627', name: 'KARNATAKA EXP' });
  assert.equal(t.classCode, 'SL');
  assert.deepEqual({ code: t.quota.code, tatkal: t.quota.tatkal }, { code: 'TQ', tatkal: true });
  assert.equal(t.from.code, 'SBC');
  assert.equal(t.to.code, 'NDLS');
  assert.deepEqual(t.departure, { date: '2026-12-24', time: '19:20' });
  assert.deepEqual(t.arrival, { date: '2026-12-26', time: '09:00' });
  assert.equal(t.fare.ticket, 2345);
  assert.equal(t.fare.total, 2362.7);
});

test('older ERS: confirmed, RAC and Tatkal waitlist on one PNR', () => {
  const t = parseTicketText(f.ERS_OLDER);
  const kinds = statusesOf(t).map((s) => s.kind);
  assert.deepEqual(kinds, ['CNF', 'RAC', 'WL']);
  assert.equal(t.passengers[1].booking.number, 4);
  assert.equal(t.passengers[1].current.number, 2);
  assert.equal(t.passengers[2].current.list, 'TQWL');
  assert.equal(t.passengers[2].current.number, 3);
  assert.equal(t.passengers[0].current.berthType, 'LB');
});

// ── SMS ─────────────────────────────────────────────────────────────────────

test('SMS: confirmed booking with "+1" and coach-berth pairs', () => {
  const t = parseTicketText(f.SMS_CONFIRMED);
  assert.equal(t.source, 'sms');
  assert.equal(t.pnr, '2345678901');
  assert.equal(t.train.number, '12952');
  assert.equal(t.classCode, '3A');
  assert.equal(t.from.code, 'NDLS');
  assert.equal(t.to.code, 'MMCT');
  assert.equal(t.boarding.code, 'NDLS');
  assert.deepEqual(t.departure, { date: '2026-11-15', time: '16:55' });
  assert.equal(t.fare.ticket, 3945);
  assert.equal(t.fare.convenience, 35.4);
  assert.equal(t.passengers.length, 2);
  assert.equal(t.passengers[0].name, 'ASHA VERMA');
  assert.deepEqual(statusesOf(t).map((s) => `${s.kind} ${s.coach}/${s.berth}`), ['CNF B4/23', 'CNF B4/24']);
});

test('SMS: the customer care number is not read as a train or a fare', () => {
  const t = parseTicketText(f.SMS_CONFIRMED);
  assert.notEqual(t.train.number, '14646');
  assert.equal(t.fare.ticket, 3945);
});

test('SMS: an SMS never says the quota, so it is reported missing rather than assumed general', () => {
  const t = parseTicketText(f.SMS_NO_QUOTA);
  assert.equal(t.quota, null);
  assert.ok(t.missing.includes('quota'));
  assert.equal(t.passengers.length, 1);
  assert.equal(t.passengers[0].name, 'NEHA RAO');
  assert.equal(effectiveStatus(t.passengers[0]).coach, 'C2');
});

test('SMS: a TQWL waitlist proves the ticket is Tatkal', () => {
  const t = parseTicketText(f.SMS_TATKAL_WL);
  assert.equal(t.quota.code, 'TQ');
  assert.equal(t.quota.inferred, true);
  assert.equal(t.passengers.length, 3);
  assert.deepEqual(statusesOf(t).map((s) => s.number), [12, 13, 14]);
  assert.deepEqual(t.missing, []);
});

test('SMS: dash separators, a single passenger without "+N", RAC', () => {
  const t = parseTicketText(f.SMS_RAC);
  assert.equal(t.pnr, '6012345678');
  assert.equal(t.train.number, '12301');
  assert.deepEqual(t.departure, { date: '2027-01-05', time: '16:50' });
  assert.equal(t.passengers.length, 1);
  assert.deepEqual({ kind: statusesOf(t)[0].kind, number: statusesOf(t)[0].number }, { kind: 'RAC', number: 21 });
  assert.equal(t.fare.ticket, 2890);
});

test('SMS: per-passenger "P1-" berths with berth types, and a fare with a thousands comma', () => {
  const t = parseTicketText(f.SMS_PER_PASSENGER);
  assert.equal(t.classCode, 'CC');
  assert.deepEqual(statusesOf(t).map((s) => `${s.coach}/${s.berth}/${s.berthType}`), ['C3/45/WS', 'C3/46/NC']);
  assert.equal(t.fare.ticket, 2450);
  assert.deepEqual(t.departure, { date: '2027-02-02', time: '06:00' });
});

test('text that is not a ticket is rejected, not shown as an empty card', () => {
  assert.equal(parseTicketText(f.NOT_A_TICKET), null);
  assert.equal(parseTicketText(''), null);
  assert.equal(parseTicketText(null), null);
});

// ── Pieces ──────────────────────────────────────────────────────────────────

test('dates in every format IRCTC prints them', () => {
  assert.equal(parseDate('15-Nov-2026'), '2026-11-15');
  assert.equal(parseDate('15/11/2026'), '2026-11-15');
  assert.equal(parseDate('15-11-26'), '2026-11-15');
  assert.equal(parseDate('15Nov26'), '2026-11-15');
  assert.equal(parseDate('5 November 2026'), '2026-11-05');
  assert.equal(parseDate('31-02-2026'), null);
  assert.equal(parseDate('nonsense'), null);
});

test('stations with and without a bracketed code', () => {
  assert.deepEqual(parseStation('KSR BENGALURU (SBC)'), { name: 'KSR BENGALURU', code: 'SBC' });
  assert.deepEqual(parseStation('NDLS'), { name: 'NDLS', code: 'NDLS' });
  assert.equal(parseStation(''), null);
});

test('status cells in their many spellings', () => {
  const kinds = (s) => parseStatuses(s).map((x) => x.kind);
  assert.deepEqual(kinds('CNF/B4/23/LOWER CNF/B4/23/LOWER'), ['CNF', 'CNF']);
  assert.deepEqual(kinds('RLWL/45  RLWL/20'), ['WL', 'WL']);
  assert.deepEqual(kinds('WL 12 RAC 4'), ['WL', 'RAC']);
  assert.deepEqual(kinds('CNF  CAN'), ['CNF', 'CAN']);
  assert.deepEqual(kinds('S5 33 LB'), ['CNF']);
  assert.deepEqual(kinds('RAC/S2/45/SIDE LOWER'), ['RAC']);
  assert.equal(parseStatuses('RAC/S2/45/SIDE LOWER')[0].berthType, 'SIDE LOWER');
  assert.equal(parseStatuses('PQWL/7')[0].list, 'PQWL');
  assert.deepEqual(kinds('VEG NO FOOD'), []);
});

// ── pdf.js text items → lines ───────────────────────────────────────────────

const item = (str, x, y, width, size = 9) => ({ str, transform: [size, 0, 0, size, x, y], width, height: size });

test('itemsToLines rebuilds rows by baseline and orders runs by x', () => {
  const lines = itemsToLines([item('Class', 300, 700, 22), item('PNR', 40, 700, 18), item('2345678901', 40, 687, 50), item('AC 3 TIER (3A)', 300, 687.5, 60)]);
  assert.deepEqual(lines, ['PNR  Class', '2345678901  AC 3 TIER (3A)']);
});

test('itemsToLines joins words with one space and columns with two', () => {
  const lines = itemsToLines([item('NEW', 40, 700, 18), item('DELHI', 60.5, 700, 25), item('(NDLS)', 88, 700, 28), item('MUMBAI', 200, 700, 34)]);
  assert.deepEqual(lines, ['NEW DELHI (NDLS)  MUMBAI']);
});

test('itemsToLines does not split glyph runs that touch', () => {
  const lines = itemsToLines([item('PN', 40, 700, 12), item('R', 52, 700, 6)]);
  assert.deepEqual(lines, ['PNR']);
});

test('itemsToLines ignores the whitespace items pdf.js inserts for wide gaps', () => {
  const lines = itemsToLines([item('12952/MMCT TEJAS RAJ', 40, 700, 100), item(' ', 140, 700, 60), item('AC 3 TIER (3A)', 200, 700, 60)]);
  assert.deepEqual(lines, ['12952/MMCT TEJAS RAJ  AC 3 TIER (3A)']);
});
