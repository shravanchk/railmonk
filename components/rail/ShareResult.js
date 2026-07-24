import React, { useEffect, useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';

/**
 * "Send this result to someone."
 *
 * On a phone the native share sheet is the right answer — it puts WhatsApp
 * first, which is how this audience actually shares a train plan. Everywhere
 * else, copying the link is the honest fallback. The button is only offered
 * once we know which one the browser supports, so it never advertises a share
 * sheet that will not appear.
 */
export default function ShareResult({ url, title, text, className = '' }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // navigator.share is absent on desktop and outside secure contexts, and
  // checking during render would not match the server-rendered markup.
  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard permission denied, or an insecure context. Select the text so
      // the visitor can copy it by hand rather than being told nothing.
      const field = document.getElementById('share-result-url');
      if (field) {
        field.select();
        field.setSelectionRange(0, url.length);
      }
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title, text, url });
    } catch {
      // Includes the visitor simply dismissing the sheet — not an error worth
      // reporting, and falling back to a copy would be presumptuous.
    }
  };

  if (!url) return null;

  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/70 dark:bg-slate-800/70 ${className}`}
    >
      <p className="text-sm font-semibold text-ink dark:text-white">Share this result</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
        The link carries your inputs, so whoever opens it sees the same answer.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:text-slate-300"
        >
          {copied ? (
            <Check aria-hidden="true" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Link2 aria-hidden="true" className="h-4 w-4" />
          )}
          {copied ? 'Link copied' : 'Copy link'}
        </button>

        {canShare ? (
          <button
            type="button"
            onClick={share}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <Share2 aria-hidden="true" className="h-4 w-4" />
            Share
          </button>
        ) : null}
      </div>

      {/* Present for the clipboard fallback above, and so the link is visible
          and selectable rather than hidden behind a button that may fail. */}
      <label htmlFor="share-result-url" className="sr-only">
        Link to this result
      </label>
      <input
        id="share-result-url"
        type="text"
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        className="mt-3 w-full truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-ink-muted outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
      />

      <p aria-live="polite" className="sr-only">
        {copied ? 'Link copied to clipboard' : ''}
      </p>
    </div>
  );
}
