import React, { useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Info } from 'lucide-react';
import { CalcLayout, ResultStat } from '../calculator/CalcLayout';
import EEATPanel from '../calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import Card from '../ui/Card';
import Breadcrumbs from '../ui/Breadcrumbs';
import RelatedContent from './RelatedContent';
import NextStep from './NextStep';
import ReminderPlanner from './ReminderPlanner';
import UpdatedStamp from './UpdatedStamp';
import useToday from './useToday';
import { buildFaqSchema } from '../../utils/faqSchema';
import { getTool } from '../../utils/catalog';
import { getFestival, festivalPlan, upcomingFestivals } from '../../utils/festivals';
import { formatLong, formatDate, formatShort, formatDayMonth, statusLabel, toneCls } from './festivalFormat';
import { cn } from '../ui/cn';

const HUB_HREF = '/rail/festival-booking-dates';

const Badge = ({ row }) => {
  const { text, tone } = statusLabel(row);
  if (!text) return <span className="text-xs text-ink-muted">—</span>;
  return (
    <span className={cn('inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', toneCls[tone])}>
      {text}
    </span>
  );
};

/**
 * The booking calendar for one direction of travel: each journey date, the
 * moment its general window opens, the two Tatkal moments, and where that
 * stands today.
 */
const WindowTable = ({ heading, intro, rows }) => (
  <Card className="overflow-hidden">
    <div className="border-b border-slate-200/70 px-5 py-4 dark:border-slate-700/70">
      <h2 className="font-display text-lg font-bold text-ink dark:text-white">{heading}</h2>
      <p className="mt-1 text-sm text-ink-muted dark:text-slate-400">{intro}</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-ink-muted dark:bg-slate-800/80 dark:text-slate-400">
          <tr>
            <th scope="col" className="px-5 py-2.5 font-semibold">Journey date</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">General booking opens</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">Tatkal AC · 10:00</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">Tatkal SL · 11:00</th>
            <th scope="col" className="px-5 py-2.5 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700/70">
          {rows.map((row) => (
            <tr key={row.journeyDate} className={row.label ? 'bg-brand-50/40 dark:bg-brand-900/10' : undefined}>
              <td className="px-5 py-2.5">
                <time dateTime={row.journeyDate} className="font-semibold text-ink dark:text-white">{formatShort(row.journeyDate)}</time>
                {row.label ? <span className="ml-2 text-xs text-brand-700 dark:text-brand-300">{row.label}</span> : null}
              </td>
              <td className="px-3 py-2.5 text-ink dark:text-slate-100">
                <time dateTime={row.general.opensDate}>{formatShort(row.general.opensDate)}</time>
                <span className="text-ink-muted dark:text-slate-400"> · 08:00</span>
              </td>
              <td className="px-3 py-2.5 text-ink-soft dark:text-slate-300">{formatDayMonth(row.tatkalAc.opensDate)}</td>
              <td className="px-3 py-2.5 text-ink-soft dark:text-slate-300">{formatDayMonth(row.tatkalNonAc.opensDate)}</td>
              <td className="px-5 py-2.5"><Badge row={row} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

const phaseCopy = (plan) => {
  const { festival, occurrence, phase, outbound, inbound } = plan;
  const name = festival.shortName;
  const year = occurrence.year;
  if (phase === 'before') {
    const first = outbound[0];
    const n = first.general.daysUntilOpen;
    return {
      tone: 'soon',
      title: `Booking for ${name} ${year} has not opened yet`,
      body: `The first ${name} journey date (${formatDate(first.journeyDate)}) opens for reservation on ${formatLong(first.general.opensDate)} at 08:00 IST — ${n === 1 ? 'tomorrow' : `${n} days from now`}. Set a reminder below so you are logged in when it does.`,
    };
  }
  if (phase === 'opening') {
    const next = [...outbound, ...inbound].find((r) => r.status === 'open-today' || r.status === 'upcoming');
    const opensToday = next?.status === 'open-today';
    return {
      tone: opensToday ? 'today' : 'open',
      title: `${name} ${year} booking windows are opening now`,
      body: next
        ? opensToday
          ? `Travel on ${formatDate(next.journeyDate)} opens today at 08:00 IST. Earlier dates are already open — check the tables below for yours.`
          : `The next date to open is ${formatDate(next.journeyDate)}, on ${formatLong(next.general.opensDate)} at 08:00 IST. Earlier dates are already open.`
        : 'Check the tables below for your date.',
    };
  }
  if (phase === 'open') {
    return {
      tone: 'open',
      title: `Every ${name} ${year} date is open for booking`,
      body: `General reservation for the whole ${name} rush has opened. If your train shows a waitlist, the question is now whether it will clear — and whether Tatkal, one day before travel, is the better bet.`,
    };
  }
  return null;
};

const FestivalBookingPage = ({ slug }) => {
  const festival = getFestival(slug);
  const today = useToday();
  const plan = useMemo(() => (festival ? festivalPlan(festival, today) : null), [festival, today]);
  const others = useMemo(() => upcomingFestivals(today).filter((p) => p.festival.slug !== slug).slice(0, 6), [today, slug]);

  if (!festival || !plan) return null;

  const { occurrence, peak, main, outbound, inbound } = plan;
  const year = occurrence.year;
  const name = festival.name;
  const href = `${HUB_HREF}/${slug}`;
  const canonical = `https://railmonk.com${href}`;
  const pageTitle = `${name} ${year} Train Ticket Booking Date — When IRCTC Booking Opens | Railmonk`;
  const description = `${festival.shortName} ${year} is on ${formatDate(main.journeyDate)}. IRCTC general booking for travel on ${formatDayMonth(peak.journeyDate)} opens ${formatDate(peak.general.opensDate)} at 08:00 IST; Tatkal opens the day before travel. Every outbound and return date listed.`;

  const banner = phaseCopy(plan);

  // The reminder defaults to the first outbound date still to open; failing
  // that, the peak day, where the planner itself will say booking is open.
  const reminderDate = today
    ? ([...outbound, ...inbound].find((r) => r.status === 'upcoming' || r.status === 'open-today') || peak).journeyDate
    : peak.journeyDate;

  const faqItems = [
    {
      question: `When does IRCTC booking open for ${festival.shortName} ${year}?`,
      answer: `${festival.shortName} ${year} falls on ${formatLong(main.journeyDate)}. Under the 60-day Advance Reservation Period, general booking for travel on that day opens on ${formatLong(main.general.opensDate)} at 08:00 IST. For the busiest outbound day, ${formatDate(peak.journeyDate)}, booking opens on ${formatDate(peak.general.opensDate)}. Each journey date opens on its own day, 60 days ahead, so the tables above list every date in the rush.`,
    },
    {
      question: `What time does ${festival.shortName} ticket booking start on IRCTC?`,
      answer: 'General-quota reservation opens at 08:00 IST on the day the 60-day window reaches your journey date. Tatkal is separate: it opens at 10:00 IST for AC classes and 11:00 IST for Sleeper and other non-AC classes, one day before the journey. Only Aadhaar-authenticated IRCTC accounts can book Tatkal online.',
    },
    {
      question: `What is the Tatkal booking date for ${festival.shortName} ${year} travel?`,
      answer: `Tatkal opens one day before each journey date. For travel on ${formatDate(peak.journeyDate)}, that is ${formatDate(peak.tatkalAc.opensDate)} — 10:00 IST for AC classes and 11:00 IST for Sleeper. The Tatkal quota is small and festival demand is extreme, so treat it as a backup to a general booking made on the day the window opened, not as the plan.`,
    },
    {
      question: `Booking for my ${festival.shortName} date has already opened. What now?`,
      answer: 'Book immediately even if the train shows a waitlist — a low GNWL number booked early still confirms on most trains, and the queue only gets longer. Then check the confirmation odds for your waitlist code, and note the Tatkal date for the same journey as a fallback one day before travel.',
    },
    {
      question: `Do ${festival.shortName} special trains follow the 60-day rule?`,
      answer: 'Not always. Festival specials are notified separately, often only a few weeks before they run, and their booking opens when the notification says, which can be shorter than 60 days. The dates on this page are for regular trains. Check the IRCTC and zonal railway announcements for specials on your route once the festival is a few weeks away.',
    },
    {
      question: `Is the ${festival.shortName} ${year} date confirmed?`,
      answer: `${plan.confidenceNote} The dates here were checked against Drik Panchang and the mainstream Indian calendars. If your family follows a regional calendar that puts the festival a day earlier or later, use the tables to read off the booking date for that day instead.`,
    },
  ];

  const faqSchema = buildFaqSchema(faqItems);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content={[`${festival.shortName} ${year} train ticket booking date`, `${festival.shortName} ${year} date`, `IRCTC ${festival.shortName} booking`, `${festival.shortName} special train ${year}`, ...festival.aliases.map((a) => `${a} ${year} train booking`)].join(', ')}
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Festival travel"
        title={`${name} ${year}: train ticket booking dates`}
        subtitle={`${festival.shortName} ${year} is on ${formatLong(main.journeyDate)}. Below is the exact day and time IRCTC booking opens for every date in the ${festival.shortName} rush — going and coming back — under the 60-day rule, with the Tatkal dates alongside.`}
      >
        <Breadcrumbs
          className="-mt-3 mb-6"
          items={[
            { name: 'Home', href: '/' },
            { name: 'Festival booking dates', href: HUB_HREF },
            { name: `${festival.shortName} ${year}` },
          ]}
        />

        <div aria-live="polite">
          {banner ? (
            <div className={cn('mb-6 rounded-2xl border p-4 sm:p-5', toneCls[banner.tone].replace(/ring-[^ ]+/g, ''), 'border-current/20')}>
              <p className="font-display text-base font-bold">{banner.title}</p>
              <p className="mt-1 text-sm leading-relaxed opacity-90">{banner.body}</p>
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ResultStat label={`${festival.shortName} ${year}`} value={formatShort(main.journeyDate)} />
          <ResultStat label="Busiest outbound day" value={formatShort(peak.journeyDate)} />
          <ResultStat label="General booking opens for that day" value={`${formatShort(peak.general.opensDate)} · 08:00`} emphasis />
          <ResultStat label="Tatkal for that day" value={`${formatShort(peak.tatkalAc.opensDate)} · 10:00 / 11:00`} />
        </div>

        <p className="mt-3 flex items-start gap-2 text-xs text-ink-muted dark:text-slate-500">
          <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            All times IST. General booking is 60 days ahead excluding the journey day; Tatkal is one day ahead.{' '}
            {plan.confidenceNote}
          </span>
        </p>

        <div className="mt-8 grid gap-6">
          <WindowTable
            heading={`Going for ${festival.shortName}: outbound dates`}
            intro={`From ${formatDate(outbound[0].journeyDate)} to ${formatDate(outbound[outbound.length - 1].journeyDate)}. The named days are the festival itself; the days before them are when most people travel.`}
            rows={outbound}
          />
          <WindowTable
            heading="Coming back: return dates"
            intro={`From ${formatDate(inbound[0].journeyDate)} to ${formatDate(inbound[inbound.length - 1].journeyDate)}. Return tickets open later than outbound ones, and are the ones people forget to book on the day.`}
            rows={inbound}
          />
        </div>

        <div className="mt-8">
          {today ? (
            <ReminderPlanner
              key={reminderDate}
              compact
              defaultJourneyDate={reminderDate}
              heading={`Remind me when ${festival.shortName} booking opens`}
            />
          ) : (
            <Card className="p-5 text-sm text-ink-muted dark:text-slate-400">Loading the reminder…</Card>
          )}
        </div>

        <NextStep
          title="Already booked and holding a waitlist?"
          body="Festival demand cuts cancellations sharply, so waitlists move less than usual. Check the honest odds for your GNWL, RLWL or PQWL number before you decide whether to gamble on Tatkal."
          href="/rail/waitlist-confirmation-chances"
          cta="Check waitlist chances"
          secondary={{ href: '/rail/guides/tatkal-booking-masterclass', label: 'Tatkal booking masterclass' }}
        />

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-ink dark:text-white">{festival.shortName} {year}: the days</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(occurrence.days || []).map((d) => (
                <li key={d.date} className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 dark:border-slate-700/60">
                  <span className="text-ink dark:text-slate-100">{d.label}</span>
                  <time dateTime={d.date} className="shrink-0 font-medium text-ink-soft dark:text-slate-300">{formatShort(d.date)}</time>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{festival.blurb}</p>
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-ink dark:text-white">The routes that sell out first</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{festival.corridors}</p>
            <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-ink dark:text-slate-200">How to be ready at 08:00</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
              <li>Log in to IRCTC five minutes early, with the passenger master list and payment method saved.</li>
              <li>Search the train, not the route: pick the train number in advance and go straight to it.</li>
              <li>Book on the day the window opens even if it shows a waitlist. Confirmed berths on these routes last minutes.</li>
              <li>Book the return the day it opens too — that date is in the second table, and it is the one people miss.</li>
              <li>Keep the Tatkal date as a fallback. It needs an Aadhaar-authenticated account, which cannot be sorted out on the morning.</li>
            </ul>
          </Card>
        </section>

        <section className="mt-10" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-display text-xl font-bold text-ink dark:text-white">Frequently asked questions</h2>
          <div className="mt-4 grid gap-3">
            {faqItems.map((item) => (
              <details key={item.question} className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/70 dark:bg-slate-800/70">
                <summary className="cursor-pointer select-none font-semibold text-ink dark:text-slate-100">{item.question}</summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {others.length ? (
          <section className="mt-10" aria-labelledby="others-heading">
            <h2 id="others-heading" className="flex items-center gap-2 font-display text-xl font-bold text-ink dark:text-white">
              <CalendarDays aria-hidden="true" className="h-5 w-5 text-brand-600 dark:text-brand-300" />
              Other festival rushes coming up
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((p) => (
                <li key={p.festival.slug}>
                  <Link
                    href={`${HUB_HREF}/${p.festival.slug}`}
                    className="group flex h-full flex-col rounded-xl border border-slate-200/70 bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card dark:border-slate-700/70 dark:bg-slate-800/70 dark:hover:border-brand-700"
                  >
                    <span className="font-display font-semibold text-ink dark:text-white">{p.festival.name} {p.occurrence.year}</span>
                    <span className="mt-1 text-sm text-ink-muted dark:text-slate-400">
                      {formatShort(p.occurrence.main)} · booking for {formatDayMonth(p.peak.journeyDate)} opens {formatDayMonth(p.peak.general.opensDate)}
                    </span>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
                      See all dates
                      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              <Link href={HUB_HREF} className="font-semibold text-brand-700 underline underline-offset-2 dark:text-brand-300">
                See the full festival booking calendar
              </Link>
            </p>
          </section>
        ) : null}

        <div className="mt-10">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="September 15, 2026"
            scope="Festival dates are taken from the published panchang and can differ by a day between regional calendars. Booking dates follow the 60-day Advance Reservation Period for regular trains; festival special trains are notified separately with their own windows."
            sources={[
              { label: 'Drik Panchang — Indian festival calendar', url: 'https://www.drikpanchang.com/calendars/indian/indiancalendar.html' },
              { label: 'IRCTC Official Portal', url: 'https://www.irctc.co.in/' },
              { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' },
            ]}
          />
        </div>

        <UpdatedStamp updated={getTool(HUB_HREF)?.updated} href="/rail/irctc-calculator" />
        <div className="mt-10">
          <RelatedContent href={HUB_HREF} kind="tool" />
        </div>
      </CalcLayout>
    </>
  );
};

export default FestivalBookingPage;
