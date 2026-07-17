import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { AlertTriangle, Clock, ExternalLink, TicketX } from 'lucide-react';
import EEATPanel from '../calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import SearchLandingSections from '../calculator/SearchLandingSections';
import { buildSoftwareApplicationSchema, buildBreadcrumbSchema } from '../../utils/schema';
import { CalcLayout } from '../calculator/CalcLayout';
import HowToSection from '../calculator/HowToSection';
import { SelectField } from '../ui/Field';
import Card from '../ui/Card';

const {
  CLASS_RULES,
  flatChargePerPassenger,
  clerkagePerPassenger,
  computeCancellationRefund
} = require('../../utils/engines/irctcCancellation');

const controlCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink ' +
  'shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// Worked-example figures used in the prose below are computed from the same
// engine the calculator runs, so the text can never drift from the results.
const EX_SLAB25 = computeCancellationRefund({ classCode: '3A', ticketType: 'confirmed', fare: 2400, hoursBeforeDeparture: 48, passengers: 2 });
const EX_FLAT = computeCancellationRefund({ classCode: 'SL', ticketType: 'confirmed', fare: 800, hoursBeforeDeparture: 100, passengers: 1 });
const EX_WL = computeCancellationRefund({ classCode: 'SL', ticketType: 'waitlisted', fare: 1500, hoursBeforeDeparture: 40, passengers: 2 });
const CLERKAGE_EACH = clerkagePerPassenger(); // ₹63

const classOptions = Object.entries(CLASS_RULES).map(([value, rule]) => ({ value, label: rule.label }));

const ticketTypeOptions = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rac', label: 'RAC' },
  { value: 'waitlisted', label: 'Waitlisted (WL)' },
  { value: 'tatkal-confirmed', label: 'Tatkal — Confirmed' },
  { value: 'tatkal-rac-wl', label: 'Tatkal — RAC / Waitlisted' }
];

const slabLabel = {
  flat: '72 hours or more before departure',
  'slab-25': '72 to 24 hours before departure',
  'slab-50': '24 to 8 hours before departure',
  'no-refund': 'Less than 8 hours before departure',
  clerkage: 'RAC / waitlisted — clerkage only',
  'rac-wl-late': 'Under 30 minutes before departure',
  'tatkal-no-refund': 'Confirmed Tatkal'
};

const minChargeText = (classCode) => {
  const rule = CLASS_RULES[classCode];
  return rule.gst ? `₹${rule.flat} + GST (${rupees(flatChargePerPassenger(classCode))})` : rupees(rule.flat);
};

const explanationFor = (result, classCode, passengers) => {
  const perPax = passengers > 1 ? ' per passenger' : '';
  switch (result.rule) {
    case 'flat':
      return `72-hour window: full refund minus the flat cancellation charge of ${minChargeText(classCode)}${perPax} for this class.`;
    case 'slab-25':
      return result.minChargeApplied
        ? `72–24 hour window: 25% of fare would be less than the class minimum, so the flat charge of ${minChargeText(classCode)}${perPax} applies instead.`
        : `72–24 hour window: 25% of the fare is deducted (it exceeds the ${minChargeText(classCode)}${perPax} minimum for this class).`;
    case 'slab-50':
      return result.minChargeApplied
        ? `24–8 hour window: 50% of fare would be less than the class minimum, so the flat charge of ${minChargeText(classCode)}${perPax} applies instead.`
        : `24–8 hour window: 50% of the fare is deducted (it exceeds the ${minChargeText(classCode)}${perPax} minimum for this class).`;
    case 'no-refund':
      return 'Cancellations less than 8 hours before scheduled departure get no refund. Online self-service cancellation is also closed by this point — only a TDR claim with a valid reason is possible.';
    case 'clerkage':
      return `RAC and waitlisted tickets skip the time slabs: a flat clerkage of ₹60 + GST (${rupees(CLERKAGE_EACH)})${perPax} is deducted, cancellable up to 30 minutes before departure.`;
    case 'rac-wl-late':
      return 'RAC and waitlisted tickets must be cancelled at least 30 minutes before scheduled departure. Past that point there is no refund.';
    case 'tatkal-no-refund':
      return 'Confirmed Tatkal tickets are non-refundable on voluntary cancellation, no matter how early you cancel.';
    default:
      return '';
  }
};

