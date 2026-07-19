import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { Gauge, HelpCircle, ListOrdered, TrainFront } from 'lucide-react';
import EEATPanel from '../calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import SearchLandingSections from '../calculator/SearchLandingSections';
import { buildSoftwareApplicationSchema, buildBreadcrumbSchema } from '../../utils/schema';
import { CalcLayout } from '../calculator/CalcLayout';
import HowToSection from '../calculator/HowToSection';
import Card from '../ui/Card';
import { cn } from '../ui/cn';

const { WL_TYPES, estimateChances } = require('../../utils/engines/waitlistChances');

const BAND_STYLES = {
  'very-high': 'border-emerald-300 bg-gradient-to-br from-emerald-600 to-emerald-700 dark:border-emerald-800',
  high: 'border-emerald-300 bg-gradient-to-br from-emerald-600 to-teal-700 dark:border-emerald-800',
  moderate: 'border-amber-300 bg-gradient-to-br from-amber-500 to-orange-600 dark:border-amber-800',
  low: 'border-rose-300 bg-gradient-to-br from-rose-500 to-rose-600 dark:border-rose-800',
  'very-low': 'border-rose-300 bg-gradient-to-br from-rose-600 to-rose-700 dark:border-rose-800'
};

const DAYS_OPTIONS = [
  { value: 30, label: '3+ weeks away' },
  { value: 12, label: '1–2 weeks away' },
  { value: 5, label: '3–7 days away' },
  { value: 1, label: 'Tomorrow / day after' }
];

