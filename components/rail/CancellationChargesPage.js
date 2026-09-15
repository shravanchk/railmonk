import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { CalcLayout, ResultStat } from '../calculator/CalcLayout';
import EEATPanel from '../calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import Card from '../ui/Card';
import Breadcrumbs from '../ui/Breadcrumbs';
import RelatedContent from './RelatedContent';
import NextStep from './NextStep';
import UpdatedStamp from './UpdatedStamp';
import { buildFaqSchema } from '../../utils/faqSchema';
import { getTool } from '../../utils/catalog';
import { CLASS_PAGES, getClassPage, chargeTable } from '../../utils/cancellationCharges';

const HUB_HREF = '/rail/cancellation-charges';

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const slabSummary = (slab, t) => {
  switch (slab.rule) {
    case 'flat':
      return `Flat charge of ${rupees(t.flatWithGst)} per passenger${t.gstApplies ? ` (₹${t.flat} + ${t.gstRatePercent}% GST)` : ''}, whatever the fare.`;
    case 'slab-25':
      return `25% of the fare, or the flat ${rupees(t.flatWithGst)} per passenger if that is more. The percentage takes over once the fare passes ${rupees(t.breakEven25)} per passenger.`;
    case 'slab-50':
      return `50% of the fare, or the flat ${rupees(t.flatWithGst)} per passenger if that is more. The percentage takes over above ${rupees(t.breakEven50)} per passenger.`;
    default:
      return 'No refund. Once inside 8 hours, and after the chart is prepared, online cancellation closes; only a TDR remains, and only for the reasons the rules allow.';
  }
};

