// What another app shared into installed Railmonk: an e-ticket PDF, an SMS,
// or both.
//
// The service worker (public/sw.js) receives the share — the manifest's
// share_target POSTs to /share-target — parks it in the "railmonk-share"
// cache and opens the ticket reader with `?shared=1`. The reader takes it from
// here. The POST is answered by the worker on the phone itself, so the ticket
// never reaches a server.
//
// Browser only.

const CACHE = 'railmonk-share';

const index = (url) => Number(String(url).split('/').pop()) || 0;

/** The shared files and text, without removing them. */
export const peekShared = async () => {
  const empty = { files: [], text: '' };
  if (typeof caches === 'undefined') return empty;
  try {
    const cache = await caches.open(CACHE);
    const keys = [...(await cache.keys())];
    const files = [];
    let text = '';
    for (const key of keys.sort((a, b) => index(a.url) - index(b.url))) {
      const res = await cache.match(key);
      if (!res) continue;
      if (new URL(key.url).pathname === '/__shared/text') {
        text = await res.text();
        continue;
      }
      const blob = await res.blob();
      const name = decodeURIComponent(res.headers.get('x-name') || '') || `shared-${files.length + 1}`;
      files.push(new File([blob], name, { type: blob.type }));
    }
    return { files, text };
  } catch (e) {
    return empty;
  }
};

let pending = null;

/**
 * The share for this page, or null when it was not opened with `?shared=1`.
 * Read once per address, so a remount (React strict mode, a language
 * redirect) gets the same share instead of an empty cache.
 */
export const sharedPayload = () => {
  if (typeof window === 'undefined') return null;
  if (!new URLSearchParams(window.location.search).has('shared')) return null;
  if (!pending || pending.href !== window.location.href) pending = { href: window.location.href, payload: peekShared() };
  return pending.payload;
};

/** `?shared=lost`: the share reached the network instead of the worker. */
export const shareWasLost = () =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('shared') === 'lost';

/**
 * Once the reader has opened the share: empty the cache and drop `shared`
 * from the address, so a reload or Back does not bring the ticket back.
 */
export const consumeShared = () => {
  pending = null;
  if (typeof caches !== 'undefined') caches.delete(CACHE).catch(() => {});
  const url = new URL(window.location.href);
  url.searchParams.delete('shared');
  window.history.replaceState(window.history.state, '', url);
};
