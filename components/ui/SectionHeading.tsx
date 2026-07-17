import React from 'react';
import Link from 'next/link';
import { cn } from './cn';

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  action?: { label: string; href: string };
  className?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  action,
  className,
}: SectionHeadingProps) {
  const centered = align === 'center';
  return (
    <div
      className={cn(
        'flex flex-col gap-2',
        centered ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className={cn('max-w-2xl', centered && 'mx-auto')}>
        {eyebrow ? (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-600 dark:text-brand-300">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl dark:text-white">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 text-base leading-relaxed text-ink-muted dark:text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
        >
          {action.label}
          <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
        </Link>
      ) : null}
    </div>
  );
}
