import React from 'react';
import Head from 'next/head';
import { buildFaqSchema } from '../../utils/faqSchema';

const cardCls = 'mb-3.5 rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 dark:border-slate-700/70 dark:bg-slate-800/70';
const headingCls = 'font-display text-lg font-semibold text-ink dark:text-white';
const bodyCls = 'mt-2.5 text-[0.92rem] leading-relaxed text-ink-soft dark:text-slate-300 space-y-3';
const linkCls = 'font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200';

const Section = ({ heading, children, defaultOpen = false }) => (
  <details className={cardCls} {...(defaultOpen ? { open: true } : {})}>
    <summary className="cursor-pointer select-none"><span className={headingCls}>{heading}</span></summary>
    <div className={bodyCls}>{children}</div>
  </details>
);

const SearchLandingSections = ({ intro, example, formula, faqItems = [], relatedLinks = [], softwareSchema = null }) => {
  const faqSchema = faqItems.length ? buildFaqSchema(faqItems) : null;
  const shouldOpenInNewTab = (href = '') => href.startsWith('http') || href.endsWith('.html');

  return (
    <div className="mt-4">
      {softwareSchema || faqSchema ? (
        <Head>
          {softwareSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} /> : null}
          {faqSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /> : null}
        </Head>
      ) : null}

      <Section heading="Overview" defaultOpen>{intro}</Section>
      <Section heading="Example calculation">{example}</Section>
      <Section heading="How the formula works">{formula}</Section>

      {faqItems.length ? (
        <Section heading="Frequently asked questions">
          {faqItems.map((item) => (
            <div key={item.question} className="mb-2.5">
              <h3 className="text-[0.95rem] font-semibold text-ink dark:text-slate-100">{item.question}</h3>
              <p className="mt-0.5">{item.answer}</p>
            </div>
          ))}
        </Section>
      ) : null}

      {relatedLinks.length ? (
        <section className={cardCls}>
          <h2 className={headingCls}>Related tools</h2>
          <ul className="mt-2.5 list-disc space-y-1.5 pl-5 text-[0.92rem] text-ink-soft dark:text-slate-300">
            {relatedLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={linkCls} target={shouldOpenInNewTab(link.href) ? '_blank' : undefined} rel={shouldOpenInNewTab(link.href) ? 'noopener noreferrer' : undefined}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
};

export default SearchLandingSections;
