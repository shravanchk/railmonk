import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeIndianRupee,
  BedDouble,
  CalendarClock,
  FileCheck,
  ShieldCheck,
  Sparkles,
  TicketX,
  TrainFront,
  Zap,
} from 'lucide-react';
import Container from '../ui/Container';
import Card from '../ui/Card';
import SectionHeading from '../ui/SectionHeading';
import Reveal from '../ui/Reveal';

const TOOLS = [
  {
    href: '/rail/irctc-calculator',
    title: 'IRCTC Booking Date Calculator',
    desc: 'Find the exact date and time your ticket window opens — general quota and Tatkal — so you are ready the second booking starts.',
    Icon: CalendarClock,
  },
  {
    href: '/rail/irctc-cancellation-calculator',
    title: 'Cancellation Refund Calculator',
    desc: 'See the rupee amount you will actually get back before you cancel, using the official refund slabs for every class and timing.',
    Icon: TicketX,
  },
  {
    href: '/rail/tatkal-charges-calculator',
    title: 'Tatkal Charges Calculator',
    desc: 'Know the real Tatkal premium over the base fare for your class and distance before you pay it.',
    Icon: Zap,
  },
  {
    href: '/rail/tdr-refund-checker',
    title: 'TDR Refund Checker',
    desc: 'Check whether your situation qualifies for a TDR refund, what share you can claim, and the filing deadline that applies.',
    Icon: FileCheck,
  },
  {
    href: '/rail/berth-position-finder',
    title: 'Berth Position Finder',
    desc: 'Turn a seat number into its coach layout position — lower, middle, upper, side — before you board.',
    Icon: BedDouble,
  },
];

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Railmonk',
  url: 'https://railmonk.com/',
  description: 'Free IRCTC and Indian Railways tools: cancellation refunds, Tatkal charges, TDR eligibility, booking dates, and berth positions.',
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

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Railmonk — IRCTC refund, Tatkal, TDR & berth tools for Indian Railways</title>
        <meta name="description" content="Free Indian Railways tools: calculate IRCTC cancellation refunds, Tatkal charges, TDR refund eligibility, booking-window dates, and berth positions — built on the official rules." />
        <link rel="canonical" href="https://railmonk.com/" />
        <meta property="og:title" content="Railmonk — IRCTC refund, Tatkal, TDR & berth tools" />
        <meta property="og:description" content="Know your refund before you cancel. Free IRCTC and Indian Railways tools built on the official rules." />
        <meta property="og:url" content="https://railmonk.com/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      </Head>
      <div className="bg-white font-sans text-ink dark:bg-slate-900">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-brand-50 via-white to-white dark:border-slate-800 dark:from-slate-800/60 dark:via-slate-900 dark:to-slate-900">
          <Container className="py-16 sm:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700 shadow-soft dark:border-slate-700 dark:bg-slate-800 dark:text-brand-400">
                <TrainFront className="h-3.5 w-3.5" />
                Indian Railways tools, minus the guesswork
              </p>
              <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight text-ink dark:text-white sm:text-5xl">
                Know your refund <span className="text-brand-600 dark:text-brand-400">before</span> you cancel
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft dark:text-slate-300">
                Railmonk turns IRCTC&apos;s dense fare and refund rules into instant answers — cancellation refunds,
                Tatkal charges, TDR eligibility, booking windows, and berth positions.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/rail/irctc-cancellation-calculator"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lift transition hover:bg-brand-700"
                >
                  Calculate my refund
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/rail/guides/irctc-booking-strategy"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink-soft transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Read the booking strategy guide
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* Tool grid */}
        <Reveal>
          <section className="py-14 sm:py-16">
            <Container>
              <SectionHeading
                eyebrow="Rail tools"
                title="Every tool answers one real question"
                subtitle="No logins, no ads in your way — pick the question you have and get the number."
              />
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {TOOLS.map(({ href, title, desc, Icon }) => (
                  <Card key={href} href={href} className="p-6">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-slate-700/70 dark:text-brand-400">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-bold text-ink dark:text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-400">
                      Open tool <ArrowRight className="h-4 w-4" />
                    </span>
                  </Card>
                ))}
                <Card href="/rail/guides/irctc-booking-strategy" className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white dark:from-brand-700 dark:to-brand-900">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold">IRCTC Booking Strategy Guide</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/85">
                    When windows open, how quotas work, and how to raise your odds of a confirmed ticket.
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                    Read the guide <ArrowRight className="h-4 w-4" />
                  </span>
                </Card>
              </div>
            </Container>
          </section>
        </Reveal>

        {/* Why Railmonk */}
        <Reveal>
          <section className="border-t border-slate-200/70 bg-slate-50 py-14 dark:border-slate-800 dark:bg-slate-900/60 sm:py-16">
            <Container>
              <SectionHeading
                eyebrow="Why Railmonk"
                title="Built on the rules, not on hearsay"
                align="center"
              />
              <div className="mx-auto mt-8 grid max-w-4xl gap-5 sm:grid-cols-3">
                <div className="text-center">
                  <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-400">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-display text-base font-bold text-ink dark:text-white">Official rule sets</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                    Every tool cites the railway refund rules and fare tables it implements, with effective dates.
                  </p>
                </div>
                <div className="text-center">
                  <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-400">
                    <BadgeIndianRupee className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-display text-base font-bold text-ink dark:text-white">Rupee answers</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                    Not just percentages — the actual amount you get back or pay extra, per passenger.
                  </p>
                </div>
                <div className="text-center">
                  <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-400">
                    <TrainFront className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-display text-base font-bold text-ink dark:text-white">Honest caveats</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                    Where only the official IRCTC portal can confirm something, the tools say so plainly.
                  </p>
                </div>
              </div>
              <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-ink-muted dark:text-slate-500">
                Railmonk is an independent informational site and is not affiliated with IRCTC or Indian Railways.
                Looking for salary, tax, and loan calculators? Visit our sister site{' '}
                <a href="https://upaman.com/" rel="noopener" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">Upaman</a>.
              </p>
            </Container>
          </section>
        </Reveal>
      </div>
    </>
  );
}
