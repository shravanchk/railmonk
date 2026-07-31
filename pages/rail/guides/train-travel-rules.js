import GuidePageLayout from '../../../components/guides/GuidePageLayout';
import Callout from '../../../components/guides/Callout';

const CANONICAL = '/rail/guides/train-travel-rules';

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Train Travel Rules: Night Berth Timings, Luggage Limits and Penalties',
  description:
    'The Indian Railways rules passengers actually argue about on board — the 10 PM to 6 AM sleeping window, middle berth rights, free luggage allowance by class, and what travelling without a valid ticket now costs.',
  author: { '@type': 'Organization', name: 'Railmonk Research Team' },
  publisher: { '@type': 'Organization', name: 'Railmonk' },
  datePublished: '2026-07-31',
  dateModified: '2026-07-31',
  mainEntityOfPage: `https://railmonk.com${CANONICAL}`,
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What are the sleeping hours in a train?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sleeping hours in reserved sleeping-accommodation coaches run from 10 PM to 6 AM. Outside that window the middle berth is meant to be folded down so that the lower berth can be shared as seating. The window was shortened from 9 PM in 2017.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can the middle berth passenger sleep during the day?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Not by right. Between 6 AM and 10 PM the middle berth should stay folded if keeping it down inconveniences the passengers using the lower berth as a seat. Outside those hours the middle berth passenger is entitled to have it down, and the lower berth passenger cannot object.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much luggage can I carry on a train for free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The free allowance is 70 kg in AC First Class, 50 kg in First Class and AC 2-Tier, 40 kg in AC 3-Tier, AC Chair Car and Sleeper, and 35 kg in Second Class. Maximum limits carried in the compartment are higher — 150 kg, 100 kg, 80 kg and 70 kg respectively — except in AC 3-Tier and Chair Car, where the maximum equals the free allowance.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the penalty for travelling without a ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'From 1 July 2026 the minimum penalty under Section 138 of the Railways Act doubled from ₹250 to ₹500, and you also pay the fare for the distance travelled. The change came through the Jan Vishwas (Amendment of Provisions) Act, 2026. Court-imposed punishment is unchanged at up to six months imprisonment, a fine of up to ₹1,000, or both.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens if I am caught in a higher class than my ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You pay the difference between the two fares plus a penalty. It is treated separately from travelling with no ticket at all, and the TTE can regularise it on the spot if accommodation is available in the class you are actually sitting in.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I book excess luggage online now?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Indian Railways opened online excess-luggage booking alongside ticket reservation on 31 July 2026, for AC First Class, AC 2-Tier, First Class, Sleeper and Second Class. AC 3-Tier and Chair Car are excluded because their maximum permissible limit is the same as the free allowance, so there is no excess to book.',
      },
    },
  ],
};

