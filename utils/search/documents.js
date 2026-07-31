// Everything the site search can return, assembled from the same catalog that
// drives the nav, footer and sitemap. Adding a tool or guide to utils/catalog.js
// puts it in search automatically; only the handful of standalone pages below
// have to be listed by hand.

import { TOOLS, GUIDES, categoryLabel } from '../catalog';
import { RULE_UPDATES } from '../ruleUpdates';
import { TRANSLATED, toHindiHref } from '../i18n';
import { createIndex, search as runSearch, tokenize } from './engine';

export const TYPE_LABEL = {
  tool: 'Tool',
  guide: 'Guide',
  update: 'Rule change',
  page: 'Page',
};

// Featured tools answer the commonest questions, so a near-tie between a
// featured tool and something peripheral should break towards the tool. Small
// enough that it never overturns a genuinely better match.
const FEATURED_BOOST = 6;
const TOOL_BOOST = 3;

const toolDocs = TOOLS.map((tool) => ({
  href: tool.href,
  title: tool.title,
  type: 'tool',
  category: tool.category,
  categoryLabel: categoryLabel(tool.category),
  blurb: tool.blurb,
  keywords: tool.keywords || [],
  icon: tool.icon,
  isNew: tool.isNew,
  boost: tool.featured ? FEATURED_BOOST : TOOL_BOOST,
}));

// Hindi pages are indexed as their own documents, keyed on their Hindi title
// and Devanagari keywords. They sit slightly below the English tools rather than
// alongside them: an English query should not surface a Hindi page above the
// English original, while a Devanagari query matches only these, because no
// English document holds a single Devanagari token.
const HINDI_KEYWORDS = {
  '/rail/irctc-calculator': [
    'बुकिंग', 'टिकट कब बुक करें', '60 दिन', 'अग्रिम आरक्षण', 'तत्काल समय',
    'रिजर्वेशन कब खुलेगा', 'टिकट कब मिलेगी', 'बुकिंग तिथि',
  ],
  '/rail/irctc-cancellation-calculator': [
    'टिकट कैंसिल', 'टिकिट कैंसिल', 'रद्द', 'रिफंड', 'पैसा वापस', 'कटौती', 'क्लर्केज',
    'कितना पैसा वापस मिलेगा', 'रद्दीकरण शुल्क',
  ],
  // Both spellings of the nasal are listed where they are genuinely both
  // common. The normaliser folds the nukta, so ज़/ज variants need no such
  // duplication — but कन्फर्म/कंफर्म and टिकट/टिकिट are different characters,
  // not a diacritic, and no amount of normalising joins them.
  '/rail/waitlist-confirmation-chances': [
    'वेटिंग', 'वेटिंग लिस्ट', 'कन्फर्म', 'कंफर्म', 'GNWL', 'RLWL', 'PQWL', 'TQWL', 'RAC',
    'टिकट कन्फर्म होगी', 'टिकिट', 'प्रतीक्षा सूची',
  ],
  '/rail/tatkal-charges-calculator': [
    'तत्काल', 'तत्काल चार्ज', 'तत्काल शुल्क', 'कितना ज्यादा', 'प्रीमियम तत्काल',
    'तत्काल बुकिंग समय',
  ],
};

const hindiDocs = TOOLS.filter((tool) => TRANSLATED.includes(tool.href)).map((tool) => ({
  href: toHindiHref(tool.href),
  title: tool.titleHi || tool.title,
  type: 'tool',
  category: tool.category,
  categoryLabel: categoryLabel(tool.category),
  blurb: tool.blurbHi || tool.blurb,
  keywords: [...(HINDI_KEYWORDS[tool.href] || []), 'हिंदी', 'hindi'],
  icon: tool.icon,
  locale: 'hi',
  boost: 1,
}));

const guideDocs = GUIDES.map((guide) => ({
  href: guide.href,
  title: guide.title,
  type: 'guide',
  category: guide.category,
  categoryLabel: categoryLabel(guide.category),
  blurb: guide.blurb,
  keywords: guide.keywords || [],
  readingMinutes: guide.readingMinutes,
  boost: 0,
}));

// Rule changes are indexed individually and deep-link to their anchor, so
// "chart 10 hours" or "ARP 60 days" lands on the entry rather than the top of
// the log.
const updateDocs = RULE_UPDATES.map((update) => ({
  href: `/rail/rule-updates#${update.id}`,
  title: update.title,
  type: 'update',
  category: update.category,
  categoryLabel: categoryLabel(update.category),
  blurb: update.summary,
  keywords: [update.effectiveLabel, 'rule change', 'what changed', 'new rule'],
  body: update.whatChanged,
  effectiveLabel: update.effectiveLabel,
  boost: 0,
}));

