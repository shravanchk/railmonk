/*
 * Railmonk service worker.
 *
 * - POST /share-target: a ticket shared from another app (the manifest's
 *   share_target) — an ERS PDF from WhatsApp, Gmail or Files, or an SMS from
 *   Messages. It is parked in its own cache and the ticket reader picks it up
 *   (utils/shared.js). The share is answered here, on the phone; it never
 *   reaches the network.
 * - Install: cache the ticket reader in both languages, the pages it links
 *   to, and every script and style they reference, plus the pdf.js worker —
 *   so a ticket can be read on a platform with no signal.
 * - Pages: network first (so updates arrive), falling back to the cache.
 * - /_next/static and /vendor: cache first. Their names change whenever their
 *   contents do, so a cached copy is never stale.
 *
 * Cross-origin requests (ads, analytics, fonts) are left alone entirely.
 * Bump VERSION to drop every old cache on the next visit.
 */
const VERSION = 'v1';
const CACHE = `railmonk-${VERSION}`;
// Read by utils/shared.js; not versioned, so an update never drops a share.
const SHARE_CACHE = 'railmonk-share';

const PAGES = ['/rail/ticket-reader', '/hi/rail/ticket-reader', '/rail/saved-journeys', '/'];

const ASSET_RE = /(?:src|href)="(\/(?:_next\/static|vendor)\/[^"]+)"/g;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const assets = new Set(['/vendor/pdf.worker.min.mjs', '/manifest.json', '/icon-192.png', '/railmonk-logo.svg']);
      for (const path of PAGES) {
        try {
          const res = await fetch(path, { cache: 'no-cache' });
          if (!res.ok) continue;
          const html = await res.clone().text();
          await cache.put(path, res);
          for (const m of html.matchAll(ASSET_RE)) assets.add(m[1]);
        } catch (e) {
          // Offline during install: whatever was fetched is still cached.
        }
      }
      await Promise.all([...assets].map((a) => cache.add(a).catch(() => {})));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE && key !== SHARE_CACHE) await caches.delete(key);
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(receiveShare(req));
    return;
  }
  if (req.method !== 'GET') return;

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/vendor/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(url.pathname)) || (await caches.match('/rail/ticket-reader')) || Response.error())
    );
  }
});

/** Keeps the shared files and text (replacing any earlier share) and opens the reader. */
async function receiveShare(req) {
  try {
    const form = await req.formData();
    const files = form.getAll('files').filter((f) => typeof f === 'object' && 'size' in f);
    // Apps disagree on where an SMS goes: Messages uses `text`, some mail apps
    // put the subject in `title` and the body in `text`. Keep all of it.
    const text = ['title', 'text', 'url']
      .map((k) => form.get(k))
      .filter((v) => typeof v === 'string' && v.trim())
      .join('\n');
    const cache = await caches.open(SHARE_CACHE);
    for (const key of await cache.keys()) await cache.delete(key);
    await Promise.all(
      files.map((f, i) =>
        cache.put(
          `/__shared/${i}`,
          new Response(f, {
            headers: {
              'content-type': f.type || 'application/octet-stream',
              'x-name': encodeURIComponent(f.name || `shared-${i + 1}`),
            },
          })
        )
      )
    );
    if (text) await cache.put('/__shared/text', new Response(text, { headers: { 'content-type': 'text/plain;charset=utf-8' } }));
  } catch (e) {
    // The reader says nothing arrived and offers the drop zone instead.
  }
  return Response.redirect(new URL('/rail/ticket-reader?shared=1', self.location.origin).href, 303);
}
