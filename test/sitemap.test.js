const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// The catalog is ESM and the sitemap is XML, so this test reads both as text
// and compares the URL sets. It exists because pages have shipped before
// without ever reaching the sitemap — a silent SEO loss with no other signal.

const ROOT = path.join(__dirname, '..');

// Pages that carry `noindex` and have nothing durable for a crawler to see are
// kept out of the sitemap on purpose: saved journeys is personal and
// device-local, and search results are generated from a query string.
const EXCLUDED = new Set(['/rail/saved-journeys', '/search']);

const sitemapUrls = () => {
  const xml = fs.readFileSync(path.join(ROOT, 'public/sitemap.xml'), 'utf8');
  return new Set([...xml.matchAll(/<loc>https:\/\/railmonk\.com(\/[^<]*)<\/loc>/g)].map((m) => m[1]));
};

const catalogHrefs = () => {
  const src = fs.readFileSync(path.join(ROOT, 'utils/catalog.js'), 'utf8');
  return [...src.matchAll(/^\s+href: '(\/[^']+)',$/gm)].map((m) => m[1]);
};

/** Every route Next will export, derived from the pages directory. */
const pageRoutes = () => {
  const pagesDir = path.join(ROOT, 'pages');
  const routes = [];
  const walk = (dir, prefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, `${prefix}/${entry.name}`);
      } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        const base = entry.name.replace(/\.(js|jsx|ts|tsx)$/, '');
        if (base.startsWith('_') || base === '404') continue;
        // pages/index.js → "/", pages/guides/index.js → "/guides".
        routes.push(base === 'index' ? prefix || '/' : `${prefix}/${base}`);
      }
    }
  };
  walk(pagesDir, '');
  return routes;
};

test('every tool and guide in the catalog is in the sitemap', () => {
  const urls = sitemapUrls();
  const missing = catalogHrefs().filter((href) => !EXCLUDED.has(href) && !urls.has(href));
  assert.deepEqual(missing, [], `catalog entries missing from sitemap: ${missing.join(', ')}`);
});

test('every exported page is in the sitemap, unless deliberately excluded', () => {
  const urls = sitemapUrls();
  const missing = pageRoutes().filter((r) => !EXCLUDED.has(r) && !urls.has(r));
  assert.deepEqual(missing, [], `pages missing from sitemap: ${missing.join(', ')}`);
});

test('the sitemap contains no URL without a page behind it', () => {
  const routes = new Set(pageRoutes());
  const orphans = [...sitemapUrls()].filter((u) => !routes.has(u));
  assert.deepEqual(orphans, [], `sitemap URLs with no page: ${orphans.join(', ')}`);
});

test('every sitemap entry carries a lastmod date', () => {
  const xml = fs.readFileSync(path.join(ROOT, 'public/sitemap.xml'), 'utf8');
  const entries = xml.split('<url>').slice(1);
  entries.forEach((entry) => {
    const loc = /<loc>([^<]+)<\/loc>/.exec(entry)?.[1];
    assert.match(entry, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/, `missing or malformed lastmod for ${loc}`);
  });
});
