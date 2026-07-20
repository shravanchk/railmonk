import Head from 'next/head';
import GuidePageLayout, { sectionTitleStyle } from '../../../components/guides/GuidePageLayout';
import Callout from '../../../components/guides/Callout';

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Book a Train Ticket Online in India: First-Timer’s IRCTC Guide',
  description:
    'A step-by-step walkthrough for first-time IRCTC users: creating an account, searching trains, reading availability codes, paying, and travelling on an e-ticket.',
  author: { '@type': 'Organization', name: 'Railmonk Research Team' },
  publisher: { '@type': 'Organization', name: 'Railmonk' },
  datePublished: '2026-07-20',
  dateModified: '2026-07-20',
  mainEntityOfPage: 'https://railmonk.com/rail/guides/how-to-book-train-ticket-online'
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is the SMS/e-ticket enough, or do I need a printout?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The SMS or the e-ticket shown on your phone is valid — no printout needed. What you must carry is the original photo ID of the passenger whose ID was given at booking (Aadhaar, PAN, driving licence, passport, voter ID, or other prescribed IDs).'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I book tickets for family or friends from my IRCTC account?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. A personal IRCTC account can book for family and friends, as long as it is not used commercially (reselling tickets is illegal). The travelling passengers just need to carry their own ID matching the names on the ticket.'
      }
    },
    {
      '@type': 'Question',
      name: 'How many tickets can I book per month on IRCTC?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A standard account can book up to 12 tickets per month; Aadhaar-verified accounts (with all passengers Aadhaar-verified) get up to 24 per month.'
      }
    },
    {
      '@type': 'Question',
      name: 'Money was debited but I got no ticket — what now?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'This is a failed transaction: IRCTC refunds it automatically to the same payment method, typically within 3–7 working days. Check the Failed Transactions section under My Transactions; do not book again without verifying the first attempt truly failed.'
      }
    }
  ]
};

export default function HowToBookTrainTicketGuide() {
  return (
    <GuidePageLayout
      title="How to Book a Train Ticket Online in India: First-Timer's IRCTC Guide"
      description="Step-by-step for first-time IRCTC users: create an account, search trains, read availability codes, pick a berth, pay, and travel on an e-ticket."
      canonicalPath="/rail/guides/how-to-book-train-ticket-online"
      reviewedOn="July 20, 2026"
      reviewer="Travel Review Desk"
      articleSchema={articleSchema}
    >
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>

      <p>
        Booking an Indian train ticket online is straightforward once you have done it once — but the first time, the
        jargon (quotas, availability codes, boarding points) gets in the way. This guide walks the entire journey:
        account creation to sitting in your berth.
      </p>

      <h2 style={sectionTitleStyle}>Step 1 — Create your IRCTC account (free)</h2>
      <ul>
        <li>Go to irctc.co.in or the IRCTC Rail Connect app and choose Register.</li>
        <li>You need a mobile number and an email — both are verified by OTP.</li>
        <li>Pick a username you will remember; recovery is tied to that mobile/email pair.</li>
        <li>
          <strong>Link and verify Aadhaar</strong> in your profile once registered. It doubles your monthly booking
          limit (12 → 24) and is required for Tatkal&apos;s opening window.
        </li>
      </ul>

      <h2 style={sectionTitleStyle}>Step 2 — Search for trains</h2>
      <ul>
        <li>Enter origin and destination — the form accepts city names and station codes (NDLS for New Delhi, CSMT for Mumbai CST, etc.).</li>
        <li>Pick the journey date. Reserved booking opens 60 days in advance — check your exact open date with the <a href="/rail/irctc-calculator">Advance Booking (ARP) Calculator</a>.</li>
        <li>Leave quota as <strong>General</strong> for a normal booking.</li>
        <li>Not sure which class to pick? Read <a href="/rail/guides/train-classes-explained">Train Classes Explained</a> and estimate the price with the <a href="/rail/train-fare-calculator">Train Fare Calculator</a>.</li>
      </ul>

      <h2 style={sectionTitleStyle}>Step 3 — Read the availability display</h2>
      <ul>
        <li><strong>AVAILABLE 24</strong> — 24 berths free; book and you are confirmed.</li>
        <li><strong>RAC 5</strong> — you can travel and share a side-lower berth; often upgraded on board.</li>
        <li><strong>GNWL 12/WL 8</strong> — waitlisted at position 8. Whether it will clear depends on the code, position, and time left — gauge it with <a href="/rail/waitlist-confirmation-chances">Waitlist Confirmation Chances</a>.</li>
        <li>Fare shown is per adult and includes reservation charges; children aged 5–11 travel half-fare (full fare if you opt for a separate berth).</li>
      </ul>

      <h2 style={sectionTitleStyle}>Step 4 — Passenger details and berth preference</h2>
      <ul>
        <li>Names must match a passenger&apos;s photo ID (one ID per booking is enough for the group in most cases, but each traveller carrying their own is safest).</li>
        <li>State age and gender accurately — senior-citizen and lower-berth rules key off them.</li>
        <li>Set a berth preference (lower/upper/side) — it is honored only if that berth is free at allotment. See where any berth number physically sits with the <a href="/rail/berth-position-finder">Berth Position Finder</a>.</li>
        <li>Choose a boarding point if you will board after the origin station (fare is still charged from the selected from-station).</li>
      </ul>

      <h2 style={sectionTitleStyle}>Step 5 — Pay</h2>
      <ul>
        <li>UPI, cards, net banking, and IRCTC eWallet all work; UPI and eWallet clear fastest.</li>
        <li>IRCTC adds a small convenience fee per ticket (charged per PNR, not per passenger). It is not refunded on cancellation.</li>
        <li>After payment you land on the confirmation page and get the ticket by SMS and email within minutes.</li>
      </ul>

      <h2 style={sectionTitleStyle}>Step 6 — Travel day</h2>
      <ul>
        <li>The SMS or the e-ticket in the app is your ticket — <strong>no printout required</strong> — plus original photo ID.</li>
        <li>Find your coach and berth from the chart/SMS. The <a href="/rail/coach-position-finder">Coach Position Finder</a> tells you roughly where the coach halts on the platform.</li>
        <li>Arrive 20–30 minutes early at big stations; platforms can change.</li>
      </ul>

      <h2 style={sectionTitleStyle}>If something goes wrong</h2>
      <ul>
        <li><strong>Payment debited, no ticket:</strong> automatic refund in 3–7 working days; check My Transactions → Failed Transactions before rebooking.</li>
        <li><strong>Plans changed:</strong> cancel online before charting — deductions depend on class and timing; compute them with the <a href="/rail/irctc-cancellation-calculator">Cancellation Refund Calculator</a>.</li>
        <li><strong>Train cancelled / AC failed / ran 3h+ late:</strong> file a TDR — the <a href="/rail/tdr-refund-checker">TDR Refund Checker</a> tells you whether your case qualifies.</li>
      </ul>

      <Callout tone="note">
        <p>
          <strong>In a hurry for tomorrow&apos;s train?</strong> Regular quota may be gone, but Tatkal opens the
          morning before the journey — read the <a href="/rail/guides/tatkal-booking-masterclass">Tatkal Booking
          Masterclass</a> before you try.
        </p>
      </Callout>

      <h2 style={sectionTitleStyle}>Final note</h2>
      <p>
        IRCTC screens and fees change from time to time and rules differ for special trains. This walkthrough is
        educational; the IRCTC site and app are the source of truth for your specific booking.
      </p>
    </GuidePageLayout>
  );
}
