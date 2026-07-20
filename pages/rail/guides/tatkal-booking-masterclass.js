import Head from 'next/head';
import GuidePageLayout, { sectionTitleStyle } from '../../../components/guides/GuidePageLayout';
import Callout from '../../../components/guides/Callout';

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Tatkal Booking Masterclass: Timings, Aadhaar Rules, and a Minute-by-Minute Plan',
  description:
    'How to actually get a Tatkal ticket: exact opening times, the Aadhaar-authentication rule, master list preparation, payment strategy, and refund rules.',
  author: { '@type': 'Organization', name: 'Railmonk Research Team' },
  publisher: { '@type': 'Organization', name: 'Railmonk' },
  datePublished: '2026-07-20',
  dateModified: '2026-07-20',
  mainEntityOfPage: 'https://railmonk.com/rail/guides/tatkal-booking-masterclass'
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What time does Tatkal booking open?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tatkal opens one day before the journey date (counted from the train’s originating station): 10:00 AM for AC classes (2A, 3A, 3E, CC, EC) and 11:00 AM for non-AC classes (SL, 2S).'
      }
    },
    {
      '@type': 'Question',
      name: 'Do I get a refund if I cancel a confirmed Tatkal ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No — cancelling a confirmed Tatkal ticket earns no refund. Exceptions go through TDR: train cancelled, running more than 3 hours late at your boarding station, or similar railway-side failures.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is Aadhaar mandatory for Tatkal booking?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For online Tatkal in the opening window, yes: since July 2025 only Aadhaar-authenticated IRCTC accounts can book during the first 30 minutes, and OTP-based verification applies. Link and verify Aadhaar in your IRCTC profile well before booking day.'
      }
    },
    {
      '@type': 'Question',
      name: 'How many passengers can one Tatkal ticket cover?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A maximum of 4 passengers per PNR under the Tatkal quota. Book two tickets in parallel from two accounts if your group is larger — but each person can only book one Tatkal ticket per train per day.'
      }
    }
  ]
};

