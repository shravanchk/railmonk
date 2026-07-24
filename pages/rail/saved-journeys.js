import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Bookmark, CalendarPlus, Laptop, Trash2 } from 'lucide-react';
import { CalcLayout } from '../../components/calculator/CalcLayout';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Card from '../../components/ui/Card';
import RelatedContent from '../../components/rail/RelatedContent';
import NextStep from '../../components/rail/NextStep';
import { formatIsoDate } from '../../components/rail/UpdatedStamp';
import { loadJourneys, removeJourney, clearJourneys } from '../../utils/savedJourneys';
import { computeBookingWindow, getQuota } from '../../utils/engines/bookingWindow';
import { buildGoogleCalendarUrl } from '../../utils/reminders';
import { buildFaqSchema } from '../../utils/faqSchema';

const HREF = '/rail/saved-journeys';
const URL = `https://railmonk.com${HREF}`;

const FAQS = [
  {
    question: 'Where are my saved journeys stored?',
    answer:
      'In your browser, on this device only. Railmonk has no account system and no server-side storage, so a saved journey never leaves your machine. Clearing your browser data, or opening the site in a different browser or on another device, means the list will be empty.',
  },
  {
    question: 'Do I need to sign up to save a journey?',
    answer:
      'No. There is no account, no email address and no password. Saving is a single button, and removing a journey deletes it immediately and permanently.',
  },
  {
    question: 'Will saving a journey alert me when booking opens?',
    answer:
      'The saved list shows a live countdown whenever you visit, but the browser cannot notify you on its own. For an actual alert, add the calendar reminder — that fires on your device at the time you choose, whether or not you have the site open.',
  },
];

const STATUS_STYLES = {
  'open-today': 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300',
  'window-open': 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300',
  upcoming: 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-800/60 dark:bg-brand-900/20 dark:text-brand-300',
  'journey-passed': 'border-slate-200 bg-slate-50 text-ink-muted dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400',
};

const statusText = (w) => {
  if (!w) return '';
  if (w.status === 'journey-passed') return 'Journey date has passed';
  if (w.status === 'window-open') return 'Booking is open now';
  if (w.status === 'open-today') return `Booking opens today at ${w.quota.openTimeLabel}`;
  return `Opens in ${w.daysUntilOpen} ${w.daysUntilOpen === 1 ? 'day' : 'days'}`;
};

