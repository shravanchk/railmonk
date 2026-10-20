// A read ticket as it is kept in saved journeys — and back again.
//
// Saved journeys live in localStorage on the reader's own device (see
// utils/savedJourneys.js). Even there, a ticket keeps only what the rules
// need: route, train, class, quota, times, fare and each passenger's status.
// Names, ages and genders are dropped on the way in, because nothing on the
// journey card uses them and a phone is lent, lost and backed up.
//
// CommonJS so the tests can check the round trip; `fromStored` validates every
// field, so a hand-edited or corrupt entry cannot render.

const { quotaRecord, CLASS_CODES } = require('./engines/ticketParser');

const isIsoDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
const isTime = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || ''));
const str = (v, max = 60) => (typeof v === 'string' ? v.slice(0, max) : null);
const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);

const station = (s) => (s && typeof s.code === 'string' && /^[A-Z]{1,5}$/.test(s.code) ? { code: s.code, name: str(s.name) || s.code } : null);

const STATUS_KINDS = new Set(['CNF', 'RAC', 'WL', 'CAN', 'OTHER']);

const status = (s) => {
  if (!s || !STATUS_KINDS.has(s.kind)) return null;
  const out = { kind: s.kind, raw: str(s.raw, 40) || s.kind };
  if (str(s.coach, 4)) out.coach = str(s.coach, 4);
  if (num(s.berth)) out.berth = num(s.berth);
  if (str(s.berthType, 16)) out.berthType = str(s.berthType, 16);
  if (num(s.number)) out.number = num(s.number);
  if (str(s.list, 6)) out.list = str(s.list, 6);
  if (str(s.code, 6)) out.code = str(s.code, 6);
  return out;
};

const dateTime = (v) => (v && (isIsoDate(v.date) || isTime(v.time)) ? { date: isIsoDate(v.date) ? v.date : null, time: isTime(v.time) ? v.time : null } : null);

/** Parsed ticket → the record kept on the device. */
const toStored = (ticket) => {
  if (!ticket) return null;
  return fromStored({
    source: ticket.source,
    pnr: ticket.pnr,
    train: ticket.train,
    classCode: ticket.classCode,
    quotaCode: ticket.quota ? ticket.quota.code : null,
    from: ticket.from,
    boarding: ticket.boarding,
    to: ticket.to,
    startDate: ticket.startDate,
    departure: ticket.departure,
    arrival: ticket.arrival,
    fare: ticket.fare ? ticket.fare.ticket : null,
    passengers: (ticket.passengers || []).map((p) => ({ booking: p.booking, current: p.current })),
  });
};

/**
 * Stored record → a ticket in the parser's shape, or null if it is not a
 * usable ticket. Accepts both the compact stored form and its own output.
 */
const fromStored = (s) => {
  if (!s || typeof s !== 'object') return null;
  const departure = dateTime(s.departure);
  if (!departure || !departure.date) return null;
  const passengers = (Array.isArray(s.passengers) ? s.passengers : [])
    .slice(0, 6) // IRCTC allows at most six passengers per PNR
    .map((p, i) => ({ serial: i + 1, name: null, age: null, gender: null, booking: status(p && p.booking), current: status(p && p.current) }))
    .filter((p) => p.booking);
  const trainNumber = s.train && /^\d{5}$/.test(s.train.number) ? s.train.number : null;
  const quotaCode = s.quotaCode || (s.quota && s.quota.code);
  const fare = num(typeof s.fare === 'object' && s.fare ? s.fare.ticket : s.fare);
  return {
    source: s.source === 'sms' ? 'sms' : 'ers',
    pnr: /^\d{10}$/.test(String(s.pnr || '')) ? String(s.pnr) : null,
    train: trainNumber ? { number: trainNumber, name: str(s.train.name) } : null,
    classCode: CLASS_CODES.includes(s.classCode) ? s.classCode : null,
    quota: quotaRecord(quotaCode),
    from: station(s.from),
    boarding: station(s.boarding),
    to: station(s.to),
    startDate: isIsoDate(s.startDate) ? s.startDate : null,
    departure,
    arrival: dateTime(s.arrival),
    distanceKm: null,
    fare: { ticket: fare, convenience: null, insurance: null, total: null },
    passengers,
    missing: [],
  };
};

module.exports = { toStored, fromStored };
