import React from 'react';
import Link from 'next/link';
import { cn } from './cn';

type CardProps = {
  children: React.ReactNode;
  href?: string;
  className?: string;
  interactive?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
};

const surface =
  'rounded-2xl border border-slate-200/70 bg-white shadow-soft ' +
  'dark:bg-slate-800/70 dark:border-slate-700/70';

const interactiveCls =
  'transition duration-200 hover:-translate-y-0.5 hover:shadow-card hover:border-slate-300 ' +
  'dark:hover:border-slate-600 focus-within:ring-2 focus-within:ring-brand-500/40';

export default function Card({ children, href, className, interactive, as: Tag = 'div' }: CardProps) {
  const classes = cn(surface, (interactive || href) && interactiveCls, className);
  if (href) {
    return (
      <Link href={href} className={cn('block', classes)}>
        {children}
      </Link>
    );
  }
  return <Tag className={classes}>{children}</Tag>;
}