const IRCTCCancellationCalculator = () => {
  const [classCode, setClassCode] = useState('3A');
  const [ticketType, setTicketType] = useState('confirmed');
  const [fare, setFare] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [timingMode, setTimingMode] = useState('datetime'); // 'datetime' | 'hours'
  const [departureAt, setDepartureAt] = useState('');
  const [hoursDirect, setHoursDirect] = useState('');
  const [now, setNow] = useState(() => Date.now());

  // Keep the hours-remaining countdown live while a departure time is set.
  useEffect(() => {
    if (timingMode !== 'datetime' || !departureAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [timingMode, departureAt]);

  const hoursBeforeDeparture = useMemo(() => {
    if (timingMode === 'hours') {
      const h = parseFloat(hoursDirect);
      return Number.isFinite(h) ? h : null;
    }
    if (!departureAt) return null;
    const dep = new Date(departureAt).getTime();
    if (!Number.isFinite(dep)) return null;
    return (dep - now) / 3600000;
  }, [timingMode, hoursDirect, departureAt, now]);

  const fareNum = parseFloat(fare);
  const paxNum = Math.max(1, parseInt(passengers, 10) || 1);
  const isTatkalConfirmed = ticketType === 'tatkal-confirmed';
  const departed = hoursBeforeDeparture !== null && hoursBeforeDeparture <= 0;

  const result = useMemo(() => {
    if (!(fareNum > 0) || hoursBeforeDeparture === null || departed) return null;
    return computeCancellationRefund({
      classCode,
      ticketType,
      fare: fareNum,
      hoursBeforeDeparture,
      passengers: paxNum
    });
  }, [classCode, ticketType, fareNum, hoursBeforeDeparture, paxNum, departed]);

  // Per-window refund figures for the timeline. Within a window the deduction
  // is constant, so one engine call per window (at a representative hour) is
  // exact. Rows carry the rule id so the active window can be highlighted.
  const timelineRows = useMemo(() => {
    if (!(fareNum > 0) || isTatkalConfirmed) return null;
    const isRacWl = ticketType !== 'confirmed';
    const depMs = timingMode === 'datetime' && departureAt ? new Date(departureAt).getTime() : null;
    const hasDates = depMs !== null && Number.isFinite(depMs);
    const stamp = (hrs) =>
      new Date(depMs - hrs * 3600000).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
      });
    // startHours = Infinity marks an open-ended first window; endHours = 0 is departure.
    const zone = (label, rule, probeHours, startHours, endHours) => {
      const r = computeCancellationRefund({ classCode, ticketType, fare: fareNum, hoursBeforeDeparture: probeHours, passengers: paxNum });
      let window = null;
      if (hasDates) {
        if (startHours === Infinity) window = `until ${stamp(endHours)}`;
        else if (endHours === 0) window = `${stamp(startHours)} → departure at ${stamp(0)}`;
        else window = `${stamp(startHours)} → ${stamp(endHours)}`;
      }
      return { label, rule, refund: r.refund, deduction: r.deduction, window };
    };
    if (isRacWl) {
      return [
        zone('Up to 30 min before departure', 'clerkage', 1, Infinity, 0.5),
        zone('Under 30 min before departure', 'rac-wl-late', 0.2, 0.5, 0)
      ];
    }
    return [
      zone('72+ hours before departure', 'flat', 100, Infinity, 72),
      zone('72 to 24 hours before', 'slab-25', 48, 72, 24),
      zone('24 to 8 hours before', 'slab-50', 12, 24, 8),
      zone('Under 8 hours before', 'no-refund', 4, 8, 0)
    ];
  }, [fareNum, isTatkalConfirmed, ticketType, classCode, paxNum, timingMode, departureAt]);

  const activeZoneIndex = result && timelineRows ? timelineRows.findIndex((row) => row.rule === result.rule) : -1;

  const countdownLabel = useMemo(() => {
    if (hoursBeforeDeparture === null) return null;
    if (departed) return 'Departure time has passed';
    const totalMins = Math.floor(hoursBeforeDeparture * 60);
    const days = Math.floor(totalMins / 1440);
    const hrs = Math.floor((totalMins % 1440) / 60);
    const mins = totalMins % 60;
    const parts = [];
    if (days) parts.push(`${days}d`);
    parts.push(`${hrs}h`, `${mins}m`);
    return `${parts.join(' ')} to departure`;
  }, [hoursBeforeDeparture, departed]);

  const seoFaqItems = [
    {
      question: 'What is a TDR and when do I need one?',
      answer:
        'A TDR (Ticket Deposit Receipt) is a manual refund claim filed on IRCTC when self-service cancellation is no longer possible or a special situation applies — for example, the train ran 3+ hours late and you chose not to travel. It must be filed within 72 hours of the train’s scheduled departure, and processing typically takes 60–90 days because the claim is verified against travel records.'
    },
    {
      question: 'What happens to a waitlisted ticket that never gets confirmed?',
      answer:
        'If an e-ticket is still fully waitlisted when the chart is prepared, IRCTC cancels it automatically and refunds the fare minus the clerkage charge — you do not need to cancel it yourself. RAC and partially confirmed tickets are not auto-cancelled, so cancel those manually (at least 30 minutes before departure) if you will not travel.'
    },
    {
      question: 'Is the GST portion of the cancellation charge refunded?',
      answer:
        'No. GST charged on AC-class cancellation charges and on clerkage is retained — the tax on the cancellation service itself is not returned. GST collected on the ticket fare portion that is refunded comes back with the refund.'
    },
    {
      question: 'How long does an IRCTC refund take to arrive?',
      answer:
        'For cards, UPI, and net banking, refunds are usually credited within 3–7 banking days of cancellation. Refunds to the IRCTC iPay / eWallet are typically instant. TDR-based refunds are much slower — commonly 60–90 days — because they go through manual verification.'
    },
    {
      question: 'What if Indian Railways cancels the train?',
      answer:
        'If the railway cancels the train, e-ticket holders get a full automatic refund of the entire fare, regardless of how close to departure it happens — no cancellation charge, no TDR needed. If the train is delayed by 3 or more hours and you choose not to travel, file a TDR within 72 hours of scheduled departure for a refund.'
    },
    {
      question: 'Until when can I cancel a ticket online?',
      answer:
        'Under the April 2026 rules, online self-service cancellation for confirmed tickets closes 8 hours before scheduled departure (RAC and waitlisted tickets can be cancelled up to 30 minutes before). After the cutoff, the only route to any refund is a TDR claim with a valid reason.'
    }
  ];

  const softwareSchema = buildSoftwareApplicationSchema({
    name: 'IRCTC Cancellation Charges Calculator',
    url: 'https://railmonk.com/irctc-cancellation-calculator',
    description: 'Estimate IRCTC train ticket refund and cancellation charge under the April 2026 rules — 72h/24h/8h slabs, class-wise flat charges, RAC/WL clerkage, and Tatkal.',
    applicationCategory: 'TravelApplication',
    featureList: [
      'April 2026 72h/24h/8h refund slabs',
      'Class-wise flat charges with GST handling',
      'RAC and waitlist clerkage rules',
      'Tatkal no-refund warning',
      'Live hours-to-departure countdown'
    ]
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', item: 'https://railmonk.com/' },
    { name: 'IRCTC Cancellation Calculator', item: 'https://railmonk.com/irctc-cancellation-calculator' }
  ]);

  const modeBtn = (mode, label) => (
    <button
      type="button"
      onClick={() => setTimingMode(mode)}
      className={
        'rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
        (timingMode === mode
          ? 'bg-brand-600 text-white'
          : 'bg-slate-100 text-ink-soft hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600')
      }
    >
      {label}
    </button>
  );

  return (
    <>
      <Head>
        <title>IRCTC Cancellation Charges Calculator — April 2026 Refund Rules | Railmonk</title>
        <meta name="description" content="Estimate your IRCTC train ticket refund under the new April 2026 rules: 72h/24h/8h cancellation slabs, class-wise flat charges with GST, RAC/waitlist clerkage, and Tatkal no-refund cases." />
        <link rel="canonical" href="https://railmonk.com/irctc-cancellation-calculator" />
        <meta property="og:title" content="IRCTC Cancellation Charges Calculator — April 2026 Rules | Railmonk" />
        <meta property="og:description" content="How much refund will you get if you cancel your train ticket? Computes the new 72h/24h/8h slabs, flat charges, RAC/WL clerkage, and Tatkal rules." />
        <meta property="og:url" content="https://railmonk.com/irctc-cancellation-calculator" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Travel"
        title="IRCTC Cancellation Charges Calculator"
        subtitle="Estimate your refund and the charge deducted when you cancel a train ticket — under the new rules effective 1 April 2026."
      >
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Input panel */}
          <Card className="p-5 lg:col-span-2">
            <div className="space-y-4">
              <SelectField
                id="cancel-class"
                label="Ticket class"
                value={classCode}
                onChange={setClassCode}
                options={classOptions}
              />

              <SelectField
                id="cancel-type"
                label="Ticket type"
                value={ticketType}
                onChange={setTicketType}
                options={ticketTypeOptions}
              />

              {isTatkalConfirmed && (
                <div className="rounded-xl border-l-4 border-rose-500 bg-rose-50/80 p-3.5 dark:border-rose-500 dark:bg-rose-950/40" role="alert">
                  <p className="flex items-center gap-2 text-sm font-semibold text-rose-800 dark:text-rose-300">
                    <AlertTriangle size={16} /> Confirmed Tatkal = no refund
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-rose-800/90 dark:text-rose-200/90">
                    Confirmed Tatkal tickets are non-refundable on voluntary cancellation — the full fare is
                    forfeited no matter how early you cancel. Only exceptions: the train itself is cancelled, or a
                    valid TDR case (e.g. 3+ hour delay).
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="cancel-fare" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">Total fare paid (₹)</label>
                <input
                  id="cancel-fare"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="e.g. 2400"
                  value={fare}
                  onChange={(e) => setFare(e.target.value)}
                  className={controlCls}
                />
              </div>

              <div>
                <label htmlFor="cancel-pax" className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">Passengers on the ticket</label>
                <input
                  id="cancel-pax"
                  type="number"
                  min="1"
                  max="6"
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  className={controlCls}
                />
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">When are you cancelling?</span>
                <div className="mb-2.5 flex gap-2">
                  {modeBtn('datetime', 'Departure date & time')}
                  {modeBtn('hours', 'Hours before')}
                </div>
                {timingMode === 'datetime' ? (
                  <>
                    <input
                      id="cancel-departure"
                      type="datetime-local"
                      aria-label="Scheduled departure date and time"
                      value={departureAt}
                      onChange={(e) => setDepartureAt(e.target.value)}
                      className={controlCls}
                    />
                    {countdownLabel && (
                      <p className={'mt-2 flex items-center gap-1.5 text-sm font-medium ' + (departed ? 'text-rose-600 dark:text-rose-400' : 'text-brand-700 dark:text-brand-300')}>
                        <Clock size={14} /> {countdownLabel}
                      </p>
                    )}
                  </>
                ) : (
                  <input
                    id="cancel-hours"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="e.g. 48"
                    aria-label="Hours before scheduled departure"
                    value={hoursDirect}
                    onChange={(e) => setHoursDirect(e.target.value)}
                    className={controlCls}
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Results panel */}
          <div className="space-y-5 lg:col-span-3">
            {result ? (
              <>
                <Card
                  className={
                    'overflow-hidden p-5 text-white ' +
                    (result.refund > 0
                      ? 'border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 dark:border-brand-700'
                      : 'border-rose-300 bg-gradient-to-br from-rose-600 to-rose-700 dark:border-rose-800')
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Estimated refund</p>
                      <p className="mt-1 font-display text-3xl font-bold leading-tight">{rupees(result.refund)}</p>
                      <p className="mt-0.5 text-sm text-white/85">of {rupees(fareNum)} fare paid</p>
                    </div>
                    <div className="shrink-0 rounded-xl bg-white/15 px-4 py-3 text-center">
                      <div className="text-xs text-white/85">Deducted</div>
                      <div className="mt-0.5 font-display text-xl font-bold leading-none">{rupees(result.deduction)}</div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-sm">
                    <p className="font-semibold">{slabLabel[result.rule]}</p>
                    <p className="mt-0.5 text-white/90">{explanationFor(result, classCode, paxNum)}</p>
                  </div>
                </Card>

                {timelineRows && (
                  <Card className="p-5">
                    <h3 className="font-display text-base font-bold text-ink dark:text-white">Refund timeline</h3>
                    <p className="mt-1 text-sm text-ink-muted dark:text-slate-400">
                      How your refund shrinks as departure gets closer{timingMode === 'datetime' && departureAt ? ' — deadlines shown for your train' : ''}.
                    </p>
                    <ol className="relative ml-2.5 mt-4 border-l-2 border-slate-200 dark:border-slate-700">
                      {timelineRows.map((row, i) => {
                        const isActive = i === activeZoneIndex;
                        const isPassed = activeZoneIndex >= 0 && i < activeZoneIndex;
                        const dotCls = isActive
                          ? 'border-brand-600 bg-brand-600 ring-4 ring-brand-200 dark:ring-brand-900'
                          : row.refund > 0
                            ? 'border-emerald-500 bg-white dark:bg-slate-800'
                            : 'border-rose-500 bg-rose-500';
                        return (
                          <li key={row.rule} className={'relative pb-5 pl-5 last:pb-0 ' + (isPassed ? 'opacity-50' : '')}>
                            <span aria-hidden="true" className={'absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 ' + dotCls} />
                            <div
                              className={
                                'flex items-start justify-between gap-3 rounded-lg px-3 py-2 text-sm ' +
                                (isActive ? 'bg-brand-50 ring-1 ring-brand-300 dark:bg-brand-900/30 dark:ring-brand-700' : '')
                              }
                            >
                              <div className="min-w-0">
                                <p className={'font-medium ' + (isActive ? 'text-brand-800 dark:text-brand-200' : 'text-ink dark:text-slate-100')}>
                                  {row.label}
                                  {isActive && <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">you are here</span>}
                                  {isPassed && <span className="ml-2 text-xs font-normal text-ink-muted dark:text-slate-500">window passed</span>}
                                </p>
                                {row.window && (
                                  <p className="mt-0.5 text-xs text-ink-muted dark:text-slate-400">{row.window}</p>
                                )}
                              </div>
                              <div className="shrink-0 text-right">
                                <p className={'font-semibold ' + (row.refund > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                                  {row.refund > 0 ? `${rupees(row.refund)} back` : 'No refund'}
                                </p>
                                {row.refund > 0 && (
                                  <p className="text-xs text-ink-muted dark:text-slate-400">−{rupees(row.deduction)}</p>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </Card>
                )}

                <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50/70 p-4 text-sm leading-relaxed text-amber-800/90 dark:border-amber-500 dark:bg-amber-900/20 dark:text-amber-200/90">
                  This is an estimate from published IRCTC policy. Actual refunds can differ for edge cases IRCTC
                  handles at its discretion (partial confirmations, concession fares, agent bookings). Verify the
                  final amount on the official IRCTC site before relying on it.
                </div>

                <a
                  href="https://www.irctc.co.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
                >
                  Cancel your ticket on the official IRCTC portal <ExternalLink size={15} strokeWidth={2.2} />
                </a>
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-10 text-center text-sm text-ink-muted dark:text-slate-400">
                <TicketX size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
                {departed
                  ? 'The departure time you entered has already passed — refunds after departure are only possible via TDR claims.'
                  : 'Enter the fare paid and when you plan to cancel to see your estimated refund.'}
              </Card>
            )}
          </div>
        </div>

        <HowToSection
          name="How to use the IRCTC Cancellation Charges Calculator"
          description="Estimate the refund for cancelling a train ticket under the April 2026 rules."
          steps={[
            { name: 'Pick your ticket class', text: 'Choose 1A/EC, 2A, 3A/CC/3E, SL, or 2S — the flat cancellation charge depends on it.' },
            { name: 'Pick the ticket type', text: 'Confirmed, RAC, and waitlisted tickets follow different rules; Tatkal has its own.' },
            { name: 'Enter fare and passengers', text: 'Use the total fare paid for the ticket and the number of passengers on it.' },
            { name: 'Set the departure time', text: 'Enter the scheduled departure date and time (a countdown shows hours remaining), or type hours directly.' },
            { name: 'Read the result', text: 'The calculator shows the refund, the amount deducted, and exactly which rule produced it.' }
          ]}
        />

        {/* Rules explainer */}
        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">The April 2026 cancellation rules, in plain words</h2>
          <p className="mt-3">
            From 1 April 2026, Indian Railways stretched every cancellation window. The old 48/12/4-hour slabs
            became <strong className="text-ink dark:text-white">72, 24, and 8 hours</strong>: cancel a confirmed
            ticket 72 hours or more before departure and you lose only the flat cancellation charge for your class;
            between 72 and 24 hours, 25% of the fare goes; between 24 and 8 hours, half the fare goes; and inside
            8 hours there is no refund at all. The percentage deductions are always subject to the flat charge as a
            minimum — a cheap ticket cancelled in the 25% window still pays at least the class charge.
          </p>
          <p className="mt-3">
            The flat charge is per passenger and depends on class: ₹240 for AC First and Executive Chair Car, ₹200
            for AC 2-Tier, ₹180 for AC 3-Tier, AC Chair Car, and AC 3 Economy, ₹120 for Sleeper, and ₹60 for Second
            Sitting. GST at 5% is added on top of the AC-class charges (making them {rupees(flatChargePerPassenger('1A'))},{' '}
            {rupees(flatChargePerPassenger('2A'))}, and {rupees(flatChargePerPassenger('3A'))} respectively) but not
            on Sleeper or Second Sitting.
          </p>
          <p className="mt-3">
            RAC and waitlisted tickets ignore the time slabs entirely. They can be cancelled up to 30 minutes before
            departure for a flat clerkage of ₹60 + GST ({rupees(CLERKAGE_EACH)}) per passenger — after that, nothing.
            And confirmed Tatkal tickets are the harshest case: voluntary cancellation refunds nothing, whether you
            cancel five days or five hours before the train leaves. Tatkal tickets still on RAC or waitlist follow
            the normal clerkage rule.
          </p>
          <p className="mt-3">
            One deadline that surprises people: <strong className="text-ink dark:text-white">online self-service
            cancellation closes 8 hours before departure</strong> for confirmed tickets. Past that point the only
            path to any refund is a TDR (Ticket Deposit Receipt) claim with a valid reason — a manual process that
            typically takes 60–90 days.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">Two worked examples</h3>
          <p className="mt-3">
            <strong className="text-ink dark:text-white">The family ticket, cancelled two days out.</strong> Two
            passengers in AC 3-Tier, total fare ₹2,400, cancelled 48 hours before departure. That lands in the
            72–24 hour window, so 25% of the fare — {rupees(EX_SLAB25.deduction)} — is deducted (comfortably above
            the {rupees(flatChargePerPassenger('3A'))}-per-passenger minimum), and {rupees(EX_SLAB25.refund)} comes
            back. Had they cancelled a day earlier, past the 72-hour line, the deduction would have been just the
            flat {rupees(flatChargePerPassenger('3A') * 2)} for the two of them.
          </p>
          <p className="mt-3">
            <strong className="text-ink dark:text-white">The early sleeper cancellation.</strong> One Sleeper-class
            ticket, fare ₹800, cancelled four days (about 100 hours) before departure. Only the flat ₹120 sleeper
            charge applies — no GST on non-AC classes — so the refund is {rupees(EX_FLAT.refund)}. A waitlisted
            version of a similar booking works differently: a ₹1,500 WL ticket for two passengers, cancelled 40
            hours out, loses only the clerkage of {rupees(CLERKAGE_EACH)} × 2 = {rupees(EX_WL.deduction)} and
            refunds {rupees(EX_WL.refund)} — the slabs never enter the picture.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">Planning the booking, not just the cancellation</h3>
          <p className="mt-3">
            The flip side of cancellation timing is booking timing. If your travel dates might shift, the shape of
            these rules argues for booking early anyway — a cancellation 72+ hours out costs only the flat charge —
            and deciding by the 72-hour mark. Our{' '}
            <a href="/irctc-calculator" className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300">IRCTC advance booking calculator</a>{' '}
            tells you exactly when the 60-day general window (and the one-day Tatkal window) opens for your journey
            date, so you can plan both ends of the trip.
          </p>
        </div>

        <div className="mt-8">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="July 11, 2026"
            scope="Refund output models the published Indian Railways cancellation rules effective 1 April 2026. Edge cases (partial confirmations, concessions, agent bookings, TDR outcomes) are decided by IRCTC and can differ."
            sources={[
              { label: 'IRCTC Cancellation & Refund Rules', url: 'https://contents.irctc.co.in/en/eticketCancel.html' },
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
                  Most people discover the cancellation charge only after cancelling — the refund arrives smaller
                  than expected and the deduction is never itemized clearly. This page answers the question before
                  you cancel: given your class, ticket type, fare, and how far away departure is, it shows the
                  refund, the deduction, and the exact rule that produced it.
                </p>
                <p>
                  It implements the Indian Railways rules effective 1 April 2026, which extended the old 48/12/4-hour
                  slabs to 72/24/8 hours. If your ticket was booked and cancelled before that date, the old slabs
                  applied instead.
                </p>
              </>
            )}
            example={(
              <p>
                A ₹2,400 AC 3-Tier ticket for two passengers, cancelled 48 hours before departure, falls in the
                72–24 hour slab: 25% of fare ({rupees(EX_SLAB25.deduction)}) is deducted because it exceeds the
                class minimum of {rupees(flatChargePerPassenger('3A'))} per passenger, leaving a refund
                of {rupees(EX_SLAB25.refund)}. The same ticket cancelled 80 hours out would lose only the flat
                charge; cancelled 6 hours out, it would refund nothing.
              </p>
            )}
            formula={(
              <p>
                For confirmed tickets: deduction = fare × slab rate (0% / 25% / 50% / 100% by the 72h/24h/8h
                windows), floored at the class flat charge × passengers (₹240/₹200/₹180 + 5% GST for AC classes;
                ₹120/₹60 without GST for SL/2S), and capped at the fare. RAC/waitlisted tickets instead deduct a
                flat ₹60 + GST clerkage per passenger up to 30 minutes before departure. Confirmed Tatkal deducts
                100% regardless of timing.
              </p>
            )}
            faqItems={seoFaqItems}
            relatedLinks={[
              { label: 'IRCTC Advance Booking Calculator', href: '/irctc-calculator' },
              { label: 'TDR Refund Checker', href: '/tdr-refund-checker' },
              { label: 'Tatkal Charges Calculator', href: '/tatkal-charges-calculator' },
              { label: 'IRCTC and Booking Strategy Guide', href: '/guides/irctc-booking-strategy' },
              { label: 'All Rail Tools', href: '/' }
            ]}
          />
        </div>

        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-center text-sm leading-relaxed text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          This calculator is an estimate based on published IRCTC policy and is not affiliated with Indian Railways
          or IRCTC. Final refund amounts are determined by IRCTC at the time of cancellation — verify on the{' '}
          <a href="https://www.irctc.co.in" target="_blank" rel="noopener noreferrer" className="font-medium underline">official IRCTC website</a>. Rules may change without notice.
        </div>
      </CalcLayout>
    </>
  );
};

export default IRCTCCancellationCalculator;
