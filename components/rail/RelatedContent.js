import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Wrench } from 'lucide-react';
import { relatedForTool, relatedForGuide, categoryLabel } from '../../utils/catalog';

const cardCls =
  'group flex h-full flex-col rounded-xl border border-slate-200/70 bg-white p-4 transition ' +
  'hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card ' +
  'dark:border-slate-700/70 dark:bg-slate-800/70 dark:hover:border-brand-700';

const Group = ({ heading, Icon, items, cta }) => {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink dark:text-slate-200">
        <Icon aria-hidden="true" className="h-4 w-4 text-brand-600 dark:text-brand-300" />
        {heading}
      </h3>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={cardCls}>
              <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
                {categoryLabel(item.category)}
              </span>
              <span className="mt-1 font-display text-[0.95rem] font-semibold text-ink dark:text-white">{item.title}</span>
              <span className="mt-1 flex-1 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{item.blurb}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
                {cta}
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Related tools and guides for a page, resolved from the catalog so that every
 * tool page links to a guide and every guide page links to a tool.
 *
 * @param {{ href: string, kind?: 'tool' | 'guide' }} props `href` is this page's own path.
 */
const RelatedContent = ({ href, kind = 'tool' }) => {
  const { tools, guides } = kind === 'guide' ? relatedForGuide(href) : relatedForTool(href);
  if (!tools.length && !guides.length) return null;

  return (
    <section aria-labelledby="related-content-heading" className="mt-12 border-t border-slate-200/70 pt-8 dark:border-slate-800">
      <h2 id="related-content-heading" className="font-display text-xl font-bold text-ink dark:text-white">
        Keep going
      </h2>
      <div className="mt-5 space-y-7">
        <Group heading="Tools that pair with this" Icon={Wrench} items={tools} cta="Open tool" />
        <Group heading={kind === 'guide' ? 'More on this topic' : 'Guides that explain the rules'} Icon={BookOpen} items={guides} cta="Read guide" />
      </div>
    </section>
  );
};

export default RelatedContent;
