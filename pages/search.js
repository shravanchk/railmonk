import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowUpRight, Search, X } from 'lucide-react';
import { CalcLayout } from '../components/calculator/CalcLayout';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Card from '../components/ui/Card';
import { highlight } from '../utils/search/engine';
import {
  SUGGESTED_QUERIES,
  TYPE_LABEL,
  liveDataNotice,
  searchSite,
} from '../utils/search/documents';

const FILTERS = [
  { id: 'all', label: 'Everything' },
  { id: 'tool', label: 'Tools' },
  { id: 'guide', label: 'Guides' },
  { id: 'update', label: 'Rule changes' },
];

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

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const inputRef = useRef(null);

  // This is a static export, so the query string is only readable once the
  // router has hydrated. Seed the field from it exactly once; after that the
  // field owns the value and the URL follows it.
  const seeded = useRef(false);
  useEffect(() => {
    if (!router.isReady || seeded.current) return;
    seeded.current = true;
    const initial = typeof router.query.q === 'string' ? router.query.q : '';
    if (initial) setQuery(initial);
    inputRef.current?.focus();
  }, [router.isReady, router.query.q]);

  // Keep the URL shareable without pushing a history entry per keystroke.
  useEffect(() => {
    if (!seeded.current) return;
    const timer = setTimeout(() => {
      const next = query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search';
      if (next !== router.asPath) router.replace(next, undefined, { shallow: true });
    }, 400);
    return () => clearTimeout(timer);
    // router.asPath is read inside the timeout on purpose — including it here
    // would restart the debounce on our own replace.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const trimmed = query.trim();
  const all = useMemo(() => (trimmed ? searchSite(trimmed, { limit: 50 }) : []), [trimmed]);
  const notice = useMemo(() => (trimmed ? liveDataNotice(trimmed) : null), [trimmed]);
  const results = useMemo(() => (type === 'all' ? all : all.filter((r) => r.type === type)), [all, type]);

  const counts = useMemo(() => {
    const map = { all: all.length };
    for (const filter of FILTERS.slice(1)) map[filter.id] = all.filter((r) => r.type === filter.id).length;
    return map;
  }, [all]);

  return (
    <>
      <Head>
        <title>Search — Railmonk</title>
        <meta
          name="description"
          content="Search every Railmonk rail tool, guide and tracked rule change in one place."
        />
        {/* A results page has nothing durable for a crawler to index, and query
            strings would generate endless near-duplicate URLs. */}
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://railmonk.com/search" />
      </Head>

      <CalcLayout
        eyebrow="Search"
        title="Search Railmonk"
        subtitle="Every tool, guide and tracked rule change. Abbreviations, part-words and typos all work."
      >
        <Breadcrumbs className="-mt-4 mb-6" items={[{ name: 'Home', href: '/' }, { name: 'Search' }]} />

        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/70 dark:bg-slate-800/70 sm:p-5">
          <label htmlFor="site-search" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
            What are you trying to work out?
          </label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              id="site-search"
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “ARP”, “GNWL”, “refund if I cancel”…"
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-[0.95rem] text-ink shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            {query ? (
              <button
                type="button"
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-slate-700"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {trimmed ? (
            <div className="mt-4">
              <p id="type-filter-label" className="text-xs font-bold uppercase tracking-wide text-ink-muted dark:text-slate-500">
                Filter by kind
              </p>
              <div role="group" aria-labelledby="type-filter-label" className="mt-2 flex flex-wrap gap-2">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setType(filter.id)}
                    aria-pressed={type === filter.id}
                    disabled={!counts[filter.id]}
                    className={`min-h-[40px] rounded-xl border px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-40 ${
                      type === filter.id
                        ? 'border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                        : 'border-slate-200 bg-white text-ink-soft hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {filter.label} ({counts[filter.id] || 0})
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {notice ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/40 dark:bg-amber-900/20">
            <p className="font-display text-base font-bold text-amber-900 dark:text-amber-200">{notice.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-amber-900/80 dark:text-amber-200/80">{notice.body}</p>
            <a
              href={notice.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-900 underline dark:text-amber-200"
            >
              {notice.cta}
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : null}

        <p aria-live="polite" className="mt-5 text-sm text-ink-muted dark:text-slate-400">
          {trimmed
            ? `${results.length} result${results.length === 1 ? '' : 's'} for “${trimmed}”`
            : 'Start typing, or pick a suggestion below.'}
        </p>

        {trimmed && results.length ? (
          <ul className="mt-3 space-y-3">
            {results.map((hit) => (
              <li key={hit.href}>
                <Card href={hit.href} className="p-5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${TYPE_STYLES[hit.type]}`}>
                      {TYPE_LABEL[hit.type]}
                    </span>
                    {hit.categoryLabel ? (
                      <span className="text-[0.7rem] font-bold uppercase tracking-wide text-ink-muted dark:text-slate-500">
                        {hit.categoryLabel}
                      </span>
                    ) : null}
                  </span>
                  <h2 className="mt-2 font-display text-base font-semibold text-ink dark:text-white">
                    <Marked text={hit.title} query={trimmed} />
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                    <Marked text={hit.blurb} query={trimmed} />
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        ) : null}

        {trimmed && !results.length ? (
          <Card className="mt-3 p-8 text-center">
            <p className="font-display text-base font-semibold text-ink dark:text-white">
              Nothing matches “{trimmed}”
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted dark:text-slate-400">
              Try a shorter word, or describe what you are working out — a refund amount, a booking date,
              a waitlist code. You can also{' '}
              <Link href="/guides" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
                browse the guides
              </Link>{' '}
              or{' '}
              <Link href="/#topics" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
                every tool by topic
              </Link>
              .
            </p>
          </Card>
        ) : null}

        {!trimmed ? (
          <div className="mt-3">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-muted dark:text-slate-500">
              Common searches
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => { setQuery(q); inputRef.current?.focus(); }}
                  className="min-h-[40px] rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-ink-soft transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:text-slate-300"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </CalcLayout>
    </>
  );
}
