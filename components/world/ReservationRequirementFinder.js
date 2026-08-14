import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { AlertTriangle, CheckCircle2, Globe2, MinusCircle, Ticket, TriangleAlert } from 'lucide-react';
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

import {
  VERIFIED,
  REGIONS,
  REQUIREMENTS,
  SERVICES,
  servicesInRegion,
  reservationCost,
  formatFee,
  verdict,
  acceptsPass,
} from '../../utils/engines/reservationRules';

const HREF = '/world/reservation-required';
const URL = `https://railmonk.com${HREF}`;

// Read the freshness claim off the data rather than restating it in prose, so
// the page cannot assert a review that never happened.
const VERIFIED_LABEL = new Date(`${VERIFIED}T00:00:00Z`).toLocaleDateString('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const REQUIREMENT_STYLE = {
  compulsory: {
    Icon: AlertTriangle,
    chip: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200',
    border: 'border-rose-200 dark:border-rose-900/60',
  },
  recommended: {
    Icon: TriangleAlert,
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
    border: 'border-amber-200 dark:border-amber-900/60',
  },
  optional: {
    Icon: CheckCircle2,
    chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
    border: 'border-emerald-200 dark:border-emerald-900/60',
  },
  none: {
    Icon: MinusCircle,
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

const ReservationRequirementFinder = () => {
  const [regionId, setRegionId] = useState('western-europe');
  const [passHolder, setPassHolder] = useState(true);
  const [selected, setSelected] = useState([]);

  const shareUrl = useShareableInputs(
    { region: regionId, pass: passHolder ? '1' : '0', picks: selected.join(',') },
    (params) => {
      if (params.region) setRegionId(params.region);
      if (params.pass) setPassHolder(params.pass !== '0');
      if (params.picks) setSelected(params.picks.split(',').filter(Boolean));
    }
  );

  const services = useMemo(() => servicesInRegion(regionId), [regionId]);
  const cost = useMemo(() => reservationCost({ serviceIds: selected, passHolder }), [selected, passHolder]);

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const compulsoryCount = SERVICES.filter((s) => s.requirement === 'compulsory').length;

  const seoFaqItems = [
    {
      question: 'Do I need a seat reservation with an Interrail or Eurail pass?',
      answer:
        `On some trains yes, on most trains no — and the split is geographic rather than random. France, Spain, Italy and every international high-speed service sell a compulsory reservation on top of the pass, from a separate and much smaller quota. Germany, Austria, Switzerland, the Netherlands and Britain mostly do not: you board and sit down. Of the ${SERVICES.length} services listed here, ${compulsoryCount} are compulsory.`,
    },
    {
      question: 'Why do pass holders pay a different reservation fee?',
      answer:
        'Because they are buying from a different inventory. A ticket buyer’s seat is part of the fare; a pass holder buys into a per-train quota reserved for passes, which is priced separately and is typically only a few dozen seats. This is why "TGV reservations cost €10" is true for pass holders and meaningless for anyone else — and why a pass reservation can be sold out on a train with hundreds of empty seats.',
    },
    {
      question: 'Which European trains need no reservation at all?',
      answer:
        'German regional trains, Swiss domestic trains, Dutch Intercity and Sprinter services, French TER, Italian Regionale and Spanish Cercanías and Media Distancia take no reservation and cost a pass holder nothing extra. These are the escape route from the high-speed supplements: Rome to Florence by Regionale, or Brussels to Amsterdam by ordinary Intercity, costs nothing more than the pass itself.',
    },
    {
      question: 'How much is a Eurostar reservation with a rail pass?',
      answer:
        `${formatFee(SERVICES.find((s) => s.id === 'eurostar').passFee)}, depending on season, and it is the most expensive and tightest pass quota in Europe. Book it first and plan the rest of the trip around it. On a short trip it is often cheaper to buy an advance Eurostar ticket outright and keep the pass for the continent.`,
    },
    {
      question: 'Do Italo and OUIGO accept rail passes?',
      answer:
        'No. Both are open-access operators outside the pass system, so a pass holder pays the full fare exactly like everyone else — there is no reservation to buy. Italo runs the same Rome–Milan corridor as Frecciarossa and often undercuts it, so buying an Italo ticket outright can be worth it to save a travel day.',
    },
    {
      question: 'Are seat reservations compulsory in Britain?',
      answer:
        'Never, and they are free. No British operator requires a reservation, and you can reserve a seat on long-distance East Coast, West Coast and Great Western services at no charge. Britain is the cheapest country in Europe to reserve in and the least necessary.',
    },
    {
      question: 'How does this compare with Indian Railways?',
      answer:
        'India inverts the model entirely. There is no pass, the reservation is the ticket, and the fee is a fixed per-class reservation charge already inside the fare. What is scarce in India is not a seat on a particular train but a berth at all — which is why Indian travellers plan around the waitlist rather than around supplements.',
    },
  ];

  const softwareSchema = buildSoftwareApplicationSchema({
    name: 'Seat Reservation Requirements by Operator',
    url: URL,
    description:
      'Which trains require a compulsory seat reservation, what it costs a rail pass holder, and which services need none at all — across Europe and beyond.',
    applicationCategory: 'TravelApplication',
    priceCurrency: 'EUR',
    featureList: [
      'Compulsory, optional and no-reservation classification by operator',
      'Separate pass-holder and ticket-buyer fees',
      'Multi-service fee totals kept per currency',
      'Flags operators that refuse rail passes',
    ],
  });

  return (
    <>
      <Head>
        <title>Do I Need a Seat Reservation? Rules & Fees by Operator | Railmonk</title>
        <meta
          name="description"
          content="Which trains force a compulsory seat reservation, what pass holders pay, and which services you can simply board — France, Spain, Italy, Germany, the UK and more."
        />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content="Seat Reservation Requirements by Operator | Railmonk" />
        <meta property="og:description" content="Compulsory or not, and what it costs with a rail pass." />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="Trains abroad · Rules"
        title="Do I Need a Seat Reservation?"
        subtitle="A rail pass buys the right to travel. On a large minority of services it does not buy the right to board — this is which ones, and what they cost."
      >
        <Breadcrumbs
          className="-mt-4 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Trains abroad', href: '/world' }, { name: 'Reservation rules' }]}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-ink dark:text-white">Where are you travelling?</h2>
            <div className="mt-2 space-y-2">
              {REGIONS.map((r) => {
                const active = r.id === regionId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRegionId(r.id)}
                    aria-pressed={active}
                    className={cn(
                      'w-full rounded-xl border p-2.5 text-left text-sm font-medium transition',
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

            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-700/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Are you using a rail pass?</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  [true, 'Yes, a pass'],
                  [false, 'No, tickets'],
                ].map(([value, label]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setPassHolder(value)}
                    aria-pressed={passHolder === value}
                    className={cn(
                      'rounded-xl border px-2 py-2 text-xs font-semibold transition',
                      passHolder === value
                        ? 'border-brand-400 bg-brand-50/70 text-brand-800 shadow-sm dark:border-brand-500/70 dark:bg-brand-900/25 dark:text-brand-200'
                        : 'border-slate-200 bg-white text-ink-soft hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
                It changes the answer more than you would expect: pass holders buy from a separate, smaller quota at its
                own price, while a ticket buyer&rsquo;s seat is usually already inside the fare.
              </p>
            </div>

            {selected.length > 0 ? (
              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-700/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
                  Your {selected.length} selected {selected.length === 1 ? 'service' : 'services'}
                </p>
                <p className="mt-1.5 font-display text-2xl font-bold text-ink dark:text-white">
                  {cost.eur.min === cost.eur.max ? `€${cost.eur.min}` : `€${cost.eur.min}–${cost.eur.max}`}
                </p>
                {Object.entries(cost.byCurrency)
                  .filter(([c]) => c !== 'EUR')
                  .map(([currency, range]) => (
                    <p key={currency} className="mt-1 text-sm font-medium text-ink-soft dark:text-slate-300">
                      + {formatFee({ currency, min: range.min, max: range.max })}
                    </p>
                  ))}
                {cost.notCovered.length ? (
                  <p className="mt-2 text-xs leading-relaxed text-rose-700 dark:text-rose-300">
                    {cost.notCovered.map((s) => s.name).join(', ')} {cost.notCovered.length === 1 ? 'does' : 'do'} not
                    accept passes — the full fare applies there, on top of this.
                  </p>
                ) : null}
                {cost.unpriced.length ? (
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
                    {cost.unpriced.map((s) => s.name).join(', ')}: the reservation is required but its cost is inside
                    the fare rather than charged separately.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="mt-3 text-xs font-medium text-brand-600 underline underline-offset-2 dark:text-brand-300"
                >
                  Clear selection
                </button>
              </div>
            ) : (
              <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-ink-muted dark:border-slate-700/60 dark:text-slate-400">
                Tick the services on your itinerary to total up what the reservations will cost.
              </p>
            )}
          </Card>

          <div className="space-y-4 lg:col-span-3">
            {services.map((service) => {
              const req = REQUIREMENTS[service.requirement];
              const style = REQUIREMENT_STYLE[service.requirement];
              const fee = passHolder ? service.passFee : service.ticketFee;
              const checked = selected.includes(service.id);

              return (
                <Card key={service.id} className={cn('p-5', checked && 'ring-2 ring-brand-400/50', style.border)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold', style.chip)}>
                          <style.Icon size={12} />
                          {req.label}
                        </span>
                        {service.quotaLimited && service.requirement === 'compulsory' ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            Limited quota
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-2 font-display text-base font-bold text-ink dark:text-white">{service.name}</h3>
                      <p className="text-xs text-ink-muted dark:text-slate-400">
                        {service.operator} · {service.country}
                      </p>
                    </div>
                    <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-medium text-ink-soft dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(service.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800"
                      />
                      On my trip
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-display text-xl font-bold text-ink dark:text-white">
                      {acceptsPass(service) ? formatFee(fee) || '—' : 'no pass'}
                    </span>
                    <span className="text-xs text-ink-muted dark:text-slate-400">
                      {passHolder ? 'with a rail pass' : 'buying a ticket'}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-medium text-ink-soft dark:text-slate-300">{verdict(service.id, { passHolder })}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{service.note}</p>
                  <a
                    href={service.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-medium text-brand-600 underline underline-offset-2 dark:text-brand-300"
                  >
                    Source: {service.source.label}
                  </a>
                </Card>
              );
            })}

            <ShareResult
              url={shareUrl}
              title="Seat reservation rules — Railmonk"
              text={`Reservation requirements for ${REGIONS.find((r) => r.id === regionId)?.label}.`}
            />
          </div>
        </div>

        <HowToSection
          name="How to use the reservation requirement finder"
          description="Find out which of your trains you can simply board, and which need paying for first."
          steps={[
            { name: 'Pick your region', text: 'The rules cluster geographically — France, Spain and Italy behave one way, Germany and Switzerland another.' },
            { name: 'Say whether you hold a pass', text: 'Pass holders and ticket buyers pay different fees from different inventories, so the answer changes.' },
            { name: 'Read the requirement badge', text: 'Compulsory means you cannot board without one. Optional means the fee only buys certainty.' },
            { name: 'Tick your services', text: 'Selecting the trains on your itinerary totals the fees, keeping each currency separate.' },
            { name: 'Watch for limited quota', text: 'A compulsory reservation with a small quota can sell out months ahead even when the train is half empty.' },
          ]}
        />

        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">The quota, not the fee, is the problem</h2>
          <p className="mt-3">
            The fees themselves are mostly modest — €10 on a TGV, €13 on a Frecciarossa. What catches travellers out is
            that a pass reservation comes from a{' '}
            <strong className="text-ink dark:text-white">separate, deliberately small inventory</strong>. An SNCF train
            might carry a few dozen pass seats out of several hundred. Once they are gone the train is closed to passes
            regardless of how many ordinary seats remain unsold, and no amount of turning up at the station changes
            that.
          </p>
          <p className="mt-3">
            This is why a pass rewards planning in exactly the countries where people expect it to grant freedom. In
            Germany, Austria and Switzerland the pass genuinely is a walk-on ticket: no compulsory fee, no quota, board
            what you like. In France and Spain it is closer to a discount card that still requires you to book each
            high-speed leg the day the window opens.
          </p>
          <p className="mt-3">
            There is almost always a way around a supplement, and it costs time rather than money. Regional trains take
            no reservation anywhere: TER instead of TGV, Regionale instead of Frecciarossa, ordinary Intercity instead
            of Eurostar Red between Brussels and Amsterdam. The Bernina route is the neatest example — the panoramic
            Bernina Express charges a compulsory seasonal supplement, while the ordinary regional train along the
            identical line costs a pass holder nothing.
          </p>
          <p className="mt-3">
            Once you know which legs carry a compulsory fee, the pass-versus-tickets question becomes answerable. Our{' '}
            <a href="/world/rail-pass-calculator" className="font-medium text-brand-600 underline underline-offset-2 dark:text-brand-300">
              rail pass break-even calculator
            </a>{' '}
            takes these same fees and works out whether the pass still wins.
          </p>
        </div>

        <NextStep
          title="Now work out whether the pass is worth it at all."
          body="These fees are the hidden cost that decides it. The break-even calculator adds them to the pass price and compares the result against buying tickets."
          href="/world/rail-pass-calculator"
          cta="Compare pass vs tickets"
          secondary={{ href: '/world/booking-windows', label: 'When can I book?' }}
        />

        <div className="mt-8">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="August 14, 2026"
            scope={`Reservation requirements and fees were checked in ${VERIFIED_LABEL} against operator statements and the Seat61 reservation reference. These are operator policies rather than regulation and they change at timetable changes; fees stored as ranges are genuinely variable by season or accommodation. Pass-holder and ticket-buyer fees are kept separate because they draw on different inventories.`}
            sources={[
              { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
              { label: 'Interrail', url: 'https://www.interrail.eu/' },
              { label: 'Eurail', url: 'https://www.eurail.com/' },
            ]}
          />
        </div>

        <div className="mt-8">
          <SearchLandingSections
            intro={(
              <>
                <p>
                  &ldquo;Do I need a seat reservation?&rdquo; has no single European answer, and the guidance people
                  find online usually conflates three separate things: whether a reservation is compulsory, what a pass
                  holder pays for one, and what a ticket buyer pays. Those are different numbers drawn from different
                  inventories.
                </p>
                <p>
                  This page keeps them apart, service by service, with the source for each and a note on what to do
                  when the fee is not worth paying — because on almost every corridor there is a slower train that needs
                  no reservation at all.
                </p>
              </>
            )}
            example={(
              <p>
                A Paris–Lyon–Milan trip with a pass: the TGV to Lyon is compulsory at{' '}
                {formatFee(SERVICES.find((s) => s.id === 'tgv-inoui').passFee)}, and the Frecciarossa onward is
                compulsory at {formatFee(SERVICES.find((s) => s.id === 'frecciarossa').passFee)} — so the pass alone is
                not enough for either leg. The same journey by TER and Regionale costs nothing extra and needs no
                booking, at the price of a much longer day.
              </p>
            )}
            formula={(
              <p>
                Each service carries a requirement level (compulsory, optional but advisable, optional, or none), a
                pass-holder fee, and a ticket-buyer fee — stored as ranges where they genuinely vary. Selecting services
                sums the fees per currency rather than converting between them, since a hard-coded exchange rate would
                be wrong within a month. Operators that refuse passes are reported separately rather than counted as
                free.
              </p>
            )}
            faqItems={seoFaqItems}
          />
        </div>

        <div className="mt-8 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-relaxed text-ink-soft dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
          <Globe2 size={18} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-300" />
          <span>
            Operator policies and fees were last checked in {VERIFIED_LABEL}. They change at timetable changes — confirm
            with the operator before travelling. Railmonk is not affiliated with any railway operator, Interrail or
            Eurail.
          </span>
        </div>

        <UpdatedStamp updated={getTool(HREF)?.updated} href={HREF} />

        <RelatedContent href={HREF} kind="tool" />
      </CalcLayout>
    </>
  );
};

export default ReservationRequirementFinder;