export default function SavedJourneysPage() {
  // `null` means "not read yet" — it keeps the server-rendered markup and the
  // first client paint identical, so there is no hydration mismatch and no
  // flash of the empty state for people who do have journeys saved.
  const [journeys, setJourneys] = useState(null);
  const [today, setToday] = useState('');

  useEffect(() => {
    const now = new Date();
    setToday(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    setJourneys(loadJourneys());
  }, []);

  const handleRemove = (id) => {
    const next = removeJourney(id);
    if (next) setJourneys(next);
  };

  const handleClear = () => {
    const next = clearJourneys();
    if (next) setJourneys(next);
  };

  return (
    <>
      <Head>
        <title>Saved Journeys — Track Your Booking Windows | Railmonk</title>
        <meta
          name="description"
          content="Keep your upcoming train journeys in one place with a live countdown to each booking window. Stored on your device only — no account, no sign-up."
        />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content="Saved Journeys | Railmonk" />
        <meta property="og:description" content="Your upcoming journeys with a countdown to each booking window. No account needed." />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        {/* Personal, device-local and empty for crawlers — no value in the index. */}
        <meta name="robots" content="noindex, follow" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(FAQS)) }} />
      </Head>

      <CalcLayout
        eyebrow="Train planning"
        title="Saved journeys"
        subtitle="Your upcoming trips with a countdown to each booking window. Everything here lives in this browser on this device — there is no account and nothing is sent to Railmonk."
      >
        <Breadcrumbs
          className="-mt-4 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Rail tools', href: '/#tools' }, { name: 'Saved journeys' }]}
        />

        <div aria-live="polite">
          {journeys === null ? (
            <Card className="p-8 text-center text-sm text-ink-muted dark:text-slate-400">Loading your saved journeys…</Card>
          ) : journeys.length === 0 ? (
            <Card className="flex flex-col items-center p-10 text-center">
              <Bookmark aria-hidden="true" className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              <h2 className="mt-4 font-display text-lg font-bold text-ink dark:text-white">No journeys saved yet</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                Set a booking reminder for a trip and choose &ldquo;Save this journey&rdquo; — it will appear here
                with a countdown to the minute its booking window opens.
              </p>
              <Link
                href="/rail/booking-reminder"
                className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lift transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <CalendarPlus aria-hidden="true" className="h-4 w-4" />
                Set your first reminder
              </Link>
            </Card>
          ) : (
            <>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {journeys.map((j) => {
                  const w = computeBookingWindow({ journeyDate: j.journeyDate, quotaId: j.quotaId, today });
                  const quota = getQuota(j.quotaId);
                  return (
                    <li key={j.id}>
                      <Card className="flex h-full flex-col p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="font-display text-base font-bold text-ink dark:text-white">
                              {j.label || 'Train journey'}
                            </h2>
                            <p className="mt-0.5 text-sm text-ink-muted dark:text-slate-400">
                              <time dateTime={j.journeyDate}>{formatIsoDate(j.journeyDate)}</time>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemove(j.id)}
                            aria-label={`Remove ${j.label || 'journey'} on ${formatIsoDate(j.journeyDate)}`}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-ink-muted transition hover:border-rose-300 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 dark:border-slate-700 dark:text-slate-400"
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="mt-3 text-xs font-medium text-ink-muted dark:text-slate-500">{quota.label}</p>

                        {w ? (
                          <>
                            <p className={`mt-2 inline-flex w-fit rounded-lg border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[w.status] || STATUS_STYLES.upcoming}`}>
                              {statusText(w)}
                            </p>
                            <p className="mt-3 flex-1 text-sm text-ink-soft dark:text-slate-300">
                              Booking opens{' '}
                              <strong className="text-ink dark:text-white">{formatIsoDate(w.opensDate)}</strong> at{' '}
                              {quota.openTimeLabel}.
                            </p>
                            {w.status !== 'journey-passed' ? (
                              <a
                                href={buildGoogleCalendarUrl({
                                  title: `IRCTC booking opens${j.label ? ` — ${j.label}` : ''}`,
                                  startWallIst: w.opensWallIso,
                                  durationMinutes: 30,
                                  description: `Booking opens at ${quota.openTimeLabel} for your journey on ${formatIsoDate(j.journeyDate)}.`,
                                  url: 'https://www.irctc.co.in/nget/train-search',
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
                              >
                                <CalendarPlus aria-hidden="true" className="h-4 w-4" />
                                Add to calendar
                              </a>
                            ) : null}
                          </>
                        ) : null}
                      </Card>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  href="/rail/booking-reminder"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lift transition hover:bg-brand-700"
                >
                  <CalendarPlus aria-hidden="true" className="h-4 w-4" />
                  Add another journey
                </Link>
                <button
                  type="button"
                  onClick={handleClear}
                  className="min-h-[44px] rounded-xl px-3 text-sm font-medium text-ink-muted underline underline-offset-2 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 dark:text-slate-400"
                >
                  Clear all saved journeys
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-ink-soft dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          <Laptop aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
          <p>
            <strong className="text-ink dark:text-white">This list is device-local.</strong>{' '}It is held in your
            browser&apos;s storage, not on our servers — so it will not follow you to another phone or browser, and
            clearing your browsing data clears it. That is the trade-off for not asking you to create an account.
            For an alert that actually reaches you, use the calendar reminder as well.
          </p>
        </div>

        <NextStep
          title="Turn a saved journey into an actual alert"
          body="A countdown only helps when you visit. The reminder tool builds a calendar event that fires on your phone at the moment your booking window opens."
          href="/rail/booking-reminder"
          cta="Set a booking reminder"
          secondary={{ href: '/rail/chart-preparation-time', label: 'Check chart preparation time' }}
        />

        <section className="mt-12" aria-labelledby="saved-faq">
          <h2 id="saved-faq" className="font-display text-xl font-bold text-ink dark:text-white">
            Frequently asked questions
          </h2>
          <div className="mt-4 space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.question} className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/70 dark:bg-slate-800/70">
                <summary className="cursor-pointer select-none font-display text-[0.98rem] font-semibold text-ink dark:text-white">
                  {faq.question}
                </summary>
                <p className="mt-2.5 text-[0.92rem] leading-relaxed text-ink-soft dark:text-slate-300">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <RelatedContent href={HREF} kind="tool" />
      </CalcLayout>
    </>
  );
}
