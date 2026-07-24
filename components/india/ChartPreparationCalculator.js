import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { AlertCircle, ClipboardList, Clock, Moon, Sunrise } from 'lucide-react';
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
  computeChartTimes,
  formatWallDate,
  formatWallTime,
  toWallIso,
  FIRST_CHART_LEAD_HOURS,
  FINAL_CHART_LEAD_MINUTES,
} from '../../utils/engines/chartPreparation';
import { buildIcsEvent, buildGoogleCalendarUrl, downloadIcs } from '../../utils/reminders';

const HREF = '/rail/chart-preparation-time';
const URL = `https://railmonk.com${HREF}`;

const controlCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink ' +
  'shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

const FAQS = [
  {
    question: 'When is the train chart prepared?',
    answer:
      'The first reservation chart is prepared at least 10 hours before the train’s scheduled departure. For trains departing between 05:00 and 14:00, the first chart is instead prepared by 20:00 the previous evening. A second and final chart is prepared about 30 minutes before departure, taking in any cancellations made after the first chart.',
  },
  {
    question: 'Why did the chart preparation time change?',
    answer:
      'The Railway Board moved first-chart preparation from 8 hours to 10 hours before departure in a revision reported in December 2025, itself an increase on the 4-hour practice of earlier years. The intent is to tell waitlisted and RAC passengers their status early enough to make other arrangements.',
  },
  {
    question: 'Can my waitlisted ticket still confirm after the first chart?',
    answer:
      'Yes, though the odds narrow sharply. Berths released by cancellations between the first and final chart can still be allotted, and the final chart about 30 minutes before departure reflects those. But a ticket still waitlisted at the first chart is automatically cancelled for e-tickets, and the refund is processed without you filing anything.',
  },
  {
    question: 'What happens to my e-ticket if it is still waitlisted when the chart is prepared?',
    answer:
      'Fully waitlisted e-tickets are cancelled automatically at chart preparation and the refund is credited to the source account, less the applicable clerkage. You do not need to file a TDR for this. Partially confirmed tickets travel, and passengers who choose not to travel in that situation can file a TDR instead.',
  },
  {
    question: 'Can I book a ticket after the chart is prepared?',
    answer:
      'Yes — berths left vacant after charting are released for current booking, available at reservation counters and on IRCTC until the final chart is prepared roughly 30 minutes before departure. Current-booking fares are sometimes lower than the normal fare for the same class.',
  },
  {
    question: 'Does chart preparation time depend on my boarding station?',
    answer:
      'The chart is prepared against the train’s scheduled departure from its originating station, not from your boarding point. For a long-distance train you board mid-route, the chart may therefore be prepared a day or more before you actually travel. A separate chart is prepared for remote-location quotas at intermediate stations.',
  },
];

const softwareSchema = buildSoftwareApplicationSchema({
  name: 'Train Chart Preparation Time Calculator',
  url: URL,
  description:
    'Work out when the first and final reservation charts are prepared for any Indian Railways train from its scheduled departure time.',
  applicationCategory: 'TravelApplication',
  featureList: [
    'First chart preparation time',
    'Final chart preparation time',
    'Previous-evening charting rule for morning trains',
    'Calendar reminder for chart preparation',
  ],
});

