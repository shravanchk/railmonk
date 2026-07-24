import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeIndianRupee,
  BedDouble,
  BellRing,
  Bookmark,
  CalendarClock,
  ClipboardList,
  FileCheck,
  ListOrdered,
  MapPin,
  ScrollText,
  ShieldCheck,
  TicketX,
  TrainFront,
  Zap,
} from 'lucide-react';
import Container from '../ui/Container';
import Card from '../ui/Card';
import SectionHeading from '../ui/SectionHeading';
import Reveal from '../ui/Reveal';
import ReminderPlanner from '../rail/ReminderPlanner';
import { SearchTrigger } from '../search/SiteSearch';
import { formatIsoDate } from '../rail/UpdatedStamp';
import { TOOLS, GUIDES, populatedCategories, categoryLabel } from '../../utils/catalog';
import { recentRuleUpdates } from '../../utils/ruleUpdates';
import { furthestBookableDate } from '../../utils/engines/bookingWindow';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CalendarClock,
  TicketX,
  ClipboardList,
  Zap,
  ListOrdered,
  FileCheck,
  BadgeIndianRupee,
  BedDouble,
  MapPin,
  BellRing,
  Bookmark,
};

const featured = TOOLS.filter((t) => t.featured);
const categories = populatedCategories();
const ruleUpdates = recentRuleUpdates(3);
const popular = GUIDES.filter((g) => g.popular).slice(0, 4);

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Railmonk',
  url: 'https://railmonk.com/',
  description:
    'Indian Railways answers calculated clearly — refunds, Tatkal, booking dates, waitlists, fares, chart timings, TDR and berth tools built on the official rules.',
};

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Railmonk',
  url: 'https://railmonk.com/',
  logo: 'https://railmonk.com/railmonk-logo.svg',
  founder: {
    '@type': 'Person',
    name: 'Shravan Cherukuri',
    sameAs: ['https://www.linkedin.com/in/ch-shravan-kumar-b6a89974/'],
  },
};

const toolListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Railmonk rail tools',
  itemListElement: TOOLS.map((t, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: t.title,
    url: `https://railmonk.com${t.href}`,
  })),
};

/**
 * "Today you can book up to <date>" — resolved in the browser, not at build
 * time. This is a static export, so a server-rendered date would freeze at
 * whenever the site was last deployed and quietly become wrong.
 */
