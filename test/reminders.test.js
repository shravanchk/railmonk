const test = require('node:test');
const assert = require('node:assert/strict');
const {
  istToUtc,
  toCompactUtc,
  escapeIcsText,
  buildIcsEvent,
  buildGoogleCalendarUrl,
  buildOutlookCalendarUrl,
} = require('../utils/reminders');

const EVENT = {
  title: 'IRCTC booking opens',
  startWallIst: '2026-09-22T08:00',
  durationMinutes: 30,
  uid: 'test-uid@railmonk.com',
  stamp: '2026-07-24T00:00:00Z',
};

test('IST wall clock converts to the correct UTC instant', () => {
  assert.equal(istToUtc('2026-09-22T08:00').toISOString(), '2026-09-22T02:30:00.000Z');
  // Early-morning IST times fall on the previous UTC day.
  assert.equal(istToUtc('2026-09-22T04:00').toISOString(), '2026-09-21T22:30:00.000Z');
});

test('malformed wall-clock input yields null, never an Invalid Date', () => {
  assert.equal(istToUtc(''), null);
  assert.equal(istToUtc('2026-09-22 08:00'), null);
  assert.equal(istToUtc('22-09-2026T08:00'), null);
  assert.equal(istToUtc(undefined), null);
});

test('compact UTC stamps are the form ICS and Google expect', () => {
  assert.equal(toCompactUtc(istToUtc('2026-09-22T08:00')), '20260922T023000Z');
});

test('ICS text escaping follows RFC 5545', () => {
  assert.equal(escapeIcsText('Tatkal; AC, 10 AM'), 'Tatkal\\; AC\\, 10 AM');
  assert.equal(escapeIcsText('line one\nline two'), 'line one\\nline two');
  assert.equal(escapeIcsText('back\\slash'), 'back\\\\slash');
});

test('a built event carries the required VEVENT properties and CRLF endings', () => {
  const ics = buildIcsEvent(EVENT);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR'));
  assert.ok(ics.includes('\r\n'));
  assert.ok(!/[^\r]\n/.test(ics), 'every LF must be preceded by CR');
  assert.ok(ics.includes('DTSTART:20260922T023000Z'));
  assert.ok(ics.includes('DTEND:20260922T030000Z'));
  assert.ok(ics.includes('SUMMARY:IRCTC booking opens'));
  assert.ok(ics.includes('UID:test-uid@railmonk.com'));
  assert.ok(ics.includes('DTSTAMP:20260724T000000Z'));
});

test('alarms are emitted one VALARM per lead time, and non-positive leads are dropped', () => {
  const ics = buildIcsEvent({ ...EVENT, alarmMinutesBefore: [1440, 15, 0, -5, NaN] });
  const alarms = ics.split('BEGIN:VALARM').length - 1;
  assert.equal(alarms, 2);
  assert.ok(ics.includes('TRIGGER:-PT1440M'));
  assert.ok(ics.includes('TRIGGER:-PT15M'));
});

test('long descriptions are folded to 75 octets with continuation lines', () => {
  const ics = buildIcsEvent({ ...EVENT, description: 'x'.repeat(400) });
  const lines = ics.split('\r\n');
  lines.forEach((line) => assert.ok(line.length <= 75, `line too long: ${line.length}`));
  // Folded continuations are marked by a single leading space.
  assert.ok(lines.some((l) => l.startsWith(' x')));
});

test('a missing title or start time produces no event at all', () => {
  assert.equal(buildIcsEvent({ ...EVENT, title: '' }), null);
  assert.equal(buildIcsEvent({ ...EVENT, startWallIst: 'nonsense' }), null);
  assert.equal(buildGoogleCalendarUrl({ ...EVENT, startWallIst: '' }), null);
  assert.equal(buildOutlookCalendarUrl({ ...EVENT, title: '' }), null);
});

test('Google Calendar URL encodes the UTC window and details', () => {
  const url = new URL(buildGoogleCalendarUrl({ ...EVENT, description: 'Sleeper, Tatkal', url: 'https://railmonk.com/' }));
  assert.equal(url.origin + url.pathname, 'https://calendar.google.com/calendar/render');
  assert.equal(url.searchParams.get('dates'), '20260922T023000Z/20260922T030000Z');
  assert.equal(url.searchParams.get('text'), 'IRCTC booking opens');
  assert.ok(url.searchParams.get('details').includes('https://railmonk.com/'));
});

test('Outlook URL uses ISO instants for start and end', () => {
  const url = new URL(buildOutlookCalendarUrl(EVENT));
  assert.equal(url.searchParams.get('startdt'), '2026-09-22T02:30:00.000Z');
  assert.equal(url.searchParams.get('enddt'), '2026-09-22T03:00:00.000Z');
});

test('duration is clamped to at least a minute so DTEND never precedes DTSTART', () => {
  const ics = buildIcsEvent({ ...EVENT, durationMinutes: 0 });
  assert.ok(ics.includes('DTEND:20260922T023100Z'));
});
