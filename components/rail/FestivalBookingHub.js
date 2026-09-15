import React, { useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CalcLayout } from '../calculator/CalcLayout';
import EEATPanel from '../calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import Card from '../ui/Card';
import Breadcrumbs from '../ui/Breadcrumbs';
import RelatedContent from './RelatedContent';
import NextStep from './NextStep';
import UpdatedStamp from './UpdatedStamp';
import useToday from './useToday';
import { buildFaqSchema } from '../../utils/faqSchema';
import { getTool } from '../../utils/catalog';
import { upcomingFestivals } from '../../utils/festivals';
import { formatLong, formatDate, formatShort, formatDayMonth, statusLabel, toneCls } from './festivalFormat';
import { cn } from '../ui/cn';

const HREF = '/rail/festival-booking-dates';
const TITLE = 'Festival Train Ticket Booking Dates 2026–27: When IRCTC Booking Opens | Railmonk';
const DESCRIPTION =
  'The exact day and time IRCTC booking opens for Diwali, Chhath, Durga Puja, Christmas, Pongal, Holi, Eid and every other festival rush — outbound and return dates, under the 60-day rule, with Tatkal dates alongside.';

const FAQ = [
  {
    question: 'How many days before a festival can I book a train ticket?',
    answer: 'Sixty days before the journey date, not counting the journey day itself, for regular trains under the Advance Reservation Period that has applied since 1 November 2024. Reservation opens at 08:00 IST on that day. Each travel date opens on its own day, so a five-day festival rush opens across five consecutive mornings — the pages here list all of them.',
  },
  {
    question: 'What time does festival booking open on IRCTC?',
    answer: 'General-quota reservation opens at 08:00 IST. Tatkal opens one day before travel at 10:00 IST for AC classes and 11:00 IST for Sleeper and other non-AC classes, and online Tatkal needs an Aadhaar-authenticated IRCTC account.',
  },
  {
    question: 'Are festival special trains bookable 60 days ahead?',
    answer: 'Usually not. Special trains are notified separately, often only weeks before they run, and their booking opens when the notification says. The dates on these pages are for regular trains. Keep an eye on IRCTC and the zonal railway announcements for specials on your route once the festival is close.',
  },
  {
    question: 'Which festivals are covered?',
    answer: 'Diwali, Chhath Puja, Durga Puja and Dussehra, Christmas and New Year, Pongal and Makar Sankranti, Holi, Eid ul-Fitr, Ugadi and Gudi Padwa, Raksha Bandhan, Ganesh Chaturthi and Onam, for the current year and the next. Dates are checked against the published panchang and re-checked each year.',
  },
];

