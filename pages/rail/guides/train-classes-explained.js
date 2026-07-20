import Head from 'next/head';
import GuidePageLayout, { sectionTitleStyle } from '../../../components/guides/GuidePageLayout';
import Callout from '../../../components/guides/Callout';

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Indian Train Classes Explained: 1A, 2A, 3A, 3E, SL, CC, EC and 2S',
  description:
    'Every Indian Railways travel class compared — berths, comfort, bedding, who each class suits, and how fares scale from Second Sitting to First AC.',
  author: { '@type': 'Organization', name: 'Railmonk Research Team' },
  publisher: { '@type': 'Organization', name: 'Railmonk' },
  datePublished: '2026-07-20',
  dateModified: '2026-07-20',
  mainEntityOfPage: 'https://railmonk.com/rail/guides/train-classes-explained'
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the difference between 3A and 3E (AC 3 Economy)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Both are air-conditioned three-tier coaches. 3E squeezes in more berths per coach (around 80 vs 64-72 in 3A), so berths are slightly narrower and there is an extra middle berth bay. In exchange, 3E fares are noticeably cheaper. Bedding is now provided in 3E on most trains, but check your train before assuming it.'
      }
    },
    {
      '@type': 'Question',
      name: 'Which class is best for an overnight family journey?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '3A is the sweet spot for most families: air-conditioned, bedding included, and cheaper than 2A. If budget allows and you want fewer co-passengers per bay, 2A adds curtains, wider berths, and more privacy. For a tight budget, SL works well in moderate weather.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is First AC (1A) worth it compared to flying?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '1A fares on long routes often come close to (or exceed) a flight ticket. You pay for a lockable cabin or coupe, wide berths, and a quiet coach. It makes sense for overnight comfort where a flight would still cost you a hotel night, or when you value door-to-door rest over speed.'
      }
    },
    {
      '@type': 'Question',
      name: 'Do Chair Car (CC) and Executive Chair Car (EC) serve food?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'On premium day trains like Shatabdi and Vande Bharat, catering is typically bundled into or offered with the fare in CC and EC. On ordinary express trains with a CC coach, food is not included — you buy from pantry or e-catering.'
      }
    }
  ]
};