function BookingHorizon() {
  const [horizon, setHorizon] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setHorizon(furthestBookableDate(todayIso));
  }, []);

  return (
    <p className="mt-6 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-ink-soft shadow-soft dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
      <CalendarClock aria-hidden="true" className="h-4 w-4 text-brand-600 dark:text-brand-400" />
      <span>Under the 60-day window, today you can book journeys up to</span>
      <strong className="font-semibold text-ink dark:text-white">
        {horizon ? formatIsoDate(horizon) : '60 days ahead'}
      </strong>
    </p>
  );
}

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Railmonk — Indian Railways answers, calculated clearly</title>
        <meta
          name="description"
          content="Free IRCTC tools built on the official rules: booking dates, Tatkal timings, cancellation refunds, waitlist odds, fares, chart preparation and berths."
        />
        <link rel="canonical" href="https://railmonk.com/" />
        <meta property="og:title" content="Railmonk — Indian Railways answers, calculated clearly" />
        <meta
          property="og:description"
          content="Booking dates, Tatkal, refunds, waitlists, fares, chart timings and berths — IRCTC rules turned into clear answers."
        />
        <meta property="og:url" content="https://railmonk.com/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Railmonk — Indian Railways answers, calculated clearly" />
        <meta name="twitter:description" content="IRCTC rules turned into clear answers. Free, no login, no guesswork." />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolListSchema) }} />
      </Head>

      <div className="bg-white font-sans text-ink dark:bg-slate-900">
        {/* 1 — Hero */}
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-brand-50 via-white to-white dark:border-slate-800 dark:from-slate-800/60 dark:via-slate-900 dark:to-slate-900">
          <Container className="pb-24 pt-16 sm:pb-28 sm:pt-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700 shadow-soft dark:border-slate-700 dark:bg-slate-800 dark:text-brand-400">
                <TrainFront aria-hidden="true" className="h-3.5 w-3.5" />
                Indian Railways tools, minus the guesswork
              </p>
              <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight text-ink dark:text-white sm:text-5xl">
                Indian Railways answers, <span className="text-brand-600 dark:text-brand-400">calculated clearly</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft dark:text-slate-300">
                Railmonk turns dense IRCTC rules into straight answers — refunds, Tatkal, booking dates, waitlists,
                fares, chart timings, TDR claims and berth positions. Every tool cites the rule it implements.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="#tools"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lift transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  Explore rail tools
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <Link
                  href="/rail/irctc-cancellation-calculator"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink-soft transition hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Calculate my refund
                </Link>
              </div>
              <SearchTrigger variant="hero" className="mt-7" />
              <BookingHorizon />
            </div>
          </Container>

          {/* Journey line: a signal dot travels the route, stations pulse as it passes */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-10">
            <div className="relative h-4">
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600/80" />
              {/* stations — delay = 12s × left% − 0.36s so each pulses as the dot arrives */}
              {[
                { left: '12%', delay: '1.08s' },
                { left: '36%', delay: '3.96s' },
                { left: '60%', delay: '6.84s' },
                { left: '84%', delay: '9.72s' },
              ].map((s) => (
                <span
                  key={s.left}
                  className="journey-station absolute top-1/2 -mt-1 h-2 w-2 rounded-full"
                  style={{ left: `calc(${s.left} - 4px)`, animationDelay: s.delay }}
                />
              ))}
              <span className="journey-dot absolute left-0 top-1/2 -mt-[5px] h-2.5 w-2.5 rounded-full bg-brand-500" />
            </div>
          </div>
        </section>

        {/* 2 — Most useful tools */}
        <Reveal>
          <section id="tools" className="scroll-mt-20 py-14 sm:py-16">
            <Container>
              <SectionHeading
                eyebrow="Start here"
                title="The questions people actually arrive with"
                subtitle="Pick the question you have. Every tool shows its inputs up front, explains its method, and says where only IRCTC can confirm the answer."
                action={{ label: 'See all tools by topic', href: '#topics' }}
              />
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((tool) => {
                  const Icon = ICONS[tool.icon] || CalendarClock;
                  return (
                    <Card key={tool.href} href={tool.href} className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-slate-700/70 dark:text-brand-400">
                          <Icon className="h-5 w-5" />
                        </span>
                        {tool.isNew ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            New
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-4 font-display text-lg font-bold text-ink dark:text-white">{tool.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{tool.blurb}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-400">
                        Open tool <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </span>
                    </Card>
                  );
                })}
              </div>
            </Container>
          </section>
        </Reveal>

        {/* 3 — Reminder feature */}
        <Reveal>
          <section className="border-y border-slate-200/70 bg-slate-50 py-14 dark:border-slate-800 dark:bg-slate-900/60 sm:py-16">
            <Container>
              <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center">
                <div>
                  <SectionHeading
                    eyebrow="Never miss a window"
                    title="Set a reminder for the minute booking opens"
                    subtitle="Confirmed berths on busy routes disappear in the first minutes. Pick your journey date and put the exact opening moment in your own calendar."
                  />
                  <ul className="mt-6 space-y-3 text-sm text-ink-soft dark:text-slate-300">
                    {[
                      'Works for the 60-day general window and both Tatkal clocks.',
                      'Alerts fire from your own device — no signal needed.',
                      'No sign-up, no email address, nothing stored by us.',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/rail/booking-reminder"
                    className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
                  >
                    More about reminders <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
                <ReminderPlanner compact heading="Set a reminder" />
              </div>
            </Container>
          </section>
        </Reveal>

        {/* 4 — Recently updated railway rules */}
        <Reveal>
          <section className="py-14 sm:py-16">
            <Container>
              <SectionHeading
                eyebrow="What changed"
                title="Recent rule changes we track"
                subtitle="Rules move, and a calculator built on last year's rules is worse than no calculator. Each change here carries its effective date and its source."
                action={{ label: 'See the full rule log', href: '/rail/rule-updates' }}
              />
              <ul className="mt-8 grid gap-5 lg:grid-cols-3">
                {ruleUpdates.map((u) => (
                  <li key={u.id}>
                    <Card href={`/rail/rule-updates#${u.id}`} className="flex h-full flex-col p-6">
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                        <ScrollText aria-hidden="true" className="h-3.5 w-3.5" />
                        {u.effectiveLabel}
                      </span>
                      <h3 className="mt-3 font-display text-base font-bold text-ink dark:text-white">{u.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{u.summary}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-400">
                        What it means <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </span>
                    </Card>
                  </li>
                ))}
              </ul>
            </Container>
          </section>
        </Reveal>

        {/* 5 — Tool categories */}
        <Reveal>
          <section id="topics" className="scroll-mt-20 border-t border-slate-200/70 bg-slate-50 py-14 dark:border-slate-800 dark:bg-slate-900/60 sm:py-16">
            <Container>
              <SectionHeading
                eyebrow="Every tool"
                title="Browse by topic"
                subtitle="The full set, grouped by the part of the journey it answers for."
              />
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => (
                  <Card key={cat.id} className="p-6">
                    <h3 className="font-display text-base font-bold text-ink dark:text-white">{cat.label}</h3>
                    <p className="mt-1 text-sm text-ink-muted dark:text-slate-400">{cat.blurb}</p>
                    <ul className="mt-4 space-y-2">
                      {cat.tools.map((tool) => (
                        <li key={tool.href}>
                          <Link
                            href={tool.href}
                            className="group inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
                          >
                            {tool.title}
                            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                          </Link>
                        </li>
                      ))}
                      {cat.guides.map((guide) => (
                        <li key={guide.href}>
                          <Link
                            href={guide.href}
                            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-brand-700 hover:underline dark:text-slate-400 dark:hover:text-brand-300"
                          >
                            {guide.title}
                            <span className="text-[0.65rem] font-semibold uppercase tracking-wide opacity-70">Guide</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </Container>
          </section>
        </Reveal>

        {/* 6 — Popular guides */}
        <Reveal>
          <section className="py-14 sm:py-16">
            <Container>
              <SectionHeading
                eyebrow="Guides"
                title="Understand the rule, not just the result"
                subtitle="Plain-English explainers that pair with the tools — written to be read once and remembered."
                action={{ label: 'Browse all guides', href: '/guides' }}
              />
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {popular.map((guide) => (
                  <Card key={guide.href} href={guide.href} className="flex h-full flex-col p-6">
                    <span className="text-[0.7rem] font-bold uppercase tracking-wide text-brand-600 dark:text-brand-300">
                      {categoryLabel(guide.category)}
                    </span>
                    <h3 className="mt-2 font-display text-base font-bold text-ink dark:text-white">{guide.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{guide.blurb}</p>
                    <span className="mt-4 text-xs text-ink-muted dark:text-slate-500">
                      {guide.readingMinutes} min read · Updated{' '}
                      <time dateTime={guide.updated}>{formatIsoDate(guide.updated)}</time>
                    </span>
                  </Card>
                ))}
              </div>
            </Container>
          </section>
        </Reveal>

        {/* 7 — Trust / methodology */}
        <Reveal>
          <section className="border-t border-slate-200/70 bg-slate-50 py-14 dark:border-slate-800 dark:bg-slate-900/60 sm:py-16">
            <Container>
              <SectionHeading eyebrow="Why Railmonk" title="Built on the rules, not on hearsay" align="center" />
              <div className="mx-auto mt-8 grid max-w-4xl gap-5 sm:grid-cols-3">
                {[
                  {
                    Icon: ShieldCheck,
                    title: 'Official rule sets',
                    body: 'Every tool cites the circular or fare table it implements, with the date that rule took effect.',
                  },
                  {
                    Icon: BadgeIndianRupee,
                    title: 'Rupee answers',
                    body: 'Not just percentages — the actual amount you get back or pay extra, itemised per passenger.',
                  },
                  {
                    Icon: TrainFront,
                    title: 'Honest caveats',
                    body: 'Where only the official IRCTC portal can confirm something, the tools say so plainly instead of guessing.',
                  },
                ].map(({ Icon, title, body }) => (
                  <div key={title} className="text-center">
                    <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-400">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 font-display text-base font-bold text-ink dark:text-white">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{body}</p>
                  </div>
                ))}
              </div>
              <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-ink-muted dark:text-slate-500">
                Railmonk is an independent informational site and is not affiliated with IRCTC or Indian Railways.
                We do not provide live train running data or PNR status — for those, use the{' '}
                <a href="https://www.irctc.co.in/" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
                  official IRCTC portal
                </a>
                . Looking for salary, tax, and loan calculators? Visit our sister site{' '}
                <a href="https://upaman.com/" rel="noopener" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
                  Upaman
                </a>
                .
              </p>
            </Container>
          </section>
        </Reveal>
      </div>
    </>
  );
}