export default function TrainTravelRulesGuide() {
  return (
    <GuidePageLayout
      title="Train Travel Rules: Night Berth Timings, Luggage & Penalties"
      description="The rules people actually argue about on board — the 10 PM–6 AM sleeping window, middle berth rights, free luggage allowance by class, and what a ticketless journey now costs after the July 2026 increase."
      canonicalPath={CANONICAL}
      reviewedOn="July 31, 2026"
      articleSchema={[articleSchema, faqSchema]}
    >
      <p>
        Most disputes inside a reserved coach come down to three questions: whose berth is it right now, how
        much can you bring aboard, and what happens if your ticket does not match where you are sitting. All
        three have written answers. Almost nobody on the train has read them, which is exactly why the
        arguments happen — and why knowing the rule is usually enough to end one.
      </p>

      <h2>Night berth timings: the 10 PM to 6 AM window</h2>
      <p>
        In coaches with sleeping accommodation, sleeping hours run from <strong>10 PM to 6 AM</strong>. Inside
        that window every passenger is entitled to use their allotted berth as a berth. Outside it, the lower
        berth doubles as shared seating for the passengers of that bay, and the middle berth is expected to be
        folded away so there is headroom to sit.
      </p>
      <p>
        The window used to start at 9 PM. It was cut by an hour in 2017, which is the source of a great deal of
        confusion — plenty of regular travellers still quote the older timing in good faith. If someone tells
        you the berths go down at nine, they are not inventing it; they are simply working from a rule that
        changed.
      </p>

      <Callout tone="note">
        <p>
          <strong>The practical reading.</strong> Between 6 AM and 10 PM, a middle-berth passenger who puts the
          berth down while the people below are trying to sit is in the wrong. Between 10 PM and 6 AM, a
          lower-berth passenger who objects to the middle berth being lowered is in the wrong. The rule exists
          precisely so neither has to negotiate it.
        </p>
      </Callout>

      <h3>Where the rule bends</h3>
      <p>
        Enforcement is a matter of judgement rather than stopwatch. Elderly passengers, pregnant women, people
        who are unwell and anyone travelling with a small child are routinely accommodated outside the window,
        and a reasonable coach lets them be. If a genuine dispute cannot be settled, the TTE is the person to
        raise it with, or the Rail Madad helpline on <strong>139</strong>. Neither is worth invoking over
        twenty minutes.
      </p>
      <p>
        One more courtesy that is written down rather than merely expected: lights and mobile conversation in
        the coach are supposed to be kept down during sleeping hours too. It is the same window, and the same
        reasoning.
      </p>

      <h2>Luggage: what you can carry, and what it costs if you exceed it</h2>
      <p>
        Every class has a free allowance and a separate maximum you may carry into the compartment on payment.
        The gap between the two is where the charges live.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-ink-muted dark:border-slate-700 dark:text-slate-400">
              <th scope="col" className="py-2 pr-3 font-semibold">Class</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Free allowance</th>
              <th scope="col" className="py-2 font-semibold">Maximum in the compartment</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['AC First Class (1A)', '70 kg', '150 kg'],
              ['First Class / AC 2-Tier (FC, 2A)', '50 kg', '100 kg'],
              ['AC 3-Tier / AC Chair Car (3A, CC)', '40 kg', '40 kg — no excess permitted'],
              ['Sleeper (SL)', '40 kg', '80 kg'],
              ['Second Class (2S)', '35 kg', '70 kg'],
            ].map(([cls, free, max]) => (
              <tr key={cls} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <th scope="row" className="py-2.5 pr-3 font-medium text-ink dark:text-white">{cls}</th>
                <td className="py-2.5 pr-3 text-ink-muted dark:text-slate-400">{free}</td>
                <td className="py-2.5 text-ink-muted dark:text-slate-400">{max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        Luggage carried beyond the free allowance but within the maximum is charged at{' '}
        <strong>1.5 times the normal luggage rate</strong> — the premium exists to push heavy consignments into
        the brake van, where they belong, rather than under someone else&rsquo;s berth. Trunks, suitcases and
        boxes taken into the compartment are also size-limited, to roughly 100 × 60 × 25 cm.
      </p>
      <p>
        Note the row that catches people out: <strong>AC 3-Tier and Chair Car have no headroom at all</strong>.
        Their maximum is the same 40 kg as their free allowance, so there is no &ldquo;pay a bit extra&rdquo;
        option in those classes. Anything over the limit has to be booked as luggage separately.
      </p>

      <Callout>
        <p>
          <strong>New since 31 July 2026:</strong> excess luggage can now be booked and paid for online at the
          time of ticket reservation, for AC First, AC 2-Tier, First Class, Sleeper and Second Class. AC 3-Tier
          and Chair Car are excluded for the reason above — with the maximum equal to the free allowance, there
          is nothing to book.
        </p>
      </Callout>

      <h2>Travelling without a valid ticket: the penalty doubled in 2026</h2>
      <p>
        From <strong>1 July 2026</strong>, the minimum penalty for travelling without a ticket rose from ₹250 to{' '}
        <strong>₹500</strong>, under amendments to Sections 137 and 138 of the Railways Act, 1989 made by the
        Jan Vishwas (Amendment of Provisions) Act, 2026. That penalty is <em>in addition</em> to the fare for
        the distance you travelled — the two are not alternatives.
      </p>
      <p>
        The same increase applies to travelling beyond the distance your ticket covers. Where a court rather
        than railway staff imposes the punishment, the ceiling is unchanged: imprisonment up to six months, a
        fine up to ₹1,000, or both.
      </p>

      <h3>The distinction that matters on board</h3>
      <p>
        A penalty collected by a TTE and a fine imposed by a court are different things, and the first is far
        more common. If you find yourself on a train with no valid ticket — a missed connection, a booking that
        did not go through — approaching the TTE yourself is materially better than being found. Regularising a
        journey is a routine transaction; being caught is a penalty.
      </p>
      <p>
        Sitting in a class above the one you booked is treated separately again: you pay the fare difference
        plus a penalty, and the TTE can regularise it on the spot if there is room in the class you are
        actually occupying.
      </p>

      <Callout tone="note">
        <p>
          <strong>A fully waitlisted e-ticket is not a ticket.</strong> It is cancelled automatically at chart
          preparation and refunded, which means boarding on it is travelling with no ticket at all — ₹500 plus
          the fare, not a conversation about your waitlist number. If yours has not cleared, check{' '}
          <a href="/rail/waitlist-confirmation-chances">what your code and number actually suggest</a> before
          you go to the station.
        </p>
      </Callout>

      <h2>The short version</h2>
      <ul>
        <li>Berths are for sleeping from <strong>10 PM to 6 AM</strong>; outside that, the middle berth folds and the lower berth is shared seating.</li>
        <li>Free luggage runs from <strong>35 kg in Second Class to 70 kg in AC First</strong>; excess inside the compartment costs 1.5× the luggage rate.</li>
        <li><strong>AC 3-Tier and Chair Car allow no excess at all</strong> — the maximum is the free allowance.</li>
        <li>Ticketless travel now costs <strong>₹500 minimum plus the fare</strong>, doubled from ₹250 on 1 July 2026.</li>
        <li>Approach the TTE before the TTE approaches you. It changes the transaction.</li>
      </ul>

      <p>
        None of these rules is obscure, and none of them requires an argument to apply. Knowing the hour, the
        weight and the number is usually the whole of it.
      </p>
    </GuidePageLayout>
  );
}
