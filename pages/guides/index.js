import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { CalcLayout } from '../../components/calculator/CalcLayout';
import Card from '../../components/ui/Card';

const GUIDES = [
  {
    title: 'How to Book a Train Ticket Online',
    desc: "First-timer's walkthrough: create an IRCTC account, search trains, read availability codes, pay, and travel on an e-ticket.",
    href: '/rail/guides/how-to-book-train-ticket-online',
  },
  {
    title: 'Train Classes Explained',
    desc: '1A vs 2A vs 3A vs 3E vs SL vs CC vs EC vs 2S — berths, comfort, bedding, and who each class actually suits.',
    href: '/rail/guides/train-classes-explained',
  },
  {
    title: 'Waitlist & RAC Survival Guide',
    desc: 'GNWL, RLWL, PQWL and TQWL decoded — how charting works, your RAC rights, and what to do at each stage.',
    href: '/rail/guides/waitlist-rac-guide',
  },
  {
    title: 'Tatkal Booking Masterclass',
    desc: 'Exact timings, the Aadhaar rule, master-list prep, payment strategy, and a minute-by-minute booking plan.',
    href: '/rail/guides/tatkal-booking-masterclass',
  },
  {
    title: 'Vande Bharat Express Guide',
    desc: 'Booking, CC vs Executive class, fares and opt-in catering, and practical tips before you board.',
    href: '/rail/guides/vande-bharat-guide',
  },
  {
    title: 'IRCTC Booking Strategy',
    desc: 'A preparation system for regular and Tatkal train bookings — windows, quotas, and confirmation odds.',
    href: '/rail/guides/irctc-booking-strategy',
  },
];

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: GUIDES.map((g, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: g.title,
    url: `https://railmonk.com${g.href}`,
  })),
};

export default function GuidesIndexPage() {
  return (
    <>
      <Head>
        <title>Indian Railways Guides — Railmonk</title>
        <meta name="description" content="Plain-English guides on IRCTC booking, refunds, and train travel that pair with Railmonk's rail tools." />
        <link rel="canonical" href="https://railmonk.com/guides" />
        <meta property="og:title" content="Indian Railways Guides — Railmonk" />
        <meta property="og:description" content="Plain-English guides on IRCTC booking, refunds, and train travel." />
        <meta property="og:url" content="https://railmonk.com/guides" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="Guides"
        title="Indian Railways guides"
        subtitle="Plain-English explainers that pair with our rail tools — so you understand the rule, not just the result."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g) => (
            <Link key={g.href} href={g.href} className="group">
              <Card className="flex h-full flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-card">
                <h3 className="font-display text-base font-semibold text-ink dark:text-white">{g.title}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{g.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:text-brand-700 dark:text-brand-300">
                  Read guide <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </CalcLayout>
    </>
  );
}
