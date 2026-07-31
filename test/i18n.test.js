const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  LOCALES,
  TRANSLATED,
  getLocale,
  toHindiHref,
  toEnglishHref,
  localeFromPath,
  hasTranslation,
  counterpartHref,
  alternatesFor,
  t,
  STRINGS,
} = require('../utils/i18n');

const ROOT = path.join(__dirname, '..');

// --- Route mapping ---

test('an English route maps to its Hindi twin and back', () => {
  assert.equal(toHindiHref('/rail/irctc-calculator'), '/hi/rail/irctc-calculator');
  assert.equal(toEnglishHref('/hi/rail/irctc-calculator'), '/rail/irctc-calculator');
});

test('the home page is a special case in both directions', () => {
  assert.equal(toHindiHref('/'), '/hi');
  assert.equal(toEnglishHref('/hi'), '/');
});

test('round-tripping a route returns the original', () => {
  TRANSLATED.forEach((href) => {
    assert.equal(toEnglishHref(toHindiHref(href)), href);
  });
});

test('the locale is read from the path, and /hindi is not /hi', () => {
  assert.equal(localeFromPath('/rail/irctc-calculator'), 'en');
  assert.equal(localeFromPath('/hi'), 'hi');
  assert.equal(localeFromPath('/hi/rail/irctc-calculator'), 'hi');
  // A route that merely starts with the same letters must not be mistaken for
  // the Hindi prefix — '/hindi-guide' would otherwise render with lang="hi".
  assert.equal(localeFromPath('/hindi-guide'), 'en');
  assert.equal(localeFromPath('/highlights'), 'en');
});

// --- The registry has to match what actually exists on disk ---

test('every route listed as translated has a Hindi page file', () => {
  const missing = TRANSLATED.filter((href) => {
    const rel = href === '/' ? 'pages/hi/index.js' : `pages/hi${href}.js`;
    return !fs.existsSync(path.join(ROOT, rel));
  });
  assert.deepEqual(missing, [], `declared as translated but no page file: ${missing.join(', ')}`);
});

test('every Hindi page file is declared in the registry', () => {
  const found = [];
  const walk = (dir, prefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, `${prefix}/${entry.name}`);
      else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        const base = entry.name.replace(/\.(js|jsx|ts|tsx)$/, '');
        found.push(base === 'index' ? prefix || '/' : `${prefix}/${base}`);
      }
    }
  };
  walk(path.join(ROOT, 'pages/hi'), '');
  const undeclared = found
    .map((route) => (route === '/' ? '/' : route))
    .filter((route) => !TRANSLATED.includes(route));
  assert.deepEqual(undeclared, [], `Hindi pages missing from TRANSLATED: ${undeclared.join(', ')}`);
});

test('every English counterpart page exists too', () => {
  const missing = TRANSLATED.filter((href) => {
    const rel = href === '/' ? 'pages/index.js' : `pages${href}.js`;
    return !fs.existsSync(path.join(ROOT, rel));
  });
  assert.deepEqual(missing, [], `Hindi page with no English original: ${missing.join(', ')}`);
});

// --- hreflang ---

test('a translated page gets a reciprocal pair plus x-default', () => {
  const alts = alternatesFor('/rail/irctc-calculator');
  assert.equal(alts.length, 3);
  assert.deepEqual(
    alts.map((a) => a.hreflang).sort(),
    ['en-IN', 'hi-IN', 'x-default']
  );
  assert.equal(alts.find((a) => a.hreflang === 'hi-IN').href, 'https://railmonk.com/hi/rail/irctc-calculator');
  assert.equal(alts.find((a) => a.hreflang === 'x-default').href, 'https://railmonk.com/rail/irctc-calculator');
});

test('both sides of a pair emit identical alternates', () => {
  TRANSLATED.forEach((href) => {
    assert.deepEqual(alternatesFor(href), alternatesFor(toHindiHref(href)), `asymmetric alternates for ${href}`);
  });
});

test('an untranslated page emits no alternates at all', () => {
  assert.deepEqual(alternatesFor('/rail/tdr-refund-checker'), []);
  assert.deepEqual(alternatesFor('/world/booking-windows'), []);
});

test('every alternate points at a page that exists', () => {
  TRANSLATED.forEach((href) => {
    alternatesFor(href).forEach((alt) => {
      const route = alt.href.replace('https://railmonk.com', '') || '/';
      const rel =
        route === '/' ? 'pages/index.js' : route === '/hi' ? 'pages/hi/index.js' : `pages${route}.js`;
      assert.ok(fs.existsSync(path.join(ROOT, rel)), `hreflang points at missing page: ${route}`);
    });
  });
});

// --- The language switcher's target ---

test('the switcher points at the other language for a translated page', () => {
  assert.equal(counterpartHref('/rail/irctc-calculator'), '/hi/rail/irctc-calculator');
  assert.equal(counterpartHref('/hi/rail/irctc-calculator'), '/rail/irctc-calculator');
  assert.equal(counterpartHref('/'), '/hi');
  assert.equal(counterpartHref('/hi'), '/');
});

test('the switcher has no target on an untranslated page, so it renders nothing', () => {
  assert.equal(counterpartHref('/rail/tdr-refund-checker'), null);
  assert.equal(counterpartHref('/world/delay-compensation'), null);
});

test('hasTranslation works from either side of the pair', () => {
  assert.equal(hasTranslation('/rail/irctc-calculator'), true);
  assert.equal(hasTranslation('/hi/rail/irctc-calculator'), true);
  assert.equal(hasTranslation('/rail/tdr-refund-checker'), false);
});

// --- Strings ---

test('every English chrome string has a Hindi counterpart', () => {
  const missing = Object.keys(STRINGS.en).filter((key) => !STRINGS.hi[key]);
  assert.deepEqual(missing, [], `untranslated chrome strings: ${missing.join(', ')}`);
});

test('no Hindi string is left as its English original', () => {
  // Two are deliberately identical: they name the other language in that
  // language, so they read the same whichever page they appear on.
  const intentionallyShared = new Set(['lang.readInHindi', 'lang.readInEnglish']);
  const untranslated = Object.keys(STRINGS.hi).filter(
    (key) => !intentionallyShared.has(key) && STRINGS.hi[key] === STRINGS.en[key]
  );
  assert.deepEqual(untranslated, [], `Hindi still holding the English string: ${untranslated.join(', ')}`);
});

test('a missing key falls back to English rather than rendering the key', () => {
  assert.equal(t('share.copy', 'hi'), STRINGS.hi['share.copy']);
  assert.equal(t('share.copy', 'ta'), STRINGS.en['share.copy']);
  assert.equal(t('does.not.exist', 'hi'), 'does.not.exist');
});

test('Hindi strings are actually in Devanagari', () => {
  const devanagari = /[ऀ-ॿ]/;
  const suspicious = Object.entries(STRINGS.hi)
    .filter(([key]) => key !== 'lang.readInEnglish')
    .filter(([, value]) => !devanagari.test(value))
    .map(([key]) => key);
  assert.deepEqual(suspicious, [], `Hindi strings with no Devanagari: ${suspicious.join(', ')}`);
});

// --- Locale registry ---

test('locales carry the html lang and prefix the rest of the code relies on', () => {
  assert.equal(getLocale('hi').htmlLang, 'hi');
  assert.equal(getLocale('hi').prefix, '/hi');
  assert.equal(getLocale('en').prefix, '');
  // An unknown locale must degrade to English, never to undefined.
  assert.equal(getLocale('zz').id, 'en');
  assert.equal(LOCALES.length, 2);
});
