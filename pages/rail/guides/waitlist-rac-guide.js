import Head from 'next/head';
import GuidePageLayout, { sectionTitleStyle } from '../../../components/guides/GuidePageLayout';
import Callout from '../../../components/guides/Callout';

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Waitlist & RAC Survival Guide: GNWL, RLWL, PQWL, TQWL Decoded',
  description:
    'What every Indian Railways waitlist code means, how charting works, your rights on an RAC ticket, and what to do at each stage before departure.',
  author: { '@type': 'Organization', name: 'Railmonk Research Team' },
  publisher: { '@type': 'Organization', name: 'Railmonk' },
  datePublished: '2026-07-20',
  dateModified: '2026-07-20',
  mainEntityOfPage: 'https://railmonk.com/rail/guides/waitlist-rac-guide'
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Can I board the train with an RAC ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. RAC (Reservation Against Cancellation) is a confirmed right to travel — you share a side-lower berth with another RAC passenger. If confirmed berths free up from last-minute cancellations or no-shows, the TTE can allot you a full berth on board.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I travel on a waitlisted e-ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. If an IRCTC e-ticket is still fully waitlisted after the chart is prepared, it is automatically cancelled and refunded — boarding with it counts as ticketless travel. Only counter (PRS) waitlisted tickets permit boarding, and even then without a berth.'
      }
    },
    {
      '@type': 'Question',
      name: 'When is the reservation chart prepared?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The first chart is usually prepared about 4 hours before departure (previous evening for early-morning trains). A second chart follows closer to departure, typically around 30 minutes before, releasing any last cancellations. Your final status can improve between the two.'
      }
    },
    {
      '@type': 'Question',
      name: 'What happens to a partially confirmed ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'If at least one passenger on the PNR is confirmed or RAC after charting, the whole party may board. Waitlisted co-passengers travel without a berth, sharing with the confirmed ones, or you can drop them via online cancellation before charting for a refund.'
      }
    }
  ]
};

