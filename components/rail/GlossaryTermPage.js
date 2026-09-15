import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, BookMarked } from 'lucide-react';
import { CalcLayout } from '../calculator/CalcLayout';
import EEATPanel from '../calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import Card from '../ui/Card';
import Breadcrumbs from '../ui/Breadcrumbs';
import RelatedContent from './RelatedContent';
import NextStep from './NextStep';
import UpdatedStamp from './UpdatedStamp';
import { buildFaqSchema } from '../../utils/faqSchema';
import { getTool } from '../../utils/catalog';
import { getTerm, relatedTerms, termsInCategory, categoryLabel } from '../../utils/glossary';

const HUB_HREF = '/rail/glossary';

const GlossaryTermPage = ({ slug }) => {
  const term = getTerm(slug);
  if (!term) return null;
  const href = `${HUB_HREF}/${slug}`;
  const canonical = `https://railmonk.com${href}`;
  const heading = term.fullForm ? `${term.term} — ${term.fullForm}` : term.term;
  const title = term.fullForm
    ? `${term.term} Full Form & Meaning in Indian Railways: ${term.fullForm} | Railmonk`
    : `${term.term} Meaning in Indian Railways: What It Is and What to Do | Railmonk`;
  const related = relatedTerms(term);
  const sameCategory = termsInCategory(term.category).filter((t) => t.slug !== slug).slice(0, 8);

  // The definition doubles as structured data: a DefinedTerm plus the
  // "what does X mean" question people actually type.
  const definedTerm = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.term,
    ...(term.fullForm ? { alternateName: term.fullForm } : {}),
    description: term.short,
    url: canonical,
    inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Railmonk Indian Railways glossary', url: `https://railmonk.com${HUB_HREF}` },
  };
  const faqItems = [
    { question: `What does ${term.term} mean on a train ticket?`, answer: term.short },
    ...(term.fullForm ? [{ question: `What is the full form of ${term.term}?`, answer: `${term.term} stands for ${term.fullForm}. ${term.body[0]}` }] : []),
  ];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={term.short} />
        <meta name="keywords" content={[`${term.term} meaning`, `${term.term} full form`, `${term.term} in railway`, `${term.term} train ticket`, ...term.aliases].join(', ')} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={term.short} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={term.short} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTerm) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(faqItems)) }} />
      </Head>

      <CalcLayout eyebrow={`Glossary · ${categoryLabel(term.category)}`} title={heading} subtitle={term.short}>
        <Breadcrumbs
          className="-mt-3 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Glossary', href: HUB_HREF }, { name: term.term }]}
        />

        <article className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="p-5 sm:p-6">
            {term.body.map((p, i) => (
              <p key={i} className={`text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300 ${i ? 'mt-4' : ''}`}>{p}</p>
            ))}
            {term.aliases.length ? (
              <p className="mt-5 text-xs text-ink-muted dark:text-slate-500">Also written or searched as: {term.aliases.join(' · ')}</p>
            ) : null}
          </Card>

          <div className="grid gap-4 content-start">
            <Card href={term.tool.href} className="p-5">
              <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">Act on it</span>
              <span className="mt-1 block font-display font-semibold text-ink dark:text-white">{term.tool.label}</span>
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
                Open <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </span>
            </Card>
            {related.length ? (
              <Card className="p-5">
                <h2 className="text-sm font-bold uppercase tracking-wide text-ink dark:text-slate-200">Related terms</h2>
                <ul className="mt-2 space-y-2">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link href={`${HUB_HREF}/${r.slug}`} className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">{r.term}</Link>
                      {r.fullForm ? <span className="text-sm text-ink-muted dark:text-slate-400"> — {r.fullForm}</span> : null}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </div>
        </article>

        <NextStep
          title="Every code on a ticket, in one place"
          body="Classes, PNR statuses, the five waitlists, quotas, berth codes and fare line items, each with the tool that acts on it."
          href={HUB_HREF}
          cta="Browse the glossary"
          secondary={{ href: '/rail/guides/pnr-status-availability-codes', label: 'How to read a PNR' }}
        />

        {sameCategory.length ? (
          <section className="mt-10" aria-labelledby="same-cat">
            <h2 id="same-cat" className="flex items-center gap-2 font-display text-xl font-bold text-ink dark:text-white">
              <BookMarked aria-hidden="true" className="h-5 w-5 text-brand-600 dark:text-brand-300" />
              More in {categoryLabel(term.category).toLowerCase()}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {sameCategory.map((t) => (
                <li key={t.slug}>
                  <Link href={`${HUB_HREF}/${t.slug}`} className="flex h-full flex-col rounded-xl border border-slate-200/70 bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card dark:border-slate-700/70 dark:bg-slate-800/70 dark:hover:border-brand-700">
                    <span className="font-display font-semibold text-ink dark:text-white">{t.term}</span>
                    <span className="mt-1 text-sm text-ink-muted dark:text-slate-400">{t.fullForm || t.short.split('.')[0]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-10">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="September 15, 2026"
            scope="Definitions follow the published Indian Railways and IRCTC rules. Where a figure appears, it is read from the same engine as the site's calculators."
            sources={[
              { label: 'IRCTC Official Portal', url: 'https://www.irctc.co.in/' },
              { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' },
              { label: 'Railway Enquiry', url: 'https://enquiry.indianrail.gov.in/' },
            ]}
          />
        </div>

        <UpdatedStamp updated={getTool(HUB_HREF)?.updated} />
        <div className="mt-10">
          <RelatedContent href={HUB_HREF} kind="tool" />
        </div>
      </CalcLayout>
    </>
  );
};

export default GlossaryTermPage;
