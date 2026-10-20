import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  AlertCircle,
  Bookmark,
  CalendarPlus,
  Check,
  ChevronDown,
  ClipboardList,
  FileText,
  Lock,
  RotateCcw,
  ShieldAlert,
  TrainFront,
  Upload,
} from 'lucide-react';
import Card from '../../ui/Card';
import { cn } from '../../ui/cn';
import InstallApp from '../InstallApp';
import { COPY, rupeeText } from './copy';
import { sampleTicketText } from './sample';
import { parseTicketText, effectiveStatus, CLASS_CODES, QUOTAS } from '../../../utils/engines/ticketParser';
import { applyEdits, buildJourneyCard, calendarEvents } from '../../../utils/engines/journeyCard';
import { istWallNow } from '../../../utils/engines/ticketChanges';
import { buildIcsCalendar, buildGoogleCalendarUrl, downloadIcs } from '../../../utils/reminders';
import { fromStored } from '../../../utils/storedTicket';
import { getJourney, saveTicketJourney } from '../../../utils/savedJourneys';
import { consumeShared, sharedPayload, shareWasLost } from '../../../utils/shared';

// Remembers which language the reader was last used in, so a share — which
// always lands on the English address — continues in Hindi for Hindi readers.
const LANG_KEY = 'railmonk.readerLang';

const controlCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink ' +
  'shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30 ' +
  'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
const labelCls = 'mb-1.5 block text-sm font-medium text-ink-soft dark:text-slate-300';
const headCls = 'font-display text-base font-bold text-ink dark:text-white';
const smallCls = 'text-xs leading-relaxed text-ink-muted dark:text-slate-400';
const linkCls = 'font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300';
const primaryBtn =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white ' +
  'shadow-lift transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-60';
const secondaryBtn =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink ' +
  'transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

const STATUS_TONE = {
  CNF: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/60',
  RAC: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800/60',
  WL: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/60',
  CAN: 'bg-slate-100 text-ink-muted ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
  OTHER: 'bg-slate-100 text-ink-muted ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
};

// Wall-clock IST lives in the UTC fields (see chartPreparation.js), so every
// formatter reads them back with timeZone UTC.
const whenText = (d, intl) =>
  new Intl.DateTimeFormat(intl, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).format(d);
const dateText = (iso, intl) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return '';
  return new Intl.DateTimeFormat(intl, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  );
};

const statusText = (s) => (s ? s.raw : '—');

const trainLabel = (t) => (t.train ? `${t.train.number}${t.train.name ? ` ${t.train.name}` : ''}` : '');

const routeLabel = (t) => (t.from && t.to ? `${t.from.code} → ${t.to.code}` : '');

/** What the rules still need that neither the ticket nor the reader supplied. */
const stillMissing = (t) => ({
  departureDate: !(t.departure && t.departure.date),
  departureTime: !(t.departure && t.departure.time),
  classCode: !t.classCode,
  quotaCode: !t.quota,
  fare: !(t.fare && t.fare.ticket),
});

