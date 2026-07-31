// Hindi, as static routes rather than a locale config.
//
// Next's built-in i18n routing is incompatible with `output: 'export'`, which
// is what this site ships. So a translated page is a real page: /rail/x has its
// Hindi twin at /hi/rail/x, exported as its own HTML file. That is also the only
// arrangement Google can index — a client-side language toggle would leave every
// crawler looking at English markup, which defeats the point of translating.
//
// TRANSLATED is the single source of truth for which English routes have a
// Hindi twin. Everything derives from it: the language switcher, the hreflang
// alternates, the sitemap check, and the Devanagari font that only /hi pages
// pay for. Adding a translation means adding the page file and one line here —
// and a test fails if those two ever disagree.

const LOCALES = [
  { id: 'en', label: 'English', shortLabel: 'EN', htmlLang: 'en', hreflang: 'en-IN', prefix: '' },
  { id: 'hi', label: 'हिंदी', shortLabel: 'हिं', htmlLang: 'hi', hreflang: 'hi-IN', prefix: '/hi' },
];

const DEFAULT_LOCALE = 'en';

const LOCALE_INDEX = Object.fromEntries(LOCALES.map((l) => [l.id, l]));

const getLocale = (id) => LOCALE_INDEX[id] || LOCALE_INDEX[DEFAULT_LOCALE];

/**
 * English routes that have a Hindi translation.
 *
 * Keep this honest. An hreflang pointing at a page that does not exist is worse
 * than no hreflang at all, and a language switcher that dumps someone on a 404
 * is worse than one that is absent.
 */
const TRANSLATED = [
  '/',
  '/rail/irctc-calculator',
  '/rail/irctc-cancellation-calculator',
  '/rail/waitlist-confirmation-chances',
  '/rail/tatkal-charges-calculator',
];

const TRANSLATED_SET = new Set(TRANSLATED);

/** '/rail/x' → '/hi/rail/x'. The home page is '/' → '/hi'. */
const toHindiHref = (href) => (href === '/' ? '/hi' : `/hi${href}`);

/** '/hi/rail/x' → '/rail/x', '/hi' → '/'. */
const toEnglishHref = (href) => {
  if (href === '/hi') return '/';
  return href.startsWith('/hi/') ? href.slice(3) : href;
};

/** Which locale is this path in? Derived from the path, never from state. */
const localeFromPath = (pathname) => {
  const path = String(pathname || '');
  return path === '/hi' || path.startsWith('/hi/') ? 'hi' : 'en';
};

const hasTranslation = (href) => TRANSLATED_SET.has(toEnglishHref(href));

/**
 * The counterpart of this page in the other language, or null when none exists.
 * Takes any path in either language.
 */
const counterpartHref = (pathname) => {
  const english = toEnglishHref(pathname);
  if (!TRANSLATED_SET.has(english)) return null;
  return localeFromPath(pathname) === 'hi' ? english : toHindiHref(english);
};

/**
 * hreflang alternates for a page, ready to render as <link> tags. Returns an
 * empty array for untranslated pages: a self-referential alternate on a page
 * with no siblings tells a crawler nothing.
 */
const alternatesFor = (pathname, origin = 'https://railmonk.com') => {
  const english = toEnglishHref(pathname);
  if (!TRANSLATED_SET.has(english)) return [];
  return [
    { hreflang: 'en-IN', href: `${origin}${english}` },
    { hreflang: 'hi-IN', href: `${origin}${toHindiHref(english)}` },
    // x-default points at English: it is the fuller site, and the one a reader
    // of neither language is likelier to be able to work with.
    { hreflang: 'x-default', href: `${origin}${english}` },
  ];
};

