import { useEffect } from 'react';

/**
 * Registers public/sw.js, which receives tickets shared from other apps and
 * keeps the ticket reader working without signal. Production only: in
 * development a caching worker would serve stale chunks and make every edit
 * look like it did not take.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Unsupported or blocked (private mode, some in-app browsers): the site
      // works as before, online only and without the share target.
    });
  }, []);
  return null;
}
