import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Clock, CornerDownLeft, Search, X } from 'lucide-react';
import { highlight } from '../../utils/search/engine';
import {
  SEARCH_DOCUMENTS,
  SUGGESTED_QUERIES,
  TYPE_LABEL,
  liveDataNotice,
  searchSite,
} from '../../utils/search/documents';

const RECENT_KEY = 'railmonk.recentSearches.v1';
const MAX_RECENT = 5;
const MAX_RESULTS = 8;

// Recent searches never leave the device — same posture as saved journeys.
// A search history is a record of what someone is worried about, and there is
// no version of this feature that is worth sending anywhere.
const loadRecent = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY));
    return Array.isArray(raw) ? raw.filter((q) => typeof q === 'string').slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
};

const storeRecent = (query) => {
  const trimmed = query.trim();
  if (trimmed.length < 2) return;
  try {
    const next = [trimmed, ...loadRecent().filter((q) => q.toLowerCase() !== trimmed.toLowerCase())];
    localStorage.setItem(RECENT_KEY, JSON.stringify(next.slice(0, MAX_RECENT)));
  } catch {
    /* storage unavailable — the feature simply does not persist */
  }
};

const TYPE_STYLES = {
  tool: 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
  guide: 'bg-slate-100 text-ink-soft dark:bg-slate-700 dark:text-slate-300',
  update: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  page: 'bg-slate-100 text-ink-muted dark:bg-slate-700 dark:text-slate-400',
};

function Marked({ text, query }) {
  return highlight(text, query).map((segment, i) =>
    segment.hit ? (
      <mark key={i} className="rounded bg-brand-100 px-0.5 text-inherit dark:bg-brand-500/30">
        {segment.text}
      </mark>
    ) : (
      <React.Fragment key={i}>{segment.text}</React.Fragment>
    ),
  );
}

// Before anything is typed: the featured tools, so the dialog is a shortcut to
// the site rather than an empty box.
const DEFAULT_RESULTS = SEARCH_DOCUMENTS.filter((d) => d.type === 'tool' && d.boost >= 6).slice(0, 5);

