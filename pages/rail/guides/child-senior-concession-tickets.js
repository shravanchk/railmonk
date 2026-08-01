import GuidePageLayout from '../../../components/guides/GuidePageLayout';
import Callout from '../../../components/guides/Callout';

const CANONICAL = '/rail/guides/child-senior-concession-tickets';

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Child Tickets, Senior Citizen Fares and Railway Concessions',
  description:
    'The age rules for child train tickets, the 2016 change that made a berth cost full fare, the current status of the senior citizen concession, and which railway concessions actually still exist.',
  author: { '@type': 'Organization', name: 'Railmonk Research Team' },
  publisher: { '@type': 'Organization', name: 'Railmonk' },
  datePublished: '2026-08-01',
  dateModified: '2026-08-01',
  mainEntityOfPage: `https://railmonk.com${CANONICAL}`,
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the age limit for a child train ticket in India?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Children below 5 years travel free and are not issued a ticket, though they get no berth of their own. From 5 years up to under 12, a ticket is required. Age is reckoned as on the date of the journey, not the date of booking.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do children between 5 and 12 pay full fare on Indian Railways?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It depends on whether you want a berth. Since 21 April 2016, a child aged 5 to under 12 allotted a separate berth or seat pays the full adult fare. If you choose not to take a separate berth, the child pays half fare — subject to the minimum fare for the class — and shares the accompanying adult’s berth.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can a child under 5 be given a berth?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, but not free. A child under 5 travels free only without a berth. If you want a berth reserved for them, you book them at full fare like any other passenger — which for a long overnight journey with a toddler is often worth it.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the senior citizen concession on train tickets available in 2026?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. The senior citizen fare concession — 40% for men aged 60 and above and 50% for women aged 58 and above — was withdrawn on 20 March 2020 and has not been restored. What does continue is the lower berth preference: senior citizens are still given priority in lower berth allotment, which is an allocation rule rather than a discount.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which railway concessions still exist?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Three groups survived the 2020 withdrawal: persons with disabilities (Divyangjan) across four categories, patients travelling for treatment of eleven specified conditions including cancer, tuberculosis, thalassemia, heart and kidney disease, and students. Most other categories — senior citizens, journalists, sportspersons, teachers, and others — remain withdrawn.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need age proof for a child train ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You declare the child’s age at booking and it is printed on the ticket. Staff can ask for proof, so carrying an Aadhaar card, birth certificate or school ID for a child close to the 5 or 12 year boundary is sensible. Declaring an under-age falsely to avoid a fare is treated as travelling on an incorrect ticket.',
      },
    },
  ],
};