const CancellationChargesPage = ({ slug }) => {
  const page = getClassPage(slug);
  if (!page) return null;
  const t = chargeTable(page);
  const href = `${HUB_HREF}/${slug}`;
  const canonical = `https://railmonk.com${href}`;
  const title = `${page.shortName} Ticket Cancellation Charges 2026: 72, 24 and 8 Hour Slabs | Railmonk`;
  const description = `${page.name} cancellation charges under the April 2026 rules: flat ${rupees(t.flatWithGst)} per passenger over 72 hours out, 25% between 72 and 24 hours, 50% between 24 and 8 hours, nothing inside 8 hours. Worked examples at ${page.exampleFares.map(rupees).join(', ')}.`;
  const siblings = CLASS_PAGES.filter((p) => p.slug !== slug);

  const faqItems = [
    {
      question: `What is the cancellation charge for a ${page.shortName} ticket?`,
      answer: `For a confirmed ${page.name} ticket cancelled more than 72 hours before departure the deduction is ${rupees(t.flatWithGst)} per passenger${t.gstApplies ? `, which is ₹${t.flat} plus ${t.gstRatePercent}% GST` : ', with no GST'}. Between 72 and 24 hours it is 25% of the fare, between 24 and 8 hours it is 50%, each subject to that flat minimum, and inside 8 hours there is no refund.`,
    },
    {
      question: `How much refund do I get on a ${rupees(page.exampleFares[1])} ${page.shortName} ticket?`,
      answer: t.slabs
        .map((s) => {
          const ex = s.examples[1];
          return `${s.label.toLowerCase()}: ${rupees(ex.refund)} back, ${rupees(ex.deduction)} deducted`;
        })
        .join('; ') + '. Figures are per passenger for a confirmed, non-Tatkal ticket.',
    },
    {
      question: `Is GST charged on ${page.shortName} cancellation?`,
      answer: t.gstApplies
        ? `Yes. ${page.name} is an AC class, so ${t.gstRatePercent}% GST is added to the flat cancellation charge, making it ${rupees(t.flatWithGst)} rather than ₹${t.flat}. The GST on the original fare is refunded in proportion to the fare refunded.`
        : `No. ${page.name} is a non-AC class, so the flat cancellation charge of ₹${t.flat} carries no GST, and the fare itself was not charged GST either.`,
    },
    {
      question: `What if my ${page.shortName} ticket is RAC or waitlisted?`,
      answer: `Only clerkage is deducted: ${rupees(t.clerkage)} per passenger (₹${t.clerkageBase} plus GST), as long as you cancel at least 30 minutes before departure. A fully waitlisted e-ticket is cancelled automatically at charting with the same deduction. Inside the last 30 minutes there is no refund.`,
    },
    {
      question: `Can I cancel a ${page.shortName} Tatkal ticket?`,
      answer: 'You can cancel it, but a confirmed Tatkal ticket gets no refund. A Tatkal ticket that is still waitlisted is refunded minus clerkage like any other waitlisted ticket. If the train is cancelled by the railway, the full fare including the Tatkal charge is refunded.',
    },
    {
      question: 'When did these cancellation charges change?',
      answer: 'The slabs on this page have applied since 1 April 2026. The flat charges by class and the 72, 24 and 8 hour boundaries are the ones the refund calculator uses, and every figure here is computed by the same code.',
    },
  ];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={[...page.aliases.map((a) => `${a} cancellation charges`), `${page.shortName} refund rules`, `${page.shortName} ticket cancel charge`, 'IRCTC cancellation charges 2026'].join(', ')} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(faqItems)) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Cancellation & refunds"
        title={`${page.name} ticket cancellation charges`}
        subtitle={`What is deducted when you cancel a ${page.shortName} ticket, by how long before departure you cancel, under the rules in force since 1 April 2026. Every figure below is computed by the same engine as the refund calculator.`}
      >
        <Breadcrumbs
          className="-mt-3 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Cancellation charges', href: HUB_HREF }, { name: page.shortName }]}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ResultStat label="Flat charge · over 72 h" value={`${rupees(t.flatWithGst)} / passenger`} emphasis />
          <ResultStat label="72 h to 24 h" value="25% of fare" />
          <ResultStat label="24 h to 8 h" value="50% of fare" />
          <ResultStat label="Inside 8 h" value="No refund" />
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs text-ink-muted dark:text-slate-500">
          <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Confirmed, non-Tatkal tickets. The 25% and 50% slabs never deduct less than the flat charge.{' '}
            {page.covers.length > 1 ? `The same table applies to ${page.covers.join(', ')}.` : ''}
          </span>
        </p>

        <div className="mt-8 grid gap-4">
          {t.slabs.map((slab) => (
            <Card key={slab.id} as="section" id={slab.id} className="scroll-mt-24 overflow-hidden">
              <div className="border-b border-slate-200/70 px-5 py-4 dark:border-slate-700/70">
                <h2 className="font-display text-lg font-bold text-ink dark:text-white">{slab.label}</h2>
                <p className="mt-1 text-sm text-ink-soft dark:text-slate-300">{slabSummary(slab, t)}</p>
              </div>
              {slab.rule !== 'no-refund' ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-ink-muted dark:bg-slate-800/80 dark:text-slate-400">
                      <tr>
                        <th scope="col" className="px-5 py-2.5 font-semibold">Fare paid</th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">Deducted</th>
                        <th scope="col" className="px-3 py-2.5 font-semibold">You get back</th>
                        <th scope="col" className="px-5 py-2.5 font-semibold">Why</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700/70">
                      {slab.examples.map((ex) => (
                        <tr key={ex.fare}>
                          <td className="px-5 py-2.5 font-semibold text-ink dark:text-white">{rupees(ex.fare)}</td>
                          <td className="px-3 py-2.5 text-rose-700 dark:text-rose-300">{rupees(ex.deduction)}</td>
                          <td className="px-3 py-2.5 font-semibold text-emerald-700 dark:text-emerald-300">{rupees(ex.refund)}</td>
                          <td className="px-5 py-2.5 text-ink-muted dark:text-slate-400">
                            {slab.rule === 'flat' ? 'Flat charge' : ex.minChargeApplied ? 'Flat minimum is higher than the percentage' : slab.rule === 'slab-25' ? '25% of fare' : '50% of fare'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </Card>
          ))}

          <Card as="section" id="rac-waitlist" className="scroll-mt-24 p-5">
            <h2 className="font-display text-lg font-bold text-ink dark:text-white">RAC and waitlisted {page.shortName} tickets</h2>
            <p className="mt-1 text-sm text-ink-soft dark:text-slate-300">
              Clerkage of {rupees(t.clerkage)} per passenger (₹{t.clerkageBase} + GST) up to 30 minutes before departure; nothing after that. The slabs above do not apply.
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-muted dark:text-slate-400">
              {t.racWl.map((ex) => (
                <li key={ex.fare}>
                  {rupees(ex.fare)} fare → <span className="font-semibold text-emerald-700 dark:text-emerald-300">{rupees(ex.refund)}</span> back
                </li>
              ))}
            </ul>
          </Card>

          <Card as="section" id="tatkal" className="scroll-mt-24 p-5">
            <h2 className="font-display text-lg font-bold text-ink dark:text-white">Tatkal {page.shortName} tickets</h2>
            <p className="mt-1 text-sm text-ink-soft dark:text-slate-300">
              A confirmed Tatkal ticket is not refunded on cancellation, at any time. A Tatkal ticket that never confirmed is refunded minus clerkage. Only a train cancelled by the railway returns the full fare.
            </p>
          </Card>
        </div>

        <NextStep
          title="Your exact fare, your exact refund"
          body="The calculator takes the fare you actually paid, the number of passengers and the hours to departure, and gives the rupee figure for this class."
          href={`/rail/irctc-cancellation-calculator`}
          cta="Open the refund calculator"
          secondary={{ href: '/rail/tdr-refund-checker', label: 'Missed the window? Check TDR' }}
        />

        <section className="mt-10" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-display text-xl font-bold text-ink dark:text-white">Frequently asked questions</h2>
          <div className="mt-4 grid gap-3">
            {faqItems.map((item) => (
              <details key={item.question} className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/70 dark:bg-slate-800/70">
                <summary className="cursor-pointer select-none font-semibold text-ink dark:text-slate-100">{item.question}</summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="others-heading">
          <h2 id="others-heading" className="font-display text-xl font-bold text-ink dark:text-white">Cancellation charges for other classes</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {siblings.map((p) => {
              const st = chargeTable(p);
              return (
                <li key={p.slug}>
                  <Link href={`${HUB_HREF}/${p.slug}`} className="group flex h-full flex-col rounded-xl border border-slate-200/70 bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card dark:border-slate-700/70 dark:bg-slate-800/70 dark:hover:border-brand-700">
                    <span className="font-display font-semibold text-ink dark:text-white">{p.name}</span>
                    <span className="mt-1 text-sm text-ink-muted dark:text-slate-400">Flat {rupees(st.flatWithGst)} per passenger</span>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
                      See the slabs
                      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mt-10">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="September 15, 2026"
            scope="Cancellation slabs and flat charges as in force from 1 April 2026, computed by the same engine as the refund calculator. IRCTC convenience fees and payment-gateway charges are not refunded and are not included."
            sources={[
              { label: 'IRCTC — cancellation and refund rules', url: 'https://www.irctc.co.in/' },
              { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' },
            ]}
          />
        </div>

        <UpdatedStamp updated={getTool(HUB_HREF)?.updated} href="/rail/irctc-cancellation-calculator" />
        <div className="mt-10">
          <RelatedContent href={HUB_HREF} kind="tool" />
        </div>
      </CalcLayout>
    </>
  );
};

export default CancellationChargesPage;
