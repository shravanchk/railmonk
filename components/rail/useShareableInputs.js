import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { buildShareUrl, decodeFields, encodeFields } from '../../utils/shareLinks';

/**
 * Two-way binding between a calculator's inputs and the URL.
 *
 * A result that cannot be sent to anyone is half a result — people work out a
 * refund or a chart time and then want to show someone. This keeps the address
 * bar in step with the inputs, so the page can be shared, bookmarked or
 * reloaded without retyping.
 *
 * @param fields  Current values, keyed by the query-string name. Strings only.
 * @param apply   Called once, with whatever the incoming URL carried, so the
 *                calculator can restore its own state. Values arrive as strings.
 * @returns       The absolute share URL — empty string until the client mounts.
 *
 * Values equal to the ones the page loads with are never written, so the URL
 * stays clean until the visitor actually changes something. The canonical link
 * tag is unaffected: it stays parameter-free, so none of this creates
 * near-duplicate URLs for a crawler to wade through.
 */
export default function useShareableInputs(fields, apply) {
  const router = useRouter();
  // Captured on first render, and used both as the defaults to diff against and
  // as the list of keys we recognise in an incoming URL.
  const defaults = useRef(fields);
  const hydrated = useRef(false);
  const touched = useRef(false);
  // Kept in a ref so a caller can pass an inline closure without restarting the
  // hydration effect on every render.
  const applyRef = useRef(apply);
  applyRef.current = apply;

  const [shareUrl, setShareUrl] = useState('');

  // Static export: the query string is only readable once the router hydrates.
  useEffect(() => {
    if (!router.isReady || hydrated.current) return;
    hydrated.current = true;
    const incoming = decodeFields(router.query, Object.keys(defaults.current));
    if (Object.keys(incoming).length) {
      touched.current = true;
      applyRef.current(incoming);
    }
  }, [router.isReady, router.query]);

  const query = encodeFields(fields, defaults.current);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(buildShareUrl(window.location.origin, router.pathname, fields, defaults.current));
    }
    if (!hydrated.current) return;
    if (!touched.current) {
      if (!query) return; // still sitting on the defaults — leave the URL alone
      touched.current = true;
    }
    // Debounced, and `replace` rather than `push`: typing a fare should not
    // bury the back button under one history entry per keystroke.
    const timer = setTimeout(() => {
      const next = query ? `${router.pathname}?${query}` : router.pathname;
      if (next !== router.asPath) {
        router.replace(next, undefined, { shallow: true, scroll: false });
      }
    }, 400);
    return () => clearTimeout(timer);
    // `fields` is a fresh object every render; `query` is its stable projection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, router.pathname]);

  return shareUrl;
}
