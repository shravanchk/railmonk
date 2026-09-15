import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CalcLayout } from '../calculator/CalcLayout';
import EEATPanel from '../calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import Card from '../ui/Card';
import Breadcrumbs from '../ui/Breadcrumbs';
import RelatedContent from './RelatedContent';
import NextStep from './NextStep';
import UpdatedStamp from './UpdatedStamp';
import { buildFaqSchema } from '../../utils/faqSchema';
import { getTool } from '../../utils/catalog';
import { CLASS_PAGES, SLABS, chargeTable } from '../../utils/cancellationCharges';

const HREF = '/rail/cancellation-charges';
const TITLE = 'Train Ticket Cancellation Charges 2026 by Class: Sleeper, 3AC, 2AC, 1AC, 2S | Railmonk';
const DESCRIPTION =
  'IRCTC cancellation charges from 1 April 2026 for every class: the flat charge over 72 hours out, 25% between 72 and 24 hours, 50% between 24 and 8 hours, no refund inside 8 hours, plus RAC, waitlist and Tatkal rules. Worked examples per class.';

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const FAQ = [
  {
    question: 'What are the train ticket cancellation charges in 2026?',
    answer: 'For a confirmed ticket: a flat charge by class if cancelled more than 72 hours before departure, 25% of the fare between 72 and 24 hours, 50% between 24 and 8 hours, and no refund inside 8 hours. The 25% and 50% deductions never fall below the flat charge. RAC and waitlisted tickets lose only clerkage. Confirmed Tatkal tickets are not refunded.',
  },
  {
    question: 'Which class has the highest cancellation charge?',
    answer: 'AC First Class and Executive Chair Car, whose flat charge is the highest on the table, with 5% GST on top. Second Sitting has the lowest. Because the flat charge is a minimum, it matters most on cheap tickets; on an expensive ticket cancelled late, the percentage is what decides the deduction.',
  },
  {
    question: 'Is the flat charge per ticket or per passenger?',
    answer: 'Per passenger. A four-passenger booking cancelled early is charged four times the flat amount. Cancelling one passenger from a group ticket is charged for that passenger only.',
  },
  {
    question: 'Are these the same figures the refund calculator uses?',
    answer: 'Yes. The class pages and the calculator run the same engine, so a figure here is what the calculator would give for the same fare and timing.',
  },
];

const CancellationChargesHub = () => {
  const rows = CLASS_PAGES.map((p) => ({ page: p, table: chargeTable(p) }));

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="keywords" content="train ticket cancellation charges, IRCTC cancellation charges 2026, sleeper cancellation charges, 3AC cancellation charges, 2AC cancellation charge, cancellation charge per class, refund rules by class" />
        <link rel="canonical" href={`https://railmonk.com${HREF}`} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={`https://railmonk.com${HREF}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(FAQ)) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Cancellation & refunds"
        title="Train ticket cancellation charges by class"
        subtitle="The flat charge for every class, the three time slabs that replace it as departure approaches, and what RAC, waitlisted and Tatkal tickets lose instead. Pick a class for worked examples at real fares."
      >
        <Breadcrumbs className="-mt-3 mb-6" items={[{ name: 'Home', href: '/' }, { name: 'Cancellation charges' }]} />

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-ink-muted dark:bg-slate-800/80 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Class</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Flat charge · over 72 h</th>
                  <th scope="col" className="px-3 py-3 font-semibold">GST</th>
                  <th scope="col" className="px-3 py-3 font-semibold">72–24 h</th>
                  <th scope="col" className="px-3 py-3 font-semibold">24–8 h</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Under 8 h</th>
                  <th scope="col" className="px-5 py-3 font-semibold"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700/70">
                {rows.map(({ page, table }) => (
                  <tr key={page.slug}>
                    <td className="px-5 py-3">
                      <Link href={`${HREF}/${page.slug}`} className="font-semibold text-ink hover:text-brand-700 hover:underline dark:text-white dark:hover:text-brand-300">
                        {page.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 font-semibold text-ink dark:text-white">{rupees(table.flatWithGst)}</td>
                    <td className="px-3 py-3 text-ink-muted dark:text-slate-400">{table.gstApplies ? `₹${table.flat} + 5%` : 'None'}</td>
                    <td className="px-3 py-3 text-ink-soft dark:text-slate-300">25% (min flat)</td>
                    <td className="px-3 py-3 text-ink-soft dark:text-slate-300">50% (min flat)</td>
                    <td className="px-3 py-3 text-rose-700 dark:text-rose-300">No refund</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`${HREF}/${page.slug}`} className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand-700 dark:text-brand-300">
                        Examples
                        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="mt-3 text-xs text-ink-muted dark:text-slate-500">
          Per passenger, confirmed non-Tatkal tickets, rules in force since 1 April 2026. RAC and waitlisted tickets: clerkage of {rupees(rows[0].table.clerkage)} per passenger up to 30 minutes before departure. Confirmed Tatkal: no refund.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ page, table }) => {
            const mid = page.exampleFares[1];
            const ex = table.slabs.map((s) => s.examples.find((e) => e.fare === mid));
            return (
              <Card key={page.slug} href={`${HREF}/${page.slug}`} className="flex h-full flex-col p-5">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">Flat {rupees(table.flatWithGst)}</span>
                <span className="mt-1 font-display text-lg font-bold text-ink dark:text-white">{page.name}</span>
                <span className="mt-2 text-sm text-ink-muted dark:text-slate-400">On a {rupees(mid)} ticket you get back:</span>
                <ul className="mt-2 flex-1 space-y-1 text-sm text-ink-soft dark:text-slate-300">
                  {SLABS.map((s, i) => (
                    <li key={s.id} className="flex justify-between gap-3">
                      <span>{s.label.replace(' before departure', '')}</span>
                      <strong className="text-ink dark:text-white">{rupees(ex[i].refund)}</strong>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        <NextStep
          title="Cancelling a specific ticket?"
          body="Enter the fare you paid, the passengers and the hours to departure, and the calculator gives the rupee refund under these rules."
          href="/rail/irctc-cancellation-calculator"
          cta="Open the refund calculator"
          secondary={{ href: '/rail/guides/cancellation-refund-tdr', label: 'Read the refund guide' }}
        />

        <section className="mt-10" aria-labelledby="hub-faq">
          <h2 id="hub-faq" className="font-display text-xl font-bold text-ink dark:text-white">Frequently asked questions</h2>
          <div className="mt-4 grid gap-3">
            {FAQ.map((item) => (
              <details key={item.question} className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/70 dark:bg-slate-800/70">
                <summary className="cursor-pointer select-none font-semibold text-ink dark:text-slate-100">{item.question}</summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-10">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="September 15, 2026"
            scope="Cancellation slabs and flat charges as in force from 1 April 2026, computed by the refund calculator's engine. Convenience fees and gateway charges are excluded."
            sources={[
              { label: 'IRCTC — cancellation and refund rules', url: 'https://www.irctc.co.in/' },
              { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' },
            ]}
          />
        </div>

        <UpdatedStamp updated={getTool(HREF)?.updated} href="/rail/irctc-cancellation-calculator" />
        <div className="mt-10">
          <RelatedContent href={HREF} kind="tool" />
        </div>
      </CalcLayout>
    </>
  );
};

export default CancellationChargesHub;
