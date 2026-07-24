import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { MapPin, TrainFront } from 'lucide-react';
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

const HREF = '/rail/coach-position-finder';

const { RAKE_TYPES, COACH_CODE_MEANINGS, locateCoach } = require('../../utils/engines/coachPosition');

const ZONE_LABEL = { front: 'Front of the train', middle: 'Middle of the train', rear: 'Rear of the train' };

const CoachPositionFinder = () => {
  const [rakeTypeId, setRakeTypeId] = useState('mail-express');
  const [coachCode, setCoachCode] = useState('S4');
  const shareUrl = useShareableInputs(
    { rake: rakeTypeId, coach: coachCode },
    (params) => {
      if (params.rake) setRakeTypeId(params.rake);
      if (params.coach) setCoachCode(params.coach);
    }
  );

  const rake = RAKE_TYPES.find((r) => r.id === rakeTypeId);
  const result = useMemo(
    () => locateCoach({ rakeTypeId, coachCode }),
    [rakeTypeId, coachCode]
  );

  const seoFaqItems = [
    {
      question: 'Where exactly will my coach stop on the platform?',
      answer:
        'Only the station knows precisely: look for the electronic coach position display boards along the platform, or the coach position announced in the NTES app for your train. This tool tells you the typical zone — front, middle, or rear — from the standard rake composition, which is enough to pick the right end of the platform before the display updates.'
    },
    {
      question: 'What do coach codes like S4, B2, A1, and H1 mean?',
      answer:
        'The letter is the class, the number is the coach count within it: S = Sleeper, B = AC 3-Tier, M = AC 3-Tier Economy, A = AC 2-Tier, H = AC First, C = AC Chair Car, E = Executive Chair Car, D = reserved Second Sitting. GEN/UR are unreserved coaches, SLR is the luggage-guard coach, EOG the generator car, and PC the pantry.'
    },
    {
      question: 'Is the coach order the same on every train?',
      answer:
        'No. Rake composition is set by the operating zone and can differ between trains, directions, and even days — and if a train reverses direction at a terminal en route, the whole order flips. That is why this finder answers in zones (front / middle / rear) rather than pretending to know the exact stopping point.'
    },
    {
      question: 'Which end of the platform is the engine?',
      answer:
        'It depends on the direction of travel at your station — the same train can arrive engine-first in one direction and rake-first after a reversal. Platform departure boards and the coach position display show the orientation for the day; when in doubt, ask the platform staff which end coach 1 (or the engine) arrives at.'
    },
    {
      question: 'Where is the pantry car, and can I walk to it?',
      answer:
        'On Mail/Express and Rajdhani rakes the pantry car (PC) usually sits between the sleeper/3A blocks, roughly mid-rake. All reserved coaches in a rake are vestibuled, so you can walk through — though crossing from AC to non-AC blocks may be restricted on some trains.'
    },
    {
      question: 'Why do some coaches show as EOG or SLR?',
      answer:
        'They are not passenger coaches. EOG (End-On Generation) cars power all-AC LHB rakes and sit at both ends; SLR coaches on ICF rakes combine the guard cabin with luggage space. Seeing them on the composition helps you judge where the passenger block actually starts.'
    }
  ];

  const softwareSchema = buildSoftwareApplicationSchema({
    name: 'Train Coach Position Finder',
    url: 'https://railmonk.com/rail/coach-position-finder',
    description:
      'Find where your coach (S4, B2, A1, H1…) typically stands in the rake — front, middle, or rear of the platform — for Mail/Express, Rajdhani, Shatabdi, and Vande Bharat trains.',
    applicationCategory: 'TravelApplication',
    featureList: [
      'Four standard rake compositions',
      'Front / middle / rear platform zone',
      'Visual rake strip with your coach highlighted',
      'Coach code decoder (S, B, A, H, C, E…)'
    ]
  });

  return (
    <>
      <Head>
        <title>Train Coach Position Finder — Front, Middle or Rear | Railmonk</title>
        <meta
          name="description"
          content="Where does coach S4, B2 or A1 stand — front, middle or rear? Coach order for Mail/Express, Rajdhani, Shatabdi and Vande Bharat rakes."
        />
        <link rel="canonical" href="https://railmonk.com/rail/coach-position-finder" />
        <meta property="og:title" content="Train Coach Position Finder | Railmonk" />
        <meta property="og:description" content="Pick your train type and coach number to see which part of the platform to wait on." />
        <meta property="og:url" content="https://railmonk.com/rail/coach-position-finder" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Travel"
        title="Train Coach Position Finder"
        subtitle="Pick your train type and coach number to see where it typically stands in the rake — and which part of the platform to wait on."
      >
        <Breadcrumbs
          className="-mt-4 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Rail tools', href: '/#tools' }, { name: 'Coach position finder' }]}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Inputs */}
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-ink dark:text-white">Your train & coach</h2>

            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Train type</label>
            <div className="mt-2 space-y-2">
              {RAKE_TYPES.map((r) => {
                const active = r.id === rakeTypeId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRakeTypeId(r.id)}
                    aria-pressed={active}
                    className={cn(
                      'w-full rounded-xl border p-3 text-left text-sm font-medium transition',
                      active
                        ? 'border-brand-400 bg-brand-50/70 text-brand-800 shadow-sm dark:border-brand-500/70 dark:bg-brand-900/25 dark:text-brand-200'
                        : 'border-slate-200 bg-white text-ink-soft hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            <label htmlFor="coach-code" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Coach number</label>
            <input
              id="coach-code"
              type="text"
              value={coachCode}
              onChange={(e) => setCoachCode(e.target.value)}
              maxLength={5}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium uppercase text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:ring-brand-900/40"
              placeholder="e.g. S4, B2, A1, H1, C5"
            />
            {rake && (
              <p className="mt-3 text-xs leading-relaxed text-ink-muted dark:text-slate-400">{rake.note}</p>
            )}
          </Card>

          {/* Result */}
          <div className="space-y-5 lg:col-span-3">
            {result ? (
              <>
                <Card className="overflow-hidden border-brand-300 bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white dark:border-brand-800">
                  <div className="flex items-start gap-3">
                    <MapPin size={28} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                        Coach {result.code} · {ZONE_LABEL[result.zone]}
                      </p>
                      <p className="mt-1 font-display text-xl font-bold leading-snug">{result.zoneText}</p>
                      <p className="mt-1 text-sm text-white/90">
                        Typically position {result.index + 1} of {result.total} in this rake family — about {result.percentFromFront}% of the way from the engine end.
                      </p>
                    </div>
                  </div>
                  {result.note && (
                    <div className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-sm text-white/90">{result.note}</div>
                  )}
                </Card>

                {/* Rake strip */}
                <Card className="p-5">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">Typical rake order (engine end first)</h3>
                  <div className="mt-3 overflow-x-auto pb-2">
                    <div className="flex min-w-max items-center gap-1">
                      {rakeTypeId !== 'vande-bharat' && (
                        <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-l-2xl rounded-r-md bg-ink text-white dark:bg-slate-600" title="Locomotive">
                          <TrainFront size={18} />
                        </div>
                      )}
                      {rake.coaches.map((c, i) => (
                        <div
                          key={`${c}-${i}`}
                          className={cn(
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-md border text-xs font-bold',
                            i === result.index
                              ? 'border-brand-500 bg-brand-600 text-white shadow-md'
                              : ['GEN', 'SLR', 'EOG', 'PC'].includes(c)
                                ? 'border-slate-200 bg-slate-100 text-ink-muted dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
                                : 'border-slate-200 bg-white text-ink-soft dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300'
                          )}
                          title={COACH_CODE_MEANINGS[c.match(/^[A-Z]+/)?.[0]] || c}
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-ink-muted dark:text-slate-400">
                    Representative composition — the actual order for your train and date is on the station&rsquo;s coach position display and in the NTES app.
                  </p>
                </Card>

                {/* Code legend */}
                <Card className="p-5 text-sm">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">Coach code legend</h3>
                  <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
                    {Object.entries(COACH_CODE_MEANINGS).map(([k, v]) => (
                      <div key={k} className="flex items-baseline gap-2">
                        <span className="font-bold text-brand-700 dark:text-brand-300">{k}</span>
                        <span className="text-xs text-ink-soft dark:text-slate-300">{v}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                <TrainFront size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
                Enter a coach number like S4, B2, A1, or H1 to see where it typically stands.
              </Card>
            )}
            {result ? (
              <ShareResult
                url={shareUrl}
                title="Coach position — Railmonk"
                text={`Where coach ${coachCode} usually stops on the platform.`}
              />
            ) : null}
          </div>
        </div>

        <HowToSection
          name="How to use the Coach Position Finder"
          description="Pick the right spot on the platform before the train arrives."
          steps={[
            { name: 'Pick your train type', text: 'Mail/Express, Rajdhani/Duronto, Shatabdi, or Vande Bharat — each family has its own typical rake order.' },
            { name: 'Enter your coach number', text: 'From your ticket: S4, B2, A1, H1, C5, and so on.' },
            { name: 'Read the zone', text: 'Front, middle, or rear of the platform, with the coach highlighted in the typical rake strip.' },
            { name: 'Confirm at the station', text: 'Match it against the platform coach position display or the NTES app — the day’s actual composition wins.' }
          ]}
        />

        {/* Explainer */}
        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">Why coach position is worth knowing</h2>
          <p className="mt-3">
            A 24-coach rake is over half a kilometre long. Standing at the wrong end with luggage and two minutes of
            halt time is how people miss boarding — or board the general coach and walk half the train from inside.
            Knowing the <strong className="text-ink dark:text-white">zone</strong> your coach stops in solves 90% of
            the problem before the train appears.
          </p>
          <p className="mt-3">
            The reason no tool can honestly promise the exact stopping slot: rake composition is decided by the
            train&rsquo;s operating zone, differs between train families, and flips entirely when a train reverses at
            a terminal en route. What stays stable is the <strong className="text-ink dark:text-white">block
            structure</strong> — general coaches at the ends of a Mail/Express rake, the sleeper block behind one end,
            the AC block grouped together past the pantry. That structure is what this finder maps your coach onto.
          </p>
          <p className="mt-3">
            Once you know where you&rsquo;ll board, the companion question is what your berth number means inside the
            coach — our{' '}
            <a href="/rail/berth-position-finder" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">berth position finder</a>{' '}
            turns a berth number into lower/middle/upper/side before you step in.
          </p>
        </div>
        <NextStep
          title="Know where the coach stops. Now find your berth in it."
          body="Turn your seat number into its position in the coach — lower, middle, upper or side — before you board."
          href="/rail/berth-position-finder"
          cta="Find my berth position"
          secondary={{ href: '/rail/guides/train-classes-explained', label: 'Compare train classes' }}
        />


        <div className="mt-8">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="July 19, 2026"
            scope="Compositions shown are representative of the common rake families. Actual coach order is set per train by the operating railway zone and can change — the station coach position display and NTES are authoritative."
            sources={[
              { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' },
              { label: 'NTES — National Train Enquiry System', url: 'https://enquiry.indianrail.gov.in/mntes/' },
              { label: 'IRCTC Official Portal', url: 'https://www.irctc.co.in/' }
            ]}
          />
        </div>

        <div className="mt-8">
          <SearchLandingSections
            intro={(
              <>
                <p>
                  &ldquo;Where does S4 stop?&rdquo; is really a question about rake structure. This finder maps your
                  coach number onto the representative composition of the four common rake families — Mail/Express,
                  Rajdhani/Duronto, Shatabdi, and Vande Bharat — and answers in the unit that stays reliable across
                  days: front, middle, or rear of the platform.
                </p>
                <p>
                  It deliberately does not pretend to know the exact stopping slot, because Indian Railways
                  compositions vary by zone, direction, and date. For the authoritative order on your travel day,
                  the platform&rsquo;s coach position display and the NTES app are the source of truth.
                </p>
              </>
            )}
            example={(
              <p>
                Coach B2 on a Mail/Express rake: the AC 3-Tier block sits past the pantry car, about two-thirds of
                the way down the rake — rear-middle of the platform. Coach S2 on the same train is the opposite end
                of the answer: second coach of the sleeper block, front third, close behind the general coaches at
                the engine end.
              </p>
            )}
            formula={(
              <p>
                Each rake family carries a representative front-to-rear coach order. Your coach code is normalized
                and looked up; its slot divided by rake length gives the percent-from-front and the front/middle/rear
                zone. Coach numbers beyond the representative block (say S11 on a long sleeper rake) resolve to the
                end of their class block with an explicit note.
              </p>
            )}
            faqItems={seoFaqItems}
          />
        </div>

        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-center text-sm leading-relaxed text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          Coach positions shown are typical, not guaranteed — actual rake composition varies by train, zone, direction,
          and date. Railmonk is not affiliated with Indian Railways or IRCTC. Confirm on the station&rsquo;s coach
          position display or the{' '}
          <a href="https://enquiry.indianrail.gov.in/mntes/" target="_blank" rel="noopener noreferrer" className="font-medium underline">official NTES enquiry system</a>.
        </div>

        <UpdatedStamp updated={getTool(HREF)?.updated} href={HREF} />

        <RelatedContent href={HREF} kind="tool" />
      </CalcLayout>
    </>
  );
};

export default CoachPositionFinder;
