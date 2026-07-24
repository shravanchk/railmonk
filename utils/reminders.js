// Calendar reminder builders.
//
// Railmonk is a static site, so a reminder we "send" would mean holding a
// mailing list and running a scheduler. A calendar event does the same job with
// none of that: it fires on the traveller's own phone, needs no account, and we
// never hold a single byte about them. These builders are the shared engine
// behind every "Set a reminder" button on the site.
//
// All input times are wall-clock IST (`YYYY-MM-DDTHH:MM`). IST is UTC+5:30 and
// has no daylight saving, so converting to a UTC instant is exact — and a
// UTC (`Z`) timestamp is the one form every calendar client reads correctly.

const IST_OFFSET_MINUTES = 5 * 60 + 30;

/** Parse a wall-clock IST `YYYY-MM-DDTHH:MM` into a real UTC instant. */
const istToUtc = (wallIso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(wallIso || '').trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const asUtc = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  const instant = new Date(asUtc - IST_OFFSET_MINUTES * 60 * 1000);
  return Number.isNaN(instant.getTime()) ? null : instant;
};

const pad = (n) => String(n).padStart(2, '0');

/** UTC instant → `20260724T143000Z`, the form ICS and Google Calendar expect. */
const toCompactUtc = (instant) =>
  `${instant.getUTCFullYear()}${pad(instant.getUTCMonth() + 1)}${pad(instant.getUTCDate())}` +
  `T${pad(instant.getUTCHours())}${pad(instant.getUTCMinutes())}${pad(instant.getUTCSeconds())}Z`;

const addMinutes = (instant, minutes) => new Date(instant.getTime() + minutes * 60 * 1000);

// RFC 5545 §3.3.11: backslash, semicolon and comma are escaped; newlines become \n.
const escapeIcsText = (value) =>
  String(value == null ? '' : value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

// RFC 5545 §3.1: content lines are folded at 75 octets with a leading space.
const foldLine = (line) => {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest.length) parts.push(` ${rest}`);
  return parts.join('\r\n');
};

/**
 * Build an RFC 5545 VEVENT with an optional alarm.
 *
 * @param {object} o
 * @param {string} o.title          Event summary.
 * @param {string} o.startWallIst   `YYYY-MM-DDTHH:MM` in IST.
 * @param {number} [o.durationMinutes=30]
 * @param {string} [o.description]
 * @param {string} [o.url]          Appended to the description; calendars vary on URL support.
 * @param {string} [o.location]
 * @param {number[]} [o.alarmMinutesBefore=[]]  One VALARM per entry.
 * @param {string} [o.uid]          Supply a stable id to make re-imports idempotent.
 * @returns {string|null} ICS document with CRLF line endings.
 */
const buildIcsEvent = ({
  title,
  startWallIst,
  durationMinutes = 30,
  description = '',
  url = '',
  location = '',
  alarmMinutesBefore = [],
  uid,
  stamp,
}) => {
  const start = istToUtc(startWallIst);
  if (!start || !title) return null;
  const end = addMinutes(start, Math.max(1, durationMinutes));
  const dtStamp = stamp ? new Date(stamp) : new Date();

  const body = description && url ? `${description}\n\n${url}` : description || url;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Railmonk//Rail reminders//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(uid || `${toCompactUtc(start)}-${Math.random().toString(36).slice(2, 10)}@railmonk.com`)}`,
    `DTSTAMP:${toCompactUtc(dtStamp)}`,
    `DTSTART:${toCompactUtc(start)}`,
    `DTEND:${toCompactUtc(end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
  ];
  if (body) lines.push(`DESCRIPTION:${escapeIcsText(body)}`);
  if (location) lines.push(`LOCATION:${escapeIcsText(location)}`);

  alarmMinutesBefore
    .filter((m) => Number.isFinite(m) && m > 0)
    .forEach((minutes) => {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeIcsText(title)}`,
        `TRIGGER:-PT${minutes}M`,
        'END:VALARM'
      );
    });

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(foldLine).join('\r\n');
};

/** Google Calendar "add event" URL for the same event shape. */
const buildGoogleCalendarUrl = ({ title, startWallIst, durationMinutes = 30, description = '', url = '', location = '' }) => {
  const start = istToUtc(startWallIst);
  if (!start || !title) return null;
  const end = addMinutes(start, Math.max(1, durationMinutes));
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toCompactUtc(start)}/${toCompactUtc(end)}`,
  });
  const body = description && url ? `${description}\n\n${url}` : description || url;
  if (body) params.set('details', body);
  if (location) params.set('location', location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/** Outlook.com "compose event" deep link. */
const buildOutlookCalendarUrl = ({ title, startWallIst, durationMinutes = 30, description = '', url = '', location = '' }) => {
  const start = istToUtc(startWallIst);
  if (!start || !title) return null;
  const end = addMinutes(start, Math.max(1, durationMinutes));
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  });
  const body = description && url ? `${description}\n\n${url}` : description || url;
  if (body) params.set('body', body);
  if (location) params.set('location', location);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/** Browser-only: trigger a download of an ICS document. */
const downloadIcs = (icsText, filename = 'railmonk-reminder.ics') => {
  if (typeof window === 'undefined' || !icsText) return false;
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Revoke on the next tick so Safari has finished reading the blob.
  setTimeout(() => URL.revokeObjectURL(href), 0);
  return true;
};

module.exports = {
  IST_OFFSET_MINUTES,
  istToUtc,
  toCompactUtc,
  escapeIcsText,
  buildIcsEvent,
  buildGoogleCalendarUrl,
  buildOutlookCalendarUrl,
  downloadIcs,
};