export default function SearchDialog({ onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    setRecent(loadRecent());
    inputRef.current?.focus();
  }, []);

  // Hold the page still behind the dialog.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  const trimmed = query.trim();
  const results = useMemo(
    () => (trimmed ? searchSite(trimmed, { limit: MAX_RESULTS }) : DEFAULT_RESULTS),
    [trimmed],
  );
  const notice = useMemo(() => (trimmed ? liveDataNotice(trimmed) : null), [trimmed]);
  const total = useMemo(() => (trimmed ? searchSite(trimmed, { limit: 100 }).length : 0), [trimmed]);

  useEffect(() => {
    setActive(0);
  }, [trimmed]);

  const go = useCallback(
    (href) => {
      if (trimmed) storeRecent(trimmed);
      onClose();
      router.push(href);
    },
    [router, onClose, trimmed],
  );

  const seeAll = useCallback(() => {
    if (!trimmed) return;
    storeRecent(trimmed);
    onClose();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }, [router, onClose, trimmed]);

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey && results.length)) {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey && results.length)) {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (results[active]) go(results[active].href);
      else if (trimmed) seeAll();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const showingDefaults = !trimmed;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Search Railmonk">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-x-0 top-0 mx-auto mt-[8vh] w-full max-w-2xl px-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900">
          {/* Input row */}
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-700">
            <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-ink-muted" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls="site-search-results"
              aria-autocomplete="list"
              aria-activedescendant={results[active] ? `site-search-option-${active}` : undefined}
              aria-label="Search tools, guides and rule changes"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search tools, guides and rules…"
              autoComplete="off"
              spellCheck="false"
              className="h-14 w-full bg-transparent text-base text-ink outline-none placeholder:text-ink-muted dark:text-white"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-slate-800"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          {/* We do not have live train data — say so rather than returning the
              nearest calculator and hoping. */}
          {notice ? (
            <div className="border-b border-amber-200/70 bg-amber-50/70 px-4 py-3 text-sm dark:border-amber-900/40 dark:bg-amber-900/20">
              <p className="font-semibold text-amber-900 dark:text-amber-200">{notice.title}</p>
              <p className="mt-1 leading-relaxed text-amber-900/80 dark:text-amber-200/80">{notice.body}</p>
              <a
                href={notice.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-amber-900 underline dark:text-amber-200"
              >
                {notice.cta}
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : null}

          <div className="max-h-[55vh] overflow-y-auto" ref={listRef}>
            <p className="sr-only" aria-live="polite">
              {trimmed
                ? `${total} result${total === 1 ? '' : 's'} for ${trimmed}`
                : 'Type to search'}
            </p>

            {results.length ? (
              <>
                <p className="px-4 pt-3 text-xs font-bold uppercase tracking-wide text-ink-muted dark:text-slate-500">
                  {showingDefaults ? 'Most used tools' : 'Results'}
                </p>
                <ul id="site-search-results" role="listbox" aria-label="Search results" className="p-2">
                  {results.map((hit, i) => (
                    <li key={hit.href} role="none">
                      <button
                        type="button"
                        id={`site-search-option-${i}`}
                        role="option"
                        aria-selected={i === active}
                        data-active={i === active}
                        onClick={() => go(hit.href)}
                        onMouseMove={() => setActive(i)}
                        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                          i === active ? 'bg-brand-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-ink dark:text-white">
                              <Marked text={hit.title} query={trimmed} />
                            </span>
                            <span className={`rounded px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${TYPE_STYLES[hit.type]}`}>
                              {TYPE_LABEL[hit.type]}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-sm text-ink-muted dark:text-slate-400">
                            <Marked text={hit.blurb} query={trimmed} />
                          </span>
                        </span>
                        {i === active ? (
                          <CornerDownLeft aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>

                {trimmed && total > results.length ? (
                  <button
                    type="button"
                    onClick={seeAll}
                    className="flex w-full items-center justify-between border-t border-slate-200 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 dark:border-slate-700 dark:text-brand-300 dark:hover:bg-slate-800"
                  >
                    See all {total} results for “{trimmed}”
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </button>
                ) : null}
              </>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="font-display text-base font-semibold text-ink dark:text-white">
                  Nothing matches “{trimmed}”
                </p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                  Try a shorter word, or the name of what you are trying to work out — a refund amount,
                  a booking date, a waitlist code.
                </p>
              </div>
            )}

            {/* Recent and suggested queries only while the box is empty. */}
            {showingDefaults ? (
              <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
                {recent.length ? (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-muted dark:text-slate-500">Recent</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {recent.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => { setQuery(q); inputRef.current?.focus(); }}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink-soft transition hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:text-slate-300"
                        >
                          <Clock aria-hidden="true" className="h-3.5 w-3.5 text-ink-muted" />
                          {q}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-ink-muted dark:text-slate-500">
                  Try searching for
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUGGESTED_QUERIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => { setQuery(q); inputRef.current?.focus(); }}
                      className="min-h-[40px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink-soft transition hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:text-slate-300"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer hints. Hidden on touch widths where there is no keyboard. */}
          <div className="hidden items-center justify-between gap-4 border-t border-slate-200 px-4 py-2.5 text-xs text-ink-muted dark:border-slate-700 dark:text-slate-500 sm:flex">
            <span className="flex items-center gap-3">
              <span><kbd className="rounded border border-slate-300 px-1.5 py-0.5 font-sans dark:border-slate-600">↑</kbd> <kbd className="rounded border border-slate-300 px-1.5 py-0.5 font-sans dark:border-slate-600">↓</kbd> to move</span>
              <span><kbd className="rounded border border-slate-300 px-1.5 py-0.5 font-sans dark:border-slate-600">↵</kbd> to open</span>
              <span><kbd className="rounded border border-slate-300 px-1.5 py-0.5 font-sans dark:border-slate-600">esc</kbd> to close</span>
            </span>
            <Link href="/search" onClick={onClose} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
              Full search page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
