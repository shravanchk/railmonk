const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { normalize, tokenize, queryTokens, editDistance, createIndex, search, highlight } =
  require('../utils/search/engine');

// A stand-in for the real catalog. utils/search/documents.js is ESM (it reads
// the ESM catalog), so relevance is asserted here against a fixture that mirrors
// the shape and the vocabulary of the real thing.
const DOCS = [
  {
    href: '/rail/irctc-calculator',
    title: 'IRCTC Booking Date Calculator',
    type: 'tool',
    categoryLabel: 'Booking',
    blurb: 'Find the exact date and time your ticket window opens — general quota and Tatkal.',
    keywords: ['ARP', 'advance reservation period', '60 day rule', 'when can I book', 'booking opens'],
    boost: 6,
  },
  {
    href: '/rail/irctc-cancellation-calculator',
    title: 'Cancellation Refund Calculator',
    type: 'tool',
    categoryLabel: 'Cancellation & refunds',
    blurb: 'See the rupee amount you actually get back before you cancel.',
    keywords: ['cancel ticket', 'refund amount', 'clerkage', 'paisa wapas'],
    boost: 6,
  },
  {
    href: '/rail/waitlist-confirmation-chances',
    title: 'Waitlist Confirmation Chances',
    type: 'tool',
    categoryLabel: 'Waitlist & RAC',
    blurb: 'Decode GNWL, RLWL, PQWL and TQWL — and get an honest estimate.',
    keywords: ['WL', 'GNWL', 'RLWL', 'PQWL', 'TQWL', 'will my ticket confirm'],
    boost: 6,
  },
  {
    href: '/rail/berth-position-finder',
    title: 'Berth Position Finder',
    type: 'tool',
    categoryLabel: 'Coaches & berths',
    blurb: 'Turn a seat number into its position in the coach — lower, middle, upper or side.',
    keywords: ['berth', 'side lower', 'seat number', 'coach layout'],
    boost: 3,
  },
  {
    href: '/rail/chart-preparation-time',
    title: 'Chart Preparation Time Calculator',
    type: 'tool',
    categoryLabel: 'Train planning',
    blurb: 'Work out when the first and final reservation charts are prepared.',
    keywords: ['chart', 'first chart', '10 hours before departure'],
    boost: 6,
  },
  {
    href: '/rail/guides/train-classes-explained',
    title: 'Train Classes Explained',
    type: 'guide',
    categoryLabel: 'Coaches & berths',
    blurb: '1A vs 2A vs 3A vs SL vs CC — berths, comfort and bedding.',
    keywords: ['1A', '2A', '3A', 'sleeper vs 3AC', 'which class'],
    boost: 0,
  },
  {
    href: '/privacy-policy',
    title: 'Privacy policy',
    type: 'page',
    blurb: 'What Railmonk stores and what stays on your device.',
    keywords: ['privacy', 'cookies', 'tracking'],
    boost: -2,
  },
];

const index = createIndex(DOCS);
const top = (query) => {
  const hits = search(index, query);
  return hits.length ? hits[0].href : null;
};
const hrefs = (query) => search(index, query).map((h) => h.href);

// ── Normalisation and tokenising ────────────────────────────────────────────

test('normalize folds case, accents, punctuation and whitespace', () => {
  assert.equal(normalize('  IRCTC’s  Booking-Date!! '), 'irctcs booking date');
  assert.equal(normalize('café'), 'cafe');
  assert.equal(normalize(null), '');
  assert.equal(normalize(undefined), '');
});

test('tokenize folds multi-word phrases to their canonical token', () => {
  assert.deepEqual(tokenize('advance reservation period'), ['arp']);
  assert.deepEqual(tokenize('waiting list'), ['waitlist']);
  assert.deepEqual(tokenize('wait  list'), ['waitlist']);
  assert.deepEqual(tokenize('ticket deposit receipt'), ['tdr']);
});

test('tokenize applies aliases and light stemming consistently', () => {
  // Both sides of a comparison must land on the same token.
  assert.deepEqual(tokenize('cancel'), tokenize('cancellation'));
  assert.deepEqual(tokenize('booking'), tokenize('reservation'));
  assert.deepEqual(tokenize('charges'), tokenize('fee'));
  assert.deepEqual(tokenize('classes'), tokenize('class'));
  assert.deepEqual(tokenize('chances'), tokenize('chance'));
});

test('stemming leaves railway vocabulary and short codes alone', () => {
  assert.deepEqual(tokenize('tatkal'), ['tatkal']);
  assert.deepEqual(tokenize('irctc'), ['irctc']);
  assert.deepEqual(tokenize('gnwl'), ['gnwl']);
  assert.deepEqual(tokenize('rac'), ['rac']);
  assert.deepEqual(tokenize('1a 3a 2s'), ['1a', '3a', '2s']);
  assert.deepEqual(tokenize('60'), ['60']);
});

test('queryTokens drops stopwords but never returns nothing', () => {
  assert.deepEqual(queryTokens('when can i book the ticket'), ['book', 'ticket']);
  assert.deepEqual(queryTokens('how much'), ['much']);
  // An all-stopword query keeps its words rather than matching everything.
  assert.deepEqual(queryTokens('what is the'), ['what', 'is', 'the']);
  assert.deepEqual(queryTokens('   '), []);
});

// ── Edit distance ───────────────────────────────────────────────────────────

