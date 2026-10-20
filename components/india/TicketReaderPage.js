import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { CalcLayout } from '../calculator/CalcLayout';
import Breadcrumbs from '../ui/Breadcrumbs';
import RelatedContent from '../rail/RelatedContent';
import UpdatedStamp from '../rail/UpdatedStamp';
import EEATPanel from '../calculator/EEATPanel';
import HowToSection from '../calculator/HowToSection';
import LocaleHead from '../i18n/LocaleHead';
import TicketReader from '../rail/ticketReader/TicketReader';
import { editorialProfiles } from '../../utils/editorialProfiles';
import { buildSoftwareApplicationSchema } from '../../utils/schema';
import { buildFaqSchema } from '../../utils/faqSchema';
import { getTool } from '../../utils/catalog';

const HREF = '/rail/ticket-reader';
const URL = `https://railmonk.com${HREF}`;
const linkCls = 'font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300';

export const TICKET_READER_SOURCES = [
  { label: 'IRCTC E-Ticket Cancellation & Refund Rules', url: 'https://contents.irctc.co.in/en/eticketCancel.html' },
  { label: 'IRCTC Official Portal', url: 'https://www.irctc.co.in/' },
  { label: 'Railway Enquiry (PNR status)', url: 'https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html' },
  { label: 'Mozilla pdf.js (reads the PDF on your device)', url: 'https://mozilla.github.io/pdf.js/' },
];

const FAQS = [
  {
    question: 'Is my ticket uploaded anywhere?',
    answer:
      'No. The PDF is opened by pdf.js inside your browser and the SMS is read by the same page; neither is sent to Railmonk or anyone else. When you share a ticket into the installed app, the share is answered by Railmonk’s service worker on your phone, not by a server. After one visit the reader works without signal too.',
  },
  {
    question: 'Can it show my current PNR status?',
    answer:
      'No. There is no clean, official way for a site like this to read live PNR status, so Railmonk does not try. The statuses on the card are the ones printed on your ticket at the time it was issued. For the latest, check PNR status on IRCTC or NTES — the chart time on the card tells you when it is worth checking.',
  },
  {
    question: 'How is the refund worked out?',
    answer:
      'With the same engine as the cancellation calculator, under the refund rules in force since 1 April 2026. A confirmed ticket pays a flat charge per passenger until 72 hours before departure, 25% of the fare until 24 hours, 50% until 8 hours, and gets nothing back after that. RAC and waitlisted passengers pay only clerkage until 30 minutes before departure. A confirmed Tatkal ticket gets no refund at all. The card shows the amount now and at every cut-off still ahead.',
  },
  {
    question: 'Why does it ask for the quota when I paste an SMS?',
    answer:
      'The booking SMS does not say whether the ticket is Tatkal, and a confirmed Tatkal ticket is refunded nothing while a general one gets most of its fare back. Guessing would make the refund figure wrong in the worst possible way, so the reader asks. A Tatkal waitlist number (TQWL) is the one thing in an SMS that proves the quota, and it is used when present.',
  },
  {
    question: 'When will my chart be prepared?',
    answer:
      'The first chart is prepared 10 hours before departure, or by 8 PM the evening before for trains leaving between 5 AM and 2 PM. The final chart is about 30 minutes before departure. Both count from the train’s departure at its originating station — if you board mid-route, enter that departure on the card for exact times.',
  },
  {
    question: 'How do I share a ticket into Railmonk from WhatsApp or Gmail?',
    answer:
      'Install Railmonk from this page (Chrome or Edge on Android shows an Install button). It then appears in your phone’s share menu: open the e-ticket PDF or the IRCTC SMS, tap Share, choose Railmonk, and the ticket opens here. iPhone does not let web apps receive shares, so there you pick the PDF or paste the SMS on this page.',
  },
];

const softwareSchema = buildSoftwareApplicationSchema({
  name: 'Railmonk Ticket Reader',
  url: URL,
  description:
    'Reads an IRCTC e-ticket PDF or booking SMS on your device and shows the refund if cancelled now and at every cut-off, chart preparation time, TDR deadlines and calendar reminders. Nothing is uploaded.',
  applicationCategory: 'TravelApplication',
  featureList: [
    'Reads the IRCTC ERS PDF and booking SMS on the device',
    'Refund if cancelled now, and at each cut-off',
    'Chart preparation time',
    'TDR deadlines for the ticket',
    'Calendar reminders (.ics)',
    'Share target for the installed app',
  ],
});

