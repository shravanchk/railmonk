import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * The single most useful next action from a page — one specific CTA, never a
 * vague "Learn more". Sits between a tool's result and its long-form content.
 *
 * @param {{ title: string, body: string, href: string, cta: string, secondary?: {href: string, label: string} }} props
 */
const NextStep = ({ title, body, href, cta, secondary }) => (
  <section className="mt-10 rounded-2xl border border-brand-200 bg-brand-50/70 p-5 sm:p-6 dark:border-brand-800/60 dark:bg-brand-900/20">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-xl">
        <h2 className="font-display text-lg font-bold text-ink dark:text-white">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{body}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link
          href={href}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lift transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          {cta}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        {secondary ? (
          <Link
            href={secondary.href}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-ink-soft transition hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </div>
  </section>
);

export default NextStep;
