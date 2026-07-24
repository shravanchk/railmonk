import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CalendarClock, ShieldCheck, Smartphone } from 'lucide-react';
import { CalcLayout } from '../../components/calculator/CalcLayout';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import ReminderPlanner from '../../components/rail/ReminderPlanner';
import RelatedContent from '../../components/rail/RelatedContent';
import NextStep from '../../components/rail/NextStep';
import UpdatedStamp from '../../components/rail/UpdatedStamp';
import Card from '../../components/ui/Card';
import EEATPanel from '../../components/calculator/EEATPanel';
import { editorialProfiles } from '../../utils/editorialProfiles';
import { buildSoftwareApplicationSchema } from '../../utils/schema';
import { buildFaqSchema } from '../../utils/faqSchema';
import { getTool } from '../../utils/catalog';

const HREF = '/rail/booking-reminder';
const URL = `https://railmonk.com${HREF}`;

const FAQS = [
  {
    question: 'How does a Railmonk reminder reach me?',
    answer:
      'It becomes an event in your own calendar. You pick the journey date, we calculate the exact moment that booking window opens, and you add the event to Google Calendar, Outlook, or any calendar app via a downloaded .ics file. Your phone then alerts you at the lead time you chose. Railmonk is not involved once the event is in your calendar.',
  },
  {
    question: 'Do I need to give an email address or phone number?',
    answer:
      'No. There is no sign-up, no email field and no account. The calendar file is generated in your browser, so no personal detail is ever sent to Railmonk — which also means there is no list you could later need to unsubscribe from.',
  },
  {
    question: 'Are WhatsApp or email reminders available?',
    answer:
      'Not at present. Sending messages would mean Railmonk holding your contact details and running a scheduler, and we would rather ship something that works today without collecting anything. A calendar alert does the same job more reliably, since it fires from your own device even without a network connection.',
  },
  {
    question: 'When exactly does the booking window open?',
    answer:
      'General-quota booking opens at 08:00 IST on the day 60 days before your journey, excluding the journey date itself. Tatkal opens one day before the journey — 10:00 IST for AC classes and 11:00 IST for Sleeper and other non-AC classes. The Foreign Tourist quota keeps a 365-day window.',
  },
  {
    question: 'Will the reminder still work if the rules change?',
    answer:
      'The event carries the date and time that were correct when you created it. If Indian Railways changes the advance reservation period or a Tatkal timing after that, the saved event will not update itself — so for journeys far out, it is worth re-checking here closer to the date. Rule changes we track are listed on our rule updates page.',
  },
  {
    question: 'Does a reminder improve my chance of a confirmed ticket?',
    answer:
      'Only indirectly, and that is the honest answer. It gets you to the booking page at the right minute, which matters a great deal on popular routes where berths go in the first minutes. It cannot affect quota size or availability.',
  },
];

const softwareSchema = buildSoftwareApplicationSchema({
  name: 'IRCTC Booking & Tatkal Reminder',
  url: URL,
  description:
    'Calculate the exact moment your IRCTC booking or Tatkal window opens and add it to your calendar with an alert. No sign-up and no personal data.',
  applicationCategory: 'TravelApplication',
  featureList: [
    'Booking-window date and time calculator',
    'Calendar reminder with configurable alert',
    'Google Calendar, Outlook and .ics export',
    'Tatkal AC and non-AC window timings',
  ],
});

const STEPS = [
  {
    Icon: CalendarClock,
    title: 'We do the date arithmetic',
    body: 'The 60-day window excludes the journey day, and Tatkal runs on a different clock entirely. Both are easy to get wrong by a day.',
  },
  {
    Icon: Smartphone,
    title: 'Your calendar does the nagging',
    body: 'The event lands in the calendar you already check, and alerts you a day, an hour, or fifteen minutes before the window opens.',
  },
  {
    Icon: ShieldCheck,
    title: 'Nothing is collected',
    body: 'The file is built in your browser. There is no list, no account, and nothing to unsubscribe from later.',
  },
];