export default function TicketReaderPage() {
  const tool = getTool(HREF);
  return (
    <>
      <Head>
        <title>IRCTC Ticket Reader — Refund, Chart Time & TDR From Your E-Ticket | Railmonk</title>
        <meta
          name="description"
          content="Drop in your IRCTC e-ticket PDF or paste the booking SMS: see the refund if you cancel now and at each cut-off, your chart time, TDR deadlines and calendar reminders. Read on your device — nothing is uploaded."
        />
        <link rel="canonical" href={URL} />
        <meta property="og:title" content="IRCTC Ticket Reader | Railmonk" />
        <meta property="og:description" content="Your e-ticket or SMS, read on your phone: refund now and at each cut-off, chart time, TDR deadlines." />
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="IRCTC Ticket Reader | Railmonk" />
        <meta name="twitter:description" content="Read your train ticket on your phone. Nothing is uploaded." />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(FAQS)) }} />
      </Head>
      <LocaleHead path={HREF} />

      <CalcLayout
        eyebrow="Cancellation & refunds"
        title="Ticket Reader"
        subtitle="Drop in your IRCTC e-ticket or paste the booking SMS. You get one card: what you get back if you cancel now and at each cut-off, when the chart is prepared, your TDR deadlines, and reminders for your calendar. It is all read on your device."
      >
        <Breadcrumbs className="-mt-4 mb-6" items={[{ name: 'Home', href: '/' }, { name: 'Rail tools', href: '/#tools' }, { name: 'Ticket reader' }]} />

        <TicketReader locale="en" />

        <HowToSection
          name="How to read your IRCTC ticket with Railmonk"
          description="Turn an e-ticket PDF or booking SMS into refund, chart and TDR deadlines."
          steps={[
            { name: 'Open the ticket', text: 'Drop the ERS PDF from your IRCTC email or app, choose it with the button, or paste the booking SMS.' },
            { name: 'Check what was read', text: 'The card shows the train, route, class, quota and each passenger’s status. Fill in anything marked as not found — an SMS never says whether it is Tatkal.' },
            { name: 'Read the refund', text: 'See what comes back if you cancel now, and the time at which that amount next drops.' },
            { name: 'Note the chart and TDR times', text: 'The chart time is when to check your final status; the TDR windows are what to do if the railway lets you down.' },
            { name: 'Add reminders or save it', text: 'Download one calendar file for the journey, the chart and the next refund cut-off, or save the journey on this device.' },
          ]}
        />

        <div className="mt-12 max-w-3xl text-[0.95rem] leading-relaxed text-ink-soft dark:text-slate-300">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white">Everything on your ticket that has a deadline</h2>
          <p className="mt-3">
            An IRCTC ticket carries three clocks that are never shown together: the refund, which steps down at 72, 24 and 8
            hours before departure (30 minutes for RAC and waitlist); the reservation chart, which settles your berth; and the
            TDR windows that matter only if something goes wrong. The reader works all three out from the ticket itself, with
            the same engines as the{' '}
            <Link href="/rail/irctc-cancellation-calculator" className={linkCls}>cancellation calculator</Link>, the{' '}
            <Link href="/rail/chart-preparation-time" className={linkCls}>chart time calculator</Link> and the{' '}
            <Link href="/rail/tdr-refund-checker" className={linkCls}>TDR checker</Link>, so the numbers agree everywhere on the site.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">Read on your phone, not on our server</h3>
          <p className="mt-3">
            A ticket has your name, age and PNR on it, so it stays with you. The PDF is opened by pdf.js in your browser, the SMS
            by the same page, and when Railmonk is installed, a ticket shared from WhatsApp, Gmail, Files or Messages is caught by
            the app on your phone before it could reach the network. If you save the journey, it is kept in this browser
            without the passenger names.
          </p>

          <h3 className="mt-8 font-display text-lg font-semibold text-ink dark:text-white">What it will not tell you</h3>
          <p className="mt-3">
            Your live PNR status. The statuses on the card are the ones printed when the ticket was issued, and Railmonk has no
            licensed feed of current ones — so rather than guess, the card tells you when the chart is due and leaves the
            latest status to IRCTC and NTES. For the same reason the refund is what the published rules give: the amount on
            IRCTC’s own cancel screen is final.
          </p>
        </div>

        <section className="mt-12" aria-labelledby="tr-faq">
          <h2 id="tr-faq" className="font-display text-xl font-bold text-ink dark:text-white">Frequently asked questions</h2>
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
            reviewedOn="20 October 2026"
            scope="The reader applies the refund slabs effective 1 April 2026, the December 2025 chart preparation timings and the published TDR filing limits, through the same engines as Railmonk's individual calculators. Statuses are as printed on the ticket; no live data is used."
            sources={TICKET_READER_SOURCES}
          />
        </div>

        <UpdatedStamp updated={tool?.updated} href={HREF} />

        <RelatedContent href={HREF} kind="tool" />
      </CalcLayout>
    </>
  );
}