const pageDocs = [
  {
    href: '/guides',
    title: 'All guides',
    type: 'page',
    blurb: 'Every Railmonk explainer in one place, filterable by topic.',
    keywords: ['guides', 'articles', 'explainers', 'browse', 'index', 'learn'],
  },
  {
    href: '/rail/rule-updates',
    title: 'Rule changes we track',
    type: 'page',
    blurb: 'A dated log of the IRCTC and Indian Railways rule changes behind these tools, each with its source.',
    keywords: ['changelog', 'what changed', 'new rules', 'circular', 'effective date', 'updates'],
  },
  {
    href: '/hi',
    title: 'हिंदी में रेल टूल',
    type: 'page',
    blurb: 'बुकिंग, रिफंड, वेटिंग और तत्काल के कैलकुलेटर — हिंदी में।',
    keywords: ['hindi', 'हिंदी', 'भारतीय रेल', 'रेलवे', 'ट्रेन', 'in hindi', 'हिन्दी'],
  },
  {
    href: '/world',
    title: 'Trains abroad',
    type: 'page',
    blurb: 'Booking windows and delay compensation rules for the United States, Europe and Australia.',
    keywords: [
      'abroad', 'international', 'overseas', 'foreign', 'Europe', 'EU', 'USA', 'US', 'America',
      'Australia', 'UK', 'Britain', 'Amtrak', 'Eurostar', 'Deutsche Bahn', 'SNCF', 'Trenitalia',
      'outside India', 'trains in Europe',
    ],
  },
  {
    href: '/about',
    title: 'About Railmonk',
    type: 'page',
    blurb: 'Who builds Railmonk, how the tools are researched, and what the site deliberately does not do.',
    keywords: ['about', 'who we are', 'methodology', 'editorial', 'sources', 'team'],
  },
  {
    href: '/contact',
    title: 'Contact',
    type: 'page',
    blurb: 'Report a wrong result, a stale rule, or suggest a tool.',
    keywords: ['contact', 'email', 'feedback', 'report an error', 'support', 'suggest'],
  },
  {
    href: '/privacy-policy',
    title: 'Privacy policy',
    type: 'page',
    blurb: 'What Railmonk stores, what stays on your device, and what we never collect.',
    keywords: ['privacy', 'data', 'cookies', 'tracking', 'personal information', 'GDPR'],
  },
  {
    href: '/terms-of-service',
    title: 'Terms of service',
    type: 'page',
    blurb: 'The terms you accept by using these calculators.',
    keywords: ['terms', 'conditions', 'legal', 'disclaimer', 'liability'],
  },
  {
    href: '/cookie-policy',
    title: 'Cookie policy',
    type: 'page',
    blurb: 'The cookies this site sets and why.',
    keywords: ['cookies', 'consent', 'analytics', 'storage'],
  },
].map((page) => ({ ...page, boost: -2 }));

export const SEARCH_DOCUMENTS = [...toolDocs, ...hindiDocs, ...guideDocs, ...updateDocs, ...pageDocs];

const INDEX = createIndex(SEARCH_DOCUMENTS);

/** Rank every indexed page against `query`. */
export const searchSite = (query, options) => runSearch(INDEX, query, options);

/** Guide-only search, used by the /guides filter so it behaves the same way. */
const GUIDE_INDEX = createIndex(guideDocs);
export const searchGuides = (query, options) => runSearch(GUIDE_INDEX, query, options);

// Things people will reasonably search for that this site does not do, because
// they need a licensed live-data feed we do not have. Saying so beats returning
// the nearest loosely-related calculator and letting the reader work it out.
const LIVE_DATA_TRIGGERS = [
  'pnr', 'live', 'running', 'spot', 'availability', 'timetable', 'schedule',
  'seat availability', 'train status', 'between stations', 'departures',
  'platform number', 'delay status',
  // "delay" on its own used to sit in this list, from when nothing on the site
  // answered a delay question. It now sends people asking about compensation to
  // a "we have no live data" notice instead of the tool that answers them, so
  // the trigger needs both words to fire.
].map((phrase) => tokenize(phrase));

/**
 * Does this query want live train data? Returns the explanation to show above
 * the results, or null.
 */
export const liveDataNotice = (query) => {
  const terms = new Set(tokenize(query));
  if (!terms.size) return null;
  const wanted = LIVE_DATA_TRIGGERS.some((trigger) => trigger.every((t) => terms.has(t)));
  if (!wanted) return null;
  return {
    title: 'Railmonk does not carry live train data',
    body:
      'PNR status, running position, seat availability and timetables need a live feed from Indian Railways, which we do not have. Check those on the official IRCTC portal — the tools below work out the rules around your journey instead.',
    href: 'https://www.irctc.co.in/',
    cta: 'Open IRCTC',
  };
};

/**
 * Shown before anything is typed. Not "trending" — we have no analytics feeding
 * this, and inventing popularity would be the sort of unsupported claim the
 * rest of the site avoids. These are the questions the tools were built for.
 */
export const SUGGESTED_QUERIES = [
  'When does booking open?',
  'Tatkal timing',
  'Cancellation refund',
  'GNWL vs RLWL',
  'Chart preparation',
  'Berth position',
];
