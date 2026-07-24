import React, { useMemo, useState, useId } from 'react';
import Link from 'next/link';
import { AlertCircle, Bell, BellRing, Bookmark, Calendar, Check, Download, ExternalLink } from 'lucide-react';
import Card from '../ui/Card';
import { SelectField } from '../ui/Field';
import { QUOTAS, computeBookingWindow } from '../../utils/engines/bookingWindow';
import { buildIcsEvent, buildGoogleCalendarUrl, buildOutlookCalendarUrl, downloadIcs } from '../../utils/reminders';
import { saveJourney } from '../../utils/savedJourneys';
import { formatIsoDate } from './UpdatedStamp';

const controlCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink ' +
  'shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';

const ALERT_CHOICES = [
  { id: '1440', label: 'A day before', minutes: [1440, 30] },
  { id: '60', label: 'An hour before', minutes: [60, 10] },
  { id: '15', label: '15 minutes before', minutes: [15] },
];

const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/**
 * Turns a journey date into a calendar reminder for the moment its booking
 * window opens.
 *
 * The reminder is a calendar event, not a subscription: it fires on the
 * traveller's own device and Railmonk stores nothing. `compact` renders the
 * inline version embedded in calculator pages.
 */
const ReminderPlanner = ({ compact = false, defaultQuotaId = 'general', defaultJourneyDate = '', heading }) => {
  const uid = useId();
  const [journeyDate, setJourneyDate] = useState(defaultJourneyDate);
  const [quotaId, setQuotaId] = useState(defaultQuotaId);
  const [alertChoice, setAlertChoice] = useState('1440');
  const [label, setLabel] = useState('');
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState(null);
  const [downloaded, setDownloaded] = useState(false);

  const today = todayIso();
  const window_ = useMemo(
    () => (journeyDate ? computeBookingWindow({ journeyDate, quotaId, today }) : null),
    [journeyDate, quotaId, today]
  );

  const error = useMemo(() => {
    if (!touched || !journeyDate) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(journeyDate)) return 'Enter your journey date as a valid date.';
    if (journeyDate < today) return 'That date has already passed — pick a future journey date.';
    if (window_?.status === 'window-open') {
      return `Booking for ${formatIsoDate(journeyDate)} is already open, so there is nothing left to wait for. You can book now.`;
    }
    return null;
  }, [touched, journeyDate, today, window_]);

  const isBlocking = Boolean(error) && window_?.status !== 'window-open';
  const ready = Boolean(window_) && !isBlocking && window_.status !== 'journey-passed';

  const event = useMemo(() => {
    if (!ready) return null;
    const quota = window_.quota;
    const trip = label.trim();
    const title = `${quota.id.startsWith('tatkal') ? 'Tatkal' : 'IRCTC'} booking opens${trip ? ` — ${trip}` : ''}`;
    const description = [
      `Booking opens at ${quota.openTimeLabel} for your journey on ${formatIsoDate(window_.journeyDate)}.`,
      `Quota: ${quota.label}.`,
      'Log in to IRCTC a few minutes early and have your passenger master list ready.',
    ].join('\n');
    return {
      title,
      startWallIst: window_.opensWallIso,
      durationMinutes: 30,
      description,
      url: 'https://www.irctc.co.in/nget/train-search',
      location: 'IRCTC — irctc.co.in',
      alarmMinutesBefore: ALERT_CHOICES.find((a) => a.id === alertChoice)?.minutes || [1440],
      uid: `railmonk-${window_.opensDate}-${quota.id}-${uid}`,
    };
  }, [ready, window_, label, alertChoice, uid]);

  const handleDownload = () => {
    const ics = buildIcsEvent(event);
    if (ics && downloadIcs(ics, `railmonk-booking-reminder-${window_.opensDate}.ics`)) {
      setDownloaded(true);
    }
  };

  const handleSave = () => {
    const result = saveJourney({ journeyDate, quotaId, label: label.trim() });
    setSaved(result ? 'ok' : 'failed');
  };

  const alertLabel = ALERT_CHOICES.find((a) => a.id === alertChoice)?.label.toLowerCase();

  return (
    <Card className={compact ? 'p-5' : 'p-5 sm:p-6'}>
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-slate-700/70 dark:text-brand-300">
          <BellRing aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-ink dark:text-white">
            {heading || 'Set a booking reminder'}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted dark:text-slate-400">
            Tell us your journey date and we work out the exact moment booking opens, then hand you a calendar
            event with an alert. It lands in your own calendar — Railmonk sends nothing and stores nothing.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-date`} className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
            Journey date
          </label>
          <input
            id={`${uid}-date`}
            type="date"
            value={journeyDate}
            min={today}
            onChange={(e) => { setJourneyDate(e.target.value); setTouched(true); setDownloaded(false); setSaved(null); }}
            onBlur={() => setTouched(true)}
            aria-invalid={isBlocking ? 'true' : undefined}
            aria-describedby={error ? `${uid}-error` : undefined}
            className={controlCls}
          />
        </div>

        <SelectField
          id={`${uid}-quota`}
          label="Which window?"
          value={quotaId}
          onChange={(v) => { setQuotaId(v); setDownloaded(false); setSaved(null); }}
          options={QUOTAS.map((q) => ({ value: q.id, label: `${q.label} — opens ${q.openTimeLabel}` }))}
        />

        <SelectField
          id={`${uid}-alert`}
          label="Alert me"
          value={alertChoice}
          onChange={(v) => { setAlertChoice(v); setDownloaded(false); }}
          options={ALERT_CHOICES.map((a) => ({ value: a.id, label: a.label }))}
        />

        <div>
          <label htmlFor={`${uid}-label`} className="mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300">
            Trip name <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <input
            id={`${uid}-label`}
            type="text"
            value={label}
            maxLength={60}
            placeholder="e.g. Delhi → Lucknow, cousin's wedding"
            onChange={(e) => { setLabel(e.target.value); setDownloaded(false); }}
            className={controlCls}
          />
        </div>
      </div>

      {/* Validation and result are one live region, so a screen reader hears
          whichever state applies without the other being announced as empty. */}
      <div aria-live="polite">
        {error ? (
          <p
            id={`${uid}-error`}
            role={isBlocking ? 'alert' : undefined}
            className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${
              isBlocking
                ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200'
                : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
            }`}
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}

        {ready ? (
          <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50/70 p-4 dark:border-brand-800/60 dark:bg-brand-900/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
              Booking opens
            </p>
            <p className="mt-1 font-display text-xl font-bold text-ink dark:text-white">
              {formatIsoDate(window_.opensDate)} at {window_.quota.openTimeLabel}
            </p>
            <p className="mt-1 text-sm text-ink-soft dark:text-slate-300">
              {window_.status === 'open-today'
                ? 'That is today — book as soon as the window opens.'
                : `${window_.daysUntilOpen} ${window_.daysUntilOpen === 1 ? 'day' : 'days'} from now. Your calendar will alert you ${alertLabel}.`}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                {downloaded ? <Check aria-hidden="true" className="h-4 w-4" /> : <Download aria-hidden="true" className="h-4 w-4" />}
                {downloaded ? 'Reminder downloaded' : 'Add to my calendar (.ics)'}
              </button>
              <a
                href={buildGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                <Calendar aria-hidden="true" className="h-4 w-4" />
                Google Calendar
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 opacity-60" />
              </a>
              <a
                href={buildOutlookCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                <Calendar aria-hidden="true" className="h-4 w-4" />
                Outlook
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 opacity-60" />
              </a>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                {saved === 'ok' ? <Check aria-hidden="true" className="h-4 w-4" /> : <Bookmark aria-hidden="true" className="h-4 w-4" />}
                {saved === 'ok' ? 'Saved to this device' : 'Save this journey'}
              </button>
            </div>

            {downloaded ? (
              <p className="mt-3 flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Reminder file downloaded. Open it once to add the event to your calendar — on a phone, tapping the
                  downloaded file is usually enough.
                </span>
              </p>
            ) : null}
            {saved === 'ok' ? (
              <p className="mt-2 text-sm text-ink-soft dark:text-slate-300">
                Stored on this device only.{' '}
                <Link href="/rail/saved-journeys" className="font-semibold text-brand-700 underline underline-offset-2 dark:text-brand-300">
                  View your saved journeys
                </Link>
                .
              </p>
            ) : null}
            {saved === 'failed' ? (
              <p role="alert" className="mt-2 text-sm text-rose-700 dark:text-rose-300">
                Could not save to this device — browser storage is unavailable, which usually means private browsing.
                The calendar reminder above still works.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {!journeyDate ? (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-ink-muted dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
          <Bell aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Pick a journey date above to see when its booking window opens.</span>
        </p>
      ) : null}

      <p className="mt-4 text-xs leading-relaxed text-ink-muted dark:text-slate-500">
        No email address, no phone number, no account. The reminder is a standard calendar file created in your
        browser — nothing is transmitted to Railmonk. Booking times follow published IRCTC rules and can change;
        confirm on the{' '}
        <a href="https://www.irctc.co.in/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          official IRCTC portal
        </a>
        .
      </p>
    </Card>
  );
};

export default ReminderPlanner;
