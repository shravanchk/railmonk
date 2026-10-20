// Reads an IRCTC e-ticket (the ERS PDF's text layer) or a booking SMS into one
// ticket shape, entirely on the device.
//
// Two ERS layouts are in circulation and both are read: the current one, where
// labels sit in a header row with the values on the row below ("Booked From |
// Boarding At | To", "PNR | Train No./Name | Class"), and the older one, where
// every field is "Label : value". The PDF side (utils/pdfLines.js) rebuilds the
// page as lines and marks column gaps with two or more spaces, which is what
// lets a header row be paired with its value row here.
//
// The parser reports only what is printed. Anything it cannot find goes in
// `missing` rather than being guessed, and the page asks for it instead. Quota
// is the one that matters most: an SMS often does not say Tatkal, and a Tatkal
// refund is nothing like a general one, so an unknown quota is never assumed
// to be general.
//
// Pure functions, CommonJS, like every engine, so `node --test` can run them.

const CLASS_CODES = ['1A', '2A', '3A', '3E', 'SL', 'CC', 'EC', '2S', 'FC', 'EA', 'EV', 'VS'];

// Booking classes → the charge class the cancellation engine knows. The refund
// rules group CC and 3E with 3A, and EC with 1A. EA (Executive Anubhuti) is an
// executive chair car. FC, EV and VS are left out on purpose: their charges are
// not in the engine, and a figure we cannot source is worse than none.
const CHARGE_CLASS = { '1A': '1A', EC: '1A', EA: '1A', '2A': '2A', '3A': '3A', '3E': '3A', CC: '3A', SL: 'SL', '2S': '2S' };

const AC_CLASSES = new Set(['1A', '2A', '3A', '3E', 'CC', 'EC', 'EA', 'EV', 'VS']);

// Codes as IRCTC prints them in brackets after the quota name.
const QUOTAS = {
  GN: { label: 'General', tatkal: false },
  TQ: { label: 'Tatkal', tatkal: true },
  PT: { label: 'Premium Tatkal', tatkal: true },
  LD: { label: 'Ladies', tatkal: false },
  SS: { label: 'Lower Berth / Senior Citizen', tatkal: false },
  HP: { label: 'Divyaang', tatkal: false },
  DF: { label: 'Defence', tatkal: false },
  FT: { label: 'Foreign Tourist', tatkal: false },
  YU: { label: 'Yuva', tatkal: false },
  HO: { label: 'Headquarters / High Official', tatkal: false },
  DP: { label: 'Duty Pass', tatkal: false },
  PH: { label: 'Parliament House', tatkal: false },
};

// Quota names when the code is missing, longest first so "PREMIUM TATKAL" wins over "TATKAL".
const QUOTA_WORDS = [
  ['PREMIUM TATKAL', 'PT'],
  ['TATKAL', 'TQ'],
  ['GENERAL', 'GN'],
  ['LADIES', 'LD'],
  ['LOWER BERTH', 'SS'],
  ['SENIOR CITIZEN', 'SS'],
  ['FOREIGN TOURIST', 'FT'],
  ['DEFENCE', 'DF'],
  ['YUVA', 'YU'],
];

// Class names when the code is missing. Order matters: "AC 3 ECONOMY" before "AC 3".
const CLASS_WORDS = [
  [/EXEC(?:UTIVE)?\.?\s*ANUBHUTI/, 'EA'],
  [/EXEC(?:UTIVE)?\.?\s*CHAIR\s*CAR/, 'EC'],
  [/AC\s*CHAIR\s*CAR|\bCHAIR\s*CAR/, 'CC'],
  [/AC\s*3\s*ECONOMY|3\s*AC\s*ECONOMY/, '3E'],
  [/AC\s*3\s*TIER|THIRD\s*AC|3\s*TIER\s*AC/, '3A'],
  [/AC\s*2\s*TIER|SECOND\s*AC|2\s*TIER\s*AC/, '2A'],
  [/AC\s*FIRST|FIRST\s*AC|FIRST\s*CLASS\s*AC/, '1A'],
  [/SLEEPER/, 'SL'],
  [/SECOND\s*SITTING|SECOND\s*CLASS\s*SITTING/, '2S'],
  [/FIRST\s*CLASS/, 'FC'],
];

