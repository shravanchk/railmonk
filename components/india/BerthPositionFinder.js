import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { BedDouble } from 'lucide-react';
import EEATPanel from '../calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import SearchLandingSections from '../calculator/SearchLandingSections';
import { buildSoftwareApplicationSchema, buildBreadcrumbSchema } from '../../utils/schema';
import { CalcLayout } from '../calculator/CalcLayout';
import HowToSection from '../calculator/HowToSection';
import { SelectField } from '../ui/Field';
import Card from '../ui/Card';
import { cn } from '../ui/cn';

const { CLASS_LAYOUTS, computeBerthPosition } = require('../../utils/engines/berthPosition');

const controlCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink ' +
  'shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

const classOptions = Object.entries(CLASS_LAYOUTS).map(([value, layout]) => ({ value, label: layout.label }));

// Renders one bay of the coach with the selected berth highlighted. Main-bay
// berths sit left of the aisle, side berths right — matching the physical coach.
const BayDiagram = ({ result }) => {
  const { cycle, bayStart, indexInBay } = result;
  const mainBerths = [];
  const sideBerths = [];
  cycle.forEach((type, i) => {
    const berth = { number: bayStart + i, type, selected: i === indexInBay };
    if (type === 'SL' || type === 'SU') sideBerths.push(berth);
    else mainBerths.push(berth);
  });

  const cell = (berth) => (
    <div
      key={berth.number}
      className={cn(
        'flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs font-semibold',
        berth.selected
          ? 'border-brand-500 bg-brand-600 text-white shadow-sm'
          : 'border-slate-200 bg-white text-ink-soft dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300'
      )}
    >
      <span>#{berth.number}</span>
      <span className={berth.selected ? 'text-white/90' : 'text-ink-muted dark:text-slate-500'}>{berth.type}</span>
    </div>
  );

  return (
    <div className="flex items-stretch gap-3">
      <div className="flex-1 space-y-1.5">
        <p className="text-[0.68rem] font-bold uppercase tracking-wide text-ink-muted dark:text-slate-500">Main bay</p>
        <div className="grid grid-cols-2 gap-1.5">{mainBerths.map(cell)}</div>
      </div>
      <div aria-hidden="true" className="flex w-6 shrink-0 items-center justify-center">
        <span className="rotate-90 whitespace-nowrap text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-slate-300 dark:text-slate-600">Aisle</span>
      </div>
      {sideBerths.length ? (
        <div className="w-28 shrink-0 space-y-1.5">
          <p className="text-[0.68rem] font-bold uppercase tracking-wide text-ink-muted dark:text-slate-500">Side</p>
          <div className="grid gap-1.5">{sideBerths.map(cell)}</div>
        </div>
      ) : null}
    </div>
  );
};

