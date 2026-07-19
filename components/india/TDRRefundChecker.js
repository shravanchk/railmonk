import React, { useState } from 'react';
import Head from 'next/head';
import { CheckCircle2, ExternalLink, FileText, XCircle } from 'lucide-react';
import EEATPanel from '../calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import SearchLandingSections from '../calculator/SearchLandingSections';
import { buildSoftwareApplicationSchema, buildBreadcrumbSchema } from '../../utils/schema';
import { CalcLayout } from '../calculator/CalcLayout';
import HowToSection from '../calculator/HowToSection';
import Card from '../ui/Card';
import { cn } from '../ui/cn';

const { TDR_SCENARIOS } = require('../../utils/engines/tdrRules');

const TDRRefundChecker = () => {
  const [scenarioId, setScenarioId] = useState(null);
  const scenario = TDR_SCENARIOS.find((s) => s.id === scenarioId) || null;

  const seoFaqItems = [
    {
      question: 'What is a TDR?',
      answer:
        'A TDR (Ticket Deposit Receipt) is a manual refund claim filed on IRCTC for situations where normal online cancellation does not apply — the train ran 3+ hours late, the AC failed, you were shifted to a lower class, part of a group did not travel, and similar cases. The claim is forwarded to the railways, verified against actual train running records, and refunded if the reason checks out.'
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
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', item: 'https://railmonk.com/' },
    { name: 'TDR Refund Checker', item: 'https://railmonk.com/rail/tdr-refund-checker' }
  ]);

  return (
    <>
      <Head>
        <title>TDR Refund Checker — Am I Eligible for an IRCTC Refund? | Railmonk</title>
        <meta name="description" content="Check if your situation qualifies for an IRCTC TDR refund: train 3+ hours late, AC failure, RAC/waitlist not travelled, partial group travel, missed connection — with exact filing deadlines." />
        <link rel="canonical" href="https://railmonk.com/rail/tdr-refund-checker" />
        <meta property="og:title" content="TDR Refund Eligibility Checker | Railmonk" />
        <meta property="og:description" content="Pick your situation and see whether a TDR refund applies, how much comes back, and the filing deadline." />
        <meta property="og:url" content="https://railmonk.com/rail/tdr-refund-checker" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Travel"
        title="TDR Refund Eligibility Checker"
        subtitle="Pick what happened with your train ticket and see whether a refund applies, how much comes back, and the exact deadline to claim it."
      >
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

        {/* Explainer */}
        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">TDR refunds, in plain words</h2>
          <p className="mt-3">
            Normal cancellations are self-service: you cancel online, a charge is deducted, the rest comes back in
            days. A TDR exists for everything that self-service cannot express — the railway failed you in some way,
            or the situation has its own rule. The claim is not instant money: it is a
            <strong className="text-ink dark:text-white"> verified claim</strong>, checked against the train&rsquo;s
            actual running data and on-board records, which is why TDR refunds take 60–90 days while cancellation
            refunds take three to seven.
          </p>
          <p className="mt-3">
            The single most useful thing to internalize is that <strong className="text-ink dark:text-white">every
            TDR reason has its own clock</strong>. A 3-hour-late train refunds in full — but only if you file before
            the train actually leaves your station. AC failure gives you 20 hours from arrival. A partially travelled
            group ticket gives 72 hours, and needs the TTE&rsquo;s certificate collected during the journey. Miss the
            window and the strongest claim in the world lapses. When in doubt, file first from the IRCTC app and
            gather paperwork second.
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
            relatedLinks={[
              { label: 'IRCTC Cancellation Calculator', href: '/rail/irctc-cancellation-calculator' },
              { label: 'IRCTC Advance Booking Calculator', href: '/rail/irctc-calculator' },
              { label: 'Tatkal Charges Calculator', href: '/rail/tatkal-charges-calculator' },
              { label: 'Waitlist Confirmation Chances', href: '/rail/waitlist-confirmation-chances' },
              { label: 'Train Berth Position Finder', href: '/rail/berth-position-finder' }
            ]}
          />
        </div>

        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-center text-sm leading-relaxed text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          This checker summarizes published IRCTC refund rules and is not affiliated with Indian Railways or IRCTC.
          TDR outcomes are decided by the railways after verification — file and track claims on the{' '}
          <a href="https://www.irctc.co.in" target="_blank" rel="noopener noreferrer" className="font-medium underline">official IRCTC website</a>. Rules may change without notice.
        </div>
      </CalcLayout>
    </>
  );
};

export default TDRRefundChecker;