export default function WaitlistRacGuide() {
  return (
    <GuidePageLayout
      title="Waitlist & RAC Survival Guide: GNWL, RLWL, PQWL and TQWL Decoded"
      description="What every waitlist code means, how charting works, your rights on an RAC ticket, and a stage-by-stage action plan from booking day to departure."
      canonicalPath="/rail/guides/waitlist-rac-guide"
      reviewedOn="July 20, 2026"
      reviewer="Travel Review Desk"
      articleSchema={articleSchema}
    >
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>

      <p>
        A waitlisted ticket is not a lottery ticket — different codes clear at very different rates, and what you
        should do about it changes as the journey date approaches. This guide decodes every status you will see on a
        PNR, explains how charting actually works, and gives you a stage-by-stage plan.
      </p>

      <h2 style={sectionTitleStyle}>The codes, ranked by how often they clear</h2>
      <ul>
        <li>
          <strong>RAC</strong> — not really a waitlist. You can board and you get half a side-lower berth, often
          upgraded to a full berth on the train.
        </li>
        <li>
          <strong>GNWL</strong> (General Waitlist) — the best waitlist to hold. Issued for journeys starting at the
          train&apos;s origin; it clears from the largest cancellation pool and passes through RAC first.
        </li>
        <li>
          <strong>RLWL</strong> (Remote Location Waitlist) — for boarding at major intermediate stations. Smaller
          quota, clears less often than GNWL, and usually skips the RAC stage.
        </li>
        <li>
          <strong>RSWL</strong> (Roadside Waitlist) — for smaller intermediate stations; similar odds to RLWL or worse.
        </li>
        <li>
          <strong>PQWL</strong> (Pooled Quota Waitlist) — one shared pool for several intermediate-to-intermediate
          journeys; clearance is unpredictable and often poor.
        </li>
        <li>
          <strong>TQWL</strong> (Tatkal Waitlist) — the weakest. Tatkal quota has no RAC and cleared Tatkal berths are
          few; a TQWL ticket that stays waitlisted after charting is auto-cancelled and refunded.
        </li>
      </ul>
      <Callout tone="note">
        <p>
          For a number-and-date-specific estimate, run your PNR status through the{' '}
          <a href="/rail/waitlist-confirmation-chances">Waitlist Confirmation Chances</a> tool — it weighs the code,
          your position, and how far away the journey is.
        </p>
      </Callout>

      <h2 style={sectionTitleStyle}>How a waitlist actually clears</h2>
      <p>
        Every cancellation against the relevant quota moves the list up one place. Two extra effects help you: railway
        officials release unused emergency/HO quota shortly before charting, and the second chart mops up very late
        cancellations. That is why a WL 8 that barely moved for weeks can jump to confirmed in the final 24 hours.
      </p>
      <p>
        <strong>Charting timeline:</strong> first chart around 4 hours before departure (the previous evening for
        early-morning trains); second chart roughly 30 minutes before departure. Between the two, you can still book
        any released berths under &quot;current booking&quot; on IRCTC.
      </p>

      <h2 style={sectionTitleStyle}>Your rights on RAC</h2>
      <ul>
        <li>You may board and travel — RAC is a confirmed right to travel, not a waitlist.</li>
        <li>You are allotted half a side-lower berth (two RAC passengers share it seated/lying in shifts).</li>
        <li>The TTE allots freed berths to RAC passengers in order — politely check after departure.</li>
        <li>Full cancellation-refund rules for confirmed tickets apply once you get a berth.</li>
      </ul>

      <h2 style={sectionTitleStyle}>Stage-by-stage action plan</h2>
      <h3>At booking (60–15 days out)</h3>
      <ul>
        <li>Prefer GNWL over RLWL/PQWL even if it means a nearby bigger station as your origin.</li>
        <li>Opt in to <strong>Vikalp</strong> (alternate train scheme) — the railways may shift you to another train with vacant berths at no extra cost.</li>
      </ul>
      <h3>Two weeks to 2 days out</h3>
      <ul>
        <li>Track movement every few days; steady movement is a good sign, a frozen list is not.</li>
        <li>Keep a backup: an alternate train, date, class — or a bus/flight refundable hold for critical trips.</li>
      </ul>
      <h3>The day before</h3>
      <ul>
        <li>Still deep in the waitlist? Try <strong>Tatkal</strong> the morning before the journey (see the <a href="/rail/guides/tatkal-booking-masterclass">Tatkal masterclass</a>).</li>
        <li>Premium Tatkal, if offered on your train, confirms at a dynamic fare.</li>
      </ul>
      <h3>After the first chart</h3>
      <ul>
        <li>Fully waitlisted e-ticket: it is auto-cancelled and refunded — do not board on it.</li>
        <li>Check <strong>current booking</strong> on IRCTC for berths released at charting.</li>
        <li>Partially confirmed PNR: the whole party may board; drop the unconfirmed passengers before charting if they will not travel.</li>
      </ul>

      <h2 style={sectionTitleStyle}>Refunds when the waitlist fails</h2>
      <p>
        Fully waitlisted e-tickets are refunded automatically after charting; only the IRCTC convenience fee is lost.
        If you cancel a waitlisted or RAC e-ticket yourself more than 30 minutes before departure, a small clerkage
        per passenger is deducted. Estimate exact amounts with the{' '}
        <a href="/rail/irctc-cancellation-calculator">Cancellation Refund Calculator</a>, and see the{' '}
        <a href="/rail/tdr-refund-checker">TDR Refund Checker</a> for edge cases like counter tickets.
      </p>

      <h2 style={sectionTitleStyle}>Final note</h2>
      <p>
        Clearance behavior varies by route, season, and quota releases; treat all odds as estimates. Rules quoted here
        follow current Indian Railways practice — confirm specifics on IRCTC for your train.
      </p>
    </GuidePageLayout>
  );
}
