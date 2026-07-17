import React from 'react';
import Head from 'next/head';
import Container from '../ui/Container';
import { DEFAULT_REVIEW_DATE } from '../../utils/siteMeta';

// Legacy export kept so existing legal pages that do `<h2 style={headingTwoStyle}>`
// keep working. Now a no-op: headings are styled by the layout's descendant classes
// below so they adapt to dark mode (inline styles can't).
const headingTwoStyle = {};

const proseCls = [
  'text-[1.02rem] leading-relaxed text-ink-soft dark:text-slate-300',
  '[&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-ink dark:[&_h2]:text-white',
  '[&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink dark:[&_h3]:text-white',
  '[&_p]:mt-4',
  '[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_li]:marker:text-ink-muted',
  '[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6',
  '[&_strong]:font-semibold [&_strong]:text-ink dark:[&_strong]:text-white',
  '[&_a]:font-medium [&_a]:text-brand-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-brand-700 dark:[&_a]:text-brand-300'
].join(' ');

const LegalPageLayout = ({
  title,
  description,
  canonicalPath,
  reviewedOn = DEFAULT_REVIEW_DATE,
  children
}) => {
  return (
    <section className="py-8 sm:py-12">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://railmonk.com${canonicalPath}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`https://railmonk.com${canonicalPath}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Head>
      <Container>
        <article className="mx-auto max-w-[800px]">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl dark:text-white">{title}</h1>
          <p className="mt-2 text-sm italic text-ink-muted dark:text-slate-500">Last reviewed: {reviewedOn}</p>
          <div className={`mt-6 ${proseCls}`}>{children}</div>
        </article>
      </Container>
    </section>
  );
};

export { headingTwoStyle };
export default LegalPageLayout;