export default function BookingReminderPage() {
  const router = useRouter();
  const prefillDate = typeof router.query.date === 'string' ? router.query.date : '';

  const tool = getTool(HREF);

  return (
    <>
      <Head>
        <title>IRCTC Booking & Tatkal Reminder — Free Alerts | Railmonk</title>
        <meta
          name="description"
          content="Free reminder for the exact moment your IRCTC booking or Tatkal window opens. Adds to Google Calendar, Outlook or any calendar app — no sign-up needed."
        />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content="IRCTC Booking & Tatkal Reminder | Railmonk" />
        <meta property="og:description" content="Calculate when your booking window opens and put it in your calendar with an alert. No sign-up required." />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="IRCTC Booking & Tatkal Reminder | Railmonk" />
        <meta name="twitter:description" content="Never miss the minute your booking window opens." />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(FAQS)) }} />
      </Head>

      <CalcLayout
        eyebrow="Booking"
        title="IRCTC booking & Tatkal reminders"
        subtitle="Work out the exact minute your booking window opens, then put it in your own calendar with an alert — no sign-up, no email address, nothing stored."
      >
        <Breadcrumbs
          className="-mt-4 mb-6"
          items={[{ name: 'Home', href: '/' }, { name: 'Rail tools', href: '/#tools' }, { name: 'Booking & Tatkal reminders' }]}
        />

        {/* Arriving from the booking calculator carries ?date=, so the journey
            does not have to be typed twice. This is a static export: the query
            string only exists after the router hydrates, and ReminderPlanner
            seeds its state once from these props — so the key remounts it when
            the date turns up rather than leaving the field stale. */}
        <ReminderPlanner
          key={prefillDate || 'blank'}
          defaultJourneyDate={prefillDate}
          heading="Set your reminder"
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ Icon, title, body }) => (
            <Card key={title} className="p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-slate-700/70 dark:text-brand-300">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-display text-base font-bold text-ink dark:text-white">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted dark:text-slate-400">{body}</p>
            </Card>
          ))}
        </div>

        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">Which window are you waiting for?</h2>
          <p className="mt-3">
            Three different clocks govern Indian Railways booking, and mixing them up is the most common way people
            miss a window. General-quota reservations open at <strong className="text-ink dark:text-white">08:00 IST</strong>{' '}
            on the day exactly 60 days before travel, counting back from — but not including — the journey date.
            Tatkal is not part of that window at all: it opens the day before the journey, at{' '}
            <strong className="text-ink dark:text-white">10:00 IST for AC classes</strong> and{' '}
            <strong className="text-ink dark:text-white">11:00 IST for Sleeper and other non-AC classes</strong>. The
            Foreign Tourist quota is the outlier that kept its 365-day window when the general period was halved in
            November 2024.
          </p>
          <p className="mt-4">
            The practical consequence is that a family trip in the autumn needs a reminder set roughly two months
            out, while a Tatkal attempt needs one the previous morning — and if your class is flexible, the 10:00
            and 11:00 openings are two separate chances at the same journey.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">
            Why a calendar event rather than a message
          </h3>
          <p className="mt-3">
            Sites that send booking alerts by WhatsApp or email have to hold your contact details and run a server
            that fires on schedule. We would rather not hold anything. A calendar event is better on the merits
            anyway: it fires from your own device whether or not you have signal, it survives a change of phone
            along with the rest of your calendar, and it appears in the app you already glance at each morning. The
            trade-off is that you add it yourself, once — about two taps.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">
            What to have ready before the window opens
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-ink dark:text-white">An Aadhaar-authenticated IRCTC account</strong>{' '}if you
              intend to book Tatkal — since July 2025 that is mandatory, and it is not something you can complete in
              the minute the window opens.
            </li>
            <li>
              <strong className="text-ink dark:text-white">Every traveller in your master passenger list.</strong>{' '}
              Typing names and ages during the rush is where most bookings are lost.
            </li>
            <li>
              <strong className="text-ink dark:text-white">One fast payment method, already set up.</strong>{' '}A
              payment that fails at 10:02 usually means starting again against a much emptier quota.
            </li>
            <li>
              <strong className="text-ink dark:text-white">A logged-in session a few minutes early.</strong>{' '}Signing
              in at exactly 10:00 puts you behind everyone who signed in at 09:58.
            </li>
          </ul>
        </div>

        <NextStep
          title="Not sure which date your window opens?"
          body="The booking date calculator works out the opening date for any journey date and quota, with the full advance-reservation rules alongside."
          href="/rail/irctc-calculator"
          cta="Open the booking date calculator"
          secondary={{ href: '/rail/guides/tatkal-booking-masterclass', label: 'Read the Tatkal masterclass' }}
        />

        <section className="mt-12" aria-labelledby="reminder-faq">
          <h2 id="reminder-faq" className="font-display text-xl font-bold text-ink dark:text-white">
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
            scope="Booking-window timings follow published IRCTC and Railway Board rules. Reminders are calendar events generated in your browser; Railmonk neither sends nor stores them."
            sources={[
              { label: 'Railway Board Commercial Circular No. 10 of 2024 (ARP)', url: 'https://contents.irctc.co.in/en/ARP_Change_to_60_days.pdf' },
              { label: 'IRCTC Official Portal', url: 'https://www.irctc.co.in/' },
              { label: 'Indian Railways', url: 'https://indianrailways.gov.in/' },
            ]}
          />
        </div>

        <UpdatedStamp updated={tool?.updated} href={HREF} />

        <RelatedContent href={HREF} kind="tool" />
      </CalcLayout>
    </>
  );
}
