import React from 'react';
import Head from 'next/head';
import { CalcLayout } from '../calculator/CalcLayout';
import Breadcrumbs from '../ui/Breadcrumbs';
import RelatedContent from '../rail/RelatedContent';
import UpdatedStamp from '../rail/UpdatedStamp';
import EEATPanel from '../calculator/EEATPanel';
import HowToSection from '../calculator/HowToSection';
import LocaleHead from '../i18n/LocaleHead';
import { editorialProfiles } from '../../utils/editorialProfiles';
import { buildFaqSchema } from '../../utils/faqSchema';
import { getTool } from '../../utils/catalog';
import { toHindiHref, t } from '../../utils/i18n';

/**
 * Everything a Hindi tool page needs around its calculator.
 *
 * The Hindi pages share this shell rather than each restating the head tags,
 * breadcrumb trail, FAQ block and trust panel. What they do not share is copy:
 * every string a Hindi reader sees is written for them and lives in the page's
 * own file, in one block, so a native speaker can review a page by reading a
 * single object rather than hunting strings through JSX.
 *
 * `englishHref` is the page's identity in both languages — the catalog, the
 * related-links resolver and the hreflang pair all key off it.
 */
export default function HiPageShell({
  englishHref,
  metaTitle,
  metaDescription,
  ogDescription,
  eyebrow,
  title,
  subtitle,
  breadcrumbLabel,
  schema,
  faqs = [],
  howTo,
  reviewedOn,
  scope,
  sources = [],
  children,
}) {
  const hindiHref = toHindiHref(englishHref);
  const url = `https://railmonk.com${hindiHref}`;
  const tool = getTool(englishHref);

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={ogDescription || metaDescription} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="hi_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={ogDescription || metaDescription} />
        {schema ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        ) : null}
        {faqs.length ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(faqs)) }} />
        ) : null}
      </Head>
      <LocaleHead path={englishHref} />

      <CalcLayout eyebrow={eyebrow} title={title} subtitle={subtitle}>
        <Breadcrumbs
          className="-mt-4 mb-6"
          items={[
            { name: t('nav.home', 'hi'), href: '/hi' },
            { name: t('nav.tools', 'hi'), href: '/hi' },
            { name: breadcrumbLabel },
          ]}
        />

        {children}

        {howTo ? (
          <HowToSection locale="hi" name={howTo.name} description={howTo.description} steps={howTo.steps} />
        ) : null}

        {faqs.length ? (
          <section className="mt-12" aria-labelledby="hi-faq">
            <h2 id="hi-faq" className="font-display text-xl font-bold text-ink dark:text-white">
              {t('faq.heading', 'hi')}
            </h2>
            <div className="mt-4 space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/70 dark:bg-slate-800/70"
                >
                  <summary className="cursor-pointer select-none font-display text-[0.98rem] font-semibold text-ink dark:text-white">
                    {faq.question}
                  </summary>
                  <p className="mt-2.5 text-[0.92rem] leading-relaxed text-ink-soft dark:text-slate-300">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-10">
          <EEATPanel
            locale="hi"
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn={reviewedOn}
            scope={scope}
            sources={sources}
          />
        </div>

        <UpdatedStamp updated={tool?.updated} href={englishHref} />

        <RelatedContent href={englishHref} kind="tool" locale="hi" />
      </CalcLayout>
    </>
  );
}
