import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { AlertCircle, BellRing, CalendarClock, CheckCircle2, Globe2, Hourglass } from 'lucide-react';
import { CalcLayout, ResultStat } from '../calculator/CalcLayout';
import Breadcrumbs from '../ui/Breadcrumbs';
import Card from '../ui/Card';
import RelatedContent from '../rail/RelatedContent';
import NextStep from '../rail/NextStep';
import ShareResult from '../rail/ShareResult';
import UpdatedStamp from '../rail/UpdatedStamp';
import useShareableInputs from '../rail/useShareableInputs';
import EEATPanel from '../calculator/EEATPanel';
import HowToSection from '../calculator/HowToSection';
import { editorialProfiles } from '../../utils/editorialProfiles';
import { buildSoftwareApplicationSchema } from '../../utils/schema';
import { buildFaqSchema } from '../../utils/faqSchema';
import { getTool } from '../../utils/catalog';
import {
  VERIFIED,
  REGIONS,
  OPERATORS,
  computeBookingOpening,
  compareHorizons,
  formatDate,
} from '../../utils/engines/bookingHorizons';
import { buildIcsEvent, buildGoogleCalendarUrl, downloadIcs } from '../../utils/reminders';

const HREF = '/world/booking-windows';
const URL = `https://railmonk.com${HREF}`;

const controlCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink ' +
  'shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

const labelCls = 'mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300';

const REGION_LABEL = Object.fromEntries(REGIONS.map((r) => [r.id, r.label]));

// Read the freshness claim off the data rather than restating it in prose. If
// VERIFIED moves and this sentence did not, the page would be asserting a
// review that never happened.
const VERIFIED_LABEL = new Date(`${VERIFIED}T00:00:00Z`).toLocaleDateString('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const FAQS = [
  {
    question: 'How far in advance can I book a train in Europe?',
    answer:
      'It depends entirely on the operator, and the spread is wide. Deutsche Bahn sells domestic German journeys twelve months ahead. ÖBB, SBB and international TGVs open at six months. Trenitalia and French domestic TGVs run around four months. Renfe in Spain is the outlier, sometimes opening barely a month before departure. There is no European-wide rule, so check the specific operator rather than assuming a common window.',
  },
  {
    question: 'How far in advance can I book Amtrak?',
    answer:
      'Eleven months, one of the longest windows of any major railway. It is worth using: Amtrak prices dynamically, so the cheapest fare buckets and the limited sleeper accommodation on long-distance routes are taken well before departure. The fare you see at eleven months is usually the lowest that route will offer.',
  },
  {
    question: 'When do Australian train bookings open?',
    answer:
      'NSW TrainLink sells most regional services up to six months ahead, though short journeys on a long-distance train are restricted and can only be booked closer in. V/Line reservations open around three months out, and most V/Line trains need no reservation at all. The premium Journey Beyond trains — The Ghan, Indian Pacific and Great Southern — work differently again: they sell by season, so an entire year of departures is released at once, often twelve to eighteen months ahead.',
  },
  {
    question: 'Why is the British booking window so unpredictable?',
    answer:
      'Because it is not a sales rule. British Advance fares depend on the timetable being confirmed, which normally happens about twelve weeks before travel — so engineering work, bank holidays and short-notice changes routinely push a specific date later. Some operators release earlier, occasionally around twenty weeks. If a date has not opened at twelve weeks, that is usually engineering work rather than a sold-out train.',
  },
  {
    question: 'Does booking early actually save money abroad?',
    answer:
      'On operators that use capacity-controlled discount fares, yes, and substantially — Deutsche Bahn Sparpreis, Amtrak’s lower fare buckets, French Prem’s, Swiss Supersaver tickets and Eurostar’s cheapest seats are all limited in number and go early. On operators with fixed walk-up pricing, such as much of Swiss domestic travel and most Australian suburban services, booking early gets you a seat but not a lower price.',
  },
  {
    question: 'How does this compare with the IRCTC booking window?',
    answer:
      'India’s advance reservation period is 60 days, cut from 120 in November 2024, which makes it one of the shortest windows of any large network. Almost every operator here opens earlier — Deutsche Bahn by a factor of six. The practical consequence for an Indian traveller planning a trip abroad is that the booking work starts far sooner than the IRCTC habit suggests.',
  },
];

