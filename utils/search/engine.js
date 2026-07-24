// Client-side search over the site's own content. Deliberately no search
// library: the corpus is a few dozen short documents, so an inverted index and
// its runtime would cost far more bytes than they save.
//
// What the engine does buy us is tolerance. Real queries are things like
// "wht time tatkal opens", "60 day rule", "paisa wapas", "GNWL" — none of which
// is a substring of any title on the site. So a query term matches if it is:
//
//   1. the same word after normalising, expanding aliases and light stemming,
//   2. a prefix of a word we hold ("cancel" → "cancellation"), or
//   3. within a small edit distance of one ("tatkl" → "tatkal").
//
// Both the documents and the query go through the identical pipeline, so any
// alias mapping is consistent by construction — the map only has to be
// internally coherent, not "correct".

const DIACRITICS = /[\u0300-\u036f]/g;

/** Lowercase, strip accents and punctuation, collapse to single spaces. */
const normalize = (text) =>
  String(text ?? '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Multi-word forms folded to a single canonical token before tokenising, so
// "waiting list" and "waitlist" are the same query. Longest first — the
// replacements run in order and must not eat each other's input.
const PHRASES = [
  ['advance reservation period', 'arp'],
  ['reservation against cancellation', 'rac'],
  ['ticket deposit receipt', 'tdr'],
  ['travel deposit receipt', 'tdr'],
  ['passenger name record', 'pnr'],
  ['waiting list', 'waitlist'],
  ['wait list', 'waitlist'],
  ['reservation chart', 'chart'],
  ['seat number', 'berth'],
  ['first ac', '1a'],
  ['second ac', '2a'],
  ['third ac', '3a'],
  ['sleeper class', 'sl'],
  ['chair car', 'cc'],
  ['executive class', 'ec'],
  ['second sitting', '2s'],
  ['e ticket', 'eticket'],
];

const PHRASE_PATTERNS = PHRASES.map(([from, to]) => [
  new RegExp(`\\b${from.replace(/ /g, '\\s+')}\\b`, 'g'),
  to,
]);

// Single-token aliases. Kept conservative: an alias is only worth adding when
// the two words genuinely name the same thing to a traveller. Codes like GNWL
// or TQWL are NOT folded into "waitlist" — they are more specific than it, and
// live in the per-page keywords instead.
const SYNONYMS = {
  cancel: 'cancellation',
  cancelling: 'cancellation',
  cancelation: 'cancellation',
  reservation: 'booking',
  reserve: 'booking',
  reserving: 'booking',
  book: 'booking',
  bookings: 'booking',
  wl: 'waitlist',
  waitlisted: 'waitlist',
  waitinglist: 'waitlist',
  fee: 'charge',
  fees: 'charge',
  charges: 'charge',
  cost: 'fare',
  price: 'fare',
  pricing: 'fare',
  reimbursement: 'refund',
  money: 'refund',
  wapas: 'refund',
  paisa: 'refund',
  paise: 'refund',
  kitna: 'much',
  train: 'train',
  trains: 'train',
  coaches: 'coach',
  bogie: 'coach',
  seat: 'berth',
  seats: 'berth',
  bunk: 'berth',
  timing: 'time',
  timings: 'time',
  clock: 'time',
  notification: 'reminder',
  alert: 'reminder',
  alarm: 'reminder',
  calendar: 'reminder',
  premium: 'tatkal',
  quota: 'quota',
  senior: 'concession',
  discount: 'concession',
};

// Dropped from queries so "when does the tatkal window open" scores on
// "tatkal window open". If a query is nothing but stopwords we keep them.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'am',
  'i', 'my', 'me', 'we', 'you', 'your', 'it', 'its', 'they',
  'to', 'of', 'in', 'on', 'at', 'for', 'from', 'by', 'with', 'about',
  'and', 'or', 'but', 'if', 'so', 'than', 'then',
  'do', 'does', 'did', 'can', 'will', 'would', 'should', 'shall',
  'what', 'when', 'where', 'which', 'who', 'whom', 'how', 'why',
  'get', 'got', 'have', 'has', 'had', 'need', 'want',
  'this', 'that', 'these', 'those', 'there', 'here',
  'me', 'out', 'up', 'as', 'not', 'no',
]);

/**
 * Very light suffix stripping — plurals and the two commonest verb endings.
 * A real Porter stemmer is overkill here and mangles railway vocabulary
 * ("tatkal", "waitlist"); this only has to be applied identically on both
 * sides of the comparison.
 */
const stem = (token) => {
  if (token.length < 4) return token;
  if (/(ses|xes|zes|ches|shes)$/.test(token)) return token.slice(0, -2);
  if (/[^s]s$/.test(token)) return token.slice(0, -1);
  if (token.length > 6 && token.endsWith('ing')) return token.slice(0, -3);
  if (token.length > 5 && token.endsWith('ed')) return token.slice(0, -2);
  return token;
};

/** normalize → fold phrases → split → alias → stem. Used for docs and queries. */
const tokenize = (text) => {
  let canonical = normalize(text);
  if (!canonical) return [];
  for (const [pattern, replacement] of PHRASE_PATTERNS) {
    canonical = canonical.replace(pattern, replacement);
  }
  const tokens = [];
  for (const raw of canonical.split(' ')) {
    if (!raw) continue;
    const token = stem(SYNONYMS[raw] || raw);
    if (token) tokens.push(token);
  }
  return tokens;
};

/** Query tokens with stopwords removed — unless that would leave nothing. */
const queryTokens = (query) => {
  const all = tokenize(query);
  const meaningful = all.filter((t) => !STOPWORDS.has(t));
  return meaningful.length ? meaningful : all;
};

