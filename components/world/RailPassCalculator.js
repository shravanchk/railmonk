import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { AlertTriangle, Check, Globe2, Plus, Sparkles, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react';
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
  PASSES,
  TRAVELLER_TYPES,
  getPass,
  comparePass,
  recommendPass,
} from '../../utils/engines/railPasses';
import { SERVICES, REGIONS, formatFee } from '../../utils/engines/reservationRules';

const HREF = '/world/rail-pass-calculator';
const URL = `https://railmonk.com${HREF}`;

const VERIFIED_LABEL = new Date(`${VERIFIED}T00:00:00Z`).toLocaleDateString('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const euros = (n) => `€${Number(n).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;

const range = (r) => (r.min === r.max ? euros(r.min) : `${euros(r.min)}–${euros(r.max)}`);

// A worked starting itinerary rather than an empty form. It is deliberately the
// German case, which is where a pass genuinely wins — an empty grid teaches
// nothing, and starting on a losing itinerary would be a strange first
// impression of the tool.
const DEFAULT_JOURNEYS = [
  { id: 1, from: 'Berlin', to: 'Munich', date: '2026-09-01', fare: '120', serviceId: 'db-ice' },
  { id: 2, from: 'Munich', to: 'Vienna', date: '2026-09-04', fare: '95', serviceId: 'obb-railjet' },
  { id: 3, from: 'Vienna', to: 'Zurich', date: '2026-09-08', fare: '135', serviceId: 'obb-railjet' },
  { id: 4, from: 'Zurich', to: 'Berlin', date: '2026-09-12', fare: '145', serviceId: 'db-ice' },
];

const SERVICES_BY_REGION = REGIONS.map((r) => ({
  label: r.label,
  services: SERVICES.filter((s) => s.region === r.id && s.region !== 'india'),
})).filter((g) => g.services.length > 0);

const encodeJourneys = (journeys) =>
  journeys.map((j) => [j.date || '', j.fare || '', j.serviceId || '', j.from || '', j.to || ''].join('~')).join('|');

const decodeJourneys = (raw) =>
  String(raw || '')
    .split('|')
    .filter(Boolean)
    .map((chunk, i) => {
      const [date, fare, serviceId, from, to] = chunk.split('~');
      return { id: i + 1, date, fare, serviceId, from, to };
    });

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-ink outline-none transition ' +
  'focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 ' +
  'dark:text-white dark:focus:ring-brand-900/40';

const VERDICT_STYLE = {
  pass: {
    Icon: TrendingDown,
    headline: 'The pass wins',
    card: 'border-emerald-300 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white dark:border-emerald-800',
  },
  tickets: {
    Icon: TrendingUp,
    headline: 'Buy tickets instead',
    card: 'border-rose-300 bg-gradient-to-br from-rose-600 to-rose-700 text-white dark:border-rose-900',
  },
  close: {
    Icon: Sparkles,
    headline: 'Too close to call',
    card: 'border-amber-300 bg-gradient-to-br from-amber-500 to-amber-600 text-white dark:border-amber-800',
  },
};

const RailPassCalculator = () => {
  const [passId, setPassId] = useState('flexi-5-1m');
  const [priceOverride, setPriceOverride] = useState('');
  const [travellerType, setTravellerType] = useState('adult');
  const [firstClass, setFirstClass] = useState(false);
  const [journeys, setJourneys] = useState(DEFAULT_JOURNEYS);

  const shareUrl = useShareableInputs(
    {
      pass: passId,
      price: priceOverride,
      who: travellerType,
      cls: firstClass ? '1' : '0',
      j: encodeJourneys(journeys),
    },
    (params) => {
      if (params.pass) setPassId(params.pass);
      if (params.price) setPriceOverride(params.price);
      if (params.who) setTravellerType(params.who);
      if (params.cls) setFirstClass(params.cls === '1');
      if (params.j) setJourneys(decodeJourneys(params.j));
    }
  );

  const parsedJourneys = useMemo(
    () =>
      journeys.map((j) => ({
        from: j.from,
        to: j.to,
        date: j.date || undefined,
        fare: parseFloat(j.fare) || 0,
        serviceId: j.serviceId || undefined,
      })),
    [journeys]
  );

  const result = useMemo(
    () =>
      comparePass({
        passId,
        priceOverride: priceOverride === '' ? undefined : parseFloat(priceOverride),
        travellerType,
        firstClass,
        journeys: parsedJourneys,
      }),
    [passId, priceOverride, travellerType, firstClass, parsedJourneys]
  );

  const recommendation = useMemo(
    () => recommendPass({ journeys: parsedJourneys, travellerType, firstClass }),
    [parsedJourneys, travellerType, firstClass]
  );

  const addJourney = () =>
    setJourneys((prev) => [
      ...prev,
      { id: Math.max(0, ...prev.map((p) => p.id)) + 1, from: '', to: '', date: '', fare: '', serviceId: '' },
    ]);

  const updateJourney = (id, patch) =>
    setJourneys((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  const removeJourney = (id) => setJourneys((prev) => prev.filter((j) => j.id !== id));

  const style = result ? VERDICT_STYLE[result.verdict] : null;
  const selectedPass = getPass(passId);

  const seoFaqItems = [
    {
      question: 'Is an Interrail or Eurail pass worth it?',
      answer:
        'It depends almost entirely on which countries you travel in, not on how many trains you take. A pass wins in Germany, Austria and Switzerland, where fares are high, no reservation is compulsory and you can board freely. It usually loses in France and Spain, where advance point-to-point fares are cheap and every high-speed leg adds a compulsory supplement on top of the pass. Count the reservation fees before deciding — they are the cost most comparisons leave out.',
    },
    {
      question: 'How do I calculate the break-even point for a rail pass?',
      answer:
        'Add the pass price to every compulsory reservation fee your itinerary will incur, plus the full fare for any operator that refuses passes. That total is your break-even: if the same journeys would cost more than it as ordinary tickets, the pass wins. Comparing the pass price alone against ticket prices is the standard mistake, and it can overstate the pass by a hundred euros or more on a France-heavy trip.',
    },
    {
      question: 'What is a travel day on a flexi pass?',
      answer:
        'A calendar day on which you take any number of trains. Four journeys on one day consume one travel day; four journeys on four days consume four. This is why itineraries with identical trip counts can need different pass tiers, and why clustering journeys onto the same day is the single most effective way to stretch a flexi pass.',
    },
    {
      question: 'Do night trains use up a travel day?',
      answer:
        'A direct night train departing after 19:00 uses only the departure day, and carries you into the next morning without consuming a second one. That makes a well-placed night train doubly economical: it saves a travel day and a hotel night at once. The couchette or sleeper reservation is compulsory and separately priced, so budget for it.',
    },
    {
      question: 'Are reservation fees included in a rail pass?',
      answer:
        'No, and this is the most common misunderstanding about passes. Compulsory reservations on TGV, AVE, Frecciarossa, Eurostar and every night train are charged on top, from a quota reserved for pass holders that is priced separately from ordinary tickets. On a France and Spain itinerary these fees can add a substantial fraction of the pass price again.',
    },
    {
      question: 'Which trains do not accept a rail pass at all?',
      answer:
        'Italo in Italy and OUIGO in France and Spain are open-access operators outside the pass system entirely — a pass holder pays the full fare like anyone else. This calculator counts those journeys on the pass side, because treating them as covered would overstate the pass by a whole fare rather than by a reservation fee.',
    },
    {
      question: 'Is the youth discount worth waiting for or ageing out of?',
      answer:
        'The youth price applies to travellers aged 12 to 27, taken on the first day of travel, and it is a 25% reduction — by far the largest single lever on whether a pass beats tickets. The senior discount for over-60s is much smaller at around 10%. Children aged 4 to 11 travel free on an accompanying adult’s pass, up to two per adult.',
    },
  ];

  const softwareSchema = buildSoftwareApplicationSchema({
    name: 'Rail Pass Break-Even Calculator',
    url: URL,
    description:
      'Compare an Interrail or Eurail pass against point-to-point tickets, including the compulsory reservation fees and travel-day accounting that most comparisons leave out.',
    applicationCategory: 'TravelApplication',
    priceCurrency: 'EUR',
    featureList: [
      'Break-even against point-to-point fares',
      'Compulsory reservation fees per operator',
      'Travel-day and validity checking',
      'Cheapest viable pass recommendation',
    ],
  });

  return (
    <>
      <Head>
        <title>Rail Pass Break-Even Calculator — Interrail vs Tickets | Railmonk</title>
        <meta
          name="description"
          content="Is an Interrail or Eurail pass worth it? Compare it against point-to-point tickets with reservation fees and travel days counted properly."
        />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content="Rail Pass Break-Even Calculator | Railmonk" />
        <meta property="og:description" content="Pass price plus reservation fees versus buying tickets — worked out on your actual itinerary." />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="Trains abroad · Fares"
        title="Rail Pass Break-Even Calculator"
        subtitle="Interrail or Eurail against ordinary tickets — with the reservation fees and travel-day arithmetic that decide it, and that most comparisons quietly omit."
      >
        <Breadcrumbs
          className="-mt-4 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Trains abroad', href: '/world' }, { name: 'Rail pass calculator' }]}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Pass setup */}
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-ink dark:text-white">The pass</h2>

            <label htmlFor="rp-pass" className="mt-3 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
              Pass type
            </label>
            <select id="rp-pass" value={passId} onChange={(e) => setPassId(e.target.value)} className={cn(inputCls, 'mt-2')}>
              <optgroup label="Flexi — days within a period">
                {PASSES.filter((p) => p.kind === 'flexi').map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </optgroup>
              <optgroup label="Continuous">
                {PASSES.filter((p) => p.kind === 'continuous').map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </optgroup>
            </select>

            <label htmlFor="rp-price" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
              Pass price (€, adult 2nd class)
            </label>
            <input
              id="rp-price"
              type="number"
              min="0"
              inputMode="decimal"
              placeholder={selectedPass ? String(selectedPass.indicativePriceEur) : ''}
              value={priceOverride}
              onChange={(e) => setPriceOverride(e.target.value)}
              className={cn(inputCls, 'mt-2')}
            />
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
              Prefilled with an indicative figure and meant to be overwritten — pass prices reset every year, so put in
              the price you are actually being quoted. The traveller and class discounts apply on top of whatever you
              enter.
            </p>

            <label htmlFor="rp-who" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
              Traveller
            </label>
            <select id="rp-who" value={travellerType} onChange={(e) => setTravellerType(e.target.value)} className={cn(inputCls, 'mt-2')}>
              {TRAVELLER_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
              {TRAVELLER_TYPES.find((t) => t.id === travellerType)?.note}
            </p>

            <label className="mt-4 flex items-center gap-2 text-sm font-medium text-ink-soft dark:text-slate-300">
              <input
                type="checkbox"
                checked={firstClass}
                onChange={(e) => setFirstClass(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800"
              />
              First class
            </label>

            {recommendation?.best && recommendation.best.pass.id !== passId ? (
              <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50/70 p-3 dark:border-brand-800/60 dark:bg-brand-900/20">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">Cheaper option</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
                  This itinerary needs {recommendation.needDays} travel {recommendation.needDays === 1 ? 'day' : 'days'}.
                  The cheapest pass that fits is{' '}
                  <strong className="text-ink dark:text-white">{recommendation.best.pass.label}</strong> at about{' '}
                  {euros(recommendation.best.passPriceEur)}.
                </p>
                <button
                  type="button"
                  onClick={() => { setPassId(recommendation.best.pass.id); setPriceOverride(''); }}
                  className="mt-2 text-xs font-semibold text-brand-700 underline underline-offset-2 dark:text-brand-300"
                >
                  Use this pass
                </button>
              </div>
            ) : null}
          </Card>

          {/* Result */}
          <div className="space-y-5 lg:col-span-3">
            {result ? (
              <>
                <Card className={cn('overflow-hidden p-5', style.card)}>
                  <div className="flex items-start gap-3">
                    <style.Icon size={28} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                        {selectedPass?.label} · {result.daysUsed} travel {result.daysUsed === 1 ? 'day' : 'days'} used
                      </p>
                      <p className="mt-1 font-display text-3xl font-bold leading-none">{style.headline}</p>
                      <p className="mt-2 text-sm text-white/90">
                        {result.verdict === 'close'
                          ? `The pass costs ${range(result.passTotalEur)} all in; the same trips as tickets come to ${euros(result.ticketTotalEur)}. Close enough that flexibility, not price, should decide it.`
                          : result.verdict === 'pass'
                            ? `The pass costs ${range(result.passTotalEur)} all in and saves you ${range(result.savingEur)} against ${euros(result.ticketTotalEur)} of tickets.`
                            : `The pass costs ${range(result.passTotalEur)} all in — ${range({ min: Math.abs(result.savingEur.max), max: Math.abs(result.savingEur.min) })} more than the ${euros(result.ticketTotalEur)} of tickets it replaces.`}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">The two sides</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">With a pass</p>
                      <p className="mt-1 font-display text-2xl font-bold text-ink dark:text-white">{range(result.passTotalEur)}</p>
                      <div className="mt-2 space-y-1 text-xs text-ink-soft dark:text-slate-300">
                        <div className="flex justify-between gap-2"><span>Pass price</span><span>{euros(result.passPriceEur)}</span></div>
                        <div className="flex justify-between gap-2"><span>Reservation fees</span><span>{range(result.reservationEur)}</span></div>
                        {result.uncoveredFaresEur > 0 ? (
                          <div className="flex justify-between gap-2"><span>Fares on pass-refusing operators</span><span>{euros(result.uncoveredFaresEur)}</span></div>
                        ) : null}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Buying tickets</p>
                      <p className="mt-1 font-display text-2xl font-bold text-ink dark:text-white">{euros(result.ticketTotalEur)}</p>
                      <p className="mt-2 text-xs leading-relaxed text-ink-soft dark:text-slate-300">
                        The fares you entered, with seats already included in each.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                    <p className="text-ink-soft dark:text-slate-300">
                      <strong className="text-ink dark:text-white">Break-even:</strong> you need{' '}
                      {range(result.breakEvenEur)} of point-to-point fares before this pass pays for itself. That works
                      out at {range(result.costPerTravelDay)} per travel day.
                    </p>
                  </div>

                  {Object.keys(result.otherCurrencies).length ? (
                    <p className="mt-3 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
                      Plus{' '}
                      {Object.entries(result.otherCurrencies)
                        .map(([currency, r]) => formatFee({ currency, min: r.min, max: r.max }))
                        .join(' and ')}{' '}
                      in reservation fees, shown separately rather than converted at a guessed exchange rate.
                    </p>
                  ) : null}
                </Card>

                {result.warnings.length ? (
                  <Card className="border-amber-200 p-5 dark:border-amber-900/60">
                    <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink dark:text-white">
                      <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                      Worth checking
                    </h3>
                    <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
                      {result.warnings.map((w) => (
                        <li key={w} className="flex gap-2">
                          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </Card>
                ) : (
                  <Card className="flex items-center gap-2 p-4 text-sm text-ink-soft dark:text-slate-300">
                    <Check size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    This itinerary fits the pass cleanly — enough travel days, inside the validity window, and no
                    operator that refuses passes.
                  </Card>
                )}

                <ShareResult
                  url={shareUrl}
                  title="Rail pass break-even — Railmonk"
                  text={`${selectedPass?.label}: ${style.headline.toLowerCase()} (${range(result.passTotalEur)} vs ${euros(result.ticketTotalEur)}).`}
                />
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                <Globe2 size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
                Choose a pass and enter a price to compare it against tickets.
              </Card>
            )}
          </div>
        </div>

        {/* Itinerary */}
        <Card className="mt-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-ink dark:text-white">Your itinerary</h2>
              <p className="mt-1 text-sm text-ink-muted dark:text-slate-400">
                Enter the fare you would pay without a pass, and pick the service so the reservation fee is counted.
              </p>
            </div>
            <button
              type="button"
              onClick={addJourney}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-300 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
            >
              <Plus size={16} />
              Add a journey
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {journeys.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-ink-muted dark:border-slate-700 dark:text-slate-400">
                No journeys yet. Add one to start the comparison.
              </p>
            ) : null}

            {journeys.map((j) => (
              <div key={j.id} className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-12 dark:border-slate-700">
                <div className="sm:col-span-2">
                  <label htmlFor={`rp-from-${j.id}`} className="block text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">From</label>
                  <input id={`rp-from-${j.id}`} type="text" value={j.from} onChange={(e) => updateJourney(j.id, { from: e.target.value })} className={cn(inputCls, 'mt-1')} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`rp-to-${j.id}`} className="block text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">To</label>
                  <input id={`rp-to-${j.id}`} type="text" value={j.to} onChange={(e) => updateJourney(j.id, { to: e.target.value })} className={cn(inputCls, 'mt-1')} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`rp-date-${j.id}`} className="block text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Date</label>
                  <input id={`rp-date-${j.id}`} type="date" value={j.date} onChange={(e) => updateJourney(j.id, { date: e.target.value })} className={cn(inputCls, 'mt-1')} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`rp-fare-${j.id}`} className="block text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Fare (€)</label>
                  <input id={`rp-fare-${j.id}`} type="number" min="0" inputMode="decimal" value={j.fare} onChange={(e) => updateJourney(j.id, { fare: e.target.value })} className={cn(inputCls, 'mt-1')} />
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <label htmlFor={`rp-svc-${j.id}`} className="block text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Service</label>
                  <select id={`rp-svc-${j.id}`} value={j.serviceId} onChange={(e) => updateJourney(j.id, { serviceId: e.target.value })} className={cn(inputCls, 'mt-1')}>
                    <option value="">Not sure / no reservation</option>
                    {SERVICES_BY_REGION.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                            {s.passFee ? ` · ${formatFee(s.passFee)}` : ''}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 flex items-end justify-end sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeJourney(j.id)}
                    aria-label={`Remove journey ${j.from || ''} to ${j.to || ''}`}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
            Several journeys on the same date count as one travel day — that is what a flexi pass actually sells.
            Journeys left undated are counted as a separate day each, which is the cautious reading.
          </p>
        </Card>

        {/* Viable tiers */}
        {recommendation?.viable?.length > 1 ? (
          <Card className="mt-5 p-5">
            <h2 className="font-display text-lg font-bold text-ink dark:text-white">Every pass that fits this trip</h2>
            <p className="mt-1 text-sm text-ink-muted dark:text-slate-400">
              Tiers with enough travel days and a long enough validity window, cheapest first.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                    <th className="py-2 pr-3 font-semibold text-ink dark:text-white">Pass</th>
                    <th className="py-2 pr-3 font-semibold text-ink dark:text-white">Pass price</th>
                    <th className="py-2 pr-3 font-semibold text-ink dark:text-white">All in</th>
                    <th className="py-2 font-semibold text-ink dark:text-white">vs tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendation.viable.map((v) => (
                    <tr
                      key={v.pass.id}
                      className={cn(
                        'border-b border-slate-100 dark:border-slate-700/60',
                        v.pass.id === passId && 'bg-brand-50/60 dark:bg-brand-900/20'
                      )}
                    >
                      <td className="py-2 pr-3 font-medium text-ink dark:text-white">{v.pass.label}</td>
                      <td className="py-2 pr-3 text-ink-soft dark:text-slate-300">{euros(v.passPriceEur)}</td>
                      <td className="py-2 pr-3 text-ink-soft dark:text-slate-300">{range(v.passTotalEur)}</td>
                      <td className={cn('py-2 font-medium', v.savingEur.min > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400')}>
                        {v.savingEur.min > 0 ? `saves ${range(v.savingEur)}` : `costs ${range({ min: Math.abs(v.savingEur.max), max: Math.abs(v.savingEur.min) })} more`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        {recommendation && !recommendation.best ? (
          <Card className="mt-5 flex items-start gap-2 border-amber-200 p-5 dark:border-amber-900/60">
            <X size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm leading-relaxed text-ink-soft dark:text-slate-300">{recommendation.reason}</p>
          </Card>
        ) : null}

        <HowToSection
          name="How to use the Rail Pass Break-Even Calculator"
          description="Decide between a rail pass and ordinary tickets on the numbers rather than the marketing."
          steps={[
            { name: 'Enter your journeys', text: 'Add each leg with its date and the fare you would pay without a pass — check one real operator site for those figures.' },
            { name: 'Pick the service for each leg', text: 'This is what pulls in the compulsory reservation fee, which is the cost that decides most of these comparisons.' },
            { name: 'Choose a pass and enter its real price', text: 'The prefilled figure is indicative; pass prices reset annually, so use the price you are being quoted.' },
            { name: 'Set the traveller type', text: 'The youth discount is 25% and is often what flips the answer.' },
            { name: 'Read the break-even', text: 'It tells you how much point-to-point fare the trip needs before the pass pays for itself.' },
          ]}
        />

        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">Why most pass comparisons are wrong</h2>
          <p className="mt-3">
            The usual method is to add up the tickets you would have bought and compare that with the pass price. It
            omits the three things that actually decide the answer.
          </p>
          <p className="mt-3">
            The first is <strong className="text-ink dark:text-white">reservation fees</strong>. A pass does not get you
            on to a TGV, an AVE, a Frecciarossa, a Eurostar or any night train — each sells a compulsory supplement on
            top, from a separate pass quota. Three TGV legs already add enough to reshape the comparison, and a Eurostar
            crossing alone can add {formatFee(SERVICES.find((s) => s.id === 'eurostar').passFee)}.
          </p>
          <p className="mt-3">
            The second is <strong className="text-ink dark:text-white">travel-day accounting</strong>. A flexi pass sells
            days, not journeys. Four trains in one day cost one day; the same four trains spread across a week cost four,
            and possibly a more expensive tier. Clustering journeys is the most effective way to stretch a pass, and a
            night train departing after 19:00 uses only its departure day while still carrying you into the next
            morning.
          </p>
          <p className="mt-3">
            The third is <strong className="text-ink dark:text-white">operators that refuse passes outright</strong>.
            Italo and OUIGO are outside the system, so a pass holder pays the whole fare. This calculator puts those
            fares on the pass side, because counting them as covered would overstate the pass by an entire ticket.
          </p>
          <p className="mt-3">
            The result is a geography, not a rule of thumb. Germany, Austria and Switzerland reward a pass: high walk-up
            fares, no compulsory supplements, board what you like. France and Spain punish one: cheap advance fares and a
            supplement on every fast train. Before buying, it is worth checking{' '}
            <a href="/world/reservation-required" className="font-medium text-brand-600 underline underline-offset-2 dark:text-brand-300">
              which of your trains actually require a reservation
            </a>{' '}
            and{' '}
            <a href="/world/booking-windows" className="font-medium text-brand-600 underline underline-offset-2 dark:text-brand-300">
              when the booking window opens
            </a>{' '}
            — the pass quota on a popular TGV can be gone months ahead.
          </p>
        </div>

        <NextStep
          title="Pass or tickets, the reservations still need booking."
          body="Compulsory supplements come from a small quota that opens on the operator's own schedule. Find out when yours opens before it sells out."
          href="/world/booking-windows"
          cta="Check booking windows"
          secondary={{ href: '/world/reservation-required', label: 'Which trains need a reservation?' }}
        />

        <div className="mt-8">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="August 14, 2026"
            scope={`The break-even arithmetic, travel-day accounting and validity checks are the durable part of this tool. Reservation fees come from the site's own reservation-rules data, checked in ${VERIFIED_LABEL}. Pass prices are indicative starting figures only — Interrail and Eurail reset them annually, which is why the price field is editable and why the tool asks you to enter the price you are actually quoted.`}
            sources={[
              { label: 'Interrail', url: 'https://www.interrail.eu/' },
              { label: 'Eurail', url: 'https://www.eurail.com/' },
              { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
            ]}
          />
        </div>

        <div className="mt-8">
          <SearchLandingSections
            intro={(
              <>
                <p>
                  &ldquo;Is Interrail worth it?&rdquo; cannot be answered in general, only for a specific itinerary —
                  and the answer swings on costs the pass sellers do not put in front of you. This calculator adds the
                  compulsory reservation fees to the pass price, counts travel days the way a flexi pass actually counts
                  them, and charges any pass-refusing operator at full fare.
                </p>
                <p>
                  It then tells you the number that matters: how much point-to-point fare your trip needs before the
                  pass pays for itself.
                </p>
              </>
            )}
            example={(
              <p>
                Four long German and Austrian legs worth €495 of tickets, spread over four days on a 5-day flexi pass:
                no compulsory supplements, so the pass costs its price plus optional seat fees and comes out well ahead.
                Swap the same four legs for TGV and AVE journeys with €160 of cheap advance fares, and the pass now
                carries €40–70 of compulsory reservations on top of its price — the identical pass loses badly on an
                identical number of trains.
              </p>
            )}
            formula={(
              <p>
                Pass side = pass price (adjusted by traveller type and class) + compulsory reservation fees for the
                chosen services + full fares on operators that refuse passes. Ticket side = the sum of the fares you
                enter. Saving = ticket side − pass side, reported as a range wherever a reservation fee is itself a
                range, with the verdict taken on the midpoint. Travel days = distinct dates, undated journeys counted
                individually; a tier is only viable if it has enough travel days and enough validity to reach the last
                journey.
              </p>
            )}
            faqItems={seoFaqItems}
          />
        </div>

        <div className="mt-8 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-relaxed text-ink-soft dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
          <Globe2 size={18} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-300" />
          <span>
            Pass prices are indicative and were last reviewed in {VERIFIED_LABEL} — enter the price you are quoted.
            Reservation fees change at timetable changes. Railmonk is not affiliated with Interrail, Eurail or any
            railway operator, and sells nothing.
          </span>
        </div>

        <UpdatedStamp updated={getTool(HREF)?.updated} href={HREF} />

        <RelatedContent href={HREF} kind="tool" />
      </CalcLayout>
    </>
  );
};

export default RailPassCalculator;
