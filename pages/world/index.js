import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, Clock3, Globe2, Mountain, Scale } from 'lucide-react';
import { CalcLayout } from '../../components/calculator/CalcLayout';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Card from '../../components/ui/Card';
import { toolsInCategory } from '../../utils/catalog';
import { OPERATORS } from '../../utils/engines/bookingHorizons';
import { SCHEMES } from '../../utils/engines/delayCompensation';

const URL = 'https://railmonk.com/world';

const WORLD_TOOLS = toolsInCategory('world');

const ICONS = {
  '/world/delay-compensation': Scale,
  '/world/booking-windows': Clock3,
  '/world/swiss-travel-pass-calculator': Mountain,
};

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Railmonk tools for trains outside India',
  itemListElement: WORLD_TOOLS.map((t, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: t.title,
    url: `https://railmonk.com${t.href}`,
  })),
};

// Two numbers that make the case for the section better than any blurb: the
// spread of booking windows, and the fact that half the world has no statutory
// delay compensation at all.
const STATUTORY_COUNT = SCHEMES.filter((s) => s.kind === 'statutory').length;

export default function WorldIndexPage() {
  return (
    <>
      <Head>
        <title>Trains Abroad — Booking Windows & Delay Compensation | Railmonk</title>
        <meta
          name="description"
          content="Rail tools for travel outside India: when booking opens for Amtrak, Deutsche Bahn, Eurostar, SNCF and Australian operators, and what a delayed train entitles you to in the EU, UK, US and Australia."
        />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content="Trains Abroad — Railmonk" />
        <meta property="og:description" content="Booking windows and delay compensation rules for the US, Europe and Australia." />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Trains Abroad — Railmonk" />
        <meta name="twitter:description" content="The rules change the moment you leave the Indian network. These tools cover the rest." />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="Trains abroad"
        title="Trains outside India"
        subtitle="Every instinct built on Indian Railways — book 60 days out, file a TDR when the train is late — stops working the moment you leave the network. These tools cover the rules that replace them in the United States, Europe and Australia."
      >
        <Breadcrumbs className="-mt-4 mb-6" items={[{ name: 'Home', href: '/' }, { name: 'Trains abroad' }]} />

        <div className="grid gap-4 sm:grid-cols-2">
          {WORLD_TOOLS.map((tool) => {
            const Icon = ICONS[tool.href] || Globe2;
            return (
              <Card key={tool.href} href={tool.href} className="group p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h2 className="mt-3 font-display text-lg font-bold text-ink dark:text-white">{tool.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{tool.blurb}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
                  Open tool
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="font-display text-2xl font-bold text-ink dark:text-white">{OPERATORS.length}</p>
            <p className="mt-1 text-sm text-ink-muted dark:text-slate-400">
              operators and regions covered, from a 30-day Baltic window to a full year on Deutsche Bahn.
            </p>
          </Card>
          <Card className="p-5">
            <p className="font-display text-2xl font-bold text-ink dark:text-white">{STATUTORY_COUNT}</p>
            <p className="mt-1 text-sm text-ink-muted dark:text-slate-400">
              compensation schemes where a delay creates a legal entitlement — and two large countries where it does not.
            </p>
          </Card>
          <Card className="p-5">
            <p className="font-display text-2xl font-bold text-ink dark:text-white">60 days</p>
            <p className="mt-1 text-sm text-ink-muted dark:text-slate-400">
              India&apos;s booking window, shorter than almost every operator here. That gap is what these tools exist to close.
            </p>
          </Card>
        </div>

        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">Why a separate section</h2>
          <p className="mt-3">
            The rest of Railmonk is about one railway with one rulebook. Abroad there is no such thing: the booking
            window is set by each operator rather than by the country, and a delayed train is worth a fixed percentage
            of your fare in Europe, a goodwill voucher in the United States, and — outside Victoria — very little in
            Australia. Mixing those into the Indian tools would have made both harder to trust, so they live here,
            with their sources and review dates attached the same way.
          </p>
          <p className="mt-3">
            What these pages will never do is quote you a live fare or a seat count. That needs a licensed feed from
            each operator, which we do not have and would not pretend to. They answer the questions that turn on rules
            and dates, which are the ones that are genuinely hard to look up: when the window opens, and what a delay
            is worth.
          </p>
          <p className="mt-3">
            Travelling in India instead?{' '}
            <Link href="/" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">
              The IRCTC tools
            </Link>{' '}
            cover booking windows, Tatkal, refunds, waitlists and charting.
          </p>
        </div>
      </CalcLayout>
    </>
  );
}