// Words that make a "( XX )" a class rather than, say, a station code.
const CLASS_HINT = /AC|SLEEPER|SITTING|CHAIR|CLASS|TIER|FIRST|ECONOMY|ANUBHUTI|VISTADOME/;

const MONTHS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };

const DATE_SRC = String.raw`(\d{1,2}[-/.](?:\d{1,2}|[A-Za-z]{3,9})[-/.]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9},?\s+\d{4}|\d{1,2}[A-Za-z]{3}\d{2,4})`;
const TIME_SRC = String.raw`\b([01]?\d|2[0-3]):([0-5]\d)\b`;

const pad = (n) => String(n).padStart(2, '0');

/** "15-Nov-2026", "15/11/2026", "15-11-26", "15Nov26", "15 November 2026" → "2026-11-15". */
const parseDate = (raw) => {
  const s = String(raw || '').trim().toUpperCase();
  let d;
  let m;
  let y;
  let match;
  if ((match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s))) {
    [, y, m, d] = match.map(Number);
  } else if ((match = /^(\d{1,2})[-/. ]+([A-Z]{3,9})[-/., ]+(\d{2,4})$/.exec(s)) || (match = /^(\d{1,2})([A-Z]{3})(\d{2,4})$/.exec(s))) {
    d = Number(match[1]);
    m = MONTHS[match[2].slice(0, 3)];
    y = Number(match[3]);
  } else if ((match = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/.exec(s))) {
    [, d, m, y] = match.map(Number);
  } else {
    return null;
  }
  if (y < 100) y += 2000;
  if (!m || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCMonth() !== m - 1) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
};

/** Pull a date and a time out of a cell, in either order. */
const dateTimeIn = (value) => {
  const s = String(value || '');
  const date = new RegExp(DATE_SRC).exec(s);
  const time = new RegExp(TIME_SRC).exec(s);
  return {
    date: date ? parseDate(date[1]) : null,
    time: time ? `${pad(time[1])}:${time[2]}` : null,
  };
};

const amount = (raw) => {
  if (raw == null) return null;
  const n = Number(String(raw).replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};

const normalise = (text) =>
  String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u00a0\u2007\u202f]/g, ' ')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    // The rupee sign comes out of IRCTC's fonts as ₹, as a stray glyph, or not
    // at all. Amounts are found by their labels, so it is dropped everywhere.
    .replace(/₹/g, ' ')
    .replace(/[ \t]+$/gm, '');

// ── Stations, class, quota ──────────────────────────────────────────────────

