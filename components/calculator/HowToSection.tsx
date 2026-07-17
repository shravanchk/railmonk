import React from 'react';
import { cn } from '../ui/cn';
const { buildHowToSchema } = require('../../utils/schema');

export type HowToStep = { name: string; text: string };

type HowToSectionProps = {
  /** schema.org HowTo name, e.g. "How to use the SIP Calculator" */
  name: string;
  steps: HowToStep[];
  description?: string;
  /** ISO-8601 duration for the HowTo, e.g. "PT1M" */
  totalTime?: string;
  /** visible heading */
  heading?: string;
  className?: string;
};

// Renders a visible numbered "how to use" guide AND emits matching
// schema.org HowTo structured data (JSON-LD) for SEO. Dark-aware.
export default function HowToSection({
  name,
  steps,
  description,
  totalTime = 'PT1M',
  heading = 'How to use this calculator',
  className
}: HowToSectionProps) {
  if (!steps || steps.length === 0) return null;

  const schema = buildHowToSchema({ name, description, steps, totalTime });

  return (
    <section className={cn('mt-10', className)} aria-label={heading}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <h2 className="font-display text-xl font-bold text-ink dark:text-white">{heading}</h2>
      {/* ul, not ol: the number badge is rendered explicitly, and ol semantics
          would double it for screen readers and text extractors ("1. 1"). */}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {steps.map((step, index) => (
          <li
            key={step.name}
            className="flex gap-3 rounded-xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/70 dark:bg-slate-800/70"
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 font-display text-sm font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
            >
              {index + 1}
            </span>
            <div>
              <p className="font-semibold text-ink dark:text-white">{step.name}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{step.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