const BerthPositionFinder = () => {
  const [classCode, setClassCode] = useState('SL');
  const [berthNumber, setBerthNumber] = useState('');

  const layout = CLASS_LAYOUTS[classCode];
  const result = useMemo(() => {
    const n = parseInt(berthNumber, 10);
    if (!Number.isInteger(n)) return null;
    return computeBerthPosition({ classCode, berthNumber: n });
  }, [classCode, berthNumber]);

  const invalidNumber = berthNumber !== '' && result === null;

  const seoFaqItems = [
    {
      question: 'How do I know if my berth is lower, middle, or upper?',
      answer:
        'Berth types repeat in a fixed pattern within each class. In Sleeper and AC 3-Tier the pattern is 8 berths per bay: 1 lower, 2 middle, 3 upper, 4 lower, 5 middle, 6 upper, then 7 side lower and 8 side upper — and it repeats (so berth 23 is a side lower). AC 2-Tier repeats every 6 (lower, upper, lower, upper, side lower, side upper), and AC First alternates lower/upper.'
    },
    {
      question: 'Which berth numbers are side berths in Sleeper class?',
      answer:
        'Berth numbers that leave a remainder of 7 (side lower) or 0 (side upper) when divided by 8: side lowers are 7, 15, 23, 31, 39, 47, 55, 63, 71 and side uppers are 8, 16, 24, 32, 40, 48, 56, 64, 72.'
    },
    {
      question: 'Does the pattern change between ICF and LHB coaches?',
      answer:
        'The repeating bay pattern is the same; what changes is coach length. ICF Sleeper has 72 berths while LHB builds go up to around 78–81; ICF AC 3-Tier has 64 while LHB has 72. A berth number valid for your coach follows the same type pattern either way.'
    },
    {
      question: 'Which berth is best for senior citizens?',
      answer:
        'Lower berths — no climbing, closest to the floor and luggage. Indian Railways also runs a lower-berth quota for senior citizens and reserves priority allotment; choosing "lower berth preferred" at booking uses it. Middle berths are the hardest: they fold away for daytime seating and require an awkward climb.'
    },
    {
      question: 'Why is the side lower berth shared in Sleeper class?',
      answer:
        'Side lower berths are where RAC (Reservation Against Cancellation) passengers are seated — two RAC ticket holders can share one side lower. If you hold a confirmed side lower and an RAC passenger is allotted to it, you keep it at night but share seating during the day.'
    },
    {
      question: 'Is there a side middle berth?',
      answer:
        'Some AC 3-Tier Economy (3E) coach builds added a side middle berth, but layouts vary by production batch, so this finder does not cover 3E. In SL, 3A, 2A, and 1A there is no side middle.'
    }
  ];

  const softwareSchema = buildSoftwareApplicationSchema({
    name: 'Train Berth Position Finder',
    url: 'https://railmonk.com/rail/berth-position-finder',
    description: 'Find out whether an Indian Railways berth number is lower, middle, upper, side lower, or side upper — for Sleeper, AC 3-Tier, AC 2-Tier, and AC First — with a visual bay diagram.',
    applicationCategory: 'TravelApplication',
    featureList: [
      'Berth type from coach class and berth number',
      'Visual bay diagram with your berth highlighted',
      'SL, 3A, 2A, and 1A patterns (ICF and LHB)',
      'Practical tips per berth type'
    ]
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', item: 'https://railmonk.com/' },
    { name: 'Berth Position Finder', item: 'https://railmonk.com/rail/berth-position-finder' }
  ]);

  return (
    <>
      <Head>
        <title>Train Berth Position Finder — Lower, Middle, Upper or Side? | Railmonk</title>
        <meta name="description" content="Enter your coach class and berth number to see if it's a lower, middle, upper, side lower, or side upper berth — with a visual bay diagram for SL, 3A, 2A, and 1A coaches." />
        <link rel="canonical" href="https://railmonk.com/rail/berth-position-finder" />
        <meta property="og:title" content="Train Berth Position Finder | Railmonk" />
        <meta property="og:description" content="Is berth 23 a side lower? Find your berth's position in Sleeper, AC 3-Tier, AC 2-Tier, and AC First coaches." />
        <meta property="og:url" content="https://railmonk.com/rail/berth-position-finder" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Travel"
        title="Train Berth Position Finder"
        subtitle="Enter your coach class and berth number to see exactly where you'll be — lower, middle, upper, or side — with the bay laid out visually."
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Input panel */}
          <Card className="p-5 lg:col-span-2">
            <div className="space-y-4">
              <SelectField
                id="berth-class"
                label="Coach class"
                value={classCode}
                onChange={setClassCode}
                options={classOptions}
              />

              <div>
                <label htmlFor="berth-number" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">Berth number</label>
                <input
                  id="berth-number"
                  type="number"
                  min="1"
                  max={layout.maxBerth}
                  inputMode="numeric"
                  placeholder={`1–${layout.maxBerth}`}
                  value={berthNumber}
                  onChange={(e) => setBerthNumber(e.target.value)}
                  className={controlCls}
                />
                {invalidNumber && (
                  <p className="mt-1.5 text-sm text-rose-600 dark:text-rose-400" role="alert">
                    Enter a berth number between 1 and {layout.maxBerth} for {layout.label}.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-relaxed text-ink-soft dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                <p className="font-semibold text-ink dark:text-white">{layout.label}</p>
                <p className="mt-1">{layout.coachNote}</p>
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
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Berth {berthNumber} in {layout.label}</p>
                      <p className="mt-1 font-display text-3xl font-bold leading-tight">{result.typeLabel}</p>
                      <p className="mt-0.5 text-sm text-white/85">
                        {classCode === '1A' ? 'Cabins are lettered; odd numbers are lower, even are upper.' : `Bay ${result.bay} · ${result.isSide ? 'aisle side of the coach' : 'main bay'}`}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-xl bg-white/15 px-4 py-3 text-center">
                      <div className="font-display text-2xl font-bold leading-none">{result.type}</div>
                    </div>
                  </div>
                  {result.aboveTypical && (
                    <div className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-sm text-white/90">
                      Berth {berthNumber} exists only in longer (LHB) builds of this class — the type shown assumes
                      the standard repeating pattern continues.
                    </div>
                  )}
                </Card>

                {classCode !== '1A' && (
                  <Card className="p-5">
                    <h3 className="font-display text-base font-bold text-ink dark:text-white">Your bay, mapped</h3>
                    <p className="mt-1 text-sm text-ink-muted dark:text-slate-400">
                      Berths {result.bayStart}–{result.bayStart + result.cycle.length - 1} form bay {result.bay}. Yours is highlighted.
                    </p>
                    <div className="mt-4">
                      <BayDiagram result={result} />
                    </div>
                  </Card>
                )}

                <Card className="p-5 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">Good to know about a {result.typeLabel.toLowerCase()}</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5">
                    {result.tips.map((tip) => <li key={tip}>{tip}</li>)}
                  </ul>
                </Card>
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                <BedDouble size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
                Enter your berth number to see its position and the bay layout.
              </Card>
            )}
          </div>
        </div>

        <HowToSection
          name="How to use the Train Berth Position Finder"
          description="Find out where a berth number sits inside an Indian Railways coach."
          steps={[
            { name: 'Pick the coach class', text: 'Sleeper, AC 3-Tier, AC 2-Tier, or AC First — each has a different repeating pattern.' },
            { name: 'Enter the berth number', text: 'The number printed on your ticket (e.g. S4, berth 23 — enter 23).' },
            { name: 'Read the position', text: 'The finder shows the berth type, the bay it sits in, and a diagram with your berth highlighted.' }
          ]}
        />

        {/* Explainer */}
        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">How berth numbering works, in plain words</h2>
          <p className="mt-3">
            Indian Railways coaches are built from repeating bays, and the berth numbers simply walk through each
            bay in a fixed order. In Sleeper and AC 3-Tier a bay holds eight berths:
            <strong className="text-ink dark:text-white"> lower, middle, upper on one side; lower, middle, upper
            facing them; then the side lower and side upper across the aisle</strong>. That is why the pattern of
            &ldquo;berth number mod 8&rdquo; tells you everything — 1 is a lower, 2 a middle, 7 a side lower, 8 a
            side upper, 9 a lower again, and berth 23 lands on a side lower in bay 3.
          </p>
          <p className="mt-3">
            AC 2-Tier drops the middle berth, so its bays repeat every six: lower, upper, lower, upper, then side
            lower and side upper. AC First has no open bays at all — it is lettered cabins and coupés where odd
            numbers are lower berths and even are upper. The pattern holds across both ICF (conventional) and LHB
            (modern) coach builds; the builds differ only in how many bays long the coach is, which is why LHB
            Sleeper runs to 78–81 berths against ICF&rsquo;s 72.
          </p>
          <p className="mt-3">
            Knowing the position before boarding is mostly about choosing trade-offs. Lower berths double as
            everyone&rsquo;s daytime seat; upper berths are private but need a climb; middles exist only at night;
            side lowers get shared with RAC passengers in Sleeper; side uppers have the least headroom. If the
            allotment matters — say, travelling with elderly parents — book early enough to use the lower-berth
            preference, and check our{' '}
            <a href="/rail/irctc-calculator" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">advance booking calculator</a>{' '}
            for exactly when the window opens.
          </p>
        </div>

        <div className="mt-8">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="July 17, 2026"
            scope="Berth patterns follow the standard Indian Railways ICF/LHB coach layouts for SL, 3A, 2A, and 1A. AC 3-Tier Economy (3E) and special coach builds vary by production batch and are not covered."
            sources={[
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
                  The ticket tells you the coach and berth number but not what the berth <em>is</em> — and whether
                  you end up climbing to an upper, folding down a middle, or sharing a side lower with RAC
                  passengers is decided entirely by that number. This finder maps any berth number in Sleeper, AC
                  3-Tier, AC 2-Tier, and AC First to its type and position, and draws the bay so you can see your
                  neighbours&rsquo; berths too.
                </p>
              </>
            )}
            example={(
              <p>
                Berth 23 in a Sleeper coach: 23 mod 8 leaves 7, which is the side-lower slot — so you are on the
                aisle side in bay 3 (berths 17–24), on the berth RAC passengers share during the day. Berth 22 in
                the same coach is a main-bay upper: private around the clock, but a climb.
              </p>
            )}
            formula={(
              <p>
                Berth type = position of ((berth − 1) mod cycle length) in the class pattern. SL/3A cycle (length 8):
                LB, MB, UB, LB, MB, UB, SL, SU. 2A cycle (length 6): LB, UB, LB, UB, SL, SU. 1A alternates LB, UB.
                Bay number = ⌈berth ÷ cycle length⌉. The pattern is identical for ICF and LHB builds; only total
                berth count differs.
              </p>
            )}
            faqItems={seoFaqItems}
            relatedLinks={[
              { label: 'IRCTC Advance Booking Calculator', href: '/rail/irctc-calculator' },
              { label: 'IRCTC Cancellation Calculator', href: '/rail/irctc-cancellation-calculator' },
              { label: 'Tatkal Charges Calculator', href: '/rail/tatkal-charges-calculator' },
              { label: 'TDR Refund Checker', href: '/rail/tdr-refund-checker' }
            ]}
          />
        </div>

        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-center text-sm leading-relaxed text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          Berth layouts reflect standard Indian Railways coach patterns; special and refurbished builds can differ.
          This tool is not affiliated with Indian Railways or IRCTC — confirm your allotment on the{' '}
          <a href="https://www.irctc.co.in" target="_blank" rel="noopener noreferrer" className="font-medium underline">official IRCTC website</a>.
        </div>
      </CalcLayout>
    </>
  );
};

export default BerthPositionFinder;
