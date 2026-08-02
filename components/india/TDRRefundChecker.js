import React, { useState } from 'react';
import Head from 'next/head';
import { CheckCircle2, ExternalLink, FileText, XCircle } from 'lucide-react';
import EEATPanel from '../calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import SearchLandingSections from '../calculator/SearchLandingSections';
import { buildSoftwareApplicationSchema } from '../../utils/schema';
import { CalcLayout } from '../calculator/CalcLayout';
import HowToSection from '../calculator/HowToSection';
import Card from '../ui/Card';
import Breadcrumbs from '../ui/Breadcrumbs';
import RelatedContent from '../rail/RelatedContent';
import NextStep from '../rail/NextStep';
import ShareResult from '../rail/ShareResult';
import UpdatedStamp from '../rail/UpdatedStamp';
import useShareableInputs from '../rail/useShareableInputs';
import { getTool } from '../../utils/catalog';
import { cn } from '../ui/cn';

const HREF = '/rail/tdr-refund-checker';

const { TDR_SCENARIOS } = require('../../utils/engines/tdrRules');

const TDRRefundChecker = () => {
  const [scenarioId, setScenarioId] = useState(null);
  const shareUrl = useShareableInputs(
    { case: scenarioId || '' },
    (params) => {
      if (params.case) setScenarioId(params.case);
    }
  );
  const scenario = TDR_SCENARIOS.find((s) => s.id === scenarioId) || null;

  const seoFaqItems = [
    {
      question: 'What is the full form of TDR in railways?',
      answer:
        'TDR stands for Ticket Deposit Receipt. It is a manual refund claim filed on IRCTC for situations where normal online cancellation does not apply — the train ran 3+ hours late, the AC failed, you were shifted to a lower class, part of a group did not travel, and similar cases. The claim is forwarded to the railways, verified against actual train running records, and refunded if the reason checks out.'
    },
    {
      question: 'How do I file a TDR on IRCTC?',
      answer:
        'Log in to irctc.co.in, go to My Account → My Transactions → File TDR, select the ticket and the passenger(s), choose the reason from the dropdown, and submit. Note the TDR reference number — refund status can be tracked under TDR History.'
    },
    {
      question: 'How long does a TDR refund take?',
      answer:
        'Typically 60–90 days. Unlike instant cancellation refunds, every TDR is manually verified against the train’s running data and on-board records (like TTE certificates), which is what takes the time.'
    },
    {
      question: 'What is the TDR deadline for a late-running train?',
      answer:
        'If the train is running 3 or more hours late and you decide not to travel, the TDR must be filed before the train actually departs from your boarding station. File it from the IRCTC website or app as soon as you decide not to board — waiting until after departure forfeits the claim.'
    },
    {
      question: 'Can I file a TDR just because my plans changed?',
      answer:
        'No. TDR reasons are a fixed list of railway-caused or rule-recognized situations, and claims are verified against records. A voluntary change of plans inside the no-refund window is not a valid TDR reason and will be rejected.'
    },
    {
      question: 'Do I need a TTE certificate?',
      answer:
        'For on-board issues — AC failure, travelling in a lower class, part of a group not travelling — yes, ask the TTE for a certificate during the journey. The certificate number goes into the TDR and claims without one are much more likely to be rejected.'
    },
    {
      question: 'How do I check my TDR status?',
      answer:
        'Log in to irctc.co.in and go to My Account → My Transactions → TDR History. Each claim shows its current stage — registered, forwarded to railway, or refunded/rejected — against the TDR reference number you received when filing.'
    },
    {
      question: 'What if my TDR is rejected?',
      answer:
        'The rejection reason appears in TDR History — most rejections are a mismatched reason, a missed deadline, or a missing TTE certificate. If the facts genuinely support your claim (for example, the train really was 3+ hours late), raise it with IRCTC customer care (care@irctc.co.in) or through RailMadad citing the TDR reference number and the train’s actual running data. There is no fee to escalate, but a claim rejected on deadline grounds is rarely reversed.'
    }
  ];

  const softwareSchema = buildSoftwareApplicationSchema({
    name: 'TDR Refund Eligibility Checker',
    url: 'https://railmonk.com/rail/tdr-refund-checker',
    description: 'Check whether your IRCTC situation qualifies for a TDR refund — late trains, AC failure, RAC/waitlist, partial travel — with the exact filing deadline for each case.',
    applicationCategory: 'TravelApplication',
    featureList: [
      'Nine common refund scenarios covered',
      'Eligibility and refund extent per scenario',
      'Exact TDR filing deadlines',
      'Step-by-step filing instructions'
    ]
  });

  return (
    <>
      <Head>
        <title>TDR (Ticket Deposit Receipt): IRCTC Refund Rules &amp; How to File | Railmonk</title>
        <meta name="description" content="TDR stands for Ticket Deposit Receipt — the IRCTC claim for late trains, AC failure and other railway faults. Check eligibility, deadlines and how to file one." />
        <meta name="keywords" content="TDR full form, ticket deposit receipt, how to file TDR in IRCTC, TDR refund, TDR filing time limit, TDR status, train 3 hours late refund" />
        <link rel="canonical" href="https://railmonk.com/rail/tdr-refund-checker" />
        <meta property="og:title" content="TDR (Ticket Deposit Receipt): IRCTC Refund Rules &amp; How to File | Railmonk" />
        <meta property="og:description" content="What TDR means, which situations qualify, the deadline for each, and the exact filing steps on IRCTC." />
        <meta property="og:url" content="https://railmonk.com/rail/tdr-refund-checker" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Travel"
        title="TDR (Ticket Deposit Receipt) Refund Checker"
        subtitle="Pick what happened with your train ticket and see whether a refund applies, how much comes back, and the exact deadline to claim it — plus what a TDR is and how to file one on IRCTC."
      >
        <Breadcrumbs
          className="-mt-4 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Rail tools', href: '/#tools' }, { name: 'TDR refund checker' }]}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Scenario picker */}
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-ink dark:text-white">What happened?</h2>
            <div className="mt-3 space-y-2">
              {TDR_SCENARIOS.map((s) => {
                const active = s.id === scenarioId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScenarioId(s.id)}
                    aria-pressed={active}
                    className={cn(
                      'w-full rounded-xl border p-3 text-left text-sm font-medium transition',
                      active
                        ? 'border-brand-400 bg-brand-50/70 text-brand-800 shadow-sm dark:border-brand-500/70 dark:bg-brand-900/25 dark:text-brand-200'
                        : 'border-slate-200 bg-white text-ink-soft hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Result panel */}
          <div className="space-y-5 lg:col-span-3">
            {scenario ? (
              <>
                <Card
                  className={
                    'overflow-hidden p-5 text-white ' +
                    (scenario.eligible
                      ? 'border-emerald-300 bg-gradient-to-br from-emerald-600 to-emerald-700 dark:border-emerald-800'
                      : 'border-rose-300 bg-gradient-to-br from-rose-600 to-rose-700 dark:border-rose-800')
                  }
                >
                  <div className="flex items-start gap-3">
                    {scenario.eligible
                      ? <CheckCircle2 size={28} className="mt-0.5 shrink-0" />
                      : <XCircle size={28} className="mt-0.5 shrink-0" />}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                        {scenario.eligible ? 'Refund applies' : 'No refund'}
                      </p>
                      <p className="mt-1 font-display text-xl font-bold leading-snug">{scenario.refundText}</p>
                      {scenario.eligible && (
                        <p className="mt-1 text-sm text-white/90">
                          {scenario.needsTdr ? 'A TDR filing is required.' : 'No TDR needed — the refund is automatic for e-tickets.'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-sm">
                    <p className="font-semibold">Deadline</p>
                    <p className="mt-0.5 text-white/90">{scenario.deadlineText}</p>
                  </div>
                </Card>

                <Card className="p-5 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">What to know</h3>
                  <p className="mt-2">{scenario.detail}</p>
                  {scenario.needsTdr && (
                    <>
                      <h4 className="mt-4 flex items-center gap-1.5 font-semibold text-ink dark:text-white">
                        <FileText size={15} /> How to file the TDR
                      </h4>
                      <ol className="mt-2 list-decimal space-y-1 pl-5">
                        <li>Log in at irctc.co.in → My Account → My Transactions → <strong className="text-ink dark:text-white">File TDR</strong>.</li>
                        <li>Select the ticket and the affected passenger(s).</li>
                        <li>Pick the matching reason from the dropdown (it must match your situation — reasons are verified).</li>
                        <li>Submit and save the TDR reference number; track it under TDR History.</li>
                      </ol>
                      <p className="mt-3 text-xs text-ink-muted dark:text-slate-400">
                        TDR refunds are manually verified against train running records and typically take 60–90 days.
                      </p>
                    </>
                  )}
                </Card>

                <a
                  href="https://www.irctc.co.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
                >
                  {scenario.needsTdr ? 'File your TDR on the official IRCTC portal' : 'Check refund status on the official IRCTC portal'} <ExternalLink size={15} strokeWidth={2.2} />
                </a>
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                <FileText size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
                Select what happened with your ticket to see whether a refund applies and the deadline to claim it.
              </Card>
            )}
            {scenario ? (
              <ShareResult
                url={shareUrl}
                title="TDR refund eligibility — Railmonk"
                text={'Whether this situation qualifies for a TDR refund, and by when to file.'}
              />
            ) : null}
          </div>
        </div>

        <HowToSection
          name="How to use the TDR Refund Checker"
          description="Find out whether your train ticket situation qualifies for a refund."
          steps={[
            { name: 'Pick your situation', text: 'Choose the scenario that matches what happened — late train, AC failure, partial travel, and so on.' },
            { name: 'Read the eligibility', text: 'The checker shows whether a refund applies, how much comes back, and whether a TDR filing is needed at all.' },
            { name: 'Note the deadline', text: 'Every TDR reason has a hard filing deadline — some as tight as before the train departs.' },
            { name: 'File on IRCTC', text: 'Follow the filing steps shown, keep the TDR reference number, and expect 60–90 days for verification.' }
          ]}
        />

        {/* Definition + always-visible reason/deadline table. The per-scenario
            panel above is state-gated and so invisible to crawlers; this
            renders the same TDR_SCENARIOS data unconditionally. */}
        <section id="what-is-tdr" className="mt-12 max-w-3xl scroll-mt-24 text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">What is a TDR (Ticket Deposit Receipt) in IRCTC?</h2>
          <p className="mt-3">
            TDR is the full form of <strong className="text-ink dark:text-white">Ticket Deposit Receipt</strong> — the
            manual refund claim you file on IRCTC when an ordinary online cancellation cannot express what went
            wrong. It covers railway-caused failures and rule-recognized situations: the train ran three or more
            hours late, the AC stopped working, you were put in a lower class than booked, part of your group did
            not travel, or a late first train made you miss a connection. You file it against the PNR, the railway
            verifies it against actual running records, and the money follows if the reason holds up.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">Which situations qualify, and the deadline for each</h3>
          <p className="mt-3">
            Every TDR reason carries its own clock, and missing it voids even an obviously valid claim. Two common
            cases need no TDR at all — the railway handles them automatically.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-ink-muted dark:border-slate-700 dark:text-slate-400">
                  <th scope="col" className="py-2 pr-3 font-semibold">What happened</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">What you get back</th>
                  <th scope="col" className="py-2 font-semibold">Deadline to act</th>
                </tr>
              </thead>
              <tbody>
                {TDR_SCENARIOS.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <th scope="row" className="py-2.5 pr-3 font-medium text-ink dark:text-white">
                      {s.label}
                      {s.eligible && !s.needsTdr ? (
                        <span className="block text-xs font-normal text-emerald-600 dark:text-emerald-400">No TDR needed</span>
                      ) : null}
                    </th>
                    <td className="py-2.5 pr-3 text-ink-soft dark:text-slate-300">{s.refundText}</td>
                    <td className="py-2.5 text-ink-muted dark:text-slate-400">{s.deadlineText}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">How to file a TDR on IRCTC, step by step</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Sign in at <strong className="text-ink dark:text-white">irctc.co.in</strong> (or the IRCTC Rail Connect app) with the account that booked the ticket.</li>
            <li>Open <strong className="text-ink dark:text-white">My Account → My Transactions → File TDR</strong>.</li>
            <li>Select the booking, then tick the specific passengers the claim covers — a partly used ticket is claimed per passenger, not as a whole.</li>
            <li>Choose the reason from the dropdown. Pick the one that actually happened; the railway checks it against running data and a mismatched reason is the most common rejection.</li>
            <li>Enter the <strong className="text-ink dark:text-white">TTE certificate number</strong> if your reason needs one — AC failure, lower-class travel, and partly travelled group tickets all do. Collect it on board, not afterwards.</li>
            <li>Submit and save the TDR reference number. Track progress under <strong className="text-ink dark:text-white">My Transactions → TDR History</strong>; verification typically runs 60–90 days.</li>
          </ol>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">TDR or ordinary cancellation — which one applies?</h3>
          <p className="mt-3">
            If you are simply changing your plans and the ticket can still be cancelled online, that is a
            cancellation, not a TDR: charges follow the refund slabs and the money returns in days rather than
            months. Work out the exact rupee amount with the{' '}
            <a href="/rail/irctc-cancellation-calculator" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">IRCTC cancellation charges calculator</a>.
            A TDR is for when the railway, not you, changed the plan — and it cannot rescue a voluntary
            cancellation made inside the no-refund window.
          </p>
        </section>

        {/* Explainer */}
        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">Why a TDR takes 60–90 days</h2>
          <p className="mt-3">
            Normal cancellations are self-service: you cancel online, a charge is deducted, the rest comes back in
            days. A TDR exists for everything that self-service cannot express — the railway failed you in some way,
            or the situation has its own rule. The claim is not instant money: it is a
            <strong className="text-ink dark:text-white"> verified claim</strong>, checked against the train&rsquo;s
            actual running data and on-board records, which is why TDR refunds take 60–90 days while cancellation
            refunds take three to seven.
          </p>
          <p className="mt-3">
            When in doubt, file first from the IRCTC app and gather paperwork second — the deadlines in the table
            above are hard, and the strongest claim in the world lapses once its window closes.
          </p>
          <p className="mt-3">
            Equally important is what a TDR is not: a way to soften the no-refund window. Voluntary cancellation
            inside 8 hours of departure refunds nothing, and picking a TDR reason that did not actually occur just
            produces a rejection two months later. If you are deciding whether to cancel a ticket you can still
            cancel normally, our{' '}
            <a href="/rail/irctc-cancellation-calculator" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">cancellation charges calculator</a>{' '}
            shows exactly what each timing window returns.
          </p>
        </div>
        <NextStep
          title="Cancelling by choice instead?"
          body="An ordinary cancellation follows the refund slabs, not the TDR rules. The refund calculator shows the rupee amount you actually get back."
          href="/rail/irctc-cancellation-calculator"
          cta="Calculate my refund"
          secondary={{ href: '/rail/chart-preparation-time', label: 'Check chart preparation time' }}
        />


        <div className="mt-8">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="July 17, 2026"
            scope="Scenarios and deadlines follow published IRCTC/Indian Railways refund rules. Individual TDR outcomes are decided by the railways after verification against running records and can differ."
            sources={[
              { label: 'IRCTC E-Ticket Cancellation & Refund Rules', url: 'https://contents.irctc.co.in/en/eticketCancel.html' },
              { label: 'IRCTC Official Portal', url: 'https://www.irctc.co.in/' },
              { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' }
            ]}
          />
        </div>

        <div className="mt-8">
          <SearchLandingSections
            intro={(
              <>
                <p>
                  Most refund questions after a bad train day are really one question: does my situation qualify,
                  and how long do I have? This checker walks the nine most common scenarios — railway-cancelled
                  trains, 3+ hour delays, AC failure, class downgrades, RAC and waitlist cases, partially travelled
                  group tickets, and missed connections — and answers eligibility, refund extent, and deadline for
                  each.
                </p>
                <p>
                  It also tells you when a TDR is <em>not</em> needed: fully waitlisted e-tickets and
                  railway-cancelled trains refund automatically, and filing an unnecessary TDR only slows things
                  down.
                </p>
              </>
            )}
            example={(
              <p>
                Your train is running four hours late and you decide not to travel: that qualifies for a full
                refund, but the TDR must be filed before the train actually departs your boarding station — file it
                from the IRCTC app the moment you decide. Compare that with an AC failure en route, where you have
                20 hours after arrival and claim the AC/non-AC fare difference with the TTE&rsquo;s certificate.
              </p>
            )}
            formula={(
              <p>
                Eligibility is rule-based per scenario: railway-caused events (cancellation, 3+ hour delay, AC
                failure, downgrade, missed connection) refund in full or as a fare difference; passenger-side cases
                (RAC/WL not travelled, partial group travel) refund minus clerkage or cancellation charge; voluntary
                changes inside the no-refund window get nothing. Each scenario carries its own filing deadline,
                from before-departure to 72 hours after arrival.
              </p>
            )}
            faqItems={seoFaqItems}
          />
        </div>

        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-center text-sm leading-relaxed text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          This checker summarizes published IRCTC refund rules and is not affiliated with Indian Railways or IRCTC.
          TDR outcomes are decided by the railways after verification — file and track claims on the{' '}
          <a href="https://www.irctc.co.in" target="_blank" rel="noopener noreferrer" className="font-medium underline">official IRCTC website</a>. Rules may change without notice.
        </div>

        <UpdatedStamp updated={getTool(HREF)?.updated} href={HREF} />

        <RelatedContent href={HREF} kind="tool" />
      </CalcLayout>
    </>
  );
};

export default TDRRefundChecker;