export default function TatkalMasterclassGuide() {
  return (
    <GuidePageLayout
      title="Tatkal Booking Masterclass: A Minute-by-Minute Plan That Works"
      description="Exact Tatkal opening times, the 2025 Aadhaar-authentication rule, master-list preparation, payment strategy, and what refunds you can and cannot get."
      canonicalPath="/rail/guides/tatkal-booking-masterclass"
      reviewedOn="July 20, 2026"
      reviewer="Travel Review Desk"
      articleSchema={articleSchema}
    >
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>

      <p>
        Tatkal seats on popular trains are gone in the first two to three minutes. The people who get them are not
        faster typists — they simply have nothing left to type when the window opens. This guide is the full
        preparation system: rules first, then a minute-by-minute plan.
      </p>

      <h2 style={sectionTitleStyle}>The rules you must know</h2>
      <ul>
        <li><strong>Opening:</strong> one day before the journey (dated from the train&apos;s <em>originating</em> station) — 10:00 AM for AC classes, 11:00 AM for non-AC.</li>
        <li><strong>Aadhaar:</strong> since July 2025, only Aadhaar-authenticated IRCTC accounts can book online Tatkal in the first 30 minutes, with OTP verification. Authorised agents are blocked 10:00–10:30 and 11:00–11:30.</li>
        <li><strong>Limit:</strong> maximum 4 passengers per Tatkal PNR.</li>
        <li><strong>Charges:</strong> roughly 10% of the basic fare extra for second class and 30% for other classes, within minimum/maximum caps — compute yours with the <a href="/rail/tatkal-charges-calculator">Tatkal Charges Calculator</a>.</li>
        <li><strong>Refunds:</strong> confirmed Tatkal tickets earn <strong>no refund</strong> on cancellation. TQWL tickets that never confirm are auto-refunded after charting.</li>
        <li><strong>No concessions:</strong> senior-citizen and other concessions do not apply in Tatkal.</li>
      </ul>

      <h2 style={sectionTitleStyle}>The day before booking day</h2>
      <ul>
        <li><strong>Verify Aadhaar linkage</strong> in your IRCTC profile — do not discover the requirement at 09:59.</li>
        <li>
          <strong>Fill your Master List</strong> (My Profile → Master List, up to 20 saved passengers). On booking day
          you select passengers in two clicks instead of typing names, ages, and IDs.
        </li>
        <li><strong>Decide train + one backup</strong> (different train, class, or nearby boarding point). Switching targets mid-window costs the seat.</li>
        <li><strong>Pick the fastest payment path:</strong> IRCTC eWallet or UPI are typically quickest. Load the eWallet in advance, and keep UPI as fallback.</li>
        <li>Confirm the class opening time you actually need — AC at 10:00, non-AC at 11:00. Book SL at 11:00 as your backup even if you got 3A at 10:00; cancel whichever you drop (mind the no-refund rule on confirmed Tatkal).</li>
      </ul>

      <h2 style={sectionTitleStyle}>Minute-by-minute on booking day</h2>
      <Callout>
        <ul>
          <li><strong>T−15 min:</strong> log in on a stable connection. One tab, one device as primary; a second device ready but idle.</li>
          <li><strong>T−10 min:</strong> open the journey search with date and stations pre-filled; do not hit search yet.</li>
          <li><strong>T−2 min:</strong> re-check the login session has not expired.</li>
          <li><strong>T 0:</strong> search, pick the train/class, select quota <strong>Tatkal</strong>, add passengers from the Master List, skip optional fields.</li>
          <li><strong>Payment:</strong> take the first working option — eWallet/UPI. Approve the UPI request the second it arrives.</li>
          <li><strong>If it fails:</strong> switch immediately to the backup train or class. Retrying a sold-out train wastes the only minutes that matter.</li>
        </ul>
      </Callout>

      <h2 style={sectionTitleStyle}>If you end up on TQWL</h2>
      <p>
        Tatkal Waitlist is the weakest waitlist — there is no RAC stage and few cancellations flow back into the
        quota. Treat TQWL as a maybe, keep your backup alive, and check your realistic odds with the{' '}
        <a href="/rail/waitlist-confirmation-chances">Waitlist Confirmation Chances</a> tool. If it never confirms,
        the ticket auto-cancels at charting with a refund (minus the convenience fee).
      </p>

      <h2 style={sectionTitleStyle}>Premium Tatkal: when to pay up</h2>
      <p>
        Some trains carry a separate Premium Tatkal quota with dynamic pricing — fares climb as seats sell, often
        1.5–2x the normal Tatkal fare. It makes sense when the journey is non-negotiable and regular Tatkal has
        already sold out or gone to waitlist; it books through the same flow with quota <strong>Premium Tatkal</strong>.
        Note: no refund at all on Premium Tatkal cancellations.
      </p>

      <h2 style={sectionTitleStyle}>Common failure modes</h2>
      <ul>
        <li>Typing passenger details live instead of using the Master List — this alone loses most races.</li>
        <li>Session expiry at open time because you logged in an hour early and idled.</li>
        <li>Card payments with OTP delays — a 40-second OTP is a lost seat; prefer eWallet/UPI.</li>
        <li>Assuming the Tatkal date from your boarding station instead of the train&apos;s origin date.</li>
        <li>Booking 5+ passengers on one PNR — the form rejects it at the last step.</li>
      </ul>

      <h2 style={sectionTitleStyle}>Use the tools together</h2>
      <Callout>
        <ol>
          <li>Confirm the exact Tatkal open time for your class with the <a href="/rail/irctc-calculator">ARP &amp; Tatkal Calculator</a>.</li>
          <li>Know the surcharge in advance via the <a href="/rail/tatkal-charges-calculator">Tatkal Charges Calculator</a>.</li>
          <li>Ended up waitlisted? Check odds on <a href="/rail/waitlist-confirmation-chances">Waitlist Confirmation Chances</a> and read the <a href="/rail/guides/waitlist-rac-guide">Waitlist &amp; RAC guide</a>.</li>
        </ol>
      </Callout>

      <h2 style={sectionTitleStyle}>Final note</h2>
      <p>
        Tatkal rules — timings, Aadhaar requirements, and charges — are revised by Indian Railways periodically.
        Verify current rules on IRCTC before an important booking; this guide is educational.
      </p>
    </GuidePageLayout>
  );
}