/** "NEW DELHI (NDLS)", "NEW DELHI - NDLS" or "NDLS" → { name, code }. */
const parseStation = (raw) => {
  const s = String(raw || '').trim().toUpperCase();
  if (!s) return null;
  let m = /^(.*?)\s*\(\s*([A-Z]{1,5})\s*\)/.exec(s);
  if (m) return { name: m[1].replace(/\s+/g, ' ').trim() || m[2], code: m[2] };
  m = /^([A-Z][A-Z .'&]*?)\s+-\s+([A-Z]{2,5})$/.exec(s);
  if (m) return { name: m[1].trim(), code: m[2] };
  if (/^[A-Z]{2,5}$/.test(s)) return { name: s, code: s };
  return null;
};

const STATION_IN_LINE = /([A-Z][A-Z .'&-]*?)\s*\(\s*([A-Z]{1,5})\s*\)/g;

const classFrom = (raw) => {
  const s = String(raw || '').toUpperCase();
  const coded = /\(\s*(1A|2A|3A|3E|SL|CC|EC|2S|FC|EA|EV|VS)\s*\)/.exec(s);
  if (coded) return coded[1];
  const bare = /^\s*(1A|2A|3A|3E|SL|CC|EC|2S|FC|EA|EV|VS)\s*$/.exec(s);
  if (bare) return bare[1];
  const word = CLASS_WORDS.find(([re]) => re.test(s));
  return word ? word[1] : null;
};

const quotaFrom = (raw) => {
  const s = String(raw || '').toUpperCase();
  const coded = /\(\s*([A-Z]{2})\s*\)/.exec(s);
  if (coded && QUOTAS[coded[1]]) return coded[1];
  const bare = /^\s*([A-Z]{2})\s*$/.exec(s);
  if (bare && QUOTAS[bare[1]]) return bare[1];
  const word = QUOTA_WORDS.find(([w]) => s.includes(w));
  return word ? word[1] : null;
};

const quotaRecord = (code) => (code && QUOTAS[code] ? { code, ...QUOTAS[code] } : null);

// ── Passenger status ────────────────────────────────────────────────────────

const BERTH = String.raw`SIDE\s+LOWER|SIDE\s+UPPER|SIDE\s+MIDDLE|LOWER|MIDDLE|UPPER|WINDOW(?:\s+SIDE)?|AISLE|NO\s+CHOICE|LB|MB|UB|SL|SU|SM|WS|NC`;
const COACH = String.raw`([A-Z]{1,3}\d{1,2})\s*[/ ,]\s*(\d{1,3})(?:\s*[/ ,]\s*(${BERTH})\b)?`;
const SEP = String.raw`(?:\s*/\s*|\s+)`;

// Sticky patterns, tried in order at each position of a status cell.
const STATUS_PATTERNS = [
  { kind: 'CNF', re: new RegExp(String.raw`(?:CNF|CONFIRMED)\b(?:${SEP}${COACH})?`, 'iy') },
  { kind: 'RAC', re: new RegExp(String.raw`RAC(?:${SEP}(?:RAC\s*)?(?:${COACH}|(\d{1,4})\b))`, 'iy') },
  { kind: 'WL', re: /((?:GN|PQ|RL|RS|RQ|TQ|PT|CK|LD|SS|HP|DF|FT|YU)?WL)(?:\s*\/\s*|\s+)?(\d{1,4})\b/iy },
  { kind: 'CAN', re: /(?:CAN|CANCELLED|CANCELED)\b/iy },
  { kind: 'OTHER', re: /(NOSB|NR|MOD)\b/iy },
  // A bare coach and berth ("B4/23", "S5 33 LB") is a confirmed berth.
  { kind: 'CNF', re: new RegExp(COACH, 'iy') },
];

const berthType = (raw) => (raw ? raw.toUpperCase().replace(/\s+/g, ' ') : null);

const buildStatus = (kind, m) => {
  const raw = m[0].replace(/\s+/g, ' ').trim().toUpperCase();
  if (kind === 'CNF') {
    // The CNF pattern's coach groups start at 1; the bare-coach pattern's too.
    return { kind, coach: m[1] ? m[1].toUpperCase() : null, berth: m[2] ? Number(m[2]) : null, berthType: berthType(m[3]), raw };
  }
  if (kind === 'RAC') {
    return {
      kind,
      coach: m[1] ? m[1].toUpperCase() : null,
      berth: m[2] ? Number(m[2]) : null,
      berthType: berthType(m[3]),
      number: m[4] ? Number(m[4]) : null,
      raw,
    };
  }
  if (kind === 'WL') return { kind, list: m[1].toUpperCase(), number: Number(m[2]), raw };
  if (kind === 'OTHER') return { kind, code: m[1].toUpperCase(), raw };
  return { kind, raw };
};

/**
 * Every status in a cell, in order. "CNF/B4/23/LOWER  CNF/B4/23/LOWER" gives
 * two; "WL/12 RAC 4" gives two. Anything unrecognised is stepped over.
 */
const parseStatuses = (text) => {
  const s = String(text || '');
  const out = [];
  let p = 0;
  while (p < s.length) {
    if (/[\s/,|-]/.test(s[p])) {
      p += 1;
      continue;
    }
    let matched = false;
    for (const { kind, re } of STATUS_PATTERNS) {
      re.lastIndex = p;
      const m = re.exec(s);
      if (m && m[0]) {
        out.push(buildStatus(kind, m));
        p = re.lastIndex;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const next = s.slice(p).search(/[\s/,]/);
      p = next === -1 ? s.length : p + next;
    }
  }
  return out;
};

const parseStatus = (text) => parseStatuses(text)[0] || null;

// ── ERS (PDF) ───────────────────────────────────────────────────────────────

// Labels as printed, mapped to the field they fill. Header-row matching and
// "Label : value" matching both read from this list.
const LABELS = [
  ['booked from', 'from'],
  ['from', 'from'],
  ['boarding at', 'boarding'],
  ['boarding station', 'boarding'],
  ['to', 'to'],
  ['reservation upto', 'to'],
  ['reservation up to', 'to'],
  ['pnr', 'pnr'],
  ['pnr no', 'pnr'],
  ['pnr no.', 'pnr'],
  ['pnr number', 'pnr'],
  ['train no./name', 'train'],
  ['train no. / name', 'train'],
  ['train no. & name', 'train'],
  ['train no & name', 'train'],
  ['train number / name', 'train'],
  ['class', 'class'],
  ['quota', 'quota'],
  ['distance', 'distance'],
  ['booking date', 'bookingDate'],
  ['date of booking', 'bookingDate'],
  ['start date', 'startDate'],
  ['departure', 'departure'],
  ['scheduled departure', 'departure'],
  ['arrival', 'arrival'],
  ['scheduled arrival', 'arrival'],
  ['date of journey', 'journeyDate'],
  ['date of boarding', 'boardingDate'],
  ['transaction id', 'transactionId'],
];

const LABEL_INDEX = new Map(LABELS);

const labelKey = (cell) =>
  String(cell || '')
    .toLowerCase()
    .replace(/[*:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/&]/g, '\\$&');

const cellsOf = (line) =>
  line
    .split(/\s{2,}|\t/)
    .map((c) => c.trim())
    .filter(Boolean);

/**
 * Fields from header rows: a line made only of known labels, followed by a
 * line with the same number of cells, pairs up column by column.
 */
const headerRowFields = (lines) => {
  const fields = {};
  lines.forEach((line, i) => {
    const heads = cellsOf(line);
    if (heads.length < 2 || !heads.every((h) => LABEL_INDEX.has(labelKey(h)))) return;
    const next = lines.slice(i + 1).find((l) => l.trim());
    if (!next) return;
    const values = cellsOf(next);
    if (values.length !== heads.length) return;
    heads.forEach((h, j) => {
      const field = LABEL_INDEX.get(labelKey(h));
      if (!fields[field]) fields[field] = values[j];
    });
  });
  return fields;
};

// "Label : value" (any label) and "Label* value" (the starred ones on the
// current ERS). A value runs to the next column gap or the end of the line.
const INLINE_PATTERNS = LABELS.map(([label, field]) => ({
  field,
  re: new RegExp(String.raw`(?:^|[\s(])${escapeRe(label).replace(/ /g, '\\s+')}\s*(?:\*\s*:?|:)[ \t]*(.+?)(?=\s{2,}|\t|$)`, 'im'),
}));

const inlineFields = (text) => {
  const fields = {};
  for (const { field, re } of INLINE_PATTERNS) {
    if (fields[field]) continue;
    const m = re.exec(text);
    if (m && m[1].trim()) fields[field] = m[1].trim();
  }
  return fields;
};

/** Station row of the current ERS: three "NAME (CODE)" cells under the header. */
const stationRow = (lines) => {
  const i = lines.findIndex((l) => /booked\s+from/i.test(l) && /boarding\s+at/i.test(l));
  if (i === -1) return null;
  const next = lines.slice(i + 1, i + 3).find((l) => /\(\s*[A-Z]{1,5}\s*\)/.test(l.toUpperCase()));
  if (!next) return null;
  const found = [...next.toUpperCase().matchAll(STATION_IN_LINE)].map((m) => ({ name: m[1].replace(/\s+/g, ' ').trim(), code: m[2] }));
  if (found.length === 3) return { from: found[0], boarding: found[1], to: found[2] };
  if (found.length === 2) return { from: found[0], boarding: found[0], to: found[1] };
  return null;
};

const PASSENGER_LINE = /^\s*(\d{1,2})[.)]?\s+([A-Z][A-Za-z .'-]*?)\s+(\d{1,3})\s+(MALE|FEMALE|TRANSGENDER|M|F|T)\b(.*)$/i;

const ersPassengers = (lines) => {
  const out = [];
  for (const line of lines) {
    const m = PASSENGER_LINE.exec(line);
    if (!m) continue;
    const statuses = parseStatuses(m[5]);
    if (!statuses.length) continue;
    out.push({
      serial: Number(m[1]),
      name: m[2].replace(/\s+/g, ' ').trim().toUpperCase(),
      age: Number(m[3]),
      gender: m[4][0].toUpperCase(),
      booking: statuses[0],
      current: statuses[1] || null,
    });
  }
  return out;
};

const firstMatch = (text, re) => {
  const m = re.exec(text);
  return m ? m[1] : null;
};

const parseErs = (text) => {
  const lines = text.split('\n');
  const f = { ...inlineFields(text), ...headerRowFields(lines) };

  const pnr =
    firstMatch(f.pnr || '', /(\d{10})/) ||
    firstMatch(text, /PNR[^0-9\n]{0,24}(\d{10})\b/i) ||
    firstMatch(text, /PNR[\s\S]{0,160}?\b(\d{10})\b/i);

  let train = null;
  const trainCell = f.train || firstMatch(text, /\b(\d{5}\s*\/\s*[A-Z][A-Z0-9 .'()-]{2,40}?)(?=\s{2,}|\t|$)/m);
  if (trainCell) {
    const m = /(\d{5})\s*[/-]?\s*(.*)$/.exec(trainCell.trim());
    if (m) train = { number: m[1], name: m[2].replace(/\s+/g, ' ').trim().toUpperCase() || null };
  }

  let classCode = classFrom(f.class);
  if (!classCode) {
    const coded = [...text.toUpperCase().matchAll(/([A-Z][A-Z0-9 .]{1,30}?)\s*\(\s*(1A|2A|3A|3E|SL|CC|EC|2S|FC|EA|EV|VS)\s*\)/g)].find((m) =>
      CLASS_HINT.test(m[1])
    );
    if (coded) classCode = coded[2];
  }

  let quotaCode = quotaFrom(f.quota);
  if (!quotaCode) {
    // Only a quota name next to its code counts outside the Quota field: the
    // ERS small print mentions Tatkal whatever the ticket is.
    const coded = /\b(GENERAL|TATKAL|PREMIUM\s+TATKAL|LADIES|LOWER\s+BERTH|SENIOR\s+CITIZEN|FOREIGN\s+TOURIST|DEFENCE|YUVA)\s*\(\s*([A-Z]{2})\s*\)/i.exec(text);
    if (coded && QUOTAS[coded[2].toUpperCase()]) quotaCode = coded[2].toUpperCase();
  }

  const row = stationRow(lines);
  const from = (row && row.from) || parseStation(f.from);
  const boarding = (row && row.boarding) || parseStation(f.boarding) || from;
  const to = (row && row.to) || parseStation(f.to);

  const dep = dateTimeIn(f.departure);
  const arr = dateTimeIn(f.arrival);
  const startDate = dateTimeIn(f.startDate).date || dateTimeIn(f.journeyDate).date;
  const departure = {
    date: dep.date || dateTimeIn(f.boardingDate).date || dateTimeIn(f.journeyDate).date || startDate,
    time: dep.time,
  };

  const passengers = ersPassengers(lines);
  const fare = {
    ticket: amount(firstMatch(text, /Ticket\s+Fare[^0-9\n]{0,24}([\d,]+(?:\.\d{1,2})?)/i)),
    convenience: amount(firstMatch(text, /Convenience\s+Fee[^0-9\n]{0,40}([\d,]+(?:\.\d{1,2})?)/i)),
    insurance: amount(firstMatch(text, /Insurance[^0-9\n]{0,40}([\d,]+\.\d{1,2})/i)),
    total: amount(firstMatch(text, /Total\s+Fare[^0-9\n]{0,40}([\d,]+(?:\.\d{1,2})?)/i)),
  };

  return {
    source: 'ers',
    pnr,
    train,
    classCode,
    quota: quotaRecord(quotaCode) || inferQuota(passengers),
    from,
    boarding,
    to,
    startDate,
    departure,
    arrival: arr.date || arr.time ? arr : null,
    distanceKm: Number(firstMatch(f.distance || text, /(\d{1,4})\s*KM\b/i)) || null,
    fare,
    passengers,
  };
};

// ── SMS ─────────────────────────────────────────────────────────────────────

const looksLikeSms = (text) => /\bPNR\s*[:-]\s*\d{10}/i.test(text) && /\b(?:TRN|DOJ)\s*[:-]/i.test(text);

// SMS tokens that are never a passenger name.
const SMS_KEYWORDS = /^(?:PNR|TRN|DOJ|DP|DEP|ARR|FARE|SC|BOARDING|CHART|BEWARE|IRCTC|PG|TQ|GN|PT|TATKAL|GENERAL)\b/i;

const parseSms = (text) => {
  const flat = text.replace(/\n/g, ',');
  const tokens = flat.split(',').map((t) => t.trim()).filter(Boolean);

  const pnr = firstMatch(text, /PNR\s*[:-]\s*(\d{10})/i);
  const trainNo = firstMatch(text, /TRN\s*[:-]\s*(\d{5})/i);
  const trainName = firstMatch(text, /TRN\s*[:-]\s*\d{5}\s*[/ ]\s*([A-Z][A-Z .'-]{2,40}?)(?=,|\n|$)/i);
  const doj = parseDate(firstMatch(text, new RegExp(String.raw`DOJ\s*[:-]\s*${DATE_SRC}`, 'i')));
  const depTime = firstMatch(text, /\b(?:DP|DEP|DEPT|DEPARTURE)\s*[:-]\s*(\d{1,2}:\d{2})/i);
  const arrTime = firstMatch(text, /\b(?:AR|ARR|ARRIVAL)\s*[:-]\s*(\d{1,2}:\d{2})/i);

  const classToken = tokens.find((t) => CLASS_CODES.includes(t.toUpperCase()));
  const routeToken = tokens.find((t) => /^[A-Z]{2,5}\s*-\s*[A-Z]{2,5}$/i.test(t));
  const route = routeToken ? routeToken.toUpperCase().split(/\s*-\s*/) : null;
  const boardingCode = firstMatch(text, /Boarding\s+at\s+([A-Z]{2,5})\b/i);
  const quotaToken = tokens.find((t) => /^(?:TQ|PT|GN|LD|SS|TATKAL|PREMIUM TATKAL|GENERAL)$/i.test(t));

  // The lead passenger: "RAHUL SHARMA+1" (plus one more) or a bare name, in
  // the token after the route and timing fields.
  let lead = null;
  let extra = 0;
  let leadIndex = -1;
  tokens.forEach((t, i) => {
    if (lead !== null) return;
    const plus = /^([A-Z][A-Z .']{1,40}?)\s*\+\s*(\d{1,2})$/i.exec(t);
    if (plus) {
      lead = plus[1].trim().toUpperCase();
      extra = Number(plus[2]);
      leadIndex = i;
    }
  });
  if (lead === null) {
    const i = tokens.findIndex(
      (t, idx) =>
        idx > 0 &&
        /^[A-Z][A-Z .']{2,40}$/i.test(t) &&
        !SMS_KEYWORDS.test(t) &&
        !CLASS_CODES.includes(t.toUpperCase()) &&
        !/^Boarding/i.test(t) &&
        parseStatuses(t).length === 0
    );
    if (i !== -1) {
      lead = tokens[i].trim().toUpperCase();
      leadIndex = i;
    }
  }

  // Statuses run from the passenger token to the fare. "P1-B4,23,LB" style
  // prefixes are stripped so berths read the same as "B4 23".
  const startAt = leadIndex === -1 ? 0 : leadIndex + 1;
  const fareAt = tokens.findIndex((t, i) => i >= startAt && /^(?:Fare|SC)\b/i.test(t));
  const statusText = tokens
    .slice(startAt, fareAt === -1 ? undefined : fareAt)
    .filter((t) => !/^(?:Boarding|DP|DEP|DOJ|TRN|PNR)\b/i.test(t))
    .join(' ')
    .replace(/\bP\d{1,2}\s*[-:]\s*/gi, ' ');
  const statuses = leadIndex === -1 && !/\bP\d/i.test(flat) ? [] : parseStatuses(statusText);

  const count = Math.max(statuses.length, lead !== null ? 1 + extra : 0);
  const passengers = Array.from({ length: count }, (_, i) => ({
    serial: i + 1,
    name: i === 0 ? lead : null,
    age: null,
    gender: null,
    booking: statuses[i] || statuses[statuses.length - 1] || null,
    current: null,
  })).filter((p) => p.booking);

  const fromCode = route ? route[0] : null;
  const toCode = route ? route[1] : null;
  const st = (code) => (code ? { name: code, code } : null);

  return {
    source: 'sms',
    pnr,
    train: trainNo ? { number: trainNo, name: trainName ? trainName.trim().toUpperCase() : null } : null,
    classCode: classToken ? classToken.toUpperCase() : null,
    quota: quotaRecord(quotaFrom(quotaToken)) || inferQuota(passengers),
    from: st(fromCode),
    boarding: st(boardingCode || fromCode),
    to: st(toCode),
    startDate: null,
    departure: { date: doj, time: depTime ? `${pad(depTime.split(':')[0])}:${depTime.split(':')[1]}` : null },
    arrival: arrTime ? { date: null, time: `${pad(arrTime.split(':')[0])}:${arrTime.split(':')[1]}` } : null,
    distanceKm: null,
    fare: {
      ticket: amount(firstMatch(text, /Fare\s*[:-]?\s*(?:Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i)),
      convenience: amount(firstMatch(text, /\bSC\s*[:-]\s*([\d,]+(?:\.\d{1,2})?)/i)),
      insurance: null,
      total: null,
    },
    passengers,
  };
};

// ── Shared ──────────────────────────────────────────────────────────────────

/** A Tatkal waitlist (TQWL, or CKWL on older tickets) proves the quota. */
function inferQuota(passengers) {
  const lists = passengers.flatMap((p) => [p.booking, p.current]).filter((s) => s && s.kind === 'WL').map((s) => s.list);
  if (lists.some((l) => l === 'TQWL' || l === 'CKWL')) return { code: 'TQ', ...QUOTAS.TQ, inferred: true };
  if (lists.some((l) => l === 'PTWL')) return { code: 'PT', ...QUOTAS.PT, inferred: true };
  return null;
}

/** The status that decides the refund: current if printed, else as booked. */
const effectiveStatus = (passenger) => (passenger && (passenger.current || passenger.booking)) || null;

const REQUIRED = [
  ['departureDate', (t) => t.departure && t.departure.date],
  ['departureTime', (t) => t.departure && t.departure.time],
  ['classCode', (t) => t.classCode],
  ['quota', (t) => t.quota],
  ['fare', (t) => t.fare && t.fare.ticket],
  ['passengers', (t) => t.passengers && t.passengers.length],
];

/**
 * Parse ERS text or an SMS. Returns null when the text is not a ticket at all
 * (no PNR and no train), so the page can say so instead of showing a blank card.
 */
const parseTicketText = (input) => {
  const text = normalise(input);
  if (!text.trim()) return null;
  const ticket = looksLikeSms(text) ? parseSms(text) : parseErs(text);
  if (!ticket.pnr && !ticket.train) return null;
  ticket.missing = REQUIRED.filter(([, has]) => !has(ticket)).map(([key]) => key);
  return ticket;
};

module.exports = {
  CLASS_CODES,
  CHARGE_CLASS,
  AC_CLASSES,
  QUOTAS,
  parseDate,
  parseStation,
  parseStatus,
  parseStatuses,
  parseTicketText,
  effectiveStatus,
  quotaRecord,
};