const ChartPreparationCalculator = () => {
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [touched, setTouched] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const shareUrl = useShareableInputs(
    { date: departureDate, time: departureTime },
    (params) => {
      if (params.date) setDepartureDate(params.date);
      if (params.time) setDepartureTime(params.time);
    }
  );
  const tool = getTool(HREF);

  const result = useMemo(
    () => (departureDate && departureTime ? computeChartTimes({ departureDate, departureTime }) : null),
    [departureDate, departureTime]
  );

  const incomplete = touched && (!departureDate || !departureTime);

  const reminderEvent = useMemo(() => {
    if (!result) return null;
    return {
      title: 'Train chart prepared — check your PNR status',
      startWallIst: toWallIso(result.firstChart),
      durationMinutes: 15,
      description: [
        `The first reservation chart for your train (departing ${formatWallDate(result.departure)} at ${formatWallTime(result.departure)}) is prepared around now.`,
        'Check your PNR status: waitlisted e-tickets are cancelled automatically at charting, and vacant berths open for current booking.',
      ].join('\n'),
      url: 'https://www.irctc.co.in/nget/train-search',
      alarmMinutesBefore: [30],
      uid: `railmonk-chart-${toWallIso(result.firstChart)}@railmonk.com`,
    };
  }, [result]);

  const handleDownload = () => {
    const ics = buildIcsEvent(reminderEvent);
    if (ics && downloadIcs(ics, 'railmonk-chart-reminder.ics')) setDownloaded(true);
  };

  const todayIso = new Date().toISOString().split('T')[0];

  return (
    <>
      <Head>
        <title>Train Chart Preparation Time Calculator | Railmonk</title>
        <meta
          name="description"
          content="When is your train's chart prepared? Current rules: 10 hours before departure, or 8 PM the previous evening for trains leaving between 5 AM and 2 PM."
        />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content="Train Chart Preparation Time Calculator | Railmonk" />
        <meta property="og:description" content="Enter your train's departure time and see when the first and final charts are prepared." />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Train Chart Preparation Time Calculator | Railmonk" />
        <meta name="twitter:description" content="When does your waitlist stop moving? Chart timings, calculated." />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(FAQS)) }} />
      </Head>

      <CalcLayout
        eyebrow="Train planning"
        title="Train Chart Preparation Time Calculator"
        subtitle="Enter your train's scheduled departure and see when its first and final reservation charts are prepared — the moment a waitlist stops moving and vacant berths open for current booking."
      >
        <Breadcrumbs
          className="-mt-4 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Rail tools', href: '/#tools' }, { name: 'Chart preparation time' }]}
        />

        <div className="grid gap-5 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-2">
            <div className="space-y-4">
              <div>
                <label htmlFor="chart-date" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
                  Scheduled departure date
                </label>
                <input
                  id="chart-date"
                  type="date"
                  value={departureDate}
                  min={todayIso}
                  onChange={(e) => { setDepartureDate(e.target.value); setTouched(true); setDownloaded(false); }}
                  onBlur={() => setTouched(true)}
                  className={controlCls}
                />
                <p className="mt-1 text-xs text-ink-muted dark:text-slate-500">
                  Use the train&apos;s departure from its <strong>originating station</strong>, not your boarding point.
                </p>
              </div>

              <div>
                <label htmlFor="chart-time" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
                  Scheduled departure time (IST)
                </label>
                <input
                  id="chart-time"
                  type="time"
                  value={departureTime}
                  onChange={(e) => { setDepartureTime(e.target.value); setTouched(true); setDownloaded(false); }}
                  onBlur={() => setTouched(true)}
                  className={controlCls}
                />
              </div>

              <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-sm dark:border-teal-800/60 dark:bg-teal-900/20">
                <p className="font-semibold text-teal-800 dark:text-teal-300">The two rules</p>
                <ul className="mt-1 space-y-1 text-teal-700 dark:text-teal-400">
                  <li>Departs 05:00–14:00 → first chart by 20:00 the previous evening.</li>
                  <li>Any other time → first chart {FIRST_CHART_LEAD_HOURS} hours before departure.</li>
                  <li>Final chart → {FINAL_CHART_LEAD_MINUTES} minutes before departure.</li>
                </ul>
              </div>
            </div>
          </Card>

          <div className="space-y-5 lg:col-span-3" aria-live="polite">
            {result ? (
              <>
                <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white dark:border-brand-700">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                    {result.rule === 'previous-evening' ? <Moon aria-hidden="true" className="h-3.5 w-3.5" /> : <Clock aria-hidden="true" className="h-3.5 w-3.5" />}
                    First chart prepared
                  </div>
                  <p className="mt-1 font-display text-2xl font-bold leading-tight">{formatWallTime(result.firstChart)}</p>
                  <p className="mt-0.5 text-sm text-white/85">{formatWallDate(result.firstChart)}</p>
                  <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm">
                    {result.rule === 'previous-evening'
                      ? 'Your train departs in the 05:00–14:00 band, so the chart is prepared the previous evening at 20:00.'
                      : `That is ${result.firstChartLeadHours} hours before departure.`}
                    {result.chartsOnPreviousDay ? ' Note it falls on the day before your journey.' : ''}
                  </p>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ResultStat label="Final chart" value={`${formatWallTime(result.finalChart)}`} emphasis />
                  <ResultStat label="Scheduled departure" value={formatWallTime(result.departure)} />
                </div>

                <Card className="p-5">
                  <h3 className="font-display text-base font-bold text-ink dark:text-white">What happens at each chart</h3>
                  <dl className="mt-3 space-y-3 text-sm">
                    <div>
                      <dt className="font-semibold text-ink dark:text-white">
                        First chart — {formatWallTime(result.firstChart)}, {formatWallDate(result.firstChart)}
                      </dt>
                      <dd className="mt-0.5 text-ink-muted dark:text-slate-400">
                        Berths are allotted, RAC moves up, and fully waitlisted e-tickets are cancelled automatically
                        with the refund credited back. Remaining vacant berths open for current booking.
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-ink dark:text-white">
                        Final chart — {formatWallTime(result.finalChart)}, {formatWallDate(result.finalChart)}
                      </dt>
                      <dd className="mt-0.5 text-ink-muted dark:text-slate-400">
                        Cancellations made since the first chart are absorbed, so a few RAC passengers get a full
                        berth. Current booking closes here.
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                    >
                      <ClipboardList aria-hidden="true" className="h-4 w-4" />
                      {downloaded ? 'Reminder downloaded' : 'Remind me at chart time'}
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

                <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50/70 p-4 text-sm dark:border-amber-500 dark:bg-amber-900/20">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">Before you rely on this</p>
                  <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
                    Charting times follow the published rule, but the exact minute can shift — for a train running
                    late, for remote-location quotas charted separately at intermediate stations, and around
                    festival specials. Confirm your PNR status on the official IRCTC portal.
                  </p>
                </div>
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                {incomplete ? (
                  <>
                    <AlertCircle aria-hidden="true" className="mb-3 h-8 w-8 text-amber-400" />
                    Enter both the departure date and time to see the chart timings.
                  </>
                ) : (
                  <>
                    <Sunrise aria-hidden="true" className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                    Enter your train&apos;s scheduled departure to see when its charts are prepared.
                  </>
                )}
              </Card>
            )}
            {result ? (
              <ShareResult
                url={shareUrl}
                title="Chart preparation time — Railmonk"
                text={`Chart times for a ${departureTime} departure on ${departureDate}.`}
              />
            ) : null}
          </div>
        </div>

        <HowToSection
          name="How to find your train's chart preparation time"
          description="Work out when the first and final reservation charts are prepared for your train."
          steps={[
            { name: 'Find the scheduled departure', text: 'Use the departure time from the train’s originating station, shown on your ticket or the IRCTC timetable.' },
            { name: 'Enter the date and time', text: 'Fill in both fields — the rule that applies depends on the hour of departure.' },
            { name: 'Read the first chart time', text: 'Trains leaving between 05:00 and 14:00 are charted at 20:00 the previous evening; all others 10 hours before departure.' },
            { name: 'Note the final chart', text: 'Prepared about 30 minutes before departure, absorbing late cancellations.' },
            { name: 'Set a reminder', text: 'Add a calendar alert for chart time so you can check your PNR status the moment it is decided.' },
          ]}
        />

        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">
            Why chart time is the deadline that actually matters
          </h2>
          <p className="mt-3">
            A waitlisted ticket is a question that stays open until the chart is prepared. Up to that moment the
            number can keep falling as other passengers cancel; at that moment it is answered, and for a fully
            waitlisted e-ticket the answer is final — the booking is cancelled automatically and the money returns
            to the account it came from, less clerkage. Knowing when that happens is what turns an anxious wait into
            a decision point: if the chart is prepared at 20:00 the night before, you know by dinner whether you are
            travelling, and you still have the evening to find an alternative.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">The two-band rule</h3>
          <p className="mt-3">
            Charting used to happen roughly four hours before departure, which left overnight travellers finding out
            their fate close to midnight. The window has been widened twice since, most recently to{' '}
            {FIRST_CHART_LEAD_HOURS} hours. But a flat ten-hour rule would chart an early-morning train in the small
            hours, so trains departing between 05:00 and 14:00 are instead charted at 20:00 the previous evening —
            a civilised hour at which to learn you need a different plan. Everything outside that band, including
            post-midnight departures, follows the ten-hour rule.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">
            The gap between the two charts is a real opportunity
          </h3>
          <p className="mt-3">
            Berths that are vacant at the first chart are released for{' '}
            <strong className="text-ink dark:text-white">current booking</strong> — bookable at reservation counters
            and on IRCTC right up to the final chart, sometimes at a fare below the normal one for that class. On
            routes where the waitlist looked hopeless, this window is frequently how people end up travelling
            anyway. It closes about {FINAL_CHART_LEAD_MINUTES} minutes before departure, when the final chart
            absorbs the last cancellations and RAC passengers move into any berths that freed up.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">
            One nuance that catches people out
          </h3>
          <p className="mt-3">
            The chart is prepared against the train&rsquo;s departure from its{' '}
            <strong className="text-ink dark:text-white">originating station</strong>, not from yours. Board a
            Kerala-bound train at Nagpur and the chart may well have been prepared more than a day before you set
            foot on the platform. Intermediate stations with remote-location quotas get their own separate charting,
            which is why an RLWL ticket behaves differently from a GNWL one right through to the end — a difference
            the{' '}
            <Link href="/rail/waitlist-confirmation-chances" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">
              waitlist confirmation tool
            </Link>{' '}
            accounts for.
          </p>
        </div>

        <NextStep
          title="Waitlisted and want to know your odds before charting?"
          body="The waitlist tool reads your quota code and position and gives an honest estimate of whether the ticket clears — plus what to do if it does not."
          href="/rail/waitlist-confirmation-chances"
          cta="Check my waitlist chances"
          secondary={{ href: '/rail/guides/waitlist-rac-guide', label: 'Read the waitlist & RAC guide' }}
        />

        <section className="mt-12" aria-labelledby="chart-faq">
          <h2 id="chart-faq" className="font-display text-xl font-bold text-ink dark:text-white">
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
            reviewedOn="24 July 2026"
            scope="Chart timings are computed from the published Railway Board rule (first chart 10 hours before departure, or 20:00 the previous evening for 05:00–14:00 departures). Actual charting can vary for delayed trains and separately charted remote-location quotas."
            sources={[
              { label: 'IRCTC Official Portal', url: 'https://www.irctc.co.in/' },
              { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' },
              { label: 'Railway Enquiry (PNR status)', url: 'https://enquiry.indianrail.gov.in/' },
            ]}
          />
        </div>

        <UpdatedStamp updated={tool?.updated} href={HREF} />

        <RelatedContent href={HREF} kind="tool" />
      </CalcLayout>
    </>
  );
};

export default ChartPreparationCalculator;