/**
 * Levenshtein distance, abandoned as soon as it cannot come in under `max`.
 * Two rolling rows rather than a full matrix.
 */
const editDistance = (a, b, max = Infinity) => {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    let rowBest = curr[0];
    for (let j = 1; j <= b.length; j += 1) {
      const substitution = prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, substitution);
      if (curr[j] < rowBest) rowBest = curr[j];
    }
    if (rowBest > max) return max + 1;
    const swap = prev;
    prev = curr;
    curr = swap;
  }
  return prev[b.length];
};

/** How much typo tolerance a term of this length earns. */
const fuzzyBudget = (length) => {
  if (length >= 8) return 2;
  if (length >= 5) return 1;
  return 0;
};

// Where a match was found matters more than how it was found: a hit in the
// title outranks a hit in the body no matter how exact the body hit was.
const FIELD_WEIGHTS = { title: 10, keywords: 7, category: 4, blurb: 3, body: 1.5 };
const FIELDS = Object.keys(FIELD_WEIGHTS);

// Match quality, independent of field.
const EXACT = 1;
const PREFIX = 0.78;
const CONTAINED = 0.6;
const FUZZY = 0.45;

const termScoreInField = (term, tokens) => {
  let best = 0;
  for (const token of tokens) {
    if (token === term) return EXACT;
    if (term.length >= 3 && token.startsWith(term)) best = Math.max(best, PREFIX);
    else if (token.length >= 4 && term.startsWith(token)) best = Math.max(best, CONTAINED);
  }
  if (best) return best;

  const budget = fuzzyBudget(term.length);
  if (!budget) return 0;
  for (const token of tokens) {
    if (Math.abs(token.length - term.length) > budget) continue;
    if (editDistance(term, token, budget) <= budget) return FUZZY;
  }
  return 0;
};

/**
 * Prepare documents once. Tokenising the whole corpus on every keystroke is
 * cheap at this size, but the index is built once and reused anyway.
 *
 * A document is `{ href, title, blurb, keywords[], body, category, ... }`.
 */
const createIndex = (documents) =>
  documents.map((doc) => ({
    doc,
    fields: {
      title: tokenize(doc.title),
      keywords: tokenize((doc.keywords || []).join(' ')),
      category: tokenize(doc.categoryLabel || doc.category || ''),
      blurb: tokenize(doc.blurb || ''),
      body: tokenize(doc.body || ''),
    },
    haystack: {
      title: normalize(doc.title),
      blurb: normalize(doc.blurb || ''),
      keywords: normalize((doc.keywords || []).join(' ')),
    },
  }));

const scoreEntry = (entry, terms, phrase) => {
  let score = 0;
  let matched = 0;

  for (const term of terms) {
    let bestForTerm = 0;
    for (const field of FIELDS) {
      const quality = termScoreInField(term, entry.fields[field]);
      if (quality) bestForTerm = Math.max(bestForTerm, quality * FIELD_WEIGHTS[field]);
    }
    if (bestForTerm) {
      matched += 1;
      score += bestForTerm;
    }
  }

  if (!matched) return { score: 0, coverage: 0 };

  // Whole-query hits: "berth position" landing on a page whose title contains
  // exactly that should beat a page that happens to hold both words apart.
  // Position inside the title matters too — for "tatkal", the Tatkal Charges
  // Calculator is a better answer than Booking & Tatkal Reminders.
  if (phrase.length >= 3) {
    if (entry.haystack.title === phrase) score += 40;
    else if (entry.haystack.title.startsWith(phrase)) score += 24;
    else if (entry.haystack.title.includes(phrase)) score += 16;
    else if (entry.haystack.keywords.includes(phrase)) score += 10;
    else if (entry.haystack.blurb.includes(phrase)) score += 5;
  }

  score += entry.doc.boost || 0;
  const coverage = matched / terms.length;
  return { score: score * coverage, coverage };
};

/**
 * Rank documents against a query.
 *
 * Two passes: results that match every query term first, and only if there are
 * none do we fall back to partial matches. A search that turns up something
 * loosely related beats a dead end, but it must never outrank an exact hit.
 */
const search = (index, query, { limit = 20, minCoverage = 0.5 } = {}) => {
  const terms = queryTokens(query);
  if (!terms.length) return [];
  const phrase = normalize(query);

  const full = [];
  const partial = [];

  for (const entry of index) {
    const { score, coverage } = scoreEntry(entry, terms, phrase);
    if (!score) continue;
    const hit = { ...entry.doc, score, coverage };
    if (coverage === 1) full.push(hit);
    else if (coverage >= minCoverage) partial.push(hit);
  }

  const ranked = (full.length ? full : partial).sort(
    (a, b) => b.score - a.score || a.title.localeCompare(b.title),
  );
  return ranked.slice(0, limit);
};

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Split `text` into `{ text, hit }` segments so the UI can mark what matched.
 * Works on the raw words of the query (not the stemmed tokens) — highlighting
 * "cancellation" when the user typed "cancel" is fine, highlighting a word they
 * never typed is confusing.
 */
const highlight = (text, query) => {
  const words = normalize(query).split(' ').filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  if (!words.length) return [{ text, hit: false }];

  const pattern = new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'ig');
  const segments = [];
  let last = 0;
  let match = pattern.exec(text);
  while (match) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index), hit: false });
    segments.push({ text: match[0], hit: true });
    last = match.index + match[0].length;
    match = pattern.exec(text);
  }
  if (last < text.length) segments.push({ text: text.slice(last), hit: false });
  return segments.length ? segments : [{ text, hit: false }];
};

module.exports = {
  normalize,
  tokenize,
  queryTokens,
  editDistance,
  createIndex,
  search,
  highlight,
};
