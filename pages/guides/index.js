import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { CalcLayout } from '../../components/calculator/CalcLayout';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Card from '../../components/ui/Card';
import { formatIsoDate } from '../../components/rail/UpdatedStamp';
import { GUIDES, CATEGORIES, categoryLabel, recentlyUpdatedGuides, resolveRelated } from '../../utils/catalog';
import { searchGuides } from '../../utils/search/documents';

const URL = 'https://railmonk.com/guides';

// Only offer filters for topics that actually have a guide behind them.
const GUIDE_CATEGORIES = CATEGORIES.filter((c) => GUIDES.some((g) => g.category === c.id));

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Railmonk Indian Railways guides',
  itemListElement: GUIDES.map((g, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: g.title,
    url: `https://railmonk.com${g.href}`,
  })),
};

export default function GuidesIndexPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const results = useMemo(() => {
    const pool = category === 'all' ? GUIDES : GUIDES.filter((g) => g.category === category);
    if (!query.trim()) return pool;
    // Same engine as site search, so "cancel", "GNWL" and a typo all behave
    // here exactly as they do in the ⌘K dialog. Ranked, not merely filtered.
    const ranked = searchGuides(query, { limit: GUIDES.length });
    const order = new Map(ranked.map((hit, i) => [hit.href, i]));
    return pool
      .filter((g) => order.has(g.href))
      .sort((a, b) => order.get(a.href) - order.get(b.href));
  }, [query, category]);

  const recent = recentlyUpdatedGuides(3);
  const hasFilters = query.trim() !== '' || category !== 'all';

  return (
    <>
      <Head>
        <title>Indian Railways Guides — Booking, Tatkal & Refunds | Railmonk</title>
        <meta
          name="description"
          content="Plain-English guides to Indian Railways: booking online, Tatkal timings, refunds, waitlist and RAC, and train classes — each paired with a calculator."
        />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content="Indian Railways Guides — Railmonk" />
        <meta property="og:description" content="Plain-English guides on IRCTC booking, Tatkal, refunds, waitlists and train classes." />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Indian Railways Guides — Railmonk" />
        <meta name="twitter:description" content="Understand the rule, not just the result." />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="Guides"
        title="Indian Railways guides"
        subtitle="Plain-English explainers that pair with our rail tools — so you understand the rule, not just the result."
      >
        <Breadcrumbs className="-mt-4 mb-6" items={[{ name: 'Home', href: '/' }, { name: 'Guides' }]} />

        {/* Search + topic filters */}
        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/70 dark:bg-slate-800/70 sm:p-5">
          <label htmlFor="guide-search" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
            Search guides
          </label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              id="guide-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “Tatkal”, “waitlist”, “refund”…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-[0.95rem] text-ink shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-slate-700"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mt-4">
            <p id="topic-filter-label" className="text-xs font-bold uppercase tracking-wide text-ink-muted dark:text-slate-500">
              Filter by topic
            </p>
            <div role="group" aria-labelledby="topic-filter-label" className="mt-2 flex flex-wrap gap-2">
              {[{ id: 'all', label: 'All guides' }, ...GUIDE_CATEGORIES].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  aria-pressed={category === c.id}
                  className={`min-h-[40px] rounded-xl border px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    category === c.id
                      ? 'border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                      : 'border-slate-200 bg-white text-ink-soft hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p aria-live="polite" className="mt-5 text-sm text-ink-muted dark:text-slate-400">
          {results.length === GUIDES.length
            ? `${GUIDES.length} guides`
            : `${results.length} of ${GUIDES.length} guides${results.length === 1 ? '' : ''}`}
        </p>

        {results.length ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((g) => {
              const tools = resolveRelated(g.relatedTools, 'tool').slice(0, 2);
              return (
                <Card key={g.href} className="flex h-full flex-col p-5">
                  <span className="text-[0.7rem] font-bold uppercase tracking-wide text-brand-600 dark:text-brand-300">
                    {categoryLabel(g.category)}
                  </span>
                  <h2 className="mt-2 font-display text-base font-semibold text-ink dark:text-white">
                    <Link href={g.href} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                      {g.title}
                    </Link>
                  </h2>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{g.blurb}</p>
                  <p className="mt-3 text-xs text-ink-muted dark:text-slate-500">
                    {g.readingMinutes} min read · Updated <time dateTime={g.updated}>{formatIsoDate(g.updated)}</time>
                  </p>
                  {tools.length ? (
                    <p className="mt-2 text-xs text-ink-muted dark:text-slate-500">
                      Pairs with{' '}
                      {tools.map((t, i) => (
                        <React.Fragment key={t.href}>
                          {i > 0 ? ' and ' : ''}
                          <Link href={t.href} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
                            {t.title}
                          </Link>
                        </React.Fragment>
                      ))}
                    </p>
                  ) : null}
                  <Link
                    href={g.href}
                    className="mt-4 inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
                  >
                    Read guide <span aria-hidden="true">→</span>
                  </Link>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="mt-3 p-8 text-center">
            <p className="font-display text-base font-semibold text-ink dark:text-white">No guides match that search</p>
            <p className="mt-1.5 text-sm text-ink-muted dark:text-slate-400">
              Try a broader word, or clear the filters to see all {GUIDES.length} guides.
            </p>
            <button
              type="button"
              onClick={() => { setQuery(''); setCategory('all'); }}
              className="mt-4 min-h-[44px] rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-ink-soft hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:text-slate-300"
            >
              Clear filters
            </button>
          </Card>
        )}

        {!hasFilters ? (
          <section className="mt-12 border-t border-slate-200/70 pt-8 dark:border-slate-800" aria-labelledby="recent-guides">
            <h2 id="recent-guides" className="font-display text-lg font-bold text-ink dark:text-white">
              Recently updated
            </h2>
            <ul className="mt-3 space-y-2">
              {recent.map((g) => (
                <li key={g.href} className="text-sm">
                  <Link href={g.href} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
                    {g.title}
                  </Link>
                  <span className="text-ink-muted dark:text-slate-500">
                    {' '}
                    — updated <time dateTime={g.updated}>{formatIsoDate(g.updated)}</time>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </CalcLayout>
    </>
  );
}
