import GuidePageLayout from '../../../components/guides/GuidePageLayout';
import Callout from '../../../components/guides/Callout';

const CANONICAL = '/rail/guides/foreign-tourist-nri-train-booking';

// Every rule below is from two IRCTC documents unless marked otherwise:
//   • "Foreign Tourist Quota Booking" (contents.irctc.co.in, file dated 2 May 2025)
//   • "Foreign User Registration" user guide (screens dated 13 Dec 2024)
// The Aadhaar points are from the Railway Ministry announcements carried by
// All India Radio (newsonair.gov.in) in June and September 2025. Where the
// guide draws an inference those documents do not state — OCI cardholders,
// the practical effect of the Aadhaar windows — the prose says so.

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Booking Indian Trains as a Foreign Tourist or NRI',
  description:
    'How foreign tourists and NRIs register on IRCTC with a foreign mobile number, use the Foreign Tourist quota up to 365 days ahead, pay with an international card, and what the 50% cancellation deduction and Aadhaar rules mean for them.',
  author: { '@type': 'Organization', name: 'Railmonk Research Team' },
  publisher: { '@type': 'Organization', name: 'Railmonk' },
  datePublished: '2026-10-17',
  dateModified: '2026-10-17',
  mainEntityOfPage: `https://railmonk.com${CANONICAL}`,
};

