// When the booking window opens for a given journey date and quota.
//
// Rules encoded here:
//   • General / most quotas — Advance Reservation Period of 60 days excluding
//     the date of journey (Railway Board Commercial Circular No. 10 of 2024,
//     w.e.f. 1 November 2024). Reservation opens at 08:00 IST on that day.
//   • Foreign Tourist quota — 365 days, unchanged by that circular.
//   • Tatkal — one day before the journey (excluding the journey day):
//     10:00 IST for AC classes, 11:00 IST for Sleeper and other non-AC.
//     Premium Tatkal follows the AC clock.
//
// Note the two clocks people conflate: 10:00 and 11:00 are *Tatkal* times.
// The general ARP window opens at 08:00.
//
// Wall-clock IST throughout, held in UTC-backed Dates for exact date maths.
// Use the `toWallIso` helper to read values back.

const DAY_MS = 24 * 60 * 60 * 1000;

const QUOTAS = [
  {
    id: 'general',
    label: 'General / regular booking',
    hint: 'Mail, Express, Rajdhani, Shatabdi, Duronto and Vande Bharat',
    advanceDays: 60,
    openTime: '08:00',
    openTimeLabel: '08:00 AM IST',
  },
  {
    id: 'tatkal-ac',
    label: 'Tatkal — AC classes',
    hint: '1A, 2A, 3A, 3E, CC, EC and Premium Tatkal',
    advanceDays: 1,
    openTime: '10:00',
    openTimeLabel: '10:00 AM IST',
  },
  {
    id: 'tatkal-non-ac',
    label: 'Tatkal — Sleeper & non-AC',
    hint: 'SL, 2S and other non-AC classes',
    advanceDays: 1,
    openTime: '11:00',
    openTimeLabel: '11:00 AM IST',
  },
  {
    id: 'foreign-tourist',
    label: 'Foreign Tourist quota',
    hint: 'Unchanged 365-day window',
    advanceDays: 365,
    openTime: '08:00',
    openTimeLabel: '08:00 AM IST',
  },
];

const getQuota = (id) => QUOTAS.find((q) => q.id === id) || QUOTAS[0];

const parseIsoDate = (isoDate) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || '').trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const instant = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  return Number.isNaN(instant.getTime()) ? null : instant;
};

const pad = (n) => String(n).padStart(2, '0');

const toIsoDate = (instant) =>
  `${instant.getUTCFullYear()}-${pad(instant.getUTCMonth() + 1)}-${pad(instant.getUTCDate())}`;

/**
 * @param {{ journeyDate: string, quotaId?: string, today?: string }} input
 * @returns {null | {
 *   quota: object, journeyDate: string, opensDate: string, opensTime: string,
 *   opensWallIso: string, advanceDays: number,
 *   daysUntilOpen: number|null, status: 'upcoming'|'open-today'|'window-open'|'journey-passed'|null
 * }}
 */
const computeBookingWindow = ({ journeyDate, quotaId = 'general', today = null }) => {
  const journey = parseIsoDate(journeyDate);
  if (!journey) return null;
  const quota = getQuota(quotaId);

  const opens = new Date(journey.getTime() - quota.advanceDays * DAY_MS);
  const opensDate = toIsoDate(opens);
  const opensWallIso = `${opensDate}T${quota.openTime}`;

  let daysUntilOpen = null;
  let status = null;
  const now = parseIsoDate(today);
  if (now) {
    daysUntilOpen = Math.round((opens.getTime() - now.getTime()) / DAY_MS);
    if (now.getTime() > journey.getTime()) status = 'journey-passed';
    else if (daysUntilOpen > 0) status = 'upcoming';
    else if (daysUntilOpen === 0) status = 'open-today';
    else status = 'window-open';
  }

  return {
    quota,
    journeyDate: toIsoDate(journey),
    opensDate,
    opensTime: quota.openTime,
    opensWallIso,
    advanceDays: quota.advanceDays,
    daysUntilOpen,
    status,
  };
};

/**
 * The furthest journey date bookable today under the general ARP — the answer
 * to "how far ahead can I book right now?".
 */
const furthestBookableDate = (todayIso, advanceDays = 60) => {
  const today = parseIsoDate(todayIso);
  if (!today) return null;
  return toIsoDate(new Date(today.getTime() + advanceDays * DAY_MS));
};

module.exports = {
  QUOTAS,
  getQuota,
  computeBookingWindow,
  furthestBookableDate,
  parseIsoDate,
  toIsoDate,
};