const softwareSchema = buildSoftwareApplicationSchema({
  name: 'International Train Booking Window Calculator',
  url: URL,
  description:
    'When tickets go on sale for Amtrak, Deutsche Bahn, Eurostar, SNCF, Trenitalia, Renfe, NSW TrainLink and more — the exact date the booking window opens for your journey.',
  applicationCategory: 'TravelApplication',
  priceCurrency: 'EUR',
  featureList: [
    'Booking opening date by operator',
    'Countdown to the window opening',
    'Side-by-side comparison across operators',
    'Calendar reminder for the opening date',
  ],
});

const statusStyles = {
  open: 'from-emerald-600 to-emerald-700',
  'not-yet': 'from-brand-600 to-brand-700',
  past: 'from-slate-500 to-slate-600',
};

const BookingHorizonCalculator = () => {
  const [operatorId, setOperatorId] = useState('amtrak');
  const [travelDate, setTravelDate] = useState('');
  const [compareRegion, setCompareRegion] = useState('all');
  const [touched, setTouched] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const shareUrl = useShareableInputs(
    { operator: operatorId, date: travelDate },
    (params) => {
      if (params.operator && OPERATORS.some((o) => o.id === params.operator)) setOperatorId(params.operator);
      if (params.date) setTravelDate(params.date);
    }
  );
  const tool = getTool(HREF);

  const result = useMemo(
    () => (travelDate ? computeBookingOpening({ operatorId, travelDate }) : null),
    [operatorId, travelDate]
  );

  const comparison = useMemo(
    () => (travelDate ? compareHorizons({ travelDate, regionId: compareRegion === 'all' ? undefined : compareRegion }) : []),
    [travelDate, compareRegion]
  );

  const operator = result?.operator || OPERATORS.find((o) => o.id === operatorId);

  const reminderEvent = useMemo(() => {
    if (!result || result.status !== 'not-yet') return null;
    return {
      title: `Booking opens — ${operator.name}`,
      // Anchored to 09:00 IST: this site's readers are booking from India, and
      // an IST-labelled event is honest in a way "09:00 local" would not be
      // when the operator sits in another timezone.
      startWallIst: `${result.openIso}T09:00`,
      durationMinutes: 30,
      description: [
        `Tickets for ${operator.name} on ${formatDate(result.travelDate)} should go on sale around today (${operator.horizonLabel} before travel).`,
        operator.reliable
          ? 'Book early if the fare is capacity-controlled — the cheapest buckets go first.'
          : 'This operator’s opening date moves around, so check again over the following days if nothing is on sale yet.',
      ].join('\n'),
      alarmMinutesBefore: [60],
      uid: `railmonk-booking-${operator.id}-${result.travelIso}@railmonk.com`,
    };
  }, [result, operator]);

  const handleDownload = () => {
    const ics = buildIcsEvent(reminderEvent);
    if (ics && downloadIcs(ics, 'railmonk-booking-window.ics')) setDownloaded(true);
  };

  const todayIso = new Date().toISOString().split('T')[0];

  return (
    <>
      <Head>
        <title>International Train Booking Window Calculator — US, Europe & Australia | Railmonk</title>
        <meta
          name="description"
          content="When do train tickets go on sale? Booking windows for Amtrak (11 months), Deutsche Bahn (12), Eurostar, SNCF, Trenitalia, Renfe, NSW TrainLink and more — with the exact opening date for your journey."
        />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content="International Train Booking Window Calculator | Railmonk" />
        <meta property="og:description" content="Enter your travel date and see the day tickets open for any major operator abroad." />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="International Train Booking Window Calculator | Railmonk" />
        <meta name="twitter:description" content="From 30 days to a full year — when tickets actually go on sale, operator by operator." />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(FAQS)) }} />
      </Head>

      <CalcLayout
        eyebrow="Trains abroad"
        title="International Train Booking Window Calculator"
        subtitle="India opens booking 60 days out. Deutsche Bahn opens twelve months out, Renfe sometimes barely one. Enter your travel date and see the day tickets actually go on sale for the operator you need — and for every other one, side by side."
      >
        <Breadcrumbs
          className="-mt-4 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Trains abroad', href: '/world' }, { name: 'Booking windows' }]}
        />

        <div className="grid gap-5 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-2">
            <div className="space-y-4">
              <div>
                <label htmlFor="bh-operator" className={labelCls}>
                  Which operator?
                </label>
                <select
                  id="bh-operator"
                  value={operatorId}
                  onChange={(e) => { setOperatorId(e.target.value); setTouched(true); setDownloaded(false); }}
                  className={controlCls}
                >
                  {REGIONS.map((region) => (
                    <optgroup key={region.id} label={region.label}>
                      {OPERATORS.filter((o) => o.region === region.id).map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="mt-1 text-xs text-ink-muted dark:text-slate-500">
                  Booking window: <strong>{operator.horizonLabel}</strong> before departure.
                </p>
              </div>

              <div>
                <label htmlFor="bh-date" className={labelCls}>
                  Travel date
                </label>
                <input
                  id="bh-date"
                  type="date"
                  value={travelDate}
                  onChange={(e) => { setTravelDate(e.target.value); setTouched(true); setDownloaded(false); }}
                  onBlur={() => setTouched(true)}
                  className={controlCls}
                />
                <p className="mt-1 text-xs text-ink-muted dark:text-slate-500">
                  The date you want to travel, not the date you want to book.
                </p>
              </div>

              <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-sm dark:border-teal-800/60 dark:bg-teal-900/20">
                <p className="font-semibold text-teal-800 dark:text-teal-300">About this operator</p>
                <p className="mt-1 text-teal-700 dark:text-teal-400">{operator.note}</p>
              </div>
            </div>
          </Card>

          {/* min-w-0: a grid child defaults to min-width:auto, so the wide
              comparison table below would stretch this column and push the whole
              page into a horizontal scroll on a phone instead of scrolling
              inside its own container. */}
          <div className="min-w-0 space-y-5 lg:col-span-3" aria-live="polite">
            {result ? (
              <>
                <Card className={`overflow-hidden border-brand-200 bg-gradient-to-br ${statusStyles[result.status]} p-5 text-white dark:border-brand-700`}>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                    {result.status === 'open' ? (
                      <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                    ) : (
                      <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
                    )}
                    {result.status === 'open' ? 'Booking should be open now' : result.status === 'past' ? 'That date has passed' : 'Booking opens on'}
                  </div>
                  <p className="mt-1 font-display text-2xl font-bold leading-tight">
                    {result.status === 'open' ? 'Book it today' : formatDate(result.opensOn)}
                  </p>
                  <p className="mt-0.5 text-sm text-white/85">
                    {result.status === 'open'
                      ? `The window opened on ${formatDate(result.opensOn)} — ${operator.horizonLabel} before travel.`
                      : result.status === 'past'
                        ? 'Pick a date in the future to see when its booking window opens.'
                        : `That is ${result.daysUntilOpen} day${result.daysUntilOpen === 1 ? '' : 's'} from now, and ${operator.horizonLabel} before you travel.`}
                  </p>
                  {!operator.reliable && result.status !== 'past' ? (
                    <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm">
                      This operator&apos;s horizon moves — treat the date as the point to start checking, not a
                      guarantee that seats appear.
                    </p>
                  ) : null}
                </Card>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ResultStat
                    label="Booking window"
                    value={operator.horizonLabel}
                    emphasis
                  />
                  <ResultStat
                    label={result.status === 'past' ? 'Days ago' : 'Days until travel'}
                    value={`${Math.abs(result.daysUntilTravel)}`}
                  />
                </div>

                {reminderEvent ? (
                  <Card className="p-5">
                    <h3 className="font-display text-base font-bold text-ink dark:text-white">
                      Remind me the day it opens
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
                      A calendar event at 9:00 AM IST on {formatDate(result.opensOn)}, with an alert an hour before.
                      Nothing is stored on our side — the reminder lives in your own calendar.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                      >
                        <BellRing aria-hidden="true" className="h-4 w-4" />
                        {downloaded ? 'Reminder downloaded' : 'Add to my calendar'}
                      </button>
                      <a
                        href={buildGoogleCalendarUrl(reminderEvent)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                      >
                        Add to Google Calendar
                      </a>
                    </div>
                  </Card>
                ) : null}

                {comparison.length ? (
                  <Card className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-display text-base font-bold text-ink dark:text-white">
                        The same date, every operator
                      </h3>
                      <select
                        aria-label="Filter comparison by region"
                        value={compareRegion}
                        onChange={(e) => setCompareRegion(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-ink-soft dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <option value="all">All regions</option>
                        {REGIONS.map((r) => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-1.5 text-sm text-ink-muted dark:text-slate-400">
                      Sorted by which window opens first — the order to work through if the trip crosses borders.
                    </p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[34rem] text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-ink-muted dark:border-slate-700 dark:text-slate-400">
                            <th scope="col" className="py-2 pr-3 font-semibold">Operator</th>
                            <th scope="col" className="py-2 pr-3 font-semibold">Window</th>
                            <th scope="col" className="py-2 pr-3 font-semibold">Opens</th>
                            <th scope="col" className="py-2 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparison.map((row) => (
                            <tr
                              key={row.operator.id}
                              className={
                                'border-b border-slate-100 last:border-0 dark:border-slate-800 ' +
                                (row.operator.id === operatorId ? 'bg-brand-50/60 dark:bg-brand-900/20' : '')
                              }
                            >
                              <th scope="row" className="py-2.5 pr-3 font-medium text-ink dark:text-white">
                                {row.operator.name}
                                <span className="block text-xs font-normal text-ink-muted dark:text-slate-500">
                                  {REGION_LABEL[row.operator.region]}
                                </span>
                              </th>
                              <td className="py-2.5 pr-3 text-ink-muted dark:text-slate-400">{row.operator.horizonLabel}</td>
                              <td className="py-2.5 pr-3 text-ink-soft dark:text-slate-300">
                                <time dateTime={row.openIso}>{formatDate(row.opensOn)}</time>
                              </td>
                              <td className="py-2.5">
                                {row.status === 'open' ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                    Open
                                  </span>
                                ) : row.status === 'past' ? (
                                  <span className="text-xs text-ink-muted dark:text-slate-500">—</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs text-ink-muted dark:text-slate-400">
                                    <Hourglass aria-hidden="true" className="h-3 w-3" />
                                    in {row.daysUntilOpen}d
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ) : null}

                <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50/70 p-4 text-sm dark:border-amber-500 dark:bg-amber-900/20">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">Before you rely on this</p>
                  <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
                    Booking horizons are operator policy, not law, and they change — Deutsche Bahn doubled its window
                    in 2024. Sales also reset around the mid-December European timetable change, so a date just after
                    it can open later than the arithmetic suggests. Confirm on the operator&apos;s own site.
                  </p>
                </div>
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                {touched && !travelDate ? (
                  <>
                    <AlertCircle aria-hidden="true" className="mb-3 h-8 w-8 text-amber-400" />
                    Enter the date you want to travel to see when its booking window opens.
                  </>
                ) : (
                  <>
                    <Globe2 aria-hidden="true" className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                    Pick an operator and a travel date to see the day tickets go on sale.
                  </>
                )}
              </Card>
            )}

            {result && result.status !== 'past' ? (
              <ShareResult
                url={shareUrl}
                title="Train booking window — Railmonk"
                text={`${operator.name}: booking opens ${formatDate(result.opensOn)} for travel on ${formatDate(result.travelDate)}.`}
              />
            ) : null}
          </div>
        </div>

        <HowToSection
          name="How to find when train booking opens abroad"
          description="Work out the exact date tickets go on sale for a journey outside India."
          steps={[
            { name: 'Pick the operator', text: 'The window is set by the railway you are booking with, not by the country — Deutsche Bahn opens domestic and international routes at different times.' },
            { name: 'Enter your travel date', text: 'The tool counts back by that operator’s horizon to the day sales should open.' },
            { name: 'Check the comparison', text: 'For a multi-country trip, work through the operators in the order their windows open.' },
            { name: 'Set a reminder', text: 'Add the opening date to your calendar — capacity-controlled discount fares go early on most networks.' },
            { name: 'Confirm on the day', text: 'Horizons move, and European sales reset at the December timetable change. Treat the date as when to start checking.' },
          ]}
        />

        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">
            The 60-day habit does not travel
          </h2>
          <p className="mt-3">
            Anyone used to Indian Railways carries a specific instinct: booking opens 60 days out, you set an alarm,
            you compete. Almost nothing about that transfers. Most large foreign operators open months earlier — a
            year, in Germany&apos;s case — and the scarce thing is usually not the seat but the cheap fare attached to
            it. Deutsche Bahn Sparpreis, Amtrak&apos;s lower buckets, Swiss Supersaver tickets and Eurostar&apos;s
            cheapest seats are all capacity-controlled: a fixed number exist per train, and they sell in order.
            Arriving three months before departure, which feels absurdly early by Indian standards, can still be late.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">
            The exception that ruins itineraries
          </h3>
          <p className="mt-3">
            Spain runs the other way. Renfe&apos;s horizon swings between roughly one and three months with little
            warning, which means a trip that pairs a German leg bookable today with a Spanish leg that will not open
            for weeks cannot be booked in one sitting. The comparison table above exists for exactly this: it puts
            every operator&apos;s opening date against one travel date, in order, so the sequence of bookings is
            visible before you start rather than discovered halfway through.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">
            Sleepers and premium trains are a separate calculation
          </h3>
          <p className="mt-3">
            Night trains break the pattern in both directions. ÖBB&apos;s Nightjet sleepers on the long international
            runs often open <em>later</em> than ÖBB&apos;s domestic services — two to four months — while selling out
            faster than anything else on the network, so the window is short and the competition is real. Australia&apos;s
            Ghan and Indian Pacific go the opposite way: they sell by season, releasing a whole year of departures at
            once, sometimes eighteen months ahead, and the cabins go long before the horizon would suggest any urgency.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">
            What to do when the date arrives and nothing is on sale
          </h3>
          <p className="mt-3">
            Usually it is the timetable, not the train. British Advance fares depend on the schedule being confirmed
            about twelve weeks out, and engineering work routinely delays a specific date. European sales reset around
            the mid-December timetable change, so journeys just after it appear late regardless of the horizon. NSW
            TrainLink shows &ldquo;service not available&rdquo; for short hops on long-distance trains because those
            are deliberately restricted, not sold out. In all three cases the answer is the same: check again in a few
            days rather than assuming the train is full. If you want the same arithmetic for an Indian journey, the{' '}
            <Link href="/rail/irctc-calculator" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">
              IRCTC booking date calculator
            </Link>{' '}
            handles the 60-day window and Tatkal.
          </p>
        </div>

        <NextStep
          title="Train ran late once you got there?"
          body="Europe pays a fixed percentage of your fare for a delay; the US and Australia do not. See what the rules where you travelled actually entitle you to."
          href="/world/delay-compensation"
          cta="Check delay compensation"
          secondary={{ href: '/rail/irctc-calculator', label: 'India: the 60-day window' }}
        />

        <section className="mt-12" aria-labelledby="bh-faq">
          <h2 id="bh-faq" className="font-display text-xl font-bold text-ink dark:text-white">
            Frequently asked questions
          </h2>
          <div className="mt-4 space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.question} className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/70 dark:bg-slate-800/70">
                <summary className="cursor-pointer select-none font-display text-[0.98rem] font-semibold text-ink dark:text-white">
                  {faq.question}
                </summary>
                <p className="mt-2.5 text-[0.92rem] leading-relaxed text-ink-soft dark:text-slate-300">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-10">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="31 July 2026"
            scope={`Booking horizons were checked in ${VERIFIED_LABEL} against operator statements and the Seat61 booking-horizon reference. They are operator policy rather than regulation and do change; operators marked as variable open on no fixed schedule, and European sales reset at the December timetable change.`}
            sources={[
              { label: 'Seat61 — European booking horizons', url: 'https://www.seat61.com/european-train-booking-horizons.htm' },
              { label: 'Amtrak — top questions', url: 'https://www.amtrak.com/top-10-questions' },
              { label: 'National Rail — advance booking dates', url: 'https://www.nationalrail.co.uk/travel-information/advance-booking-dates/' },
              { label: 'Transport for NSW — booking restrictions', url: 'https://transportnsw.info/travel-info/using-public-transport/regional-booking-travel-information/booking-restrictions' },
            ]}
          />
        </div>

        <UpdatedStamp updated={tool?.updated} href={HREF} />

        <RelatedContent href={HREF} kind="tool" />
      </CalcLayout>
    </>
  );
};

export default BookingHorizonCalculator;