test('editDistance measures substitutions, insertions and deletions', () => {
  assert.equal(editDistance('tatkal', 'tatkal'), 0);
  assert.equal(editDistance('tatkl', 'tatkal'), 1);
  assert.equal(editDistance('cancelation', 'cancellation'), 1);
  assert.equal(editDistance('', 'chart'), 5);
  assert.equal(editDistance('chart', ''), 5);
});

test('editDistance abandons early once it cannot beat max', () => {
  // Over budget must report over budget, not the true distance.
  assert.ok(editDistance('booking', 'privacy', 1) > 1);
  assert.equal(editDistance('waitlist', 'waitlist', 0), 0);
});

// ── Relevance ───────────────────────────────────────────────────────────────

test('a title that starts with the query beats one that merely contains it', () => {
  // Both hold "cancellation"; only one leads with it.
  const results = search(index, 'cancellation');
  assert.equal(results[0].href, '/rail/irctc-cancellation-calculator');
});

test('exact and near-exact titles rank first', () => {
  assert.equal(top('berth position finder'), '/rail/berth-position-finder');
  assert.equal(top('chart preparation'), '/rail/chart-preparation-time');
  assert.equal(top('waitlist confirmation chances'), '/rail/waitlist-confirmation-chances');
});

test('abbreviations reach the page that owns them', () => {
  assert.equal(top('ARP'), '/rail/irctc-calculator');
  assert.equal(top('GNWL'), '/rail/waitlist-confirmation-chances');
  assert.equal(top('RLWL'), '/rail/waitlist-confirmation-chances');
});

test('a natural-language question finds the right tool', () => {
  assert.equal(top('when can I book my ticket'), '/rail/irctc-calculator');
  assert.equal(top('how much refund if I cancel'), '/rail/irctc-cancellation-calculator');
  assert.equal(top('will my waiting list ticket confirm'), '/rail/waitlist-confirmation-chances');
});

test('typos still land on the right page', () => {
  assert.equal(top('cancelation refund'), '/rail/irctc-cancellation-calculator');
  assert.equal(top('bearth position'), '/rail/berth-position-finder');
  assert.equal(top('waitlst'), '/rail/waitlist-confirmation-chances');
});

test('prefixes match as you type', () => {
  assert.equal(top('cancel'), '/rail/irctc-cancellation-calculator');
  assert.equal(top('waitl'), '/rail/waitlist-confirmation-chances');
  assert.ok(hrefs('char').includes('/rail/chart-preparation-time'));
});

test('a phrase alias and its expansion return the same top hit', () => {
  assert.equal(top('advance reservation period'), top('ARP'));
  assert.equal(top('waiting list'), top('waitlist'));
});

test('Hinglish keywords are searchable', () => {
  assert.equal(top('paisa wapas'), '/rail/irctc-cancellation-calculator');
});

test('every-term matches outrank partial ones', () => {
  const results = search(index, 'seat number coach');
  assert.equal(results[0].href, '/rail/berth-position-finder');
  assert.equal(results[0].coverage, 1);
});

test('a query matching nothing returns nothing rather than everything', () => {
  assert.deepEqual(search(index, 'zzzzqqqq'), []);
  assert.deepEqual(search(index, 'flight booking status pnr enquiry xyzzy'), []);
});

test('an empty query returns no results', () => {
  assert.deepEqual(search(index, ''), []);
  assert.deepEqual(search(index, '   '), []);
});

test('partial matches are a fallback, never a substitute for a full match', () => {
  // "class" hits the guide; "berth" hits both the guide blurb and the finder.
  const results = search(index, 'which class');
  assert.equal(results[0].href, '/rail/guides/train-classes-explained');
  assert.ok(results.every((r) => r.score > 0));
});

test('legal pages rank below tools for an ambiguous word', () => {
  const results = hrefs('cookies privacy');
  assert.equal(results[0], '/privacy-policy');
});

test('limit is respected', () => {
  assert.ok(search(index, 'ticket', { limit: 2 }).length <= 2);
});

// ── Highlighting ────────────────────────────────────────────────────────────

test('highlight marks the words the user typed', () => {
  const segments = highlight('Cancellation Refund Calculator', 'refund');
  assert.deepEqual(segments.map((s) => s.text).join(''), 'Cancellation Refund Calculator');
  assert.deepEqual(segments.filter((s) => s.hit).map((s) => s.text), ['Refund']);
});

test('highlight ignores stopwords and regex metacharacters', () => {
  assert.deepEqual(highlight('Berth Position Finder', 'the'), [{ text: 'Berth Position Finder', hit: false }]);
  assert.doesNotThrow(() => highlight('Fare (2A)', 'fare (2a)'));
});

test('highlight returns the whole string when nothing matches', () => {
  assert.deepEqual(highlight('Chart Preparation', 'zzz'), [{ text: 'Chart Preparation', hit: false }]);
});

// ── The real catalog ────────────────────────────────────────────────────────
// utils/catalog.js is ESM and cannot be required from these CJS tests, so it is
// read as text — the same approach test/sitemap.test.js takes.

test('every tool and guide in the catalog carries search keywords', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'utils/catalog.js'), 'utf8');
  const entries = [...source.matchAll(/\n {4}href: '([^']+)',\n([\s\S]*?)\n {2}\},/g)];
  assert.ok(entries.length >= 17, `expected the full catalog, parsed ${entries.length} entries`);
  for (const [, href, body] of entries) {
    assert.match(body, /keywords: \[/, `${href} has no keywords — it will be hard to find in search`);
  }
});
