import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { CalcLayout } from '../calculator/CalcLayout';
import EEATPanel from '../calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import Breadcrumbs from '../ui/Breadcrumbs';
import RelatedContent from './RelatedContent';
import NextStep from './NextStep';
import UpdatedStamp from './UpdatedStamp';
import { getTool } from '../../utils/catalog';
import { CATEGORIES, TERMS, termsInCategory } from '../../utils/glossary';

const HREF = '/rail/glossary';
const TITLE = 'Indian Railways Glossary: Every Ticket Code, PNR Status and Booking Term Explained | Railmonk';
const DESCRIPTION =
  'What 3A, SL, CNF, RAC, GNWL, RLWL, PQWL, TQWL, NOSB, ARP, Tatkal, TDR, clerkage and every other code on an Indian train ticket means, with the tool that acts on each one.';

const GlossaryHub = () => {
  const termSet = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Railmonk Indian Railways glossary',
    url: `https://railmonk.com${HREF}`,
    hasDefinedTerm: TERMS.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term,
      ...(t.fullForm ? { alternateName: t.fullForm } : {}),
      description: t.short,
      url: `https://railmonk.com${HREF}/${t.slug}`,
    })),
  };

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="keywords" content="railway glossary, train ticket codes, PNR status meaning, GNWL full form, RAC full form, 3A meaning, SL meaning, NOSB meaning, ARP full form, TDR full form, IRCTC abbreviations" />
        <link rel="canonical" href={`https://railmonk.com${HREF}`} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={`https://railmonk.com${HREF}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(termSet) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Reference"
        title="Indian Railways glossary"
        subtitle="Every code you meet on a ticket, a PNR page or the IRCTC booking form, in one sentence each, with a page behind it and the tool that acts on it."
      >
        <Breadcrumbs className="-mt-3 mb-6" items={[{ name: 'Home', href: '/' }, { name: 'Glossary' }]} />

        <nav aria-label="Glossary sections" className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <a key={c.id} href={`#${c.id}`} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-ink-soft hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {c.label}
            </a>
          ))}
        </nav>

        {CATEGORIES.map((c) => (
          <section key={c.id} id={c.id} className="mt-10 scroll-mt-24" aria-labelledby={`h-${c.id}`}>
            <h2 id={`h-${c.id}`} className="font-display text-xl font-bold text-ink dark:text-white">{c.label}</h2>
            <p className="mt-1 text-sm text-ink-muted dark:text-slate-400">{c.blurb}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {termsInCategory(c.id).map((t) => (
                <div key={t.slug} className="rounded-xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/70 dark:bg-slate-800/70">
                  <dt>
                    <Link href={`${HREF}/${t.slug}`} className="font-display text-base font-bold text-ink hover:text-brand-700 hover:underline dark:text-white dark:hover:text-brand-300">
                      {t.term}
                    </Link>
                    {t.fullForm ? <span className="ml-2 text-sm text-ink-muted dark:text-slate-400">{t.fullForm}</span> : null}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{t.short}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        <NextStep
          title="Reading a PNR right now?"
          body="The PNR guide walks through booking status versus current status, what changes at charting, and what each code means for whether you can travel."
          href="/rail/guides/pnr-status-availability-codes"
          cta="Read the PNR guide"
          secondary={{ href: '/rail/waitlist-confirmation-chances', label: 'Check waitlist chances' }}
        />

        <div className="mt-10">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="September 15, 2026"
            scope="Definitions follow the published Indian Railways and IRCTC rules; figures are read from the same engines as the calculators."
            sources={[
              { label: 'IRCTC Official Portal', url: 'https://www.irctc.co.in/' },
              { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' },
            ]}
          />
        </div>

        <UpdatedStamp updated={getTool(HREF)?.updated} />
        <div className="mt-10">
          <RelatedContent href={HREF} kind="tool" />
        </div>
      </CalcLayout>
    </>
  );
};

export default GlossaryHub;
