import Head from 'next/head';
import GuidePageLayout, { sectionTitleStyle } from '../../../components/guides/GuidePageLayout';
import Callout from '../../../components/guides/Callout';

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Vande Bharat Express Guide: Booking, Classes, Fares and What to Expect',
  description:
    'How to book a Vande Bharat Express, what CC and Executive class actually offer, how fares and catering work, and tips for popular corridors.',
  author: { '@type': 'Organization', name: 'Railmonk Research Team' },
  publisher: { '@type': 'Organization', name: 'Railmonk' },
  datePublished: '2026-07-20',
  dateModified: '2026-07-20',
  mainEntityOfPage: 'https://railmonk.com/rail/guides/vande-bharat-guide'
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I book a Vande Bharat ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Exactly like any other reserved train — through IRCTC (site or app) or a counter. Search your route, pick the Vande Bharat service, and choose CC (Chair Car) or EC (Executive Chair Car). The normal 60-day advance booking window and Tatkal quota apply.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is food included in the Vande Bharat fare?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Catering is optional at booking time: you choose whether to add the meal when you book, and the charge is itemised on the fare. If you skip it, you pay a lower fare and can still buy food on board on most services.'
      }
    },
    {
      '@type': 'Question',
      name: 'Does Vande Bharat have a sleeper class?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The classic Vande Bharat is a day train with only chair-car classes (CC and EC). A separate Vande Bharat sleeper variant has been introduced on select overnight corridors — availability is limited, so check your specific route on IRCTC.'
      }
    },
    {
      '@type': 'Question',
      name: 'How fast is the Vande Bharat Express?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The trainset is designed for 180 km/h and typically runs at up to 130–160 km/h where the track permits. Its real advantage is acceleration: fewer minutes lost at every stop and curve, which is why it beats Shatabdi timings on the same corridors.'
      }
    }
  ]
};

export default function VandeBharatGuide() {
  return (
    <GuidePageLayout
      title="Vande Bharat Express Guide: Booking, Classes, Fares and What to Expect"
      description="How to book a Vande Bharat, what CC and Executive class offer, how fares and optional catering work, and practical tips before you board."
      canonicalPath="/rail/guides/vande-bharat-guide"
      reviewedOn="July 20, 2026"
      reviewer="Travel Review Desk"
      articleSchema={articleSchema}
    >
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>

      <p>
        Vande Bharat Express is India&apos;s flagship semi-high-speed train: a self-propelled trainset (no separate
        locomotive) with automatic doors, sealed gangways, and airline-style seating. Over a hundred services now run
        across the network. This guide covers what actually matters when you book one — classes, fares, catering, and
        the small differences from ordinary express trains that catch first-time riders out.
      </p>

      <h2 style={sectionTitleStyle}>What makes it different</h2>
      <ul>
        <li><strong>Speed where it counts:</strong> designed for 180 km/h, typically running up to 130–160 km/h. The bigger win is acceleration — it recovers speed quickly after every stop, which is how it undercuts Shatabdi timings.</li>
        <li><strong>Trainset, not coaches + engine:</strong> driving cabs at both ends, so no engine reversal at terminals and quicker turnarounds.</li>
        <li><strong>Day train:</strong> the classic service is chair-car only. A sleeper variant exists on select overnight corridors but is still the exception.</li>
        <li><strong>Automatic doors:</strong> they close before departure like a metro — board a few minutes early, not as the train rolls.</li>
      </ul>

      <h2 style={sectionTitleStyle}>Classes: CC vs Executive</h2>
      <p>
        <strong>Chair Car (CC)</strong> is a 3+2 layout with reclining seats, charging points at every seat, and large
        sealed windows. Perfectly comfortable for 4–6 hour hops.
      </p>
      <p>
        <strong>Executive Chair Car (EC)</strong> is 2+2 with wider, deeper seats — and on Vande Bharat specifically,
        the seats <em>rotate</em> to face the direction of travel (or your co-passengers). The executive coaches sit
        mid-rake, which is also the smoothest-riding part of the train. Worth the premium on longer sectors.
      </p>
      <Callout tone="note">
        <p>
          An 8-car Vande Bharat runs coaches C1–C8 (C16 on the 16-car version) with executive mid-rake. Find where
          your coach halts on the platform with the <a href="/rail/coach-position-finder">Coach Position Finder</a>,
          and compare CC vs EC across all trains in <a href="/rail/guides/train-classes-explained">Train Classes
          Explained</a>.
        </p>
      </Callout>

      <h2 style={sectionTitleStyle}>Fares and catering</h2>
      <ul>
        <li>Fares are premium over an ordinary superfast — roughly Shatabdi-plus on most corridors. Ballpark your route with the <a href="/rail/train-fare-calculator">Train Fare Calculator</a> (pick CC or EC and the premium category).</li>
        <li><strong>Catering is opt-in at booking:</strong> the meal charge is itemised, and skipping it lowers the fare. Morning services typically offer breakfast; longer ones lunch/dinner.</li>
        <li>Children aged 5–11 pay the applicable fare rules like any reserved train; there are no Tatkal concessions.</li>
      </ul>

      <h2 style={sectionTitleStyle}>Booking a Vande Bharat</h2>
      <ul>
        <li>Book on IRCTC like any reserved train — the normal <strong>60-day advance window</strong> applies. Check your exact open date with the <a href="/rail/irctc-calculator">ARP Calculator</a>.</li>
        <li><strong>Tatkal works too:</strong> AC-class Tatkal opens at 10:00 AM the day before — the <a href="/rail/guides/tatkal-booking-masterclass">Tatkal Masterclass</a> applies unchanged.</li>
        <li>Popular corridors (Delhi–Varanasi, Delhi–Katra, Mumbai–Gandhinagar, Chennai–Mysuru, Howrah–NJP and similar) sell out days ahead in holiday season — book early rather than counting on Tatkal.</li>
        <li>Waitlists behave like any other train; gauge your odds with <a href="/rail/waitlist-confirmation-chances">Waitlist Confirmation Chances</a>.</li>
      </ul>

      <h2 style={sectionTitleStyle}>Practical tips for the ride</h2>
      <ul>
        <li>Arrive early — automatic doors close before departure and halts at intermediate stations are short (often 2 minutes).</li>
        <li>Luggage space is overhead-rack style, tighter than a sleeper coach; oversized bags are awkward. Pack cabin-bag sized where possible.</li>
        <li>In EC, ask the attendant if you may rotate the seat pair — it needs the row behind to cooperate.</li>
        <li>Windows are sealed and the cabin runs cool; carry a light layer.</li>
        <li>Cancellation follows normal reserved-ticket rules for CC/EC — compute deductions with the <a href="/rail/irctc-cancellation-calculator">Cancellation Refund Calculator</a>.</li>
      </ul>

      <h2 style={sectionTitleStyle}>Vande Bharat vs Shatabdi: which to pick?</h2>
      <p>
        Where both run, Vande Bharat is usually 15–45 minutes faster and newer inside; Shatabdi fares can be slightly
        lower and its catering is bundled rather than opt-in. If timings suit you equally, the deciding factor is
        usually departure time, not the trainset.
      </p>

      <h2 style={sectionTitleStyle}>Final note</h2>
      <p>
        New Vande Bharat services are added frequently and schedules shift — always confirm your route, timing, and
        classes on IRCTC or NTES before planning around this guide.
      </p>
    </GuidePageLayout>
  );
}