const FestivalBookingHub = () => {
  const today = useToday();
  const list = useMemo(() => upcomingFestivals(today), [today]);
  const faqSchema = buildFaqSchema(FAQ);

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta
          name="keywords"
          content="festival train ticket booking date, diwali train ticket booking date, chhath puja train booking, durga puja train ticket, holi train booking date, IRCTC festival booking, when to book diwali ticket, festival special train booking date"
        />
        <link rel="canonical" href={`https://railmonk.com${HREF}`} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={`https://railmonk.com${HREF}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>

      <CalcLayout
        eyebrow="India · Festival travel"
        title="Festival train ticket booking dates"
        subtitle="Every festival rush on Indian Railways, with the exact morning IRCTC booking opens for it. Pick your festival for the full list of outbound and return dates, or read the headline date off this table."
      >
        <Breadcrumbs className="-mt-3 mb-6" items={[{ name: 'Home', href: '/' }, { name: 'Festival booking dates' }]} />

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-ink-muted dark:bg-slate-800/80 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Festival</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Busiest travel day</th>
                  <th scope="col" className="px-3 py-3 font-semibold">General booking opens</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold"><span className="sr-only">All dates</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700/70">
                {list.map((p) => {
                  const badge = statusLabel(p.peak);
                  return (
                    <tr key={p.festival.slug}>
                      <td className="px-5 py-3">
                        <Link href={`${HREF}/${p.festival.slug}`} className="font-semibold text-ink hover:text-brand-700 hover:underline dark:text-white dark:hover:text-brand-300">
                          {p.festival.name} {p.occurrence.year}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-ink dark:text-slate-100">
                        <time dateTime={p.occurrence.main}>{formatShort(p.occurrence.main)}</time>
                      </td>
                      <td className="px-3 py-3 text-ink-soft dark:text-slate-300">{formatShort(p.peak.journeyDate)}</td>
                      <td className="px-3 py-3 text-ink dark:text-slate-100">
                        <time dateTime={p.peak.general.opensDate}>{formatShort(p.peak.general.opensDate)}</time>
                        <span className="text-ink-muted dark:text-slate-400"> · 08:00</span>
                      </td>
                      <td className="px-3 py-3">
                        {badge.text ? (
                          <span className={cn('inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', toneCls[badge.tone])}>
                            {badge.text}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`${HREF}/${p.festival.slug}`} className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand-700 dark:text-brand-300">
                          All dates
                          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="mt-3 text-xs text-ink-muted dark:text-slate-500">
          All times IST. “Busiest travel day” is the outbound date most people travel on; each festival page lists every date in the rush, including the return.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <Card key={p.festival.slug} href={`${HREF}/${p.festival.slug}`} className="flex h-full flex-col p-5">
              <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
                {formatLong(p.occurrence.main)}
              </span>
              <span className="mt-1 font-display text-lg font-bold text-ink dark:text-white">{p.festival.name} {p.occurrence.year}</span>
              <span className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{p.festival.blurb}</span>
              <span className="mt-3 text-sm text-ink-soft dark:text-slate-300">
                Booking for {formatDayMonth(p.peak.journeyDate)} opens <strong className="text-ink dark:text-white">{formatDate(p.peak.general.opensDate)}</strong>
              </span>
            </Card>
          ))}
        </div>

        <NextStep
          title="Travelling on a date that is not a festival?"
          body="The booking date calculator gives the opening day and time for any journey date, and the reminder tool puts it in your calendar with an alert."
          href="/rail/irctc-calculator"
          cta="Open the booking date calculator"
          secondary={{ href: '/rail/booking-reminder', label: 'Set a booking reminder' }}
        />

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-ink dark:text-white">How festival booking dates work</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
              <p>
                Indian Railways opens reservation 60 days before the date of journey, not counting the journey day, at 08:00 IST. There is no
                festival exception: a Diwali ticket opens on the same rule as any other, which is why the date is predictable to the day and why
                the people who get confirmed berths are the ones who were logged in at 08:00 on that morning.
              </p>
              <p>
                Because every travel date opens on its own morning, a festival rush is not one booking date but a run of them. Going home on the
                Friday before Diwali opens two days before going home on the Sunday. The festival pages here list each date separately for that reason,
                and list the return dates too, which open a week or more later and are the ones most often missed.
              </p>
              <p>
                Tatkal is the fallback, not the plan. It opens one day before travel — 10:00 IST for AC, 11:00 for Sleeper — for a small quota, on an
                Aadhaar-authenticated account only, and festival demand exhausts it in seconds.
              </p>
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-ink dark:text-white">About the dates</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft dark:text-slate-300">
              <p>
                Festival dates are taken from the published panchang and cross-checked against the mainstream Indian calendars. Lunar festivals are
                fixed once the year’s calendar is out, though a regional calendar occasionally puts one a day earlier or later. Eid depends on the moon
                sighting the evening before, so its date is the expected one.
              </p>
              <p>
                The travel window on each page runs from three days before the festival’s first day to three days after its last, which covers the
                great majority of festival journeys. If yours falls outside it, the booking date calculator handles any date.
              </p>
            </div>
          </Card>
        </section>

        <section className="mt-10" aria-labelledby="hub-faq">
          <h2 id="hub-faq" className="font-display text-xl font-bold text-ink dark:text-white">Frequently asked questions</h2>
          <div className="mt-4 grid gap-3">
            {FAQ.map((item) => (
              <details key={item.question} className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/70 dark:bg-slate-800/70">
                <summary className="cursor-pointer select-none font-semibold text-ink dark:text-slate-100">{item.question}</summary>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-10">
          <EEATPanel
            author={editorialProfiles.researchTeam}
            reviewer={editorialProfiles.travelReviewDesk}
            reviewedOn="September 15, 2026"
            scope="Festival dates from the published panchang; booking dates from the 60-day Advance Reservation Period for regular trains. Special trains are notified separately."
            sources={[
              { label: 'Drik Panchang — Indian festival calendar', url: 'https://www.drikpanchang.com/calendars/indian/indiancalendar.html' },
              { label: 'IRCTC Official Portal', url: 'https://www.irctc.co.in/' },
              { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' },
            ]}
          />
        </div>

        <UpdatedStamp updated={getTool(HREF)?.updated} href="/rail/irctc-calculator" />
        <div className="mt-10">
          <RelatedContent href={HREF} kind="tool" />
        </div>
      </CalcLayout>
    </>
  );
};

export default FestivalBookingHub;