export default function TicketReader({ locale = 'en' }) {
  const c = COPY[locale] || COPY.en;
  const router = useRouter();
  const fileRef = useRef(null);
  const [sms, setSms] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [edits, setEdits] = useState({});
  const [dragging, setDragging] = useState(false);
  const [now, setNow] = useState(null);

  // "Now" only exists on the client; a static page rendered at build time
  // would otherwise freeze every deadline at the build date.
  useEffect(() => {
    setNow(istWallNow());
    const timer = setInterval(() => setNow(istWallNow()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const readText = useCallback((text) => {
    const parsed = parseTicketText(text);
    if (!parsed) {
      setError('not-ticket');
      return false;
    }
    setError(null);
    setEdits({});
    setTicket(parsed);
    return true;
  }, []);

  const readFile = useCallback(
    async (file) => {
      if (!file) return;
      setBusy(true);
      setError(null);
      try {
        // pdfTicket pulls in pdf.js; import it only when a file arrives.
        const { isPdfFile, readPdfText, TicketPdfError } = await import('../../../utils/pdfTicket');
        if (await isPdfFile(file)) {
          try {
            readText(await readPdfText(file));
          } catch (e) {
            setError(e instanceof TicketPdfError ? e.code : 'damaged');
          }
        } else if ((file.type || '').startsWith('text/') || /\.txt$/i.test(file.name || '')) {
          readText(await file.text());
        } else {
          setError('not-pdf');
        }
      } finally {
        setBusy(false);
      }
    },
    [readText]
  );

  // Arrivals that are not typed: a share from another app, or a saved journey.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromShare = params.has('shared');
    try {
      if (locale === 'en' && fromShare && window.localStorage.getItem(LANG_KEY) === 'hi') {
        router.replace(`/hi/rail/ticket-reader${window.location.search}`);
        return;
      }
      if (!fromShare) window.localStorage.setItem(LANG_KEY, locale);
    } catch (e) {
      // Storage blocked: stay in this language.
    }

    if (shareWasLost()) {
      setError('lost');
      consumeShared();
      return;
    }
    const share = sharedPayload();
    if (share) {
      setBusy(true);
      share.then(async ({ files, text }) => {
        consumeShared();
        setBusy(false);
        if (files.length) await readFile(files[0]);
        else if (text) {
          setSms(text);
          readText(text);
        } else setError('nothing');
      });
      return;
    }
    const savedId = params.get('saved');
    if (savedId) {
      const journey = getJourney(savedId);
      const restored = journey && journey.ticket ? fromStored(journey.ticket) : null;
      if (restored) setTicket(restored);
    }
    // Runs once per arrival; the handlers are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // With the offline worker active, fetch pdf.js while idle so it is cached
  // before the first ticket is read without signal.
  useEffect(() => {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return undefined;
    const warm = () => import('../../../utils/pdfTicket').then((m) => m.warmPdfjs()).catch(() => {});
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm, { timeout: 5000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(warm, 2000);
    return () => clearTimeout(id);
  }, []);

  const resolved = useMemo(() => applyEdits(ticket, edits), [ticket, edits]);
  const card = useMemo(
    () => (resolved ? buildJourneyCard(resolved, { now, originDate: edits.originDate, originTime: edits.originTime }) : null),
    [resolved, now, edits.originDate, edits.originTime]
  );

  const reset = () => {
    setTicket(null);
    setEdits({});
    setError(null);
    setSms('');
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    readFile(e.dataTransfer.files && e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-5">
      {!ticket ? (
        <Card className="p-5">
          <h2 className={headCls}>{c.input.heading}</h2>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'mt-4 flex flex-col items-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition',
              dragging ? 'border-brand-400 bg-brand-50/60 dark:bg-brand-900/20' : 'border-slate-200 dark:border-slate-700'
            )}
          >
            <Upload aria-hidden="true" className="h-8 w-8 text-ink-muted dark:text-slate-500" />
            <p className="mt-3 font-semibold text-ink dark:text-white">{c.input.drop}</p>
            <p className="mt-1 text-sm text-ink-muted dark:text-slate-400">{c.input.or}</p>
            <button type="button" onClick={() => fileRef.current && fileRef.current.click()} className={cn(primaryBtn, 'mt-2')} disabled={busy}>
              <FileText aria-hidden="true" className="h-4 w-4" />
              {c.input.choose}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf,text/plain,.txt"
              className="sr-only"
              aria-label={c.input.choose}
              onChange={(e) => {
                readFile(e.target.files && e.target.files[0]);
                e.target.value = '';
              }}
            />
            <p className={cn(smallCls, 'mt-3 max-w-sm')}>{c.input.dropHint}</p>
          </div>

          <div className="mt-5">
            <label htmlFor="tr-sms" className={labelCls}>
              {c.input.smsLabel}
            </label>
            <textarea
              id="tr-sms"
              rows={4}
              value={sms}
              onChange={(e) => setSms(e.target.value)}
              placeholder={c.input.smsPlaceholder}
              className={cn(controlCls, 'font-mono text-sm')}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => readText(sms)} disabled={!sms.trim() || busy} className={primaryBtn}>
                <ClipboardList aria-hidden="true" className="h-4 w-4" />
                {c.input.readSms}
              </button>
              <button type="button" onClick={() => readText(sampleTicketText())} className="text-sm font-medium text-brand-700 underline underline-offset-2 dark:text-brand-300">
                {c.input.sample}
              </button>
            </div>
          </div>

          <p className="mt-5 flex items-start gap-2 text-sm text-ink-soft dark:text-slate-300">
            <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {c.input.privacy}
          </p>
        </Card>
      ) : null}

      <div aria-live="polite" className="space-y-5">
        {busy ? <Card className="p-5 text-sm text-ink-muted dark:text-slate-400">{c.input.reading}</Card> : null}
        {error ? (
          <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-200">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            {c.errors[error] || c.errors.damaged}
          </div>
        ) : null}

        {resolved && card ? <JourneyCard c={c} ticket={ticket} resolved={resolved} card={card} edits={edits} setEdits={setEdits} now={now} onReset={reset} /> : null}
      </div>

      {!ticket ? <InstallApp t={c.install} variant="card" /> : null}
    </div>
  );
}

// ── The journey card ────────────────────────────────────────────────────────

function JourneyCard({ c, ticket, resolved, card, edits, setEdits, now, onReset }) {
  const intl = c.intl;
  const missing = stillMissing(resolved);
  const anyMissing = Object.values(missing).some(Boolean);
  const t = resolved;

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white dark:border-brand-700">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
              <TrainFront aria-hidden="true" className="h-3.5 w-3.5" />
              {t.pnr ? `${c.card.pnr} ${t.pnr}` : c.card.pnr}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold leading-tight">{trainLabel(t) || '—'}</h2>
            <p className="mt-1 text-base font-semibold text-white/90">
              {t.from && t.to ? `${t.from.name} → ${t.to.name}` : routeLabel(t)}
            </p>
            {card.boardsAwayFromBookedStation && t.boarding ? <p className="text-sm text-white/80">{c.card.boardingAt(t.boarding.name)}</p> : null}
          </div>
          <button type="button" onClick={onReset} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/25">
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            {c.input.another}
          </button>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/70">{c.card.departs}</dt>
            <dd className="font-semibold">{card.departure ? whenText(card.departure, intl) : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/70">{c.card.arrives}</dt>
            <dd className="font-semibold">{card.arrival ? whenText(card.arrival, intl) : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/70">{c.card.classLabel}</dt>
            <dd className="font-semibold">{t.classCode ? c.classes[t.classCode] || t.classCode : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/70">{c.card.quotaLabel}</dt>
            <dd className="font-semibold">
              {t.quota ? c.quotas[t.quota.code] || t.quota.label : c.card.quotaUnknown}
              {t.quota && t.quota.inferred ? <span className="block text-xs font-normal text-white/75">{c.card.inferred}</span> : null}
            </dd>
          </div>
        </dl>
      </Card>

      {ticket.source === 'sms' ? <p className={cn(smallCls, 'px-1')}>{c.card.fromSms}</p> : null}

      <EditPanel c={c} ticket={ticket} resolved={resolved} card={card} edits={edits} setEdits={setEdits} missing={missing} open={anyMissing} />

      <div className="grid gap-5 lg:grid-cols-2">
        <RefundSection c={c} card={card} resolved={resolved} now={now} />
        <div className="space-y-5">
          <PassengerSection c={c} resolved={resolved} />
          <ChartSection c={c} card={card} resolved={resolved} now={now} />
        </div>
      </div>

      <TdrSection c={c} card={card} />

      <ActionsSection c={c} card={card} resolved={resolved} />
    </div>
  );
}

function EditPanel({ c, resolved, card, edits, setEdits, missing, open }) {
  const set = (key) => (e) => setEdits((prev) => ({ ...prev, [key]: e.target.value }));
  const flag = (key) => (missing[key] ? <span className="ml-1 text-xs font-semibold text-amber-700 dark:text-amber-300">· {c.edit.missing}</span> : null);
  const t = resolved;

  return (
    <Card className="p-0">
      <details open={open} className="group">
        <summary className="flex cursor-pointer select-none items-center justify-between gap-2 p-5 font-display text-base font-bold text-ink dark:text-white">
          {open ? c.edit.heading : c.edit.headingOptional}
          <ChevronDown aria-hidden="true" className="h-4 w-4 text-ink-muted transition group-open:rotate-180 dark:text-slate-400" />
        </summary>
        <div className="space-y-4 px-5 pb-5">
          <p className={smallCls}>{c.edit.intro}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="tr-date" className={labelCls}>
                {c.edit.date}
                {flag('departureDate')}
              </label>
              <input id="tr-date" type="date" value={edits.departureDate || (t.departure && t.departure.date) || ''} onChange={set('departureDate')} className={controlCls} />
            </div>
            <div>
              <label htmlFor="tr-time" className={labelCls}>
                {c.edit.time}
                {flag('departureTime')}
              </label>
              <input id="tr-time" type="time" value={edits.departureTime || (t.departure && t.departure.time) || ''} onChange={set('departureTime')} className={controlCls} />
            </div>
            <div>
              <label htmlFor="tr-class" className={labelCls}>
                {c.edit.cls}
                {flag('classCode')}
              </label>
              <select id="tr-class" value={t.classCode || ''} onChange={set('classCode')} className={controlCls}>
                <option value="" disabled>
                  —
                </option>
                {CLASS_CODES.map((code) => (
                  <option key={code} value={code}>
                    {c.classes[code] || code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tr-quota" className={labelCls}>
                {c.edit.quota}
                {flag('quotaCode')}
              </label>
              <select id="tr-quota" value={t.quota ? t.quota.code : ''} onChange={set('quotaCode')} className={controlCls}>
                <option value="" disabled>
                  {c.edit.chooseQuota}
                </option>
                {Object.keys(QUOTAS).map((code) => (
                  <option key={code} value={code}>
                    {c.quotas[code]} ({code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tr-fare" className={labelCls}>
                {c.edit.fare}
                {flag('fare')}
              </label>
              <input
                id="tr-fare"
                type="number"
                inputMode="decimal"
                min="1"
                value={edits.fare !== undefined ? edits.fare : (t.fare && t.fare.ticket) || ''}
                onChange={set('fare')}
                className={controlCls}
              />
              <p className={cn(smallCls, 'mt-1')}>{c.edit.fareHint}</p>
            </div>
          </div>

          <fieldset className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <legend className="px-1 text-sm font-medium text-ink-soft dark:text-slate-300">{c.edit.origin}</legend>
            <p className={smallCls}>{c.edit.originHint}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="tr-odate" className={labelCls}>
                  {c.edit.originDate}
                </label>
                <input
                  id="tr-odate"
                  type="date"
                  value={edits.originDate || ''}
                  placeholder={t.startDate || ''}
                  onChange={set('originDate')}
                  className={controlCls}
                />
              </div>
              <div>
                <label htmlFor="tr-otime" className={labelCls}>
                  {c.edit.originTime}
                </label>
                <input id="tr-otime" type="time" value={edits.originTime || ''} onChange={set('originTime')} className={controlCls} />
              </div>
            </div>
            {card.startedEarlier && !edits.originDate ? (
              <button
                type="button"
                onClick={() => setEdits((prev) => ({ ...prev, originDate: t.startDate }))}
                className="mt-2 text-xs font-medium text-brand-700 underline underline-offset-2 dark:text-brand-300"
              >
                {c.edit.useStart(dateText(t.startDate, c.intl))}
              </button>
            ) : null}
          </fieldset>
        </div>
      </details>
    </Card>
  );
}

function PassengerSection({ c, resolved }) {
  return (
    <Card className="p-5">
      <h3 className={headCls}>{c.card.passengers}</h3>
      <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-700/70">
        {resolved.passengers.map((p) => {
          const s = effectiveStatus(p);
          return (
            <li key={p.serial} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink dark:text-white">
                  {p.name ? `${p.serial}. ${p.name}` : c.card.passenger(p.serial)}
                </p>
                {p.current ? (
                  <p className={smallCls}>
                    {c.card.asBooked}: {statusText(p.booking)}
                  </p>
                ) : null}
              </div>
              <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1', STATUS_TONE[s ? s.kind : 'OTHER'])}>
                {c.status[s ? s.kind : 'OTHER']} · {statusText(s)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className={cn(smallCls, 'mt-3 flex items-start gap-2')}>
        <ShieldAlert aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {c.card.printedNote}
      </p>
    </Card>
  );
}

function RefundSection({ c, card, resolved, now }) {
  const intl = c.intl;
  const fare = resolved.fare && resolved.fare.ticket;
  const only = (type) => card.timeline.length && card.timeline.every((b) => b.parts.every((p) => p.ticketType === type));

  return (
    <Card className="p-5">
      <h3 className={headCls}>{c.refund.heading}</h3>

      {card.departed ? (
        <p className="mt-3 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{c.refund.departed}</p>
      ) : !card.canPrice ? (
        <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-amber-800 dark:text-amber-200">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {c.refund.unpriced[card.unpricedReason]}
        </p>
      ) : card.refundNow ? (
        <>
          <p className={cn('mt-2 font-display text-3xl font-bold', card.refundNow.refund > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-300')}>
            {card.refundNow.refund > 0 ? c.refund.back(card.refundNow.refund) : c.refund.nothing}
          </p>
          <p className="mt-1 text-sm text-ink-muted dark:text-slate-400">{c.refund.deducted(card.refundNow.deduction, fare)}</p>
          {card.nextDrop && !card.allWaitlisted ? (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
              {c.refund.nextDrop(whenText(card.refundNow.ends, intl), c.left(card.refundNow.ends.getTime() - now.getTime()), card.nextDrop.refund)}
            </p>
          ) : null}
        </>
      ) : null}

      {card.canPrice && card.timeline.length > 1 ? (
        <>
          <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">{c.refund.timeline}</h4>
          <ol className="mt-2 space-y-2">
            {card.timeline.map((band) => (
              <li
                key={band.untilHours}
                className={cn(
                  'flex items-start justify-between gap-3 rounded-xl border p-3 text-sm',
                  band.current ? 'border-brand-300 bg-brand-50/70 dark:border-brand-700 dark:bg-brand-900/25' : 'border-slate-200 dark:border-slate-700',
                  band.passed && 'opacity-50'
                )}
              >
                <span className="min-w-0">
                  <span className="block font-medium text-ink dark:text-white">
                    {band.untilHours === 0 ? c.refund.lastBand : c.refund.until(whenText(band.ends, intl))}
                  </span>
                  <span className={smallCls}>
                    {band.parts.map((p) => `${c.refund.types[p.ticketType]}: ${c.refund.rules[p.rule]}`).join(' · ')}
                  </span>
                </span>
                <span className="shrink-0 font-display font-bold text-ink dark:text-white">{rupeeText(band.refund)}</span>
              </li>
            ))}
          </ol>
        </>
      ) : null}

      <ul className={cn(smallCls, 'mt-4 list-disc space-y-1 pl-4')}>
        {only('tatkal-confirmed') ? <li>{c.refund.tatkal}</li> : null}
        {card.allWaitlisted && card.canPrice ? <li>{c.refund.allWl}</li> : null}
        {card.fareSplit ? <li>{c.refund.fareSplit}</li> : null}
        {card.excludedPassengers ? <li>{c.refund.excluded(card.excludedPassengers)}</li> : null}
        {card.boardsAwayFromBookedStation ? <li>{c.refund.booked}</li> : null}
        <li>{c.refund.fees}</li>
        <li>{c.refund.exact}</li>
      </ul>
      <p className="mt-3 text-sm">
        <Link href="/rail/irctc-cancellation-calculator" className={linkCls}>
          {c.refund.rulesLink}
        </Link>
      </p>
    </Card>
  );
}

function ChartSection({ c, card, resolved, now }) {
  if (!card.charts) return null;
  const intl = c.intl;
  const done = (d) => now && now.getTime() >= d.getTime();
  return (
    <Card className="p-5">
      <h3 className={headCls}>{c.chart.heading}</h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">{c.chart.first}</dt>
          <dd className="mt-0.5 font-semibold text-ink dark:text-white">
            {whenText(card.charts.firstChart, intl)}
            {done(card.charts.firstChart) ? <span className="ml-1 text-xs font-normal text-emerald-700 dark:text-emerald-300">· {c.chart.prepared}</span> : null}
          </dd>
          <dd className={smallCls}>{card.charts.rule === 'previous-evening' ? c.chart.ruleEvening : c.chart.ruleTen}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">{c.chart.final}</dt>
          <dd className="mt-0.5 font-semibold text-ink dark:text-white">{whenText(card.charts.finalChart, intl)}</dd>
          <dd className={smallCls}>{c.chart.finalNote}</dd>
        </div>
      </dl>
      <p className={cn(smallCls, 'mt-3')}>
        {card.chartBasis === 'origin' ? c.chart.basisOrigin : card.startedEarlier ? c.chart.startedEarlier(dateText(resolved.startDate, intl)) : c.chart.basisTicket}
      </p>
    </Card>
  );
}

function TdrSection({ c, card }) {
  if (!card.tdr.length) return null;
  const intl = c.intl;
  const deadline = (d) => {
    if (d.basis === 'automatic') return c.tdr.automatic;
    if (d.basis === 'before-actual-departure') return c.tdr.beforeDeparture(whenText(d.at, intl));
    if (d.basis === 'after-arrival') return d.at ? c.tdr.afterArrival(whenText(d.at, intl)) : c.tdr.needsArrival;
    return d.at ? c.tdr.by(whenText(d.at, intl)) : '—';
  };
  return (
    <Card className="p-5">
      <h3 className={headCls}>{c.tdr.heading}</h3>
      <p className={cn(smallCls, 'mt-1')}>{c.tdr.intro}</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {card.tdr.map((d) => (
          <li key={d.scenarioId} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
            <p className="font-semibold text-ink dark:text-white">{c.tdr.labels[d.scenarioId]}</p>
            <p className="mt-1 text-ink-soft dark:text-slate-300">{deadline(d)}</p>
            <p className={cn(smallCls, 'mt-1')}>{c.tdr.refund[d.scenarioId]}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm">
        <Link href="/rail/tdr-refund-checker" className={linkCls}>
          {c.tdr.more}
        </Link>
      </p>
    </Card>
  );
}

function ActionsSection({ c, card, resolved }) {
  const intl = c.intl;
  const events = useMemo(() => calendarEvents(card), [card]);
  const [chosen, setChosen] = useState(() => new Set(['journey', 'chart', 'refund-drop']));
  const [downloaded, setDownloaded] = useState(false);
  const [saved, setSaved] = useState(null); // null | 'ok' | 'failed'

  if (!events.length) return null;

  const info = {
    train: trainLabel(resolved) || c.card.pnr,
    route: routeLabel(resolved),
    pnr: resolved.pnr,
    cls: resolved.classCode,
    berths: resolved.passengers
      .map((p) => effectiveStatus(p))
      .filter((s) => s && s.coach)
      .map((s) => `${s.coach}/${s.berth}`)
      .join(', '),
    chart: card.charts ? whenText(card.charts.firstChart, intl) : '',
  };
  const location = resolved.boarding ? `${resolved.boarding.name} (${resolved.boarding.code})` : '';
  const describe = (e) => {
    const uid = `${resolved.pnr || resolved.train?.number || 'journey'}-${e.id}@railmonk.com`;
    if (e.id === 'journey') return { ...e, uid, title: c.ics.journey(info), description: c.ics.journeyBody(info), location };
    if (e.id === 'chart') return { ...e, uid, title: c.ics.chart(info), description: c.ics.chartBody, url: 'https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html' };
    return { ...e, uid, title: c.ics.drop(info), description: c.ics.dropBody(card.refundNow.refund, card.nextDrop.refund), url: 'https://www.irctc.co.in/' };
  };
  const described = events.map(describe);

  const download = () => {
    const ics = buildIcsCalendar(described.filter((e) => chosen.has(e.id)));
    if (ics && downloadIcs(ics, `railmonk-${resolved.pnr || 'journey'}.ics`)) setDownloaded(true);
  };
  const journeyEvent = described.find((e) => e.id === 'journey');
  const google = journeyEvent ? buildGoogleCalendarUrl(journeyEvent) : null;

  const save = () => {
    const result = saveTicketJourney(resolved, [info.train, info.route].filter(Boolean).join(' · '));
    setSaved(result ? 'ok' : 'failed');
  };

  return (
    <Card className="p-5">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className={headCls}>{c.actions.calendar}</h3>
          <fieldset className="mt-3 space-y-2">
            {described.map((e) => (
              <label key={e.id} className="flex items-center gap-2 text-sm text-ink-soft dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={chosen.has(e.id)}
                  onChange={() =>
                    setChosen((prev) => {
                      const next = new Set(prev);
                      if (next.has(e.id)) next.delete(e.id);
                      else next.add(e.id);
                      return next;
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {c.actions.events[e.id]} — {whenText(new Date(Date.parse(`${e.startWallIst}:00Z`)), intl)}
              </label>
            ))}
          </fieldset>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={download} disabled={!described.some((e) => chosen.has(e.id))} className={primaryBtn}>
              <CalendarPlus aria-hidden="true" className="h-4 w-4" />
              {c.actions.calendar}
            </button>
            {google ? (
              <a href={google} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-700 underline underline-offset-2 dark:text-brand-300">
                {c.actions.google}
              </a>
            ) : null}
          </div>
          <p className={cn(smallCls, 'mt-2')}>{downloaded ? c.actions.downloaded : c.actions.calendarHint}</p>
        </div>

        <div>
          <h3 className={headCls}>{c.actions.save}</h3>
          <p className={cn(smallCls, 'mt-1')}>{c.actions.saveNote}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={save} className={secondaryBtn}>
              {saved === 'ok' ? <Check aria-hidden="true" className="h-4 w-4 text-emerald-600" /> : <Bookmark aria-hidden="true" className="h-4 w-4" />}
              {saved === 'ok' ? c.actions.saved : c.actions.save}
            </button>
            {saved === 'ok' ? (
              <Link href="/rail/saved-journeys" className="text-sm font-medium text-brand-700 underline underline-offset-2 dark:text-brand-300">
                {c.actions.openSaved}
              </Link>
            ) : null}
          </div>
          {saved === 'failed' ? <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{c.errors.storage}</p> : null}
        </div>
      </div>
    </Card>
  );
}
