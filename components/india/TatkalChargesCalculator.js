import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { ExternalLink, Zap } from 'lucide-react';
import EEATPanel from '../calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import SearchLandingSections from '../calculator/SearchLandingSections';
import { buildSoftwareApplicationSchema, buildBreadcrumbSchema } from '../../utils/schema';
import { CalcLayout } from '../calculator/CalcLayout';
import HowToSection from '../calculator/HowToSection';
import { SelectField } from '../ui/Field';
import Card from '../ui/Card';

const { TATKAL_RULES, computeTatkalCharge } = require('../../utils/engines/tatkalCharges');

const controlCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink ' +
  'shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// Worked-example figures come from the same engine the calculator runs.
const EX_3A = computeTatkalCharge({ classCode: '3A', basicFare: 1200, passengers: 2 });
const EX_SL_MIN = computeTatkalCharge({ classCode: 'SL', basicFare: 400, passengers: 1 });
const EX_2A_MAX = computeTatkalCharge({ classCode: '2A', basicFare: 3000, passengers: 1 });

const classOptions = Object.entries(TATKAL_RULES).map(([value, rule]) => ({ value, label: rule.label }));

const TatkalChargesCalculator = () => {
  const [classCode, setClassCode] = useState('3A');
  const [basicFare, setBasicFare] = useState('');
  const [passengers, setPassengers] = useState('1');

  const fareNum = parseFloat(basicFare);
  const paxNum = Math.max(1, Math.min(4, parseInt(passengers, 10) || 1));
  const rule = TATKAL_RULES[classCode];

  const result = useMemo(() => {
    if (!(fareNum > 0)) return null;
    const r = computeTatkalCharge({ classCode, basicFare: fareNum, passengers: paxNum });
    return r.valid ? r : null;
  }, [classCode, fareNum, paxNum]);

  const capExplanation = result
    ? result.minApplied
      ? `${Math.round(result.rate * 100)}% of your basic fare would be less than the class minimum, so the minimum of ${rupees(rule.min)} per passenger applies.`
      : result.maxApplied
        ? `${Math.round(result.rate * 100)}% of your basic fare exceeds the class cap, so the maximum of ${rupees(rule.max)} per passenger applies.`
        : `${Math.round(result.rate * 100)}% of the basic fare, which sits between the ${rupees(rule.min)} minimum and ${rupees(rule.max)} maximum for this class.`
    : '';

  const seoFaqItems = [
    {
      question: 'How is the Tatkal charge calculated?',
      answer:
        'The Tatkal charge is a percentage of the basic fare — 10% for Second Sitting and Sleeper, 30% for AC Chair Car, AC 3-Tier, AC 2-Tier, and Executive Chair Car — subject to a class-wise minimum and maximum per passenger (for example ₹300–₹400 for AC 3-Tier). It is added on top of the normal fare, per passenger.'
    },
    {
      question: 'Is there Tatkal in AC First Class (1A)?',
      answer:
        'No. Tatkal quota is not available in AC First Class. It exists in Second Sitting, Sleeper, AC Chair Car, AC 3-Tier, AC 2-Tier, and Executive Chair Car.'
    },
    {
      question: 'What is Premium Tatkal and why can’t its price be calculated?',
      answer:
        'Premium Tatkal is a separate quota (AC classes on selected trains) that uses dynamic pricing — the fare rises with demand, up to roughly 1.5 times the Tatkal fare. Because the multiplier depends on how many seats have already sold, the exact price can only be seen at booking time on IRCTC.'
    },
    {
      question: 'When does Tatkal booking open?',
      answer:
        'Tatkal booking opens one day before the journey date (date of departure from the train’s originating station) — at 10:00 AM IST for AC classes and 11:00 AM IST for non-AC classes. Our IRCTC advance booking calculator shows the exact date and time for your journey.'
    },
    {
      question: 'Do I get the Tatkal charge back if I cancel?',
      answer:
        'For a confirmed Tatkal ticket, no — confirmed Tatkal tickets are non-refundable on voluntary cancellation, including the Tatkal charge. Tatkal tickets still on the waitlist are refunded minus the clerkage charge if they do not confirm.'
    },
    {
      question: 'Is the Tatkal charge per ticket or per passenger?',
      answer:
        'Per passenger. A family of four in AC 3-Tier pays four separate Tatkal charges, each computed from the basic fare with the class min/max applied individually.'
    }
  ];

  const softwareSchema = buildSoftwareApplicationSchema({
    name: 'Tatkal Charges Calculator',
    url: 'https://railmonk.com/rail/tatkal-charges-calculator',
    description: 'Calculate the extra Tatkal charge on Indian Railways tickets — 10%/30% of basic fare with class-wise min/max caps, per passenger.',
    applicationCategory: 'TravelApplication',
    featureList: [
      'Class-wise Tatkal percentage rates',
      'Minimum and maximum cap handling',
      'Per-passenger and total fare breakdown',
      'Tatkal vs general fare comparison'
    ]
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', item: 'https://railmonk.com/' },
    { name: 'Tatkal Charges Calculator', item: 'https://railmonk.com/rail/tatkal-charges-calculator' }
  ]);

  return (
    <>
      <Head>
        <title>Tatkal Charges Calculator — Extra Cost of Tatkal Tickets | Railmonk</title>
        <meta name="description" content="How much extra does a Tatkal ticket cost? Calculate the Tatkal charge for SL, 3A, 2A, CC, EC and 2S — percentage of basic fare with class-wise min/max caps, per passenger." />
        <link rel="canonical" href="https://railmonk.com/rail/tatkal-charges-calculator" />
        <meta property="og:title" content="Tatkal Charges Calculator | Railmonk" />
        <meta property="og:description" content="Calculate the exact Tatkal premium for your train class — 10%/30% of basic fare with min/max caps." />
        <meta property="og:url" content="https://railmonk.com/rail/tatkal-charges-calculator" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Travel"
        title="Tatkal Charges Calculator"
        subtitle="See exactly how much extra a Tatkal ticket costs for your class — the percentage, the min/max caps, and the total fare."
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Input panel */}
          <Card className="p-5 lg:col-span-2">
            <div className="space-y-4">
              <SelectField
                id="tatkal-class"
                label="Ticket class"
                value={classCode}
                onChange={setClassCode}
                options={classOptions}
              />

              <div>
                <label htmlFor="tatkal-fare" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">Basic fare per passenger (₹)</label>
                <input
                  id="tatkal-fare"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="e.g. 1200"
                  value={basicFare}
                  onChange={(e) => setBasicFare(e.target.value)}
                  className={controlCls}
                />
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
                  The basic fare shown in the fare breakup — before reservation fee, superfast charge, and GST.
                </p>
              </div>

              <div>
                <label htmlFor="tatkal-pax" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">Passengers (max 4 per Tatkal ticket)</label>
                <input
                  id="tatkal-pax"
                  type="number"
                  min="1"
                  max="4"
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  className={controlCls}
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-relaxed text-ink-soft dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                <p className="font-semibold text-ink dark:text-white">{rule.label} Tatkal rule</p>
                <p className="mt-1">
                  {Math.round(rule.rate * 100)}% of basic fare, minimum {rupees(rule.min)}, maximum {rupees(rule.max)} — per passenger.
                </p>
              </div>
            </div>
          </Card>

          {/* Results panel */}
          <div className="space-y-5 lg:col-span-3">
            {result ? (
              <>
                <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white dark:border-brand-700">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Tatkal charge</p>
                      <p className="mt-1 font-display text-3xl font-bold leading-tight">{rupees(result.totalCharge)}</p>
                      <p className="mt-0.5 text-sm text-white/85">
                        {paxNum > 1 ? `${rupees(result.chargePerPassenger)} × ${paxNum} passengers` : 'for one passenger'}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-xl bg-white/15 px-4 py-3 text-center">
                      <div className="text-xs text-white/85">Of basic fare</div>
                      <div className="mt-0.5 font-display text-xl font-bold leading-none">+{result.percentOfFare.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-sm">
                    <p className="text-white/90">{capExplanation}</p>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">Fare breakdown</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-ink-muted dark:text-slate-400">Basic fare {paxNum > 1 ? `(× ${paxNum})` : ''}</dt>
                      <dd className="font-semibold text-ink dark:text-slate-100">{rupees(fareNum * paxNum)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-ink-muted dark:text-slate-400">Tatkal charge {paxNum > 1 ? `(× ${paxNum})` : ''}</dt>
                      <dd className="font-semibold text-ink dark:text-slate-100">+{rupees(result.totalCharge)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2 dark:border-slate-700">
                      <dt className="font-semibold text-ink dark:text-white">Fare with Tatkal (before other add-ons)</dt>
                      <dd className="font-display text-lg font-bold text-brand-700 dark:text-brand-300">{rupees(result.totalFare)}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
                    Reservation fee, superfast charge, GST (AC classes), and catering are added on top by IRCTC for
                    both general and Tatkal tickets — the Tatkal charge is the only difference between the two.
                  </p>
                </Card>

                <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50/70 p-4 text-sm leading-relaxed text-amber-800/90 dark:border-amber-500 dark:bg-amber-900/20 dark:text-amber-200/90">
                  <span className="font-semibold">Premium Tatkal is different:</span> on trains with the Premium
                  Tatkal quota, dynamic pricing raises the fare with demand (up to ~1.5× the Tatkal fare). The exact
                  price is only visible at booking time on IRCTC.
                </div>

                <a
                  href="https://www.irctc.co.in/nget/train-search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
                >
                  Book on the official IRCTC portal <ExternalLink size={15} strokeWidth={2.2} />
                </a>
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                <Zap size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
                Enter the basic fare per passenger to see the Tatkal charge and total.
              </Card>
            )}
          </div>
        </div>

        <HowToSection
          name="How to use the Tatkal Charges Calculator"
          description="Work out the extra cost of a Tatkal ticket for any class."
          steps={[
            { name: 'Pick your class', text: 'Tatkal exists in 2S, SL, CC, 3A, 2A, and EC — each has its own percentage and caps.' },
            { name: 'Enter the basic fare', text: 'Use the basic fare from the fare breakup, not the all-inclusive total.' },
            { name: 'Set passengers', text: 'Tatkal tickets carry up to 4 passengers; the charge applies to each.' },
            { name: 'Read the result', text: 'The calculator shows the per-passenger charge, whether a min/max cap applied, and the total fare.' }
          ]}
        />

        {/* Rules explainer */}
        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">How Tatkal pricing works, in plain words</h2>
          <p className="mt-3">
            Tatkal is a last-minute quota, and the premium for it is a straightforward surcharge on the basic fare:
            <strong className="text-ink dark:text-white"> 10% in Second Sitting and Sleeper, 30% in the AC classes</strong> —
            AC Chair Car, AC 3-Tier, AC 2-Tier, and Executive Chair Car. Each class then applies a floor and a
            ceiling per passenger, so very cheap tickets pay a bit more than the percentage and expensive ones pay
            less: Sleeper is capped between ₹100 and ₹200, AC 3-Tier between ₹300 and ₹400, AC 2-Tier and Executive
            between ₹400 and ₹500, AC Chair Car between ₹125 and ₹225, and Second Sitting between ₹10 and ₹15.
          </p>
          <p className="mt-3">
            The caps mean the effective premium varies more than people expect. A ₹1,200 AC 3-Tier basic fare pays
            30% — {rupees(EX_3A.chargePerPassenger)} per passenger, {rupees(EX_3A.totalCharge)} for a couple. But a
            ₹400 Sleeper fare pays the ₹100 minimum rather than 10% ({rupees(40)}), an effective 25% — while a
            ₹3,000 AC 2-Tier fare pays only the ₹500 cap instead of 30% (₹900), an effective{' '}
            {EX_2A_MAX.percentOfFare.toFixed(0)}%. Long-distance AC Tatkal is, proportionally, the best value.
          </p>
          <p className="mt-3">
            Two things the charge does not buy: refundability and flexibility.
            <strong className="text-ink dark:text-white"> Confirmed Tatkal tickets are non-refundable on voluntary
            cancellation</strong> — the whole fare including the surcharge is forfeited — and no changes of name or
            boarding are permitted beyond what IRCTC allows for all tickets. Budget for Tatkal only when the trip is
            certain, and check our{' '}
            <a href="/rail/irctc-cancellation-calculator" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">cancellation calculator</a>{' '}
            for what a general-quota ticket would return instead.
          </p>
        </div>

        <div className="mt-8">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="July 17, 2026"
            scope="Charges follow the published Indian Railways Tatkal charge table (rates and class-wise caps). Premium Tatkal dynamic fares and train-specific quota availability are decided by IRCTC at booking time."
            sources={[
              { label: 'IRCTC Tatkal Scheme Details', url: 'https://contents.irctc.co.in/en/TATKALSCHEME.pdf' },
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
                  Tatkal fares surprise people at checkout because the surcharge is buried in the fare breakup. This
                  calculator answers the question before you book: given your class and basic fare, it shows the
                  exact Tatkal charge per passenger, whether the class minimum or maximum kicked in, and the total
                  you will pay for the group.
                </p>
                <p>
                  It implements the published Tatkal charge table — percentage of basic fare with class-wise caps —
                  which has been stable since 2015. Premium Tatkal (dynamic pricing) is flagged separately because
                  its multiplier can only be seen live on IRCTC.
                </p>
              </>
            )}
            example={(
              <p>
                Two passengers in AC 3-Tier with a basic fare of ₹1,200 each: the Tatkal charge is 30% —{' '}
                {rupees(EX_3A.chargePerPassenger)} per passenger, inside the ₹300–₹400 band — so the pair pays{' '}
                {rupees(EX_3A.totalCharge)} extra, and {rupees(EX_3A.totalFare)} in fare-plus-Tatkal before
                reservation and GST add-ons. A single ₹400 Sleeper fare instead hits the ₹100 minimum:{' '}
                {rupees(EX_SL_MIN.chargePerPassenger)} rather than 10%.
              </p>
            )}
            formula={(
              <p>
                Tatkal charge per passenger = clamp(rate × basic fare, class minimum, class maximum), where rate is
                10% for 2S/SL and 30% for CC/3A/2A/EC. Caps per passenger: 2S ₹10–₹15, SL ₹100–₹200, CC ₹125–₹225,
                3A ₹300–₹400, 2A ₹400–₹500, EC ₹400–₹500. Total = (basic fare + charge) × passengers, before
                reservation fee, superfast charge, and GST.
              </p>
            )}
            faqItems={seoFaqItems}
            relatedLinks={[
              { label: 'IRCTC Advance Booking Calculator', href: '/rail/irctc-calculator' },
              { label: 'IRCTC Cancellation Calculator', href: '/rail/irctc-cancellation-calculator' },
              { label: 'TDR Refund Checker', href: '/rail/tdr-refund-checker' },
              { label: 'Waitlist Confirmation Chances', href: '/rail/waitlist-confirmation-chances' },
              { label: 'Train Berth Position Finder', href: '/rail/berth-position-finder' }
            ]}
          />
        </div>

        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-center text-sm leading-relaxed text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          This calculator is an estimate based on the published Tatkal charge table and is not affiliated with
          Indian Railways or IRCTC. Final fares are shown by IRCTC at booking time on the{' '}
          <a href="https://www.irctc.co.in" target="_blank" rel="noopener noreferrer" className="font-medium underline">official IRCTC website</a>. Rules may change without notice.
        </div>
      </CalcLayout>
    </>
  );
};

export default TatkalChargesCalculator;
