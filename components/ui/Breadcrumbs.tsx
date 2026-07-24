import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { buildBreadcrumbSchema } from '../../utils/schema';

export type Crumb = { name: string; href?: string };

type BreadcrumbsProps = {
  /** Ordered trail. The last item is the current page and is not linked. */
  items: Crumb[];
  /** Emit BreadcrumbList JSON-LD alongside the visible trail. */
  schema?: boolean;
  className?: string;
};

/**
 * Visible breadcrumb trail plus matching structured data. The two are generated
 * from one array on purpose — schema that describes a trail the page does not
 * actually show is exactly the kind of markup Google penalises.
 */
export default function Breadcrumbs({ items, schema = true, className }: BreadcrumbsProps) {
  if (!items?.length) return null;

  const jsonLd = schema
    ? buildBreadcrumbSchema(
        items.map((c) => ({
          name: c.name,
          item: c.href ? `https://railmonk.com${c.href}` : undefined,
        }))
      )
    : null;

  return (
    <>
      {jsonLd ? (
        <Head>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </Head>
      ) : null}
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-muted dark:text-slate-500">
          {items.map((crumb, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={`${crumb.name}-${i}`} className="flex items-center gap-1">
                {i > 0 ? <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 opacity-60" /> : null}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="rounded hover:text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:hover:text-brand-300"
                  >
                    {crumb.name}
                  </Link>
                ) : (
                  <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'font-medium text-ink-soft dark:text-slate-400' : undefined}>
                    {crumb.name}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
