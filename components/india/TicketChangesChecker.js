import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeftRight, CheckCircle2, Clock, Hourglass, ShieldAlert, XCircle } from 'lucide-react';
import { CalcLayout } from '../calculator/CalcLayout';
import Breadcrumbs from '../ui/Breadcrumbs';
import Card from '../ui/Card';
import { cn } from '../ui/cn';
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
import { CLASSES } from '../../utils/engines/trainFare';
import { formatWallDate, formatWallTime, toWallIso } from '../../utils/engines/chartPreparation';
import {
  CHANNELS,
  CONFIDENCE,
  OLD_BOARDING_LEAD_HOURS,
  POSTPONE_FEE_ONLY_HOURS,
  PREPONE_MIN_HOURS,
  QUOTAS,
  STATUSES,
  TRANSFER_REASONS,
  assessTicketChanges,
  formatTimeLeft,
  istWallNow,
} from '../../utils/engines/ticketChanges';

const HREF = '/rail/ticket-changes';
const URL = `https://railmonk.com${HREF}`;

const controlCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink ' +
  'shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
const labelCls = 'mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300';
const pillCls = (active) =>
  cn(
    'rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition',
    active
      ? 'border-brand-400 bg-brand-50/70 text-brand-800 shadow-sm dark:border-brand-500/70 dark:bg-brand-900/25 dark:text-brand-200'
      : 'border-slate-200 bg-white text-ink-soft hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600'
  );
const linkCls = 'font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300';

const VERDICTS = {
  available: {
    label: 'Still possible',
    Icon: CheckCircle2,
    cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/60',
  },
  'on-request': {
    label: 'If a berth is free',
    Icon: Hourglass,
    cls: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800/60',
  },
  closed: {
    label: 'Deadline passed',
    Icon: Clock,
    cls: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/60',
  },
  'not-allowed': {
    label: 'Not allowed',
    Icon: XCircle,
    cls: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800/60',
  },
};

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const whenText = (d) => `${formatWallTime(d)}, ${formatWallDate(d)}`;

const FAQS = [
  {
    question: 'Until when can I change my boarding station?',
    answer:
      'Since 1 April 2026, until the second (final) reservation chart, about 30 minutes before the train’s departure. Before that the change had to be made 24 hours ahead. It is allowed once per PNR, for confirmed and RAC tickets only, and the new station must be a stop between your original boarding station and your destination.',
  },
  {
    question: 'Can I transfer my confirmed train ticket to someone else?',
    answer:
      'Only in five situations: to a family member (father, mother, brother, sister, son, daughter, husband or wife), between government servants on duty, between students of the same institution, within a marriage party, or between NCC cadets. The request is made in writing to the Chief Reservation Supervisor 24 hours before departure — 48 hours for students and marriage parties — and is granted only once. It cannot be done online, and Tatkal tickets cannot be transferred at all.',
  },
  {
    question: 'Can I change the date of journey on an IRCTC e-ticket?',
    answer:
      'Not as a counter procedure — postponement and preponement under Rule 213.9 apply to tickets bought at a PRS counter. An e-ticket has to be cancelled and rebooked. The Railways Minister announced in October 2025 that confirmed e-tickets would be movable online from January 2026, paying only any fare difference, but we have not found an official notice confirming it is live; if your IRCTC booking history shows a reschedule option, use it.',
  },
  {
    question: 'How much does it cost to postpone a counter ticket?',
    answer:
      'For a confirmed ticket surrendered at least 48 hours before departure, only a fresh reservation fee. Closer than that, a cancellation charge on the original ticket. RAC and waitlisted tickets pay clerkage instead. Any fare difference between the two trains is refunded or collected, and the change is allowed only once.',
  },
  {
    question: 'Can I upgrade from sleeper to AC on the train?',
    answer:
      'Yes, if a berth in the higher class is vacant. Ask the TTE first: with their permission and a vacancy up to your destination you pay only the fare difference. Moving into the AC coach without asking is charged as travelling without a proper ticket — the difference plus an excess charge of at least ₹250.',
  },
  {
    question: 'Can I travel beyond the destination on my ticket?',
    answer:
      'Yes — tell the TTE before the train reaches your ticketed station and they will issue an excess fare ticket for the extra distance, charged as a fresh journey. Your berth is only guaranteed to the original destination. Carrying on without telling anyone is treated as ticketless travel for that stretch.',
  },
];