const WaitlistChances = () => {
  const [wlCode, setWlCode] = useState('GNWL');
  const [wlNumber, setWlNumber] = useState('12');
  const [daysToJourney, setDaysToJourney] = useState(12);
  const [peakSeason, setPeakSeason] = useState(false);

  const result = useMemo(() => {
    const n = parseInt(wlNumber, 10);
    if (!n || n < 1) return null;
    return estimateChances({ wlCode, wlNumber: n, daysToJourney, peakSeason });
  }, [wlCode, wlNumber, daysToJourney, peakSeason]);

  const selectedType = WL_TYPES.find((t) => t.code === wlCode);

  const seoFaqItems = [
    {
      question: 'What is the difference between GNWL, RLWL, PQWL and TQWL?',
      answer:
        'They are waitlists against different quotas. GNWL (General Waitlist) applies to journeys from the train’s originating station and clears best because it draws on the largest pool of cancellations. RLWL (Remote Location) and RSWL (Roadside Station) cover intermediate-station journeys with much smaller quotas. PQWL (Pooled Quota) is a single small pool shared by several stations, and TQWL is the Tatkal waitlist — the weakest of all, since confirmed Tatkal tickets are non-refundable and rarely cancelled.'
    },
    {
      question: 'Will my GNWL ticket confirm?',
      answer:
        'No tool can promise it, but GNWL is the best-clearing waitlist. A low GNWL number (roughly under 15–20) booked well before the journey confirms on most trains and dates, because it clears from all cancellations plus the emergency-quota release at charting. High numbers, last-minute bookings, and festival-season travel pull the odds down sharply.'
    },
    {
      question: 'Is RAC a confirmed ticket?',
      answer:
        'RAC (Reservation Against Cancellation) guarantees travel — you board with a shared side-lower berth, two RAC passengers per berth — but not a full berth. Most RAC tickets are upgraded to a full berth before or during the journey as confirmed passengers cancel or do not show up. Unlike waitlisted e-tickets, RAC tickets are not auto-cancelled at charting.'
    },
    {
      question: 'Why does TQWL rarely confirm?',
      answer:
        'Two reasons. Confirmed Tatkal tickets carry no cancellation refund, so almost nobody cancels one — the queue barely moves. And at chart preparation, vacant berths in the Tatkal quota are used to clear the general waitlist (GNWL) first, ahead of TQWL.'
    },
    {
      question: 'What happens if my waitlisted ticket does not confirm?',
      answer:
        'A fully waitlisted e-ticket is automatically cancelled when the chart is prepared, and the fare minus a clerkage charge is refunded to the payment source — you cannot board with it. RAC and partially confirmed tickets are different: they remain valid for travel, and if you choose not to travel you must cancel or file a TDR at least 30 minutes before departure.'
    },
    {
      question: 'When do waitlists move the most?',
      answer:
        'Two windows: the days right after booking opens (agents and plans churn), and chart preparation about 4 hours before departure, when unused quotas — emergency, defence, headquarters and vacant Tatkal berths — are released to clear the queue. A ticket that looks stuck at WL 8 for days can still confirm at charting.'
    }
  ];

  const softwareSchema = buildSoftwareApplicationSchema({
    name: 'Train Waitlist Confirmation Chances',
    url: 'https://railmonk.com/rail/waitlist-confirmation-chances',
    description:
      'Decode your IRCTC waitlist code (GNWL, RLWL, PQWL, RSWL, TQWL, RAC) and get an indicative confirmation-chance estimate from your waitlist number, days to journey and season.',
    applicationCategory: 'TravelApplication',
    featureList: [
      'All six waitlist/RAC codes decoded',
      'Indicative confirmation-chance band',
      'Waitlist number and lead-time aware',
      'Festival-season adjustment'
    ]
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', item: 'https://railmonk.com/' },
    { name: 'Waitlist Confirmation Chances', item: 'https://railmonk.com/rail/waitlist-confirmation-chances' }
  ]);

  return (
    <>
      <Head>
        <title>Train Waitlist Confirmation Chances — GNWL, RLWL, PQWL, TQWL Decoded | Railmonk</title>
        <meta
          name="description"
          content="What does GNWL, RLWL, PQWL, RSWL, TQWL or RAC mean on your train ticket? Decode your waitlist code and get an indicative confirmation-chance estimate from your WL number, days to journey and season."
        />
        <link rel="canonical" href="https://railmonk.com/rail/waitlist-confirmation-chances" />
        <meta property="og:title" content="Train Waitlist Confirmation Chances | Railmonk" />
        <meta property="og:description" content="Decode GNWL, RLWL, PQWL, RSWL, TQWL and RAC — and see how likely your waitlisted train ticket is to confirm." />
        <meta property="og:url" content="https://railmonk.com/rail/waitlist-confirmation-chances" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Travel"
        title="Waitlist Confirmation Chances"
        subtitle="Pick your waitlist code and number to see what it actually means — and an honest, indicative estimate of whether it will confirm."
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Inputs */}
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-ink dark:text-white">Your ticket status</h2>

            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Waitlist code</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {WL_TYPES.map((t) => {
                const active = t.code === wlCode;
                return (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => setWlCode(t.code)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-xl border px-2 py-2 text-sm font-semibold transition',
                      active
                        ? 'border-brand-400 bg-brand-50/70 text-brand-800 shadow-sm dark:border-brand-500/70 dark:bg-brand-900/25 dark:text-brand-200'
                        : 'border-slate-200 bg-white text-ink-soft hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    {t.code}
                  </button>
                );
              })}
            </div>
            {selectedType && (
              <p className="mt-2 text-xs leading-relaxed text-ink-muted dark:text-slate-400">{selectedType.name}</p>
            )}

            <label htmlFor="wl-number" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
              {wlCode === 'RAC' ? 'RAC number' : 'Waitlist number'}
            </label>
            <input
              id="wl-number"
              type="number"
              min="1"
              max="500"
              inputMode="numeric"
              value={wlNumber}
              onChange={(e) => setWlNumber(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
              placeholder="e.g. 12 for GNWL 12"
            />

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Journey is</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {DAYS_OPTIONS.map((d) => {
                const active = d.value === daysToJourney;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDaysToJourney(d.value)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-xl border px-2 py-2 text-xs font-medium transition',
                      active
                        ? 'border-brand-400 bg-brand-50/70 text-brand-800 shadow-sm dark:border-brand-500/70 dark:bg-brand-900/25 dark:text-brand-200'
                        : 'border-slate-200 bg-white text-ink-soft hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-ink-soft dark:text-slate-300">
              <input
                type="checkbox"
                checked={peakSeason}
                onChange={(e) => setPeakSeason(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
              />
              Festival / holiday-season travel (Diwali, Chhath, summer rush…)
            </label>
          </Card>

          {/* Result */}
          <div className="space-y-5 lg:col-span-3">
            {result ? (
              <>
                <Card className={cn('overflow-hidden p-5 text-white', BAND_STYLES[result.band])}>
                  <div className="flex items-start gap-3">
                    <Gauge size={28} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                        {wlCode} {parseInt(wlNumber, 10)} · {selectedType?.name}
                      </p>
                      <p className="mt-1 font-display text-2xl font-bold leading-snug">{result.label}</p>
                      <p className="mt-1 text-sm text-white/90">Confirmation chance {result.pctText}. This is a rule-of-thumb estimate, not a prediction for your specific train.</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/25">
                    <div className="h-full rounded-full bg-white" style={{ width: `${result.score}%` }} />
                  </div>
                </Card>

                <Card className="p-5 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">Why this estimate</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5">
                    {result.factors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                  {selectedType && (
                    <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-ink-muted dark:bg-slate-800/60 dark:text-slate-400">
                      <strong className="text-ink dark:text-white">At charting:</strong> {selectedType.chartingNote}
                    </p>
                  )}
                </Card>
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                <ListOrdered size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
                Enter your waitlist number to see the estimate.
              </Card>
            )}
          </div>
        </div>

        {/* Decoder */}
        <div className="mt-12">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">Every waitlist code, decoded</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {WL_TYPES.map((t) => (
              <Card key={t.code} className="p-5">
                <div className="flex items-center gap-2">
                  <TrainFront size={18} className="text-brand-600 dark:text-brand-300" />
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">
                    {t.code} <span className="font-medium text-ink-muted dark:text-slate-400">— {t.name}</span>
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{t.meaning}</p>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted dark:text-slate-400">{t.chartingNote}</p>
              </Card>
            ))}
          </div>
        </div>

        <HowToSection
          name="How to use the Waitlist Chances estimator"
          description="Turn a cryptic PNR status into a decision."
          steps={[
            { name: 'Read your PNR status', text: 'Find the code and number on your ticket, e.g. GNWL 12/WL 8 — the second number is your current position.' },
            { name: 'Pick code and number', text: 'Select the waitlist code, enter the current number, and set how far away the journey is.' },
            { name: 'Read the band honestly', text: 'The estimate is a rule-of-thumb ordering — GNWL clears best, PQWL and TQWL worst — adjusted for depth, time and season.' },
            { name: 'Have a plan B', text: 'For "unlikely" bands, look at alternate trains or dates now rather than at charting, when everything else is also sold out.' }
          ]}
        />

        {/* Explainer */}
        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">How waitlists actually clear</h2>
          <p className="mt-3">
            Every waitlisted ticket is a claim on future cancellations in <strong className="text-ink dark:text-white">one
            specific quota</strong> — which is why the code matters more than the number. GNWL 25 from the originating
            station regularly confirms; PQWL 25 on the same train usually will not, because the pooled quota it draws
            from might be a handful of berths shared across several stations.
          </p>
          <p className="mt-3">
            Movement comes in two waves. Cancellations trickle in over the booking window as plans change. Then, about
            four hours before departure, <strong className="text-ink dark:text-white">chart preparation</strong> releases
            every unused reserved quota — emergency, headquarters, defence, vacant Tatkal berths — into the queue at
            once. This is why a stuck waitlist can jump twenty places at the end, and why the final answer only truly
            arrives at charting.
          </p>
          <p className="mt-3">
            Know your downside before you wait it out. A fully waitlisted e-ticket that fails to confirm is auto-cancelled
            with a near-full refund, so waiting costs little. An RAC ticket travels either way. The trap is a Tatkal
            waitlist during festival season — the queue barely moves, and the time you spend hoping is time you are not
            booking an alternative. If your ticket does confirm and plans later change, our{' '}
            <a href="/rail/irctc-cancellation-calculator" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">cancellation charges calculator</a>{' '}
            shows what cancelling costs at each stage, and the{' '}
            <a href="/rail/tdr-refund-checker" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">TDR refund checker</a>{' '}
            covers RAC and partial-confirmation refund cases.
          </p>
        </div>

        <div className="mt-8">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="July 19, 2026"
            scope="Quota definitions and charting behaviour follow published Indian Railways rules. The confirmation-chance band is a heuristic estimate — Indian Railways publishes no per-train probabilities, and actual outcomes vary by train, route, date and season."
            sources={[
              { label: 'IRCTC Official Portal', url: 'https://www.irctc.co.in/' },
              { label: 'IRCTC E-Ticket Cancellation & Refund Rules', url: 'https://contents.irctc.co.in/en/eticketCancel.html' },
              { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' }
            ]}
          />
        </div>

        <div className="mt-8">
          <SearchLandingSections
            intro={(
              <>
                <p>
                  A PNR status like <em>GNWL 34/WL 12</em> packs two facts: which quota&rsquo;s cancellations you are
                  waiting on, and how many people are ahead of you. This page decodes all six codes — GNWL, RLWL,
                  PQWL, RSWL, TQWL and RAC — and turns your code, number, lead time and season into an honest
                  indicative band instead of a false precise percentage.
                </p>
                <p>
                  It also tells you what happens if the ticket never confirms: waitlisted e-tickets drop automatically
                  at charting with a refund, while RAC tickets stay valid for travel and need an active cancellation
                  if you will not board.
                </p>
              </>
            )}
            example={(
              <p>
                GNWL 12 on a ticket booked three weeks out, outside festival season: a good-to-very-good chance —
                twelve general-quota cancellations over three weeks plus the charting release is a normal outcome.
                The same number as TQWL for tomorrow&rsquo;s train is the opposite story: Tatkal tickets are rarely
                cancelled, and vacant Tatkal berths clear GNWL first at charting.
              </p>
            )}
            formula={(
              <p>
                The estimate starts from each quota&rsquo;s observed clearing strength (RAC &gt; GNWL &gt; RLWL &gt;
                RSWL &gt; PQWL &gt; TQWL), scales it down as the waitlist number deepens, adds a lead-time adjustment,
                and applies a festival-season penalty. The result maps to five bands from &ldquo;very likely&rdquo; to
                &ldquo;very unlikely&rdquo; — deliberately a band, because no public data supports an exact percentage.
              </p>
            )}
            faqItems={seoFaqItems}
            relatedLinks={[
              { label: 'IRCTC Advance Booking Calculator', href: '/rail/irctc-calculator' },
              { label: 'IRCTC Cancellation Calculator', href: '/rail/irctc-cancellation-calculator' },
              { label: 'TDR Refund Checker', href: '/rail/tdr-refund-checker' },
              { label: 'Tatkal Charges Calculator', href: '/rail/tatkal-charges-calculator' },
              { label: 'Train Berth Position Finder', href: '/rail/berth-position-finder' }
            ]}
          />
        </div>

        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-center text-sm leading-relaxed text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          <HelpCircle size={15} className="mr-1 inline-block" />
          The confirmation estimate is an indicative rule of thumb, not a prediction — actual clearance depends on your
          specific train, route, date and quota, which no public data source exposes. Railmonk is not affiliated with
          Indian Railways or IRCTC. Check live PNR status on the{' '}
          <a href="https://www.irctc.co.in" target="_blank" rel="noopener noreferrer" className="font-medium underline">official IRCTC website</a>.
        </div>
      </CalcLayout>
    </>
  );
};

export default WaitlistChances;
