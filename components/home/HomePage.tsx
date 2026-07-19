import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeIndianRupee,
  BedDouble,
  CalendarClock,
  FileCheck,
  ListOrdered,
  MapPin,
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
  {
    href: '/rail/waitlist-confirmation-chances',
    title: 'Waitlist Confirmation Chances',
    desc: 'Decode GNWL, RLWL, PQWL, TQWL and RAC — and get an honest estimate of whether your waitlisted ticket will confirm.',
    Icon: ListOrdered,
  },
  {
    href: '/rail/coach-position-finder',
    title: 'Coach Position Finder',
    desc: 'See where coach S4, B2 or A1 typically stands — front, middle, or rear — so you wait at the right end of the platform.',
    Icon: MapPin,
  },
  {
    href: '/rail/train-fare-calculator',
    title: 'Train Fare Calculator',
    desc: 'Estimate the fare from distance and class — base fare, reservation fee, superfast charge, and GST itemized.',
    Icon: BadgeIndianRupee,
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
          <Container className="pb-28 pt-16 sm:pb-32 sm:pt-20">
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

          {/* Animated train crossing the hero on its track */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0">
            <div className="hero-train absolute bottom-[9px] left-0 text-ink dark:text-slate-400">
              <svg width="160" height="48" viewBox="0 0 160 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* steam puffs above the chimney */}
                <g fill="currentColor" opacity="0.55">
                  <circle className="hero-steam" cx="141" cy="10" r="3" />
                  <circle className="hero-steam hero-steam-2" cx="143" cy="9" r="2.4" />
                  <circle className="hero-steam hero-steam-3" cx="139" cy="11" r="2" />
                </g>
                {/* coaches */}
                <rect x="2" y="18" width="44" height="20" rx="4" fill="currentColor" />
                <rect x="8" y="23" width="8" height="6" rx="1.5" fill="#fff7ed" />
                <rect x="20" y="23" width="8" height="6" rx="1.5" fill="#fff7ed" />
                <rect x="32" y="23" width="8" height="6" rx="1.5" fill="#fff7ed" />
                <rect x="52" y="18" width="44" height="20" rx="4" fill="currentColor" />
                <rect x="58" y="23" width="8" height="6" rx="1.5" fill="#fff7ed" />
                <rect x="70" y="23" width="8" height="6" rx="1.5" fill="#fff7ed" />
                <rect x="82" y="23" width="8" height="6" rx="1.5" fill="#fff7ed" />
                {/* couplers */}
                <rect x="46" y="26" width="6" height="4" fill="currentColor" opacity="0.7" />
                <rect x="96" y="26" width="6" height="4" fill="currentColor" opacity="0.7" />
                {/* locomotive (facing right) */}
                <rect x="102" y="20" width="52" height="18" rx="4" fill="#ea580c" />
                <rect x="102" y="10" width="22" height="14" rx="3" fill="#c2410c" />
                <rect x="106" y="13" width="7" height="6" rx="1.5" fill="#fff7ed" />
                <rect x="136" y="8" width="7" height="12" rx="2" fill="#c2410c" />
                <path d="M154 38V26l6 12h-6z" fill="#c2410c" />
                {/* wheels with a spoke so the spin reads */}
                <g className="hero-train-wheel">
                  <circle cx="12" cy="40" r="5" fill="currentColor" />
                  <line x1="12" y1="36.5" x2="12" y2="43.5" stroke="#fff7ed" strokeWidth="1.4" />
                </g>
                <g className="hero-train-wheel">
                  <circle cx="36" cy="40" r="5" fill="currentColor" />
                  <line x1="36" y1="36.5" x2="36" y2="43.5" stroke="#fff7ed" strokeWidth="1.4" />
                </g>
                <g className="hero-train-wheel">
                  <circle cx="62" cy="40" r="5" fill="currentColor" />
                  <line x1="62" y1="36.5" x2="62" y2="43.5" stroke="#fff7ed" strokeWidth="1.4" />
                </g>
                <g className="hero-train-wheel">
                  <circle cx="86" cy="40" r="5" fill="currentColor" />
                  <line x1="86" y1="36.5" x2="86" y2="43.5" stroke="#fff7ed" strokeWidth="1.4" />
                </g>
                <g className="hero-train-wheel">
                  <circle cx="112" cy="40" r="5" fill="#7c2d12" />
                  <line x1="112" y1="36.5" x2="112" y2="43.5" stroke="#fff7ed" strokeWidth="1.4" />
                </g>
                <g className="hero-train-wheel">
                  <circle cx="132" cy="40" r="5" fill="#7c2d12" />
                  <line x1="132" y1="36.5" x2="132" y2="43.5" stroke="#fff7ed" strokeWidth="1.4" />
                </g>
                <g className="hero-train-wheel">
                  <circle cx="148" cy="40" r="5" fill="#7c2d12" />
                  <line x1="148" y1="36.5" x2="148" y2="43.5" stroke="#fff7ed" strokeWidth="1.4" />
                </g>
              </svg>
            </div>
            {/* rail */}
            <div className="h-[2px] w-full bg-slate-300/90 dark:bg-slate-700" />
            {/* sleepers */}
            <div className="h-[5px] w-full bg-[repeating-linear-gradient(90deg,rgba(148,163,184,0.55)_0px,rgba(148,163,184,0.55)_8px,transparent_8px,transparent_26px)] dark:bg-[repeating-linear-gradient(90deg,rgba(51,65,85,0.9)_0px,rgba(51,65,85,0.9)_8px,transparent_8px,transparent_26px)]" />
          </div>
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