const softwareSchema = buildSoftwareApplicationSchema({
  name: 'Ticket Changes Checker',
  url: URL,
  description:
    'Check which changes an Indian Railways ticket still allows — boarding station, name transfer, travel date, class upgrade and journey extension — with the deadline, place and cost of each.',
  applicationCategory: 'TravelApplication',
  featureList: [
    'Boarding station change deadline (final chart)',
    'Name transfer eligibility and 24/48-hour deadline',
    'Postponement and preponement rules for counter tickets',
    'Upgrade and journey extension cost estimates',
  ],
});

const TicketChangesChecker = () => {
  const [channel, setChannel] = useState('eticket');
  const [status, setStatus] = useState('CNF');
  const [quota, setQuota] = useState('general');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [transferReason, setTransferReason] = useState('family');
  const [classCode, setClassCode] = useState('SL');
  const [upgradeClassCode, setUpgradeClassCode] = useState('3A');
  const [distanceKm, setDistanceKm] = useState('');
  const [extraKm, setExtraKm] = useState('');
  // "Now" only exists on the client — a static page rendered at build time
  // would otherwise freeze every deadline at the build date.
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(istWallNow());
    const timer = setInterval(() => setNow(istWallNow()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const shareUrl = useShareableInputs(
    {
      channel,
      status,
      quota,
      date: departureDate,
      time: departureTime,
      reason: transferReason,
      cls: classCode,
      up: upgradeClassCode,
      km: distanceKm,
      extra: extraKm,
    },
    (p) => {
      if (CHANNELS.some((c) => c.id === p.channel)) setChannel(p.channel);
      if (STATUSES.some((s) => s.id === p.status)) setStatus(p.status);
      if (QUOTAS.some((q) => q.id === p.quota)) setQuota(p.quota);
      if (p.date) setDepartureDate(p.date);
      if (p.time) setDepartureTime(p.time);
      if (TRANSFER_REASONS.some((r) => r.id === p.reason)) setTransferReason(p.reason);
      if (CLASSES[p.cls]) setClassCode(p.cls);
      if (CLASSES[p.up]) setUpgradeClassCode(p.up);
      if (p.km) setDistanceKm(p.km);
      if (p.extra) setExtraKm(p.extra);
    }
  );
  const tool = getTool(HREF);

  const result = useMemo(
    () =>
      assessTicketChanges({
        departureDate,
        departureTime,
        now,
        channel,
        status,
        quota,
        transferReason,
        classCode,
        upgradeClassCode,
        distanceKm: Number(distanceKm) || undefined,
        extraKm: Number(extraKm) || undefined,
      }),
    [departureDate, departureTime, now, channel, status, quota, transferReason, classCode, upgradeClassCode, distanceKm, extraKm]
  );

  const hasDeparture = Boolean(result.departure);
  const departed = hasDeparture && now && now.getTime() >= result.departure.getTime();

  return (
    <>
      <Head>
        <title>Change Boarding Station, Name or Date on a Train Ticket | Railmonk</title>
        <meta
          name="description"
          content="What your train ticket still allows: boarding station change until the final chart, name transfer 24/48 hours ahead, date change, upgrade and extension — with the deadline for each."
        />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content="Ticket Changes Checker | Railmonk" />
        <meta property="og:description" content="Boarding station, name, date, class, destination — what you can still change on your ticket, and until when." />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Ticket Changes Checker | Railmonk" />
        <meta name="twitter:description" content="Before you cancel: what your train ticket can still be changed to." />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(FAQS)) }} />
      </Head>

      <CalcLayout
        eyebrow="Cancellation & refunds"
        title="Ticket Changes Checker"
        subtitle="Before you cancel: what your ticket still allows. Boarding station, name, travel date, class and destination — each with its deadline, where to do it and what it costs."
      >
        <Breadcrumbs
          className="-mt-4 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Rail tools', href: '/#tools' }, { name: 'Ticket changes' }]}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Inputs */}
          <Card className="p-5 lg:col-span-2">
            <div className="space-y-5">
              <fieldset>
                <legend className={labelCls}>How was it booked?</legend>
                <div className="grid grid-cols-1 gap-2">
                  {CHANNELS.map((c) => (
                    <button key={c.id} type="button" aria-pressed={channel === c.id} onClick={() => setChannel(c.id)} className={pillCls(channel === c.id)}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className={labelCls}>Current status</legend>
                <div className="grid grid-cols-3 gap-2">
                  {STATUSES.map((s) => (
                    <button key={s.id} type="button" aria-pressed={status === s.id} onClick={() => setStatus(s.id)} className={cn(pillCls(status === s.id), 'text-center')}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="tc-quota" className={labelCls}>Quota</label>
                <select id="tc-quota" value={quota} onChange={(e) => setQuota(e.target.value)} className={controlCls}>
                  {QUOTAS.map((q) => (
                    <option key={q.id} value={q.id}>{q.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="tc-date" className={labelCls}>Departure date</label>
                  <input id="tc-date" type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className={controlCls} />
                </div>
                <div>
                  <label htmlFor="tc-time" className={labelCls}>Time (IST)</label>
                  <input id="tc-time" type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} className={controlCls} />
                </div>
                <p className="col-span-2 -mt-1 text-xs text-ink-muted dark:text-slate-500">
                  The train&apos;s scheduled departure from its <strong>originating station</strong> — the safe reading of every
                  deadline below. Leave blank to see the rules without dates.
                </p>
              </div>

              <div>
                <label htmlFor="tc-reason" className={labelCls}>If transferring the ticket, to whom?</label>
                <select id="tc-reason" value={transferReason} onChange={(e) => setTransferReason(e.target.value)} className={controlCls}>
                  {TRANSFER_REASONS.map((r) => (
                    <option key={r.id} value={r.id}>{r.label} ({r.leadHours} h)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="tc-class" className={labelCls}>Ticket class</label>
                  <select id="tc-class" value={classCode} onChange={(e) => setClassCode(e.target.value)} className={controlCls}>
                    {Object.entries(CLASSES).map(([code, c]) => (
                      <option key={code} value={code}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="tc-up" className={labelCls}>Upgrade to</label>
                  <select id="tc-up" value={upgradeClassCode} onChange={(e) => setUpgradeClassCode(e.target.value)} className={controlCls}>
                    {Object.entries(CLASSES).map(([code, c]) => (
                      <option key={code} value={code}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="tc-km" className={labelCls}>Journey (km)</label>
                  <input id="tc-km" type="number" inputMode="numeric" min="1" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} placeholder="e.g. 800" className={controlCls} />
                </div>
                <div>
                  <label htmlFor="tc-extra" className={labelCls}>Extend by (km)</label>
                  <input id="tc-extra" type="number" inputMode="numeric" min="1" value={extraKm} onChange={(e) => setExtraKm(e.target.value)} placeholder="e.g. 120" className={controlCls} />
                </div>
                <p className="col-span-2 -mt-1 text-xs text-ink-muted dark:text-slate-500">
                  Optional — distances turn the upgrade and extension rules into rupee estimates.
                </p>
              </div>
            </div>
          </Card>

          {/* Results */}
          <div className="space-y-4 lg:col-span-3" aria-live="polite">
            <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white dark:border-brand-700">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                <ArrowLeftRight aria-hidden="true" className="h-3.5 w-3.5" />
                What this ticket still allows
              </div>
              <p className="mt-1 font-display text-2xl font-bold leading-tight">
                {result.openCount} of {result.changes.length} changes open
              </p>
              <p className="mt-2 text-sm text-white/85">
                {hasDeparture
                  ? departed
                    ? 'This train has already left. Only changes made with the TTE on board remain.'
                    : `Train departs ${whenText(result.departure)}.${now ? '' : ' Working out time left…'}`
                  : 'Add the departure date and time to turn each rule into a deadline.'}
              </p>
            </Card>

            {result.changes.map((change) => {
              const v = VERDICTS[change.verdict];
              const conf = CONFIDENCE[change.confidence];
              return (
                <Card key={change.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-ink dark:text-white">{change.label}</h3>
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1', v.cls)}>
                      <v.Icon aria-hidden="true" className="h-3.5 w-3.5" />
                      {v.label}
                    </span>
                  </div>

                  {change.reason ? (
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{change.reason}</p>
                  ) : null}

                  {change.verdict !== 'not-allowed' ? (
                    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Deadline</dt>
                        <dd className="mt-0.5 text-ink dark:text-white">
                          {change.deadline ? (
                            <>
                              <time dateTime={toWallIso(change.deadline)} className="font-semibold">{whenText(change.deadline)}</time>
                              {change.msLeft > 0 ? (
                                <span className="block text-xs text-emerald-700 dark:text-emerald-300">{formatTimeLeft(change.msLeft)} left</span>
                              ) : null}
                              <span className="block text-xs text-ink-muted dark:text-slate-400">{change.deadlineRule}</span>
                            </>
                          ) : (
                            change.deadlineRule
                          )}
                          {change.lateRule ? (
                            <span className="mt-1 block text-xs text-ink-muted dark:text-slate-400">
                              After that: {change.lateRule.toLowerCase()}
                              {change.lateDeadline ? ` (${whenText(change.lateDeadline)})` : ''}, at a cancellation charge.
                            </span>
                          ) : null}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Cost</dt>
                        <dd className="mt-0.5 font-semibold text-ink dark:text-white">
                          {change.cost?.label}
                          {change.cost?.estimated ? <span className="font-normal text-ink-muted dark:text-slate-400"> (estimate)</span> : null}
                        </dd>
                        {change.cost?.detail ? (
                          <dd className="mt-1 text-xs leading-relaxed text-ink-muted dark:text-slate-400">{change.cost.detail}</dd>
                        ) : null}
                        {change.penalty ? (
                          <dd className="mt-1 text-xs leading-relaxed text-rose-700 dark:text-rose-300">
                            Done without asking: about {rupees(change.penalty.perPassenger)} per passenger, including the{' '}
                            {rupees(change.penalty.excessCharge)} excess charge.
                          </dd>
                        ) : null}
                      </div>
                      {change.where ? (
                        <div className="sm:col-span-2">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">Where</dt>
                          <dd className="mt-0.5 text-ink-soft dark:text-slate-300">{change.where}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}

                  {change.conditions?.length ? (
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
                      {change.conditions.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  ) : null}

                  <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-muted dark:text-slate-400">
                    <ShieldAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>
                      <strong className="font-semibold">{conf.label}.</strong> {conf.note}
                      {change.announced ? ` The online option is ${CONFIDENCE.announced.label.toLowerCase()}: ${CONFIDENCE.announced.note.toLowerCase()}` : ''}
                    </span>
                  </p>
                </Card>
              );
            })}

            <ShareResult
              url={shareUrl}
              title="Ticket changes — Railmonk"
              text="What this train ticket can still be changed to, and until when."
            />
          </div>
        </div>

        <HowToSection
          name="How to check what you can change on a train ticket"
          description="Find out which changes your Indian Railways ticket still allows, and the deadline for each."
          steps={[
            { name: 'Say how it was booked', text: 'E-tickets and counter tickets follow different rules — a date change, for instance, is a counter procedure.' },
            { name: 'Enter the current status and quota', text: 'Confirmed, RAC or waitlisted, and whether it is Tatkal or a concession ticket. Several changes depend on these.' },
            { name: 'Add the departure', text: 'Every deadline counts back from the train’s scheduled departure.' },
            { name: 'Read each card', text: 'Each change shows whether it is still possible, the deadline, where to go and what it costs.' },
            { name: 'Act before the earliest deadline', text: 'Name transfers close a day or two before departure; a boarding station change stays open until the final chart.' },
          ]}
        />

        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">Change it before you cancel it</h2>
          <p className="mt-3">
            A reserved ticket is less rigid than it looks. Five kinds of change are allowed, each with its own deadline,
            and most people only find out about them after paying a cancellation charge. If you are travelling from a
            different station, sending someone in your place, going a day later, wanting a better class or going
            further, check here first — then use the{' '}
            <Link href="/rail/irctc-cancellation-calculator" className={linkCls}>cancellation calculator</Link> only if
            none of them fits.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">Boarding station: now open until the final chart</h3>
          <p className="mt-3">
            From 1 April 2026 a confirmed or RAC passenger can change the boarding station until the second reservation
            chart, about 30 minutes before departure — online for an e-ticket, at any PRS counter for a counter ticket.
            The old rule closed the change {OLD_BOARDING_LEAD_HOURS} hours ahead, and a lot of pages still say so. It is
            allowed once, the new station must be a stop between where you booked from and where you are going, and
            after the change your berth is no longer held at the original station. See the{' '}
            <Link href="/rail/rule-updates" className={linkCls}>rule updates log</Link> for the source.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">Name transfer: a short list, in writing</h3>
          <p className="mt-3">
            A reservation belongs to the person named on it. The rules allow a transfer only to a parent, sibling, child
            or spouse; between government servants on duty; between students of one institution; within a marriage
            party; or between NCC cadets. The request goes in writing to the Chief Reservation Supervisor 24 hours before
            departure — 48 for students and marriage parties — and is granted once. Groups can change no more than 10% of
            their members. Tatkal tickets cannot be transferred at all.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">Date change: a counter-ticket rule</h3>
          <p className="mt-3">
            Under Rule 213.9, a counter ticket can be postponed to a later train or preponed to an earlier one, once, for
            the same destination, in the same or a higher class, if accommodation is available. A confirmed ticket
            surrendered {POSTPONE_FEE_ONLY_HOURS} hours or more ahead pays only a fresh reservation fee; RAC and
            waitlisted tickets pay clerkage. Preponement must be asked for at least {PREPONE_MIN_HOURS} hours before the
            earlier train. None of this applies to Tatkal, and an e-ticket has to be cancelled and rebooked unless the
            online reschedule option shows up in your IRCTC account.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">Upgrades and extensions: ask first</h3>
          <p className="mt-3">
            Both depend on a free berth, and both get cheaper if you ask before you act. With the TTE&apos;s permission an
            upgrade costs the fare difference and an extension the fare for the extra distance. Without it, the same
            journey is charged as an irregularity with an excess charge on top — the{' '}
            <Link href="/rail/penalty-calculator" className={linkCls}>penalty calculator</Link> shows that side.
          </p>
        </div>

        <NextStep
          title="None of the changes fit?"
          body="See exactly what you get back if you cancel — by class, status and hours to departure, under the April 2026 refund slabs."
          href="/rail/irctc-cancellation-calculator"
          cta="Work out my refund"
          secondary={{ href: '/rail/chart-preparation-time', label: 'When is my chart prepared?' }}
        />

        <section className="mt-12" aria-labelledby="tc-faq">
          <h2 id="tc-faq" className="font-display text-xl font-bold text-ink dark:text-white">Frequently asked questions</h2>
          <div className="mt-4 space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.question} className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/70 dark:bg-slate-800/70">
                <summary className="cursor-pointer select-none font-display text-[0.98rem] font-semibold text-ink dark:text-white">{faq.question}</summary>
                <p className="mt-2.5 text-[0.92rem] leading-relaxed text-ink-soft dark:text-slate-300">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-10">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="18 October 2026"
            scope="Name transfer, postponement/preponement and the Tatkal exclusion are read from the rule pages Indian Railways publishes on indianrail.gov.in. The boarding station change is from the April 2026 railway notice. Upgrade and extension procedure is as reported and applied, and fare amounts are estimates from our fare engine."
            sources={[
              { label: 'Indian Railways — Change in name of passenger', url: 'https://www.indianrail.gov.in/enquiry/StaticPages/StaticEnquiry.jsp?StaticPage=change_Name.html' },
              { label: 'Indian Railways — Postponement and preponement (Rule 213.9)', url: 'https://www.indianrail.gov.in/enquiry/StaticPages/StaticEnquiry.jsp?StaticPage=new_Rules.html' },
              { label: 'Indian Railways — Tatkal scheme', url: 'https://www.indianrail.gov.in/enquiry/StaticPages/StaticEnquiry.jsp?StaticPage=tatkal_Scheme.html' },
              { label: 'Southern Railway — boarding point change notice (2 April 2026)', url: 'https://sr.indianrailways.gov.in/view_detail.jsp?lang=0&dcd=19594&id=0,4,268' },
            ]}
          />
        </div>

        <UpdatedStamp updated={tool?.updated} href={HREF} />

        <RelatedContent href={HREF} kind="tool" />
      </CalcLayout>
    </>
  );
};

export default TicketChangesChecker;