export default function TrainClassesExplainedGuide() {
  return (
    <GuidePageLayout
      title="Indian Train Classes Explained: 1A vs 2A vs 3A vs 3E vs SL vs CC vs EC vs 2S"
      description="Every Indian Railways travel class compared — berths per coach, comfort, bedding, and who each class actually suits — from Second Sitting to First AC."
      canonicalPath="/rail/guides/train-classes-explained"
      reviewedOn="July 20, 2026"
      reviewer="Travel Review Desk"
      articleSchema={articleSchema}
    >
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>

      <p>
        Indian Railways runs eight commonly bookable reserved classes, and the two-letter codes on the booking page
        (SL, 3A, CC…) tell you almost nothing about what you actually get. This guide compares every class on the
        things that matter — sleep, space, temperature, bedding, and price — so you can pick the right one instead of
        defaulting to whatever is available.
      </p>

      <h2 style={sectionTitleStyle}>The quick comparison</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left dark:bg-slate-800">
              <th className="border border-slate-200 p-2 dark:border-slate-700">Class</th>
              <th className="border border-slate-200 p-2 dark:border-slate-700">Full name</th>
              <th className="border border-slate-200 p-2 dark:border-slate-700">AC</th>
              <th className="border border-slate-200 p-2 dark:border-slate-700">Sleep?</th>
              <th className="border border-slate-200 p-2 dark:border-slate-700">Berths/seats per coach</th>
              <th className="border border-slate-200 p-2 dark:border-slate-700">Rough fare vs SL</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['2S', 'Second Sitting', 'No', 'No — bench seats', '~108 seats', '~0.5x'],
              ['SL', 'Sleeper', 'No', 'Yes — 3-tier berths', '72–81 berths', '1x (baseline)'],
              ['3E', 'AC 3 Tier Economy', 'Yes', 'Yes — 3-tier, narrower', '~80 berths', '~2.4x'],
              ['CC', 'AC Chair Car', 'Yes', 'No — 3+2 reclining seats', '~73–78 seats', '~2.2x (day trains)'],
              ['3A', 'AC 3 Tier', 'Yes', 'Yes — 3-tier + bedding', '64–72 berths', '~2.6x'],
              ['2A', 'AC 2 Tier', 'Yes', 'Yes — 2-tier, curtains', '46–54 berths', '~3.7x'],
              ['EC', 'Executive Chair Car', 'Yes', 'No — 2+2 wide seats', '~52–56 seats', '~4.5x (day trains)'],
              ['1A', 'First AC', 'Yes', 'Yes — lockable cabins', '18–24 berths', '~6x'],
            ].map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) => (
                  <td key={i} className={`border border-slate-200 p-2 dark:border-slate-700 ${i === 0 ? 'font-semibold' : ''}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Fare ratios are indicative — actual prices depend on distance and train type. Get a rupee figure for your
        route with the <a href="/rail/train-fare-calculator">Train Fare Calculator</a>.
      </p>

      <h2 style={sectionTitleStyle}>Non-AC classes: 2S and SL</h2>
      <p>
        <strong>Second Sitting (2S)</strong> is the cheapest reserved class: non-AC bench-style seats in a 3+3 layout,
        meant for short day hops. It is perfectly usable for 2–4 hour journeys and costs very little.
      </p>
      <p>
        <strong>Sleeper (SL)</strong> is the workhorse of Indian Railways — non-AC, open windows, three-tier berths,
        72–81 per coach. It is the baseline every other fare scales from. In pleasant weather on a well-maintained
        train it is decent value; in peak summer or winter on busy corridors, the AC classes earn their premium. No
        bedding is provided, so carry a sheet or sleeping-bag liner.
      </p>

      <h2 style={sectionTitleStyle}>AC sleeper classes: 3E, 3A, 2A, 1A</h2>
      <p>
        <strong>AC 3 Tier Economy (3E)</strong> is the budget AC option: the same three-tier layout as 3A but with an
        extra berth column, so around 80 berths per coach and slightly narrower berths. If you are of average build
        and want AC at the lowest price, 3E is excellent value.
      </p>
      <p>
        <strong>AC 3 Tier (3A)</strong> is the most-booked AC class and the default recommendation for overnight
        travel: bedding (two sheets, blanket, pillow) included, charging points, curtained windows. Bays of six berths
        plus two side berths.
      </p>
      <p>
        <strong>AC 2 Tier (2A)</strong> removes the middle berth, so each bay has four berths plus two side berths —
        more headroom on the lower berth, wider berths, individual reading lights, and privacy curtains. Choose it for
        long journeys where sleep quality matters.
      </p>
      <p>
        <strong>First AC (1A)</strong> replaces open bays with lockable rooms: coupes (2 berths) and cabins (4
        berths). Carpeted coach, wide berths, and only 18–24 passengers per coach. Room allocation (coupe vs cabin)
        happens at charting — you cannot book a specific room.
      </p>
      <Callout tone="note">
        <p>
          <strong>Where exactly will you sleep?</strong> Once you have a berth number, the{' '}
          <a href="/rail/berth-position-finder">Berth Position Finder</a> tells you if it is lower/middle/upper or a
          side berth, and the <a href="/rail/coach-position-finder">Coach Position Finder</a> shows where your coach
          stops on the platform.
        </p>
      </Callout>

      <h2 style={sectionTitleStyle}>AC seating classes: CC and EC</h2>
      <p>
        <strong>AC Chair Car (CC)</strong> is the standard class on intercity day trains — 3+2 reclining seats, AC,
        decent legroom. On Shatabdi and Vande Bharat services, catering is typically part of the deal.
      </p>
      <p>
        <strong>Executive Chair Car (EC)</strong> is the business-class version: 2+2 wide seats, more recline and
        pitch, and on Vande Bharat Executive coaches, rotating seats. Worth it on journeys over 4–5 hours if the fare
        gap is acceptable.
      </p>

      <h2 style={sectionTitleStyle}>How to choose, in one minute</h2>
      <ul>
        <li><strong>Short day trip, minimum cost:</strong> 2S.</li>
        <li><strong>Day trip in comfort:</strong> CC — or EC if it is a long sit.</li>
        <li><strong>Overnight on a budget:</strong> SL in mild weather, 3E when you want AC.</li>
        <li><strong>Overnight, best value-for-comfort:</strong> 3A.</li>
        <li><strong>Overnight, prioritize sleep and privacy:</strong> 2A, then 1A if budget allows.</li>
        <li><strong>Traveling with elderly passengers:</strong> prefer 2A/3A and request lower berths at booking.</li>
      </ul>

      <h2 style={sectionTitleStyle}>FAQs</h2>
      <h3>3A vs 3E — is the saving worth it?</h3>
      <p>
        Usually yes for solo travelers of average build; the ~10–15% saving buys the same AC and a berth that is a few
        centimetres narrower. Families and tall travelers tend to prefer 3A.
      </p>
      <h3>Do AC classes include bedding?</h3>
      <p>
        3A, 2A, and 1A include bedding. 3E now provides it on most trains but it was originally a no-bedding class —
        carry a light layer as a backup. SL and seating classes have no bedding.
      </p>
      <h3>Is 1A worth it against a flight?</h3>
      <p>
        On overnight routes, 1A doubles as a hotel night and delivers you to the city centre rested. If your
        comparison is a morning flight plus an extra hotel night, 1A often breaks even.
      </p>

      <h2 style={sectionTitleStyle}>Use the tools together</h2>
      <Callout>
        <ol>
          <li>Estimate the fare for each class on your route with the <a href="/rail/train-fare-calculator">Train Fare Calculator</a>.</li>
          <li>Check when booking opens with the <a href="/rail/irctc-calculator">ARP Calculator</a>.</li>
          <li>If you land on a waitlist, gauge your odds with <a href="/rail/waitlist-confirmation-chances">Waitlist Confirmation Chances</a>.</li>
        </ol>
      </Callout>

      <h2 style={sectionTitleStyle}>Final note</h2>
      <p>
        Coach compositions and amenities vary by train and are revised by Indian Railways from time to time. Treat
        this as a planning guide and verify specifics for your train on IRCTC before booking.
      </p>
    </GuidePageLayout>
  );
}