export default function ChildSeniorConcessionGuide() {
  return (
    <GuidePageLayout
      title="Child Tickets, Senior Fares & Concessions"
      description="Age rules for child train tickets, the 2016 change that made a berth cost full fare, where the senior citizen concession actually stands now, and which railway concessions still exist."
      canonicalPath={CANONICAL}
      reviewedOn="August 1, 2026"
      articleSchema={[articleSchema, faqSchema]}
    >
      <p>
        Two questions in this area get asked far more than any others, and both have answers that changed in the
        last decade — which is why so much of the advice floating around is confidently out of date. Children
        aged five to eleven have not automatically travelled at half fare since 2016. Senior citizens have not
        received a fare concession since March 2020. Neither change was quietly reversed, however often you
        hear otherwise.
      </p>

      <h2>Child tickets: the rule turns on the berth, not the age</h2>
      <p>
        Age decides whether a ticket is needed at all. What you pay, once one is needed, depends entirely on
        whether the child gets a berth of their own.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-ink-muted dark:border-slate-700 dark:text-slate-400">
              <th scope="col" className="py-2 pr-3 font-semibold">Age on the date of travel</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Without a separate berth</th>
              <th scope="col" className="py-2 font-semibold">With a separate berth</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Under 5 years', 'Free — no ticket issued', 'Full adult fare, if you choose to book one'],
              ['5 to under 12 years', 'Half fare, subject to the minimum fare for the class', 'Full adult fare'],
              ['12 years and above', 'Not applicable — a berth is always allotted', 'Full adult fare'],
            ].map(([age, without, withBerth]) => (
              <tr key={age} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <th scope="row" className="py-2.5 pr-3 font-medium text-ink dark:text-white">{age}</th>
                <td className="py-2.5 pr-3 text-ink-muted dark:text-slate-400">{without}</td>
                <td className="py-2.5 text-ink-muted dark:text-slate-400">{withBerth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        The change that catches people out came into force on <strong>21 April 2016</strong>. Before it, a child
        aged 5 to 11 paid half fare and was still allotted a berth. Since then, half fare buys no berth — the
        child shares yours — and a berth of their own costs the same as an adult&rsquo;s. Both options remain
        available at booking; it is a choice you make, not something the system decides for you.
      </p>

      <Callout tone="note">
        <p>
          <strong>Half fare is not half of what you would otherwise pay.</strong> It is subject to the minimum
          fare for the class, so on short journeys the two options can be much closer than you expect. On an
          overnight journey in Sleeper or 3A, the gap is usually large enough that sharing a single berth with a
          nine-year-old is a genuine decision rather than an obvious saving.
        </p>
      </Callout>

      <h3>Practical notes on booking children</h3>
      <ul>
        <li>
          Age is reckoned <strong>as on the date of the journey</strong>. A child who turns 12 the week before
          travel is an adult for that ticket, even though they were 11 when you booked.
        </li>
        <li>
          A child under 5 travelling free is still worth <strong>adding to the booking</strong> as a
          non-berth passenger where the form allows it. It puts them on the chart, which matters if anyone asks.
        </li>
        <li>
          Carry <strong>age proof</strong> for a child near either boundary — Aadhaar, a birth certificate or a
          school ID. It is rarely asked for and awkward when it is.
        </li>
        <li>
          Children do not get a separate luggage allowance. The{' '}
          <a href="/rail/guides/train-travel-rules">free allowance for the class</a> covers the whole booking.
        </li>
      </ul>

      <h2>Senior citizens: where the concession actually stands</h2>
      <p>
        Indian Railways defines a senior citizen as a <strong>man aged 60 or above</strong> or a{' '}
        <strong>woman aged 58 or above</strong>. Until March 2020 that status carried a fare concession of 40%
        for men and 50% for women across most classes.
      </p>
      <p>
        That concession was <strong>withdrawn on 20 March 2020</strong>, alongside almost all other categories,
        and it has not been restored. The question has been raised in Parliament repeatedly since and the answer
        has not changed. If you are being told otherwise by a booking agent, or by a page that does not say when
        it was last updated, the claim is stale.
      </p>

      <Callout>
        <p>
          <strong>What did survive is the lower berth preference.</strong> Senior citizens, women aged 45 and
          above, and pregnant women continue to get priority in lower berth allotment, and there is a reserved
          allocation of lower berths for them in Sleeper and AC classes. This is an <em>allocation</em> rule, not
          a discount — it costs nothing and it is applied automatically when ages are entered correctly at
          booking, which is a good reason to enter them correctly.
        </p>
      </Callout>

      <p>
        The preference operates at berth allotment, so it works best when there is inventory left to allot
        from. Booking early matters more for it than any request made later — by the time you are looking at{' '}
        <a href="/rail/waitlist-confirmation-chances">a waitlist number</a>, berth preference is no longer the
        constraint.
      </p>

      <h2>Which concessions still exist</h2>
      <p>
        The March 2020 withdrawal covered most of the roughly fifty concession categories the railway used to
        operate. Three groups were subsequently restored and remain in force:
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-ink-muted dark:border-slate-700 dark:text-slate-400">
              <th scope="col" className="py-2 pr-3 font-semibold">Category</th>
              <th scope="col" className="py-2 font-semibold">What it covers</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                'Divyangjan (persons with disabilities)',
                'Four categories, including orthopaedic and mobility disabilities, blindness and hearing impairment. An escort travelling with the passenger is covered on the same basis.',
              ],
              [
                'Patients',
                'Eleven specified conditions, including cancer, tuberculosis, thalassemia, heart disease, kidney disease and haemophilia, for journeys undertaken for treatment.',
              ],
              [
                'Students',
                'For specified journeys, typically between home and place of study, on production of a certificate from the institution.',
              ],
            ].map(([cat, covers]) => (
              <tr key={cat} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <th scope="row" className="py-2.5 pr-3 font-medium text-ink dark:text-white">{cat}</th>
                <td className="py-2.5 text-ink-muted dark:text-slate-400">{covers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        Concession rates vary by category and by class rather than being a single percentage, and they are not
        applied automatically. Each requires documentation held <em>before</em> you book — for Divyangjan
        travel, a photo identity card issued by the railways; for patients, a certificate from the treating
        hospital; for students, a certificate from the institution.
      </p>

      <Callout tone="note">
        <p>
          <strong>Concession tickets generally cannot be booked online without prior registration.</strong> The
          Divyangjan concession in particular requires the railway-issued ID card to be registered against your
          IRCTC account before the option appears at booking. That is a counter or divisional-office errand, and
          it is not something you can complete on the morning of travel.
        </p>
      </Callout>

      <h2>The short version</h2>
      <ul>
        <li>Under 5: <strong>free, no berth</strong>. A berth for them costs full fare.</li>
        <li>5 to under 12: <strong>half fare without a berth, full fare with one</strong> — since 21 April 2016.</li>
        <li>Age counts <strong>on the date of travel</strong>.</li>
        <li>The senior citizen fare concession has been <strong>withdrawn since 20 March 2020</strong> and is not back.</li>
        <li>Senior <strong>lower berth preference does continue</strong>, and costs nothing.</li>
        <li>Divyangjan, specified patients and students are the categories that still hold a concession — each needs paperwork arranged in advance.</li>
      </ul>

      <p>
        The pattern across all of it: the railway now discounts far less than it used to, but it still allocates
        by need. Entering ages and categories accurately at booking is what switches the allocation rules on,
        and it is free.
      </p>
    </GuidePageLayout>
  );
}
