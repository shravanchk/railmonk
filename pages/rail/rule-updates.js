import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ExternalLink, FileText, Newspaper } from 'lucide-react';
import { CalcLayout } from '../../components/calculator/CalcLayout';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Card from '../../components/ui/Card';
import { formatIsoDate } from '../../components/rail/UpdatedStamp';
import { recentRuleUpdates, CONFIDENCE_LABEL } from '../../utils/ruleUpdates';
import { getTool, getGuide, categoryLabel } from '../../utils/catalog';

const HREF = '/rail/rule-updates';
const URL = `https://railmonk.com${HREF}`;

const updates = recentRuleUpdates();

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Indian Railways rule changes tracked by Railmonk',
  itemListElement: updates.map((u, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: u.title,
    url: `${URL}#${u.id}`,
  })),
};

export default function RuleUpdatesPage() {
  return (
    <>
      <Head>
        <title>Indian Railways Rule Changes 2026 — What Changed | Railmonk</title>
        <meta
          name="description"
          content="A dated log of IRCTC rule changes affecting booking windows, Tatkal, refunds and chart preparation — each with its effective date and source."
        />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content="Indian Railways Rule Changes | Railmonk" />
        <meta property="og:description" content="What changed, when it took effect, and which tools it affects — with sources." />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="What changed"
        title="Indian Railways rule changes"
        subtitle="Every rule change that alters what our tools calculate, with the date it took effect and where you can check it yourself. If a rule moved and this page does not say so, our tools have not moved either."
      >
        <Breadcrumbs className="-mt-4 mb-6" items={[{ name: 'Home', href: '/' }, { name: 'Rule changes' }]} />

        <ol className="space-y-5">
          {updates.map((u) => {
            const affected = u.affects.map((href) => getTool(href) || getGuide(href)).filter(Boolean);
            return (
              <li key={u.id} id={u.id}>
                <Card className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      Effective {u.effectiveLabel}
                    </span>
                    <span className="text-xs font-medium text-ink-muted dark:text-slate-500">{categoryLabel(u.category)}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[0.7rem] font-semibold ${
                        u.confidence === 'circular'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300'
                          : 'bg-slate-100 text-ink-muted dark:bg-slate-700/60 dark:text-slate-300'
                      }`}
                    >
                      {u.confidence === 'circular' ? <FileText aria-hidden="true" className="h-3 w-3" /> : <Newspaper aria-hidden="true" className="h-3 w-3" />}
                      {CONFIDENCE_LABEL[u.confidence]}
                    </span>
                  </div>

                  <h2 className="mt-3 font-display text-lg font-bold text-ink dark:text-white">{u.title}</h2>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">{u.summary}</p>

                  <div className="mt-4 rounded-xl border-l-4 border-brand-400 bg-brand-50/50 p-3 dark:border-brand-600 dark:bg-brand-900/15">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                      What it means for you
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{u.whatChanged}</p>
                  </div>

                  {u.circular ? (
                    <p className="mt-3 text-xs text-ink-muted dark:text-slate-500">{u.circular}</p>
                  ) : null}

                  {affected.length ? (
                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-ink dark:text-slate-200">
                        Tools updated for this
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {affected.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className="inline-flex rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-brand-700 transition hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:text-brand-300 dark:hover:bg-slate-700/50"
                            >
                              {item.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700/70">
                    <p className="text-xs font-bold uppercase tracking-wide text-ink dark:text-slate-200">Sources</p>
                    <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5">
                      {u.sources.map((s) => (
                        <li key={s.url}>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
                          >
                            {s.label}
                            <ExternalLink aria-hidden="true" className="h-3 w-3 opacity-60" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">How we decide what goes on this page</h2>
          <p className="mt-3">
            Indian Railways rules are announced through Railway Board circulars, and those circulars are what our
            calculators implement. Where we have read the circular itself, the entry above is marked{' '}
            <strong className="text-ink dark:text-white">verified against the circular</strong>{' '}and links to it. Where
            a change was announced publicly but we could not retrieve the underlying circular text, the entry says so
            and cites the reporting instead. The distinction matters: the second kind is likelier to be approximately
            right rather than exactly right, and you should treat the precise minute or rupee with more caution.
          </p>
          <p className="mt-4">
            What you will not find here is a rule change without a date, or a claim about railway operations we
            cannot source. Where only the official IRCTC portal can confirm something for your particular train — live
            availability, actual charting for a delayed service, the status of a specific PNR — our tools say so
            rather than guessing. Corrections are welcome via the{' '}
            <Link href="/contact" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">
              contact page
            </Link>
            ; if we have a rule wrong, we would rather hear it from you than leave it wrong.
          </p>
          <p className="mt-4 text-sm text-ink-muted dark:text-slate-400">
            Last reviewed <time dateTime="2026-07-24">{formatIsoDate('2026-07-24')}</time>. Railmonk is an
            independent informational site and is not affiliated with IRCTC or Indian Railways.
          </p>
        </div>
      </CalcLayout>
    </>
  );
}
