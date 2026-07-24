import React from 'react';
import Head from 'next/head';
import Container from '../ui/Container';
import Breadcrumbs from '../ui/Breadcrumbs';
import RelatedContent from '../rail/RelatedContent';
import UpdatedStamp from '../rail/UpdatedStamp';
import { getGuide, categoryLabel } from '../../utils/catalog';

// Legacy export kept so existing guide pages that do `<h2 style={sectionTitleStyle}>`
// keep working. It is now a no-op: headings are styled by the layout's descendant
// classes below so they adapt to dark mode (inline styles can't).
const sectionTitleStyle = {};

const proseCls = [
  'text-[1.02rem] leading-relaxed text-ink-soft dark:text-slate-300',
  '[&_h2]:mt-9 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-ink dark:[&_h2]:text-white',
  '[&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink dark:[&_h3]:text-white',
  '[&_p]:mt-4',
  '[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_li]:marker:text-ink-muted',
  '[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6',
  '[&_strong]:font-semibold [&_strong]:text-ink dark:[&_strong]:text-white',
  '[&_a]:font-medium [&_a]:text-brand-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-brand-700 dark:[&_a]:text-brand-300',
  '[&_table]:mt-4 [&_table]:overflow-hidden [&_table]:rounded-lg'
].join(' ');

const GuidePageLayout = ({
  title,
  description,
  canonicalPath,
  reviewedOn = 'March 14, 2026',
  author = 'Railmonk Research Team',
  reviewer = 'Travel Review Desk',
  articleSchema,
  children
}) => {
  // Catalog entry supplies the topic, the machine-readable updated date, and
  // the related tools/guides — so a guide never has to repeat them inline.
  const guide = getGuide(canonicalPath);

  return (
    <section className="py-8 sm:py-12">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://railmonk.com${canonicalPath}`} />
        <meta property="og:title" content={`${title} | Railmonk`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`https://railmonk.com${canonicalPath}`} />
        <meta property="og:type" content="article" />
        {guide?.updated ? <meta property="article:modified_time" content={guide.updated} /> : null}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${title} | Railmonk`} />
        <meta name="twitter:description" content={description} />
        {articleSchema ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
        ) : null}
      </Head>
      <Container>
        <article className="mx-auto max-w-[820px]">
          {/* Breadcrumbs emit their own BreadcrumbList schema, matching the
              trail actually rendered above the heading. */}
          <Breadcrumbs
            className="mb-5"
            items={[
              { name: 'Home', href: '/' },
              { name: 'Guides', href: '/guides' },
              ...(guide ? [{ name: categoryLabel(guide.category), href: '/guides' }] : []),
              { name: title }
            ]}
          />

          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl dark:text-white">{title}</h1>

          <p className="mt-2 text-sm italic text-ink-muted dark:text-slate-500">
            Reviewed on {reviewedOn} • Author: {author} • Reviewer: {reviewer}
            {guide?.readingMinutes ? ` • ${guide.readingMinutes} min read` : ''}
          </p>
          {guide?.updated ? <UpdatedStamp updated={guide.updated} href={canonicalPath} /> : null}

          <div className={`mt-6 ${proseCls}`}>{children}</div>

          <RelatedContent href={canonicalPath} kind="guide" />
        </article>
      </Container>
    </section>
  );
};

export { sectionTitleStyle };
export default GuidePageLayout;