// ── Shared chrome strings ───────────────────────────────────────────────────
// Only the furniture lives here — headings, button labels, the breadcrumb
// trail. Page copy does not: a calculator's prose is written, not assembled
// from keys, and pretending otherwise produces the stilted half-translation
// that makes people switch back to English.
const STRINGS = {
  en: {
    'nav.home': 'Home',
    'nav.tools': 'Rail tools',
    'nav.language': 'Language',
    'nav.railTools': 'Rail Tools',
    'nav.trainsAbroad': 'Trains Abroad',
    'nav.guides': 'Guides',
    'nav.resources': 'Resources',
    'nav.setReminder': 'Set a reminder',
    'nav.menu': 'Menu',
    'nav.explore': 'Explore',
    'nav.searchPlaceholder': 'Search tools, guides and rules…',
    'nav.ruleChanges': 'Rule changes',
    'nav.savedJourneys': 'Saved journeys',
    'nav.about': 'About Railmonk',
    'nav.contact': 'Contact',
    'share.title': 'Share this result',
    'share.body': 'The link carries your inputs, so whoever opens it sees the same answer.',
    'share.copy': 'Copy link',
    'share.copied': 'Link copied',
    'share.share': 'Share',
    'share.label': 'Link to this result',
    'howto.heading': 'How to use this calculator',
    'related.heading': 'Keep going',
    'related.tools': 'Tools that pair with this',
    'related.guides': 'Guides that explain the rules',
    'related.moreTopic': 'More on this topic',
    'related.openTool': 'Open tool',
    'related.readGuide': 'Read guide',
    'faq.heading': 'Frequently asked questions',
    'eeat.panel': 'Editorial Trust Panel',
    'eeat.author': 'Author',
    'eeat.reviewer': 'Reviewed by',
    'eeat.reviewedOn': 'Last reviewed',
    'eeat.update': 'Content update',
    'eeat.scope': 'Scope',
    'eeat.sources': 'Primary references',
    'updated.reviewed': 'Rules reviewed',
    'lang.readInHindi': 'हिंदी में पढ़ें',
    'lang.readInEnglish': 'Read in English',
  },
  hi: {
    'nav.home': 'होम',
    'nav.tools': 'रेल टूल्स',
    'nav.language': 'भाषा',
    'nav.railTools': 'रेल टूल्स',
    'nav.trainsAbroad': 'विदेश की ट्रेनें',
    'nav.guides': 'गाइड',
    'nav.resources': 'अन्य जानकारी',
    'nav.setReminder': 'रिमाइंडर लगाइए',
    'nav.menu': 'मेन्यू',
    'nav.explore': 'और देखिए',
    'nav.searchPlaceholder': 'टूल, गाइड और नियम खोजिए…',
    'nav.ruleChanges': 'नियमों में बदलाव',
    'nav.savedJourneys': 'सहेजी गई यात्राएँ',
    'nav.about': 'Railmonk के बारे में',
    'nav.contact': 'संपर्क',
    'share.title': 'यह परिणाम साझा करें',
    'share.body': 'लिंक में आपकी दी हुई जानकारी शामिल रहती है, इसलिए जो भी इसे खोलेगा उसे यही उत्तर दिखेगा।',
    'share.copy': 'लिंक कॉपी करें',
    'share.copied': 'लिंक कॉपी हो गया',
    'share.share': 'साझा करें',
    'share.label': 'इस परिणाम का लिंक',
    'howto.heading': 'इस कैलकुलेटर का उपयोग कैसे करें',
    'related.heading': 'आगे पढ़ें',
    'related.tools': 'इससे जुड़े टूल',
    'related.guides': 'नियम समझाने वाली गाइड',
    'related.moreTopic': 'इसी विषय पर और',
    'related.openTool': 'टूल खोलें',
    'related.readGuide': 'गाइड पढ़ें',
    'faq.heading': 'अक्सर पूछे जाने वाले प्रश्न',
    'eeat.panel': 'संपादकीय भरोसा पैनल',
    'eeat.author': 'लेखक',
    'eeat.reviewer': 'समीक्षक',
    'eeat.reviewedOn': 'अंतिम समीक्षा',
    'eeat.update': 'सामग्री अद्यतन',
    'eeat.scope': 'दायरा',
    'eeat.sources': 'मुख्य स्रोत',
    'updated.reviewed': 'नियम समीक्षित',
    'lang.readInHindi': 'हिंदी में पढ़ें',
    'lang.readInEnglish': 'Read in English',
  },
};

/** Look up a chrome string. Falls back to English, then to the key itself. */
const t = (key, locale = DEFAULT_LOCALE) =>
  (STRINGS[locale] && STRINGS[locale][key]) || STRINGS[DEFAULT_LOCALE][key] || key;

module.exports = {
  LOCALES,
  DEFAULT_LOCALE,
  TRANSLATED,
  STRINGS,
  getLocale,
  toHindiHref,
  toEnglishHref,
  localeFromPath,
  hasTranslation,
  counterpartHref,
  alternatesFor,
  t,
};
