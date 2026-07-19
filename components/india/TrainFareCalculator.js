import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { BadgeIndianRupee, Route } from 'lucide-react';
import EEATPanel from '../calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import SearchLandingSections from '../calculator/SearchLandingSections';
import { buildSoftwareApplicationSchema, buildBreadcrumbSchema } from '../../utils/schema';
import { CalcLayout } from '../calculator/CalcLayout';
import HowToSection from '../calculator/HowToSection';
import Card from '../ui/Card';
import { cn } from '../ui/cn';

const { CLASSES, estimateFare } = require('../../utils/engines/trainFare');

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const PRESETS = [
  { label: 'Delhi – Jaipur', km: 309 },
  { label: 'Mumbai – Pune', km: 192 },
  { label: 'Chennai – Bengaluru', km: 362 },
  { label: 'Delhi – Mumbai', km: 1384 },
  { label: 'Kolkata – Delhi', km: 1450 },
  { label: 'Delhi – Chennai', km: 2180 }
];

const CATEGORIES = [
  { id: 'express', label: 'Mail / Express' },
  { id: 'superfast', label: 'Superfast' },
  { id: 'premium', label: 'Rajdhani / Shatabdi / Duronto (flexi-fare)' }
];

const TrainFareCalculator = () => {
  const [classCode, setClassCode] = useState('SL');
  const [distanceKm, setDistanceKm] = useState('500');
  const [trainCategory, setTrainCategory] = useState('superfast');
  const [passengers, setPassengers] = useState('1');

  const result = useMemo(
    () => estimateFare({ classCode, distanceKm: parseFloat(distanceKm), trainCategory, passengers: parseInt(passengers, 10) || 1 }),
    [classCode, distanceKm, trainCategory, passengers]
  );
  const pax = Math.max(1, parseInt(passengers, 10) || 1);

  const seoFaqItems = [
    {
      question: 'How is an Indian Railways train fare calculated?',
      answer:
        'The fare is built from a distance-based base fare (telescopic — the per-km rate falls as the journey gets longer), multiplied up by class, plus fixed charges: a reservation fee (₹15–60 by class), a superfast charge on superfast trains (₹15–75), 5% GST on AC classes, and catering where bundled. Rajdhani, Shatabdi, and Duronto add flexi-fare on top, which raises the base fare with demand.'
    },
    {
      question: 'Why does my IRCTC fare differ from this estimate?',
      answer:
        'This tool models the published fare structure from distance and class, calibrated to be within roughly 10% on Mail/Express-family trains. Real fares also depend on the exact route distance, train-specific catering, dynamic pricing on premium trains, and periodic fare revisions. The amount IRCTC shows at booking is always the authoritative fare.'
    },
    {
      question: 'What is flexi-fare / dynamic pricing?',
      answer:
        'On Rajdhani, Shatabdi, and Duronto trains, the base fare rises in steps (typically 10% per 10% of berths sold) up to a ceiling of roughly 1.4× in most classes. Book early on these trains: the same seat can cost 40% more once the quota fills. Executive and First AC are generally exempt from surge.'
    },
    {
      question: 'Do children need a full-fare ticket?',
      answer:
        'Children aged 5–11 pay the full adult fare if you opt for a separate berth for them; without a berth (sharing with an adult), roughly half fare applies in reserved classes. Under-5s travel free without a berth. The choice is made per child while booking.'
    },
    {
      question: 'Is there still a senior citizen concession?',
      answer:
        'No. The senior citizen concession (40% for men 60+, 50% for women 58+) has been suspended since March 2020 and had not been restored as of mid-2026 — seniors pay full fare. Lower-berth quota priority for seniors continues.'
    },
    {
      question: 'Is GST charged on train tickets?',
      answer:
        'Only on AC and first-class tickets, at 5%. Sleeper and Second Sitting fares carry no GST. The 5% applies to the fare including reservation and superfast charges, and it is not refunded on the cancellation-charge portion if you cancel.'
    }
  ];

  const softwareSchema = buildSoftwareApplicationSchema({
    name: 'Train Fare Calculator (Estimate)',
    url: 'https://railmonk.com/rail/train-fare-calculator',
    description:
      'Estimate Indian Railways ticket fares from distance and class — Sleeper to AC First — with reservation fee, superfast charge, GST, and the flexi-fare surge range on premium trains.',
    applicationCategory: 'TravelApplication',
    featureList: [
      'All eight reserved classes',
      'Telescopic distance-based base fare',
      'Reservation, superfast, and GST breakdown',
      'Flexi-fare surge range for premium trains'
    ]
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', item: 'https://railmonk.com/' },
    { name: 'Train Fare Calculator', item: 'https://railmonk.com/rail/train-fare-calculator' }
  ]);

  return (
    <>
      <Head>
        <title>Train Fare Calculator — Estimate Indian Railways Ticket Prices by Distance & Class | Railmonk</title>
        <meta
          name="description"
          content="Estimate your train ticket fare from distance and class — Sleeper, 3A, 2A, 1A, Chair Car — with the full breakdown: base fare, reservation fee, superfast charge, GST, and flexi-fare range."
        />
        <link rel="canonical" href="https://railmonk.com/rail/train-fare-calculator" />
        <meta property="og:title" content="Train Fare Calculator | Railmonk" />
        <meta property="og:description" content="Distance + class → estimated Indian Railways fare, with the full charge breakdown." />
        <meta property="og:url" content="https://railmonk.com/rail/train-fare-calculator" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Travel"
        title="Train Fare Calculator"
        subtitle="Estimate the fare for your journey from distance and class — with every charge itemized, and the flexi-fare range on premium trains."
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Inputs */}
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-ink dark:text-white">Journey details</h2>

            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Class</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {Object.entries(CLASSES).map(([code, cls]) => {
                const active = code === classCode;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setClassCode(code)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-xl border px-2 py-2 text-xs font-semibold transition',
                      active
                        ? 'border-brand-400 bg-brand-50/70 text-brand-800 shadow-sm dark:border-brand-500/70 dark:bg-brand-900/25 dark:text-brand-200'
                        : 'border-slate-200 bg-white text-ink-soft hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    {cls.label}
                  </button>
                );
              })}
            </div>

            <label htmlFor="fare-distance" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Distance (km)</label>
            <input
              id="fare-distance"
              type="number"
              min="1"
              max="4500"
              inputMode="numeric"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
              placeholder="e.g. 500"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setDistanceKm(String(p.km))}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[0.7rem] font-medium text-ink-soft transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-brand-500/60"
                >
                  {p.label} · {p.km} km
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-muted dark:text-slate-400">
              The route distance is printed on your ticket and shown on NTES / train enquiry sites.
            </p>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Train category</label>
            <div className="mt-2 space-y-2">
              {CATEGORIES.map((c) => {
                const active = c.id === trainCategory;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTrainCategory(c.id)}
                    aria-pressed={active}
                    className={cn(
                      'w-full rounded-xl border p-2.5 text-left text-sm font-medium transition',
                      active
                        ? 'border-brand-400 bg-brand-50/70 text-brand-800 shadow-sm dark:border-brand-500/70 dark:bg-brand-900/25 dark:text-brand-200'
                        : 'border-slate-200 bg-white text-ink-soft hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <label htmlFor="fare-pax" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Passengers</label>
            <input
              id="fare-pax"
              type="number"
              min="1"
              max="6"
              inputMode="numeric"
              value={passengers}
              onChange={(e) => setPassengers(e.target.value)}
              className="mt-2 w-24 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
            />
          </Card>

          {/* Result */}
          <div className="space-y-5 lg:col-span-3">
            {result ? (
              <>
                <Card className="overflow-hidden border-brand-300 bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white dark:border-brand-800">
                  <div className="flex items-start gap-3">
                    <BadgeIndianRupee size={28} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                        Estimated fare · {CLASSES[classCode].label} · {distanceKm} km
                      </p>
                      <p className="mt-1 font-display text-3xl font-bold leading-none">
                        {trainCategory === 'premium'
                          ? `${rupees(result.total)} – ${rupees(result.surgeTotal)}`
                          : rupees(result.total)}
                      </p>
                      <p className="mt-2 text-sm text-white/90">
                        {pax > 1 ? `${rupees(result.totalPerPassenger)}${trainCategory === 'premium' ? `–${rupees(result.surgeTotalPerPassenger)}` : ''} per passenger × ${pax}. ` : ''}
                        {trainCategory === 'premium'
                          ? 'The range covers flexi-fare: the low end is the base fare, the high end the typical 1.4× surge ceiling.'
                          : 'Indicative estimate — the fare IRCTC shows at booking is final.'}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">Per-passenger breakdown</h3>
                  <div className="mt-2 divide-y divide-slate-100 text-sm dark:divide-slate-700/60">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-ink-soft dark:text-slate-300">Base fare (distance × class rate)</span>
                      <span className="font-medium text-ink dark:text-white">{rupees(result.baseFare)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-ink-soft dark:text-slate-300">Reservation fee</span>
                      <span className="font-medium text-ink dark:text-white">{rupees(result.reservationFee)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-ink-soft dark:text-slate-300">Superfast charge</span>
                      <span className="font-medium text-ink dark:text-white">{result.superfastCharge ? rupees(result.superfastCharge) : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-ink-soft dark:text-slate-300">GST (5%, AC classes only)</span>
                      <span className="font-medium text-ink dark:text-white">{result.gst ? rupees(result.gst) : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 font-semibold">
                      <span className="text-ink dark:text-white">Estimated total per passenger</span>
                      <span className="text-brand-700 dark:text-brand-300">{rupees(result.totalPerPassenger)}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
                    Excludes IRCTC convenience fee, payment gateway charges, catering on trains where it is bundled,
                    and Tatkal premium — for that, see the{' '}
                    <a href="/rail/tatkal-charges-calculator" className="font-medium text-brand-600 underline underline-offset-2 dark:text-brand-300">Tatkal charges calculator</a>.
                  </p>
                </Card>
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                <Route size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
                Enter the journey distance to estimate the fare.
              </Card>
            )}
          </div>
        </div>

        <HowToSection
          name="How to use the Train Fare Calculator"
          description="Estimate what a ticket should cost before you open IRCTC."
          steps={[
            { name: 'Pick the class', text: 'From Second Sitting to AC First — the class multiplier is the biggest factor in the fare.' },
            { name: 'Enter the distance', text: 'Use the km figure from your ticket or a train enquiry site; the city-pair chips fill common routes.' },
            { name: 'Pick the train category', text: 'Superfast adds a fixed charge; Rajdhani/Shatabdi/Duronto show a flexi-fare range instead of one number.' },
            { name: 'Read the breakdown', text: 'Base fare, reservation fee, superfast charge, and GST — so you know what the IRCTC total is made of.' }
          ]}
        />

        {/* Explainer */}
        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">How Indian Railways prices a ticket</h2>
          <p className="mt-3">
            Every reserved fare is assembled from the same parts. The <strong className="text-ink dark:text-white">base
            fare</strong> comes from a distance table that is telescopic — each additional kilometre costs less than the
            last, which is why a 2,000 km journey is far less than four times a 500 km one. The class you pick scales
            that base: AC 3-Tier runs roughly 2.7× Sleeper, AC 2-Tier close to 4×, AC First around 6.5×.
          </p>
          <p className="mt-3">
            On top come the fixed charges: a <strong className="text-ink dark:text-white">reservation fee</strong> of
            ₹15–60 by class, a <strong className="text-ink dark:text-white">superfast charge</strong> of ₹15–75 on
            trains classified superfast, and <strong className="text-ink dark:text-white">5% GST on AC classes
            only</strong>. Premium trains add the flexi-fare mechanism — the base fare climbs in 10% steps as berths
            sell, up to about 1.4× — which is why this calculator shows a range for them and why booking a Rajdhani
            early genuinely saves money.
          </p>
          <p className="mt-3">
            Treat the output as a planning number, calibrated to land within about 10% on Mail/Express-family trains.
            The exact fare depends on the route&rsquo;s chartered distance and train-specific extras, and what IRCTC
            shows at payment is final. If plans might change after booking, our{' '}
            <a href="/rail/irctc-cancellation-calculator" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">cancellation calculator</a>{' '}
            tells you how much of this fare comes back at each stage.
          </p>
        </div>

        <div className="mt-8">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="July 19, 2026"
            scope="Models the published Indian Railways fare structure (telescopic base fare, class multipliers, reservation/superfast charges, GST) calibrated against current fares on common routes. Estimates only — dynamic pricing, catering bundles, and fare revisions make the IRCTC booking amount authoritative."
            sources={[
              { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' },
              { label: 'IRCTC Official Portal', url: 'https://www.irctc.co.in/' },
              { label: 'NTES — National Train Enquiry System', url: 'https://enquiry.indianrail.gov.in/mntes/' }
            ]}
          />
        </div>

        <div className="mt-8">
          <SearchLandingSections
            intro={(
              <>
                <p>
                  &ldquo;What should this ticket cost?&rdquo; is answerable from two inputs — distance and class —
                  because Indian Railways fares are formula-built, not market-priced (except the flexi-fare premium
                  trains). This calculator reconstructs that formula and itemizes the result, so an IRCTC total is
                  never a surprise again.
                </p>
                <p>
                  It covers all eight reserved classes across Mail/Express, Superfast, and premium flexi-fare trains,
                  and separates the parts people usually conflate: the distance-based fare, the fixed fees, and the
                  taxes.
                </p>
              </>
            )}
            example={(
              <p>
                Delhi to Mumbai (about 1,384 km) in AC 3-Tier on a superfast train: a base fare around {rupees(estimateFare({ classCode: '3A', distanceKm: 1384 }).baseFare)},
                plus ₹40 reservation fee, ₹45 superfast charge, and 5% GST — roughly {rupees(estimateFare({ classCode: '3A', distanceKm: 1384 }).totalPerPassenger)} per
                passenger. The same journey in Sleeper: about {rupees(estimateFare({ classCode: 'SL', distanceKm: 1384 }).totalPerPassenger)}, with no GST.
              </p>
            )}
            formula={(
              <p>
                Base fare = telescopic per-km slabs (₹0.49/km up to 500 km, stepping down to ₹0.22/km beyond
                2,000 km on the Sleeper scale) × the class multiplier. Add the class&rsquo;s reservation fee, the
                superfast charge where applicable, then 5% GST on AC classes; totals round to the nearest ₹5.
                Premium trains additionally show the ~1.4× flexi-fare ceiling as a range.
              </p>
            )}
            faqItems={seoFaqItems}
            relatedLinks={[
              { label: 'Tatkal Charges Calculator', href: '/rail/tatkal-charges-calculator' },
              { label: 'IRCTC Cancellation Calculator', href: '/rail/irctc-cancellation-calculator' },
              { label: 'IRCTC Advance Booking Calculator', href: '/rail/irctc-calculator' },
              { label: 'Waitlist Confirmation Chances', href: '/rail/waitlist-confirmation-chances' }
            ]}
          />
        </div>

        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-center text-sm leading-relaxed text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          Fares shown are estimates built from the published fare structure and typically land within ~10% for
          Mail/Express-family trains — dynamic pricing, catering bundles, and revisions can move the real number.
          Railmonk is not affiliated with Indian Railways or IRCTC. The fare shown at booking on the{' '}
          <a href="https://www.irctc.co.in" target="_blank" rel="noopener noreferrer" className="font-medium underline">official IRCTC website</a>{' '}
          is final.
        </div>
      </CalcLayout>
    </>
  );
};

export default TrainFareCalculator;