const FAQS = [
  {
    q: 'Can foreigners book Indian train tickets online?',
    a: 'Yes. Register on irctc.co.in with a non-Indian mobile number and an email address, pay the one-time ₹100 + GST international user fee with a card issued outside India, and verify the mobile number. You can then book under the Foreign Tourist quota through the "Foreign Tourist Ticket Booking" option in the Services menu, entering each passenger’s passport number.',
  },
  {
    q: 'Can NRIs use the Foreign Tourist quota?',
    a: 'Yes. IRCTC’s own Foreign Tourist quota document says the facility is open to foreign tourists, including NRIs, holding a valid passport. An NRI books from an international IRCTC account — one registered with a mobile number whose country code is not +91.',
  },
  {
    q: 'How far in advance can I book with the Foreign Tourist quota?',
    a: 'Up to 365 days before the journey, against 60 days for ordinary bookings. If you book more than 60 days out, the ticket is accepted but no berth is allotted until the normal 60-day window opens. If the railway cannot allot one then, the ticket is cancelled automatically and you are told by SMS and email.',
  },
  {
    q: 'Which classes are available in the Foreign Tourist quota?',
    a: 'Executive Class (EC), First AC (1A), Second AC (2A), Third AC (3A), AC Chair Car (CC), Sleeper (SL) and Second Sitting (2S), according to IRCTC’s current Foreign Tourist quota document. Older pages that list only 1A, 2A and EC are out of date. Not every train carries every class, and the quota on any one train is small.',
  },
  {
    q: 'What does the Foreign Tourist quota cost?',
    a: 'The normal fare for the class plus an IRCTC service charge of ₹200 + GST per ticket. Separately, an international or NRI account pays a one-time registration fee of ₹100 + GST. Payment is by international debit or credit card.',
  },
  {
    q: 'What happens if I cancel a Foreign Tourist quota ticket?',
    a: 'Half the fare is deducted on top of the normal cancellation charges, according to IRCTC’s Foreign Tourist quota terms. That makes it far more expensive to cancel than an ordinary ticket, so book the quota only for journeys you are fairly sure of. Refunds go back only to the card used for the booking.',
  },
  {
    q: 'Can foreigners book Tatkal tickets online?',
    a: 'In practice, not from an IRCTC account without Aadhaar. Since July 2025 online Tatkal booking needs an Aadhaar-authenticated account, and since October 2025 so does general-quota booking in the first 15 minutes after a train opens for booking. The Railway Ministry announcements carry no exemption for foreign or NRI accounts. Reservation counters were not covered by the 15-minute rule.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
};

export default function ForeignTouristNriBookingGuide() {
  return (
    <GuidePageLayout
      title="Booking Indian Trains as a Foreign Tourist or NRI"
      description="Register on IRCTC with a foreign number, use the Foreign Tourist quota up to 365 days ahead, pay with an international card — and the cancellation and Aadhaar rules that catch visitors out."
      canonicalPath={CANONICAL}
      reviewedOn="October 17, 2026"
      articleSchema={[articleSchema, faqSchema]}
    >
      <p>
        Indian Railways has a booking route built specifically for visitors, and it is better than most visitors
        realise: a reserved quota on long-distance trains, a booking window six times longer than the one Indians
        get, and online payment with a foreign card. It also has two traps that the travel forums rarely mention —
        a cancellation penalty that takes half your fare, and Aadhaar rules that quietly lock international accounts
        out of the busiest booking windows.
      </p>
      <p>
        This guide covers both, from IRCTC&rsquo;s own documents. It applies to foreign nationals and to
        Non-Resident Indians living abroad; the rules for the two are the same.
      </p>

      <h2>The short version</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-ink-muted dark:border-slate-700 dark:text-slate-400">
              <th scope="col" className="py-2 pr-3 font-semibold">Question</th>
              <th scope="col" className="py-2 font-semibold">Foreign Tourist quota answer</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Who can use it', 'Foreign tourists, including NRIs, with a valid passport'],
              ['How far ahead', 'Up to 365 days (ordinary bookings: 60 days)'],
              ['Classes', 'EC, 1A, 2A, 3A, CC, Sleeper and Second Sitting'],
              ['What you need', 'An international IRCTC account and each passenger’s passport number'],
              ['Payment', 'International debit or credit card'],
              ['Extra charges', '₹100 + GST once to register; ₹200 + GST per ticket'],
              ['If you cancel', '50% of the fare deducted, on top of normal cancellation charges'],
            ].map(([q, a]) => (
              <tr key={q} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <th scope="row" className="py-2.5 pr-3 font-medium text-ink dark:text-white">{q}</th>
                <td className="py-2.5 text-ink-muted dark:text-slate-400">{a}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Step 1: register an international IRCTC account</h2>
      <p>
        You need an IRCTC account whose mobile number has a country code other than +91. That is what marks it
        as an international account, and it is the only kind that sees the Foreign Tourist booking option. The
        registration flow, per IRCTC&rsquo;s foreign-user guide:
      </p>
      <ol>
        <li>
          Click <strong>Register</strong> on irctc.co.in and enter a user ID, password, full name, email address
          and your <strong>foreign mobile number with its country code</strong>.
        </li>
        <li>
          Verify the <strong>email address</strong> with the one-time code IRCTC sends to it.
        </li>
        <li>
          Log in and pay the <strong>international user registration fee of ₹100 + GST</strong>. Only cards
          issued outside India are accepted for this fee.
        </li>
        <li>
          Verify the <strong>mobile number</strong> with the SMS code sent to it.
        </li>
        <li>
          Complete the profile — date of birth, gender and address.
        </li>
      </ol>

      <Callout tone="note">
        <p>
          <strong>Do the registration at home, not in India.</strong> The mobile code arrives by SMS on your
          foreign number, so register while that SIM is in your phone and reachable. NRIs with an older IRCTC
          account need to add and verify the international number through <em>Update Profile</em> before the
          Foreign Tourist option will work; the same ₹100 + GST fee applies to that update.
        </p>
      </Callout>

      <h2>Step 2: book under the Foreign Tourist quota</h2>
      <p>
        Once logged in, choose <strong>Foreign Tourist Ticket Booking</strong> from the <strong>Services</strong>{' '}
        menu. The booking works like any other IRCTC booking, with two differences: you enter a{' '}
        <strong>passport number for every passenger</strong>, and you pay with an{' '}
        <strong>international debit or credit card</strong>. Booking confirmation goes to your registered email
        and by SMS to the verified foreign number.
      </p>

      <h3>The 365-day window, and what &ldquo;booked&rdquo; means beyond 60 days</h3>
      <p>
        The quota can be booked up to <strong>365 days before the journey</strong>, against the{' '}
        <a href="/rail/irctc-calculator">60-day window</a> everyone else has. But a booking made more than 60 days
        out is not yet a berth. The railway&rsquo;s reservation system only allots berths once the ordinary
        window opens, so until then you hold a ticket without a seat number.
      </p>
      <p>
        When the window opens, a berth is allotted and you are notified by SMS. If none can be allotted, the
        ticket is <strong>cancelled automatically</strong> and you are told by SMS and email. Booking a year out
        gets you to the front of the queue for the quota; it does not guarantee the quota will have room.
      </p>

      <Callout>
        <p>
          <strong>The quota is small, and it is not the only option.</strong> A foreign or NRI account can also
          book in the ordinary general quota, at the ordinary price and without the Foreign Tourist service charge
          or cancellation penalty. When general availability is good, that is usually the better buy. The Foreign
          Tourist quota earns its extra cost on popular trains in peak season, when the general quota has gone to a
          waitlist.
        </p>
      </Callout>

      <h2>What it costs</h2>
      <ul>
        <li>
          <strong>The fare</strong> — the normal fare for the class. Our{' '}
          <a href="/rail/train-fare-calculator">train fare calculator</a> estimates it by class and distance.
        </li>
        <li>
          <strong>₹200 + GST per ticket</strong> — IRCTC&rsquo;s Foreign Tourist service charge, on top of the fare.
        </li>
        <li>
          <strong>₹100 + GST, once</strong> — the international user registration fee.
        </li>
      </ul>

      <h2>Cancelling: the 50% rule</h2>
      <p>
        This is the rule worth knowing before you book a year ahead. IRCTC&rsquo;s Foreign Tourist quota terms
        say that when you cancel, <strong>50% of the fare is deducted in addition to the normal cancellation
        charges</strong>. The time limits for cancelling online are the ordinary ones, but the amount you get back
        is far smaller than on an ordinary ticket.
      </p>
      <p>
        Two things follow. First, book the quota only for journeys you are fairly sure of; it is a poor way to
        hold options. Second, an automatic cancellation because no berth could be allotted is a different case:
        IRCTC cancels it and notifies you, rather than you choosing to cancel. Refunds of any kind go only to the
        card used for the booking. For how ordinary cancellation charges are worked out, see the{' '}
        <a href="/rail/irctc-cancellation-calculator">cancellation calculator</a>.
      </p>

      <h2>Tatkal and the Aadhaar rules</h2>
      <p>
        Two Railway Ministry changes in 2025 tied online booking to Aadhaar, India&rsquo;s resident identity
        number — which visitors and most NRIs do not have:
      </p>
      <ul>
        <li>
          <strong>Tatkal</strong> — since July 2025, online Tatkal booking needs an Aadhaar-authenticated IRCTC
          account.
        </li>
        <li>
          <strong>The first 15 minutes</strong> — since 1 October 2025, when a train opens for general booking,
          only Aadhaar-authenticated accounts can book online for the first 15 minutes.
        </li>
      </ul>
      <p>
        Neither announcement carries an exemption for foreign or NRI accounts. In practice that means an
        international account cannot book Tatkal online, and cannot compete in the opening minutes of a popular
        train&rsquo;s booking window. That is the real argument for the Foreign Tourist quota: its 365-day window
        lets you book long before that race begins. The 15-minute rule did not apply at reservation counters.
      </p>

      <h2>On the train</h2>
      <ul>
        <li>
          Carry the <strong>passport whose number is on the ticket</strong>. It is your identity proof for the
          booking, and a ticket checker can ask for it. See{' '}
          <a href="/rail/guides/train-travel-rules">train travel rules</a> for what happens when ID does not match.
        </li>
        <li>
          Keep the <strong>foreign SIM reachable</strong>, or at least check email. Berth allotment, chart and
          cancellation messages go to the verified number and address.
        </li>
        <li>
          The berth number appears once a berth is allotted and is final at{' '}
          <a href="/rail/chart-preparation-time">chart preparation</a>, about 10 hours before departure.
        </li>
      </ul>

      <h2>OCI cardholders</h2>
      <p>
        IRCTC&rsquo;s document does not mention Overseas Citizens of India separately. An OCI cardholder is a
        foreign national travelling on a foreign passport, so they fall within &ldquo;foreign tourists holding a
        valid passport&rdquo; on a plain reading — but that is our reading, not an IRCTC statement. If you rely on
        it for an important journey, confirm with IRCTC customer care first.
      </p>

      <h2>Frequently asked questions</h2>
      {FAQS.map(({ q, a }) => (
        <div key={q}>
          <h3>{q}</h3>
          <p>{a}</p>
        </div>
      ))}

      <h2>Sources</h2>
      <ul>
        <li>
          <a href="https://contents.irctc.co.in/en/ForeignTouristQuotaBooking.pdf" rel="noopener noreferrer" target="_blank">
            IRCTC — Foreign Tourist Quota Booking
          </a>{' '}
          (eligibility, 365-day window, classes, charges, cancellation)
        </li>
        <li>
          <a href="https://contents.irctc.co.in/en/Internation_User_guide.pdf" rel="noopener noreferrer" target="_blank">
            IRCTC — Foreign User Registration guide
          </a>{' '}
          (registration steps and fee)
        </li>
        <li>
          <a href="https://www.newsonair.gov.in/railways-to-allow-general-ticket-booking-online-only-for-aadhaar-verified-users-during-first-15-minutes-from-next-month" rel="noopener noreferrer" target="_blank">
            All India Radio — Aadhaar rule for the first 15 minutes of general booking
          </a>
        </li>
        <li>
          <a href="https://www.newsonair.gov.in/aadhaar-authentication-made-mandatory-for-online-tatkal-ticket-booking-from-july-15" rel="noopener noreferrer" target="_blank">
            All India Radio — Aadhaar authentication for online Tatkal booking
          </a>
        </li>
      </ul>
    </GuidePageLayout>
  );
}
