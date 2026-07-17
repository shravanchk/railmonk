import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { CalcLayout } from '../../components/calculator/CalcLayout';
import Card from '../../components/ui/Card';

const GUIDES = [
  {
    title: 'IRCTC Booking Strategy',
    desc: 'A preparation system for regular and Tatkal train bookings — windows, quotas, and confirmation odds.',
    href: '/guides/irctc-booking-strategy',
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
