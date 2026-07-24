import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Search } from 'lucide-react';

// The dialog pulls in the whole search index. Loading it on demand keeps it out
// of the bundle every visitor downloads, since most arrive on a calculator from
// a search engine and never open it.
const SearchDialog = dynamic(() => import('./SearchDialog'), { ssr: false });

const OPEN_EVENT = 'railmonk:open-search';

/**
 * Open the search dialog from anywhere. One dialog lives in the navbar (which
 * is global), and triggers elsewhere on the page just ask it to open — cheaper
 * and less error-prone than threading state through context for one boolean.
 */
export const openSearch = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(OPEN_EVENT));
};

const isTypingTarget = (el) =>
  !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

/** The search trigger — a button that looks like a field. */
export function SearchTrigger({ variant = 'nav', className = '' }) {
  if (variant === 'hero') {
    return (
      <button
        type="button"
        onClick={openSearch}
        className={`group mx-auto flex w-full max-w-xl items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-soft transition hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 ${className}`}
      >
        <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-ink-muted" />
        <span className="flex-1 text-sm text-ink-muted dark:text-slate-400">
          Search tools, guides and rules…
        </span>
        <kbd className="hidden shrink-0 rounded border border-slate-300 px-1.5 py-0.5 font-sans text-[0.7rem] text-ink-muted dark:border-slate-600 dark:text-slate-400 sm:block">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        data-search-trigger
        className={`hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-ink-muted transition hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:text-slate-400 lg:inline-flex ${className}`}
      >
        <Search aria-hidden="true" className="h-4 w-4" />
        Search
        <kbd className="rounded border border-slate-300 px-1.5 py-0.5 font-sans text-[0.7rem] dark:border-slate-600">⌘K</kbd>
      </button>
      <button
        type="button"
        onClick={openSearch}
        aria-label="Search"
        data-search-trigger
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-ink-soft transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 ${className}`}
      >
        <Search aria-hidden="true" className="h-4 w-4" />
      </button>
    </>
  );
}

/** Hosts the single dialog instance and the global keyboard shortcuts. */
export default function SiteSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const returnFocusTo = useRef(null);

  const openDialog = useCallback(() => {
    returnFocusTo.current = document.activeElement;
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Put focus back where it came from, or closing leaves a keyboard user
    // stranded at the top of the document. Opening with ⌘K from a page with no
    // focused element is the common case, so fall back to the navbar trigger
    // rather than to <body>.
    const opener = returnFocusTo.current;
    // Two nav triggers exist (a labelled pill and an icon button) and only one
    // is displayed at a given width — focusing a `display:none` button is a
    // no-op, so pick the one that is actually laid out.
    const fallback = [...document.querySelectorAll('[data-search-trigger]')].find((el) => el.offsetParent);
    const target = opener && opener !== document.body && opener.isConnected ? opener : fallback;
    if (target) requestAnimationFrame(() => target.focus());
  }, []);

  useEffect(() => {
    const onOpenRequest = () => openDialog();
    window.addEventListener(OPEN_EVENT, onOpenRequest);
    return () => window.removeEventListener(OPEN_EVENT, onOpenRequest);
  }, [openDialog]);

  useEffect(() => {
    const onKey = (event) => {
      const cmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      // "/" is the other convention, but only when the visitor is not already
      // typing into one of the calculators.
      const slash = event.key === '/' && !event.metaKey && !event.ctrlKey && !isTypingTarget(event.target);
      if (cmdK || slash) {
        event.preventDefault();
        openDialog();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openDialog]);

  // A route change means the visitor got where they were going.
  useEffect(() => {
    const onRouteChange = () => setOpen(false);
    router.events.on('routeChangeComplete', onRouteChange);
    return () => router.events.off('routeChangeComplete', onRouteChange);
  }, [router.events]);

  return (
    <>
      <SearchTrigger variant="nav" />
      {open ? <SearchDialog onClose={close} /> : null}
    </>
  );
}
