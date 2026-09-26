import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { AlertTriangle, Check, Mountain, Plus, Sparkles, Ticket, Trash2, TrendingDown } from 'lucide-react';
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
  HALF_FARE_CARD,
  PASSES,
  TRAVELLER_TYPES,
  LEG_TYPES,
  getLegType,
  passPrice,
  compareSwissOptions,
} from '../../utils/engines/swissPasses';

const HREF = '/world/swiss-travel-pass-calculator';
const URL = `https://railmonk.com${HREF}`;

const VERIFIED_LABEL = new Date(`${VERIFIED}T00:00:00Z`).toLocaleDateString('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const chf = (n) => `CHF ${Number(n).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
const inr = (n, rate) => `≈ ₹${Math.round(n * rate).toLocaleString('en-IN')}`;
const shortDate = (dayNumber) =>
  new Date(dayNumber * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

// A worked starting itinerary: the classic first-timer week — Lucerne, Titlis,
// Interlaken, Jungfraujoch, Zermatt, Gornergrat. It is deliberately the case
// where the popular advice ("just get the pass") is wrong, because the
// mountains dominate the spend. Fares are round example figures, labelled as
// such on the page, and meant to be replaced from the SBB app.
const DEFAULT_LEGS = [
  { id: 1, from: 'Zurich Airport', to: 'Lucerne', date: '2027-06-10', fare: '34', type: 'transport', supplement: '' },
  { id: 2, from: 'Lucerne', to: 'Engelberg (return)', date: '2027-06-11', fare: '36', type: 'transport', supplement: '' },
  { id: 3, from: 'Engelberg', to: 'Titlis (return)', date: '2027-06-11', fare: '96', type: 'mountain-50', supplement: '' },
  { id: 4, from: 'Lucerne', to: 'Interlaken', date: '2027-06-12', fare: '36', type: 'transport', supplement: '' },
  { id: 5, from: 'Interlaken', to: 'Grindelwald (return)', date: '2027-06-13', fare: '22', type: 'transport', supplement: '' },
  { id: 6, from: 'Grindelwald', to: 'Jungfraujoch (return)', date: '2027-06-13', fare: '170', type: 'jungfraujoch', supplement: '' },
  { id: 7, from: 'Interlaken', to: 'Zermatt', date: '2027-06-14', fare: '90', type: 'transport', supplement: '' },
  { id: 8, from: 'Zermatt', to: 'Gornergrat (return)', date: '2027-06-15', fare: '126', type: 'mountain-50', supplement: '' },
  { id: 9, from: 'Zermatt', to: 'Zurich Airport', date: '2027-06-16', fare: '130', type: 'transport', supplement: '' },
];

const encodeLegs = (legs) =>
  legs.map((l) => [l.date || '', l.fare || '', l.type || '', l.supplement || '', l.from || '', l.to || ''].join('~')).join('|');

const decodeLegs = (raw) =>
  String(raw || '')
    .split('|')
    .filter(Boolean)
    .map((chunk, i) => {
      const [date, fare, type, supplement, from, to] = chunk.split('~');
      return { id: i + 1, date, fare, type: getLegType(type).id, supplement, from, to };
    });

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-ink outline-none transition ' +
  'focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800/60 ' +
  'dark:text-white dark:focus:ring-brand-900/40';

const topLabelCls = 'block text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400';
const labelCls = 'block text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400';

const VERDICT_STYLE = {
  pass: {
    Icon: TrendingDown,
    card: 'border-emerald-300 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white dark:border-emerald-800',
  },
  'half-fare': {
    Icon: Ticket,
    card: 'border-brand-300 bg-gradient-to-br from-brand-600 to-brand-700 text-white dark:border-brand-800',
  },
  none: {
    Icon: Check,
    card: 'border-slate-300 bg-gradient-to-br from-slate-600 to-slate-700 text-white dark:border-slate-700',
  },
  close: {
    Icon: Sparkles,
    card: 'border-amber-300 bg-gradient-to-br from-amber-500 to-amber-600 text-white dark:border-amber-800',
  },
};

const headlineFor = (result) => {
  if (result.verdict === 'close') return 'Too close to call';
  if (result.best.kind === 'none') return 'Skip both — buy tickets';
  if (result.best.kind === 'half-fare') return 'Get the Half Fare Card';
  return `Get the ${result.best.kind === 'flex' ? 'Flex pass' : 'Swiss Travel Pass'}`;
};

const SwissPassCalculator = () => {
  const [travellerType, setTravellerType] = useState('adult');
  const [firstClass, setFirstClass] = useState(false);
  const [museums, setMuseums] = useState('');
  const [rate, setRate] = useState('');
  const [halfFarePrice, setHalfFarePrice] = useState('');
  const [priceOverrides, setPriceOverrides] = useState({});
  const [legs, setLegs] = useState(DEFAULT_LEGS);

  const shareUrl = useShareableInputs(
    {
      who: travellerType,
      cls: firstClass ? '1' : '0',
      mus: museums,
      fx: rate,
      l: encodeLegs(legs),
    },
    (params) => {
      if (params.who) setTravellerType(params.who);
      if (params.cls) setFirstClass(params.cls === '1');
      if (params.mus) setMuseums(params.mus);
      if (params.fx) setRate(params.fx);
      if (params.l) setLegs(decodeLegs(params.l));
    }
  );

  const parsedLegs = useMemo(
    () =>
      legs.map((l) => ({
        from: l.from,
        to: l.to,
        date: l.date || undefined,
        fare: parseFloat(l.fare) || 0,
        supplement: parseFloat(l.supplement) || 0,
        type: l.type,
      })),
    [legs]
  );

  // Overrides are keyed by class and age too, so switching to first class
  // does not silently reuse a second-class price someone typed in.
  const overrideKey = `${firstClass ? 'first' : 'second'}-${travellerType}`;
  const activeOverrides = priceOverrides[overrideKey] || {};

  const result = useMemo(
    () =>
      compareSwissOptions({
        legs: parsedLegs,
        travellerType,
        firstClass,
        museumsChf: parseFloat(museums) || 0,
        halfFarePriceChf: parseFloat(halfFarePrice) || undefined,
        passPriceOverrides: Object.fromEntries(
          Object.entries(activeOverrides).map(([k, v]) => [k, parseFloat(v)])
        ),
      }),
    [parsedLegs, travellerType, firstClass, museums, halfFarePrice, activeOverrides]
  );

  const fx = parseFloat(rate) > 0 ? parseFloat(rate) : null;

  const addLeg = () =>
    setLegs((prev) => [
      ...prev,
      { id: Math.max(0, ...prev.map((p) => p.id)) + 1, from: '', to: '', date: prev[prev.length - 1]?.date || '', fare: '', type: 'transport', supplement: '' },
    ]);
  const updateLeg = (id, patch) => setLegs((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removeLeg = (id) => setLegs((prev) => prev.filter((l) => l.id !== id));

  const setOverride = (passId, value) =>
    setPriceOverrides((prev) => ({ ...prev, [overrideKey]: { ...(prev[overrideKey] || {}), [passId]: value } }));

  const style = result ? VERDICT_STYLE[result.verdict] : null;
  const runnerUp = result?.options[1];

  const seoFaqItems = [
    {
      question: 'Is the Swiss Travel Pass worth it?',
      answer:
        'Only if most of your spending is on ordinary trains, buses and boats, which it covers completely. The famous mountains are a different story: the pass makes Rigi, Stoos and Stanserhorn free but only discounts Titlis, Pilatus, Schilthorn and Gornergrat by up to 50%, and the section above Wengen or Grindelwald to Jungfraujoch by just 25%. A trip built around those summits often comes out cheaper on the CHF 150 Half Fare Card.',
    },
    {
      question: 'Swiss Travel Pass or Half Fare Card — which is better for Jungfraujoch?',
      answer:
        'The Half Fare Card. It takes 50% off the entire Jungfrau Railway route, while the Swiss Travel Pass is free only as far as Wengen or Grindelwald and gives 25% off the expensive upper section. On a Jungfraujoch day the card saves noticeably more, which is why a single Jungfraujoch trip can change which product wins overall.',
    },
    {
      question: 'How much does the Swiss Half Fare Card cost?',
      answer:
        `CHF ${HALF_FARE_CARD.priceChf}, valid for one month, for anyone living outside Switzerland and Liechtenstein. It halves the fare on trains, buses, boats, city transport and most mountain railways, in first or second class. It is a discount card, not a ticket, so you still buy a ticket for every journey — at half price.`,
    },
    {
      question: 'Should I choose the consecutive or the Flex Swiss Travel Pass?',
      answer:
        'Flex costs more per day but lets you pick which days to use within a month. It wins when your trip has a few expensive travel days separated by cheap or walking days — activate it only on the big days. This calculator picks those days for you, so the comparison is against the Flex pass used well rather than on your first days.',
    },
    {
      question: 'Do children need a Swiss Travel Pass?',
      answer:
        'Usually not. Children under 6 travel free. Children aged 6 to 15 travel free with the free Swiss Family Card when accompanied by a parent holding either a Swiss Travel Pass or a Half Fare Card. So the family comparison is essentially the parents’ comparison, which is what this calculator works out.',
    },
    {
      question: 'Does the Swiss Travel Pass cover the Glacier Express and Bernina Express?',
      answer:
        'It covers the fare, but not the compulsory seat reservation, which is charged in full to everyone. The Half Fare Card halves the fare and also leaves the reservation to pay in full. Enter the reservation in the supplement field of that journey — it is added to every option and never counted as a saving.',
    },
    {
      question: 'Can I get the Swiss Travel Pass as an Indian resident?',
      answer:
        'Yes. Both the Swiss Travel Pass and the Swiss Half Fare Card are sold to anyone whose permanent residence is outside Switzerland and Liechtenstein, so Indian residents qualify. Both can be bought online before you travel and carried on your phone.',
    },
  ];

  const softwareSchema = buildSoftwareApplicationSchema({
    name: 'Swiss Travel Pass vs Half Fare Card Calculator',
    url: URL,
    description:
      'Compare the Swiss Travel Pass, Swiss Travel Pass Flex, Half Fare Card and ordinary tickets on your actual itinerary, with mountain excursion discounts and reservation supplements counted.',
    applicationCategory: 'TravelApplication',
    priceCurrency: 'CHF',
    featureList: [
      'Every consecutive and Flex tier compared',
      'Mountain excursion discounts per product',
      'Best Flex days chosen automatically',
      'Optional rupee conversion at your own rate',
    ],
  });

  return (
    <>
      <Head>
        <title>Swiss Travel Pass vs Half Fare Card Calculator | Railmonk</title>
        <meta
          name="description"
          content="Is the Swiss Travel Pass worth it? Compare it with the Half Fare Card and plain tickets on your itinerary — Jungfraujoch, Titlis and Gornergrat discounts included."
        />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content="Swiss Travel Pass vs Half Fare Card | Railmonk" />
        <meta property="og:description" content="Enter your Swiss itinerary and see which of the pass, the Half Fare Card or plain tickets is cheapest." />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="Trains abroad · Switzerland"
        title="Swiss Travel Pass vs Half Fare Card"
        subtitle="Pass, Half Fare Card or plain tickets — worked out on your own itinerary, with the mountain discounts that usually decide it."
      >
        <Breadcrumbs
          className="-mt-4 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Trains abroad', href: '/world' }, { name: 'Swiss Travel Pass calculator' }]}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Traveller setup */}
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-ink dark:text-white">You</h2>

            <label htmlFor="sp-who" className={cn(topLabelCls, 'mt-3')}>Traveller</label>
            <select id="sp-who" value={travellerType} onChange={(e) => setTravellerType(e.target.value)} className={cn(inputCls, 'mt-2')}>
              {TRAVELLER_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
              {TRAVELLER_TYPES.find((t) => t.id === travellerType)?.note} Children aged 6–15 travel free with either
              product on the free Swiss Family Card, so compare for the adults.
            </p>

            <label className="mt-4 flex items-center gap-2 text-sm font-medium text-ink-soft dark:text-slate-300">
              <input
                type="checkbox"
                checked={firstClass}
                onChange={(e) => setFirstClass(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800"
              />
              First class (enter first-class fares below)
            </label>

            <label htmlFor="sp-museums" className={cn(topLabelCls, 'mt-4')}>Museum entries you plan (CHF)</label>
            <input
              id="sp-museums"
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="0"
              value={museums}
              onChange={(e) => setMuseums(e.target.value)}
              className={cn(inputCls, 'mt-2')}
            />
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
              The pass includes free entry to more than 500 museums. Leave at 0 if you would not visit them anyway.
            </p>

            <label htmlFor="sp-fx" className={cn(topLabelCls, 'mt-4')}>Show rupees too — ₹ per CHF (optional)</label>
            <input
              id="sp-fx"
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="Your bank or forex card rate"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className={cn(inputCls, 'mt-2')}
            />
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
              We do not guess an exchange rate. Put in the one your card or forex provider will actually charge.
            </p>

            <details className="mt-5 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <summary className="cursor-pointer text-sm font-semibold text-ink dark:text-white">
                Edit product prices
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
                Prefilled with Switzerland Tourism&apos;s published prices, checked {VERIFIED_LABEL}, for your age and
                class. Prices change each year, so overwrite any that differ from what you are quoted.
              </p>
              <label htmlFor="sp-hfc" className={cn(labelCls, 'mt-3')}>Half Fare Card</label>
              <input
                id="sp-hfc"
                type="number"
                min="0"
                inputMode="decimal"
                placeholder={String(HALF_FARE_CARD.priceChf)}
                value={halfFarePrice}
                onChange={(e) => setHalfFarePrice(e.target.value)}
                className={cn(inputCls, 'mt-1')}
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                {PASSES.map((p) => (
                  <div key={p.id}>
                    <label htmlFor={`sp-price-${p.id}`} className={labelCls}>
                      {p.kind === 'flex' ? 'Flex' : 'Consecutive'} {p.days}d
                    </label>
                    <input
                      id={`sp-price-${p.id}`}
                      type="number"
                      min="0"
                      inputMode="decimal"
                      placeholder={String(passPrice({ passId: p.id, travellerType, firstClass }))}
                      value={activeOverrides[p.id] || ''}
                      onChange={(e) => setOverride(p.id, e.target.value)}
                      className={cn(inputCls, 'mt-1')}
                    />
                  </div>
                ))}
              </div>
            </details>
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
                        {result.daysNeeded} travel {result.daysNeeded === 1 ? 'day' : 'days'} · {chf(result.fullFaresChf)} of full fares
                      </p>
                      <p className="mt-1 font-display text-3xl font-bold leading-none">{headlineFor(result)}</p>
                      <p className="mt-2 text-sm text-white/90">
                        {result.verdict === 'close'
                          ? `${result.best.label} (${chf(result.best.totalChf)}) and ${runnerUp.label} (${chf(runnerUp.totalChf)}) are within a few francs. Choose on convenience: the pass means no ticket buying at all.`
                          : result.best.kind === 'none'
                            ? `Neither product pays for itself on this trip. Tickets come to ${chf(result.best.totalChf)}; the next best, ${runnerUp.label}, would cost ${chf(runnerUp.totalChf)}.`
                            : `${result.best.label}: ${chf(result.best.totalChf)} all in, saving ${chf(result.best.savingVsNoneChf)} on tickets and ${chf(runnerUp.totalChf - result.best.totalChf)} on the next best option, ${runnerUp.label}.`}
                      </p>
                      {fx ? (
                        <p className="mt-1 text-sm font-semibold text-white">{inr(result.best.totalChf, fx)} all in</p>
                      ) : null}
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">The three choices</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {[result.none, result.halfFare, result.bestPass].filter(Boolean).map((o) => (
                      <div
                        key={o.id}
                        className={cn(
                          'rounded-xl border p-4',
                          o.id === result.best.id
                            ? 'border-brand-300 bg-brand-50/60 dark:border-brand-700 dark:bg-brand-900/20'
                            : 'border-slate-200 dark:border-slate-700'
                        )}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
                          {o.kind === 'none' ? 'Tickets only' : o.kind === 'half-fare' ? 'Half Fare Card' : 'Best pass'}
                        </p>
                        <p className="mt-1 font-display text-2xl font-bold text-ink dark:text-white">{chf(o.totalChf)}</p>
                        {fx ? <p className="text-xs text-ink-muted dark:text-slate-400">{inr(o.totalChf, fx)}</p> : null}
                        <div className="mt-2 space-y-1 text-xs text-ink-soft dark:text-slate-300">
                          {o.kind !== 'none' ? (
                            <div className="flex justify-between gap-2">
                              <span>{o.kind === 'half-fare' ? (o.cards > 1 ? `${o.cards} cards` : 'Card') : `${o.pass.days}-day ${o.kind === 'flex' ? 'Flex' : 'pass'}`}</span>
                              <span>{chf(o.productChf)}</span>
                            </div>
                          ) : null}
                          <div className="flex justify-between gap-2"><span>Fares you still pay</span><span>{chf(o.faresChf)}</span></div>
                          {o.supplementsChf > 0 ? (
                            <div className="flex justify-between gap-2"><span>Reservations</span><span>{chf(o.supplementsChf)}</span></div>
                          ) : null}
                          {o.museumsChf > 0 ? (
                            <div className="flex justify-between gap-2"><span>Museums</span><span>{chf(o.museumsChf)}</span></div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  {result.bestPass?.kind === 'flex' && result.bestPass.coveredDays.length ? (
                    <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-ink-soft dark:bg-slate-800/60 dark:text-slate-300">
                      <strong className="text-ink dark:text-white">Flex days to activate:</strong>{' '}
                      {result.bestPass.coveredDays.map(shortDate).join(', ')} — your most expensive days, not your first ones.
                    </p>
                  ) : null}
                </Card>

                {result.warnings.length ? (
                  <Card className="border-amber-200 p-5 dark:border-amber-900/60">
                    <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink dark:text-white">
                      <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                      Worth knowing
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
                ) : null}

                <ShareResult
                  url={shareUrl}
                  title="Swiss Travel Pass vs Half Fare Card — Railmonk"
                  text={`${headlineFor(result)}: ${result.best.label} at ${chf(result.best.totalChf)} vs ${chf(result.none.totalChf)} on tickets.`}
                />
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                <Mountain size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
                Add a journey with its full fare to compare the pass, the Half Fare Card and plain tickets.
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
                The example is a typical first-timer week with round example fares. Replace each fare with the full
                price the SBB app shows, with no card applied.
              </p>
            </div>
            <button
              type="button"
              onClick={addLeg}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-300 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
            >
              <Plus size={16} />
              Add a journey
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {legs.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-ink-muted dark:border-slate-700 dark:text-slate-400">
                No journeys yet. Add one to start the comparison.
              </p>
            ) : null}

            {legs.map((l) => (
              <div key={l.id} className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-12 dark:border-slate-700">
                <div className="sm:col-span-2">
                  <label htmlFor={`sp-from-${l.id}`} className={labelCls}>From</label>
                  <input id={`sp-from-${l.id}`} type="text" value={l.from} onChange={(e) => updateLeg(l.id, { from: e.target.value })} className={cn(inputCls, 'mt-1')} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`sp-to-${l.id}`} className={labelCls}>To</label>
                  <input id={`sp-to-${l.id}`} type="text" value={l.to} onChange={(e) => updateLeg(l.id, { to: e.target.value })} className={cn(inputCls, 'mt-1')} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`sp-date-${l.id}`} className={labelCls}>Date</label>
                  <input id={`sp-date-${l.id}`} type="date" value={l.date} onChange={(e) => updateLeg(l.id, { date: e.target.value })} className={cn(inputCls, 'mt-1')} />
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor={`sp-type-${l.id}`} className={labelCls}>Kind of journey</label>
                  <select id={`sp-type-${l.id}`} value={l.type} onChange={(e) => updateLeg(l.id, { type: e.target.value })} className={cn(inputCls, 'mt-1')}>
                    {LEG_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label htmlFor={`sp-fare-${l.id}`} className={labelCls}>Fare CHF</label>
                  <input id={`sp-fare-${l.id}`} type="number" min="0" inputMode="decimal" value={l.fare} onChange={(e) => updateLeg(l.id, { fare: e.target.value })} className={cn(inputCls, 'mt-1')} />
                </div>
                <div className="sm:col-span-1">
                  <label htmlFor={`sp-sup-${l.id}`} className={labelCls} title="Compulsory seat reservation, e.g. Glacier Express">Seat res.</label>
                  <input id={`sp-sup-${l.id}`} type="number" min="0" inputMode="decimal" placeholder="0" value={l.supplement} onChange={(e) => updateLeg(l.id, { supplement: e.target.value })} className={cn(inputCls, 'mt-1')} />
                </div>
                <div className="col-span-2 flex items-end justify-end sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeLeg(l.id)}
                    aria-label={`Remove journey ${l.from || ''} to ${l.to || ''}`}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {getLegType(l.type).note ? (
                  <p className="col-span-2 text-xs leading-relaxed text-ink-muted sm:col-span-12 dark:text-slate-400">
                    {getLegType(l.type).note}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
            Journeys on the same date share one pass day. Use &ldquo;Seat res.&rdquo; for compulsory reservations such
            as the Glacier Express or Bernina Express — they are charged in full whatever you hold.
          </p>
        </Card>

        {/* Every option */}
        {result ? (
          <Card className="mt-5 p-5">
            <h2 className="font-display text-lg font-bold text-ink dark:text-white">Every option, cheapest first</h2>
            <p className="mt-1 text-sm text-ink-muted dark:text-slate-400">
              Passes shorter than your trip are costed with the days outside them paid at full fare.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                    <th className="py-2 pr-3 font-semibold text-ink dark:text-white">Option</th>
                    <th className="py-2 pr-3 font-semibold text-ink dark:text-white">Price</th>
                    <th className="py-2 pr-3 font-semibold text-ink dark:text-white">All in</th>
                    <th className="py-2 font-semibold text-ink dark:text-white">vs tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {result.options.map((o) => (
                    <tr
                      key={o.id}
                      className={cn(
                        'border-b border-slate-100 dark:border-slate-700/60',
                        o.id === result.best.id && 'bg-brand-50/60 dark:bg-brand-900/20'
                      )}
                    >
                      <td className="py-2 pr-3 font-medium text-ink dark:text-white">{o.label}</td>
                      <td className="py-2 pr-3 text-ink-soft dark:text-slate-300">{o.kind === 'none' ? '—' : chf(o.productChf)}</td>
                      <td className="py-2 pr-3 text-ink-soft dark:text-slate-300">
                        {chf(o.totalChf)}
                        {fx ? <span className="block text-xs text-ink-muted dark:text-slate-400">{inr(o.totalChf, fx)}</span> : null}
                      </td>
                      <td className={cn('py-2 font-medium', o.savingVsNoneChf > 0 ? 'text-emerald-700 dark:text-emerald-400' : o.savingVsNoneChf < 0 ? 'text-rose-700 dark:text-rose-400' : 'text-ink-muted dark:text-slate-400')}>
                        {o.kind === 'none' ? '—' : o.savingVsNoneChf >= 0 ? `saves ${chf(o.savingVsNoneChf)}` : `costs ${chf(-o.savingVsNoneChf)} more`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        <HowToSection
          name="How to use the Swiss Travel Pass calculator"
          description="Decide between the Swiss Travel Pass, the Half Fare Card and plain tickets on your own numbers."
          steps={[
            { name: 'List your journeys', text: 'Add each train, bus, boat and mountain trip with its date. Several journeys on one date share a pass day.' },
            { name: 'Enter full fares', text: 'Search each journey in the SBB app with no discount card and enter the full fare. Use return fares for day trips up a mountain.' },
            { name: 'Pick the kind of journey', text: 'This decides the discount: ordinary transport, the three included summits, other mountains, or the upper Jungfraujoch section.' },
            { name: 'Add reservations and museums', text: 'Panorama-train reservations are paid by everyone; museum entry is free only with the pass.' },
            { name: 'Read the ranking', text: 'Every pass tier, the Half Fare Card and plain tickets are costed and ranked. For a Flex pass, the tool also tells you which days to activate.' },
          ]}
        />

        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">Why the mountains decide it</h2>
          <p className="mt-3">
            Most advice compares the pass with the train fares and stops there. On an ordinary rail trip that is fair:
            the pass covers every train, bus and boat outright, and Swiss fares are high enough that a few long journeys
            pay for it.
          </p>
          <p className="mt-3">
            But most visitors from India are not going to Switzerland for the trains. They are going for Titlis,
            Jungfraujoch and the Matterhorn, and those are exactly the journeys the pass does not cover in full. Titlis,
            Pilatus, Schilthorn and Gornergrat are up to 50% off with either product, so the pass gives no advantage there.
            On the Jungfrau Railway the pass is free only as far as Wengen or Grindelwald and
            gives 25% off the steep, expensive section above, while the Half Fare Card halves the whole route.
          </p>
          <p className="mt-3">
            So the question is really how much of your spending is on ordinary transport. If most of it is, the pass
            wins. If a large part goes on summits, the CHF {HALF_FARE_CARD.priceChf} card often wins, even on a full week.
            Only three summits are free on the pass — Rigi, Stoos and Stanserhorn. If one of those is on your list
            anyway, it can tip the balance back.
          </p>
          <p className="mt-3">
            Planning trains elsewhere in Europe too? The{' '}
            <a href="/world/rail-pass-calculator" className="font-medium text-brand-600 underline underline-offset-2 dark:text-brand-300">
              Interrail and Eurail break-even calculator
            </a>{' '}
            does the same sums for a multi-country trip.
          </p>
        </div>

        <NextStep
          title="Booking the rest of Europe as well?"
          body="Some trains out of Switzerland need a compulsory reservation, and tickets for the rest of Europe go on sale on each operator's own schedule."
          href="/world/reservation-required"
          cta="Which trains need a reservation?"
          secondary={{ href: '/world/booking-windows', label: 'When can I book?' }}
        />

        <div className="mt-8">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="September 26, 2026"
            scope={`Pass prices are Switzerland Tourism's published 2026 figures and the Half Fare Card price is SBB's, both checked in ${VERIFIED_LABEL}. The pass's free Rigi, Stoos and Stanserhorn trips and the Half Fare Card's 50% discount come from those same pages. The 25% Jungfraujoch figure and the 50% on individual summits are the published operator practice, and are marked as such in the tool. Fares are always yours to enter. Railmonk does not carry live SBB fares.`}
            sources={[
              { label: 'Switzerland Tourism — Swiss Travel Pass', url: 'https://www.myswitzerland.com/en-us/planning/transport-accommodation/tickets-public-transport/swiss-travel-pass/' },
              { label: 'Switzerland Tourism — Swiss Travel Pass Flex', url: 'https://www.myswitzerland.com/en-us/planning/transport-accommodation/tickets-public-transport/swiss-travel-pass-flex/' },
              { label: 'SBB — Swiss Half Fare Card', url: 'https://www.sbb.ch/en/offers/swiss-half-fare-card' },
              { label: 'Jungfrau Railways — prices and tickets', url: 'https://www.jungfrau.ch/en-gb/prices-and-tickets/' },
            ]}
          />
        </div>

        <div className="mt-8">
          <SearchLandingSections
            intro={(
              <>
                <p>
                  &ldquo;Is the Swiss Travel Pass worth it?&rdquo; depends on where your money goes. This calculator
                  costs your itinerary four ways: tickets only, the Half Fare Card, every consecutive Swiss Travel Pass
                  and every Flex pass. It applies each product&apos;s actual discount on each kind of journey.
                </p>
                <p>
                  It also answers the question most comparisons skip: on a Flex pass, which days you should activate.
                </p>
              </>
            )}
            example={(
              <p>
                The example week — Lucerne, Titlis, Interlaken, Jungfraujoch, Zermatt, Gornergrat — adds up to about
                CHF 740 of full fares, and more than half of that is mountains. The Half Fare Card brings the whole trip
                to about CHF 520. The best Swiss Travel Pass still leaves roughly CHF 240 to pay on Titlis, Jungfraujoch
                and Gornergrat, taking it to about CHF 670. Swap the summits for long train journeys and the result
                reverses.
              </p>
            )}
            formula={(
              <p>
                Tickets = sum of full fares + reservations + museums. Half Fare = CHF {HALF_FARE_CARD.priceChf} per
                started month + each fare × (1 − its Half Fare discount) + reservations + museums. Each pass = its price
                + each covered fare × (1 − its pass discount) + full fare on days outside the pass + reservations. A
                consecutive pass is placed on the best run of days; a Flex pass on the highest-saving days within one
                month. Options within CHF 20 of each other are reported as too close to call.
              </p>
            )}
            faqItems={seoFaqItems}
          />
        </div>

        <div className="mt-8 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-relaxed text-ink-soft dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
          <Mountain size={18} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-300" />
          <span>
            Product prices were last checked in {VERIFIED_LABEL} and reset each year. Overwrite them with the price you
            are quoted. Railmonk is not affiliated with SBB, Swiss Travel System or any mountain railway, and sells
            nothing.
          </span>
        </div>

        <UpdatedStamp updated={getTool(HREF)?.updated} href={HREF} />

        <RelatedContent href={HREF} kind="tool" />
      </CalcLayout>
    </>
  );
};

export default SwissPassCalculator;
