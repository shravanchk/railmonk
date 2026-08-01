import GuidePageLayout from '../../../components/guides/GuidePageLayout';
import Callout from '../../../components/guides/Callout';

const CANONICAL = '/rail/guides/pnr-status-availability-codes';

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'PNR Status and Availability Codes Explained',
  description:
    'How to read an Indian Railways PNR — the difference between booking status and current status, what CNF, RAC, WL, CURR_AVBL and REGRET mean, and what changes when the chart is prepared.',
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
      name: 'What is the difference between booking status and current status?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Booking status is a frozen record of what your ticket was at the moment it was issued — it never changes. Current status is where the ticket stands now. A ticket showing GNWL 42 as booking status and CNF as current status is confirmed; the 42 is history. Reading the booking status as if it were live is the single most common misreading of a PNR.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does CNF mean on a train ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'CNF means confirmed — you have a reserved berth. Before the chart is prepared the coach and berth number may not be shown yet, which is normal and does not make the confirmation provisional. The allotment appears once charting runs.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does CURR_AVBL mean?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'CURR_AVBL is current availability — berths that are free after the chart has been prepared, released from quotas that went unused. They can be booked right up to departure, and they are the reason a train showing a long waitlist yesterday can have seats today.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does REGRET mean when booking a train ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'REGRET means the waitlist itself is full — the railway has stopped issuing further waitlisted tickets for that class and quota. It is not a temporary state you can refresh past; nothing more will be sold unless cancellations reopen the list.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many digits is a PNR number?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'An Indian Railways PNR is 10 digits. One PNR covers up to six passengers travelling together on the same journey, which is why a family booking has one number rather than six.',
      },
    },
    {
      '@type': 'Question',
      name: 'When does PNR status stop changing?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'At final chart preparation, about 30 minutes before departure. The first chart is now prepared at least 10 hours before departure, and movement between the two charts is limited — the bulk of waitlist clearing happens before the first chart, not after it.',
      },
    },
  ],
};

export default function PnrStatusCodesGuide() {
  return (
    <GuidePageLayout
      title="PNR Status & Availability Codes"
      description="How to actually read an Indian Railways PNR — booking status versus current status, what CNF, RAC, WL, CURR_AVBL and REGRET mean, and what changes at chart preparation."
      canonicalPath={CANONICAL}
      reviewedOn="August 1, 2026"
      articleSchema={[articleSchema, faqSchema]}
    >
      <p>
        A PNR tells you more than most people read off it. The status line is two pieces of information printed
        side by side, one of which is history and one of which is live — and confusing the two is why travellers
        panic about a confirmed ticket, or turn up at the station believing a waitlisted one cleared.
      </p>

      <Callout tone="note">
        <p>
          <strong>Railmonk does not carry live PNR data.</strong> Checking an actual PNR needs a live feed from
          Indian Railways — use the IRCTC portal or NTES for that. This page is about understanding what the
          answer means once you have it.
        </p>
      </Callout>

      <h2>What the number itself is</h2>
      <p>
        A Passenger Name Record is <strong>10 digits</strong>, and it covers the whole booking rather than one
        traveller — up to <strong>six passengers</strong> on the same journey share a single PNR. The leading
        digit identifies which Passenger Reservation System issued it, which is occasionally useful for
        understanding where a booking originated and almost never useful to a passenger.
      </p>
      <p>
        What matters is that the PNR is the unit the railway thinks in. Cancellations, refunds, TDR claims and
        chart entries all attach to it, which is why a partly-cancelled group booking behaves the way it does:
        one record, several passengers, individual statuses inside it.
      </p>

      <h2>Booking status and current status are different columns</h2>
      <p>
        Every passenger on the PNR has two statuses:
      </p>
      <ul>
        <li>
          <strong>Booking status</strong> — what the ticket was when it was issued. It is a frozen historical
          record. It does not update, ever.
        </li>
        <li>
          <strong>Current status</strong> — where the ticket stands right now. This is the one that moves.
        </li>
      </ul>
      <p>
        So a passenger showing booking status <code>GNWL 42</code> and current status <code>CNF/B4/21</code> is
        confirmed in coach B4, berth 21. The 42 is not a waitlist they are still sitting on; it is where they
        started. Equally, a booking status of <code>CNF</code> with a current status of <code>CAN</code> means a
        confirmed ticket that was later cancelled.
      </p>

      <Callout>
        <p>
          <strong>If you only read one field, read the current status.</strong> Screenshots circulated in family
          groups almost always show the booking status, because it is the one printed most prominently on the
          e-ticket. It is also the one that is out of date the moment anything happens.
        </p>
      </Callout>

      <h2>Status codes you will see</h2>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-ink-muted dark:border-slate-700 dark:text-slate-400">
              <th scope="col" className="py-2 pr-3 font-semibold">Code</th>
              <th scope="col" className="py-2 font-semibold">What it means</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['CNF', 'Confirmed. A berth is yours. Coach and berth appear at charting if they are not shown already.'],
              ['RAC', 'Reservation Against Cancellation. You may board and you have a seat — a shared side-lower berth — but not a berth to yourself unless it clears.'],
              ['WL', 'Waitlisted. No seat yet. On an e-ticket, a fully waitlisted booking is cancelled automatically at charting.'],
              ['CAN / CANCELLED', 'The ticket was cancelled, either by you or automatically at charting.'],
              ['MOD', 'The booking was modified after issue — typically a boarding point change.'],
              ['B4/21, S7/54', 'Coach and berth. The letter group is the coach, the number is the berth within it.'],
            ].map(([code, meaning]) => (
              <tr key={code} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <th scope="row" className="py-2.5 pr-3 font-mono text-xs font-medium text-ink dark:text-white">{code}</th>
                <td className="py-2.5 text-ink-muted dark:text-slate-400">{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        Waitlist codes carry a prefix telling you which queue you are in — <code>GNWL</code>, <code>RLWL</code>,{' '}
        <code>PQWL</code>, <code>TQWL</code> and others. The prefix matters far more than the number, because
        the queues clear at wildly different rates. That is a subject in itself:{' '}
        <a href="/rail/guides/waitlist-rac-guide">the waitlist and RAC guide</a> covers what each prefix means
        for your odds, and the{' '}
        <a href="/rail/waitlist-confirmation-chances">confirmation chances tool</a> will score a specific code
        and number.
      </p>

      <h2>Availability codes when you are searching for a train</h2>
      <p>
        Before you have a PNR at all, the availability grid uses its own vocabulary. These are not statuses —
        they describe what the railway will sell you right now.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-ink-muted dark:border-slate-700 dark:text-slate-400">
              <th scope="col" className="py-2 pr-3 font-semibold">Code</th>
              <th scope="col" className="py-2 font-semibold">What it means</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['AVAILABLE 0126', 'Berths free right now. Book and you are confirmed immediately.'],
              ['RAC 12', 'Confirmed berths are gone; you would be twelfth in the RAC queue and can still travel.'],
              ['WL 45', 'You would be issued a waitlisted ticket at number 45 in that queue.'],
              ['REGRET / NOT AVAILABLE', 'The waitlist is full. Nothing further is being sold in that class and quota.'],
              ['CURR_AVBL', 'Current availability — berths released after charting, bookable until departure.'],
              ['CHART NOT PREPARED', 'Charting has not run yet, so no allotment exists to show.'],
              ['TRAIN DEPARTED', 'The train has left. Nothing more can be booked on it.'],
            ].map(([code, meaning]) => (
              <tr key={code} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <th scope="row" className="py-2.5 pr-3 font-mono text-xs font-medium text-ink dark:text-white">{code}</th>
                <td className="py-2.5 text-ink-muted dark:text-slate-400">{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        <strong>REGRET is the one worth understanding properly.</strong> It does not mean the train is heavily
        booked and you should keep refreshing; it means the waitlist has hit its ceiling and the railway has
        stopped issuing tickets in that class and quota. Refreshing helps only if cancellations reopen the list.
        A different class, a different quota or{' '}
        <a href="/rail/guides/quotas-vikalp-break-journey">VIKALP</a> are the realistic moves.
      </p>

      <h2>What charting changes</h2>
      <p>
        The <strong>first chart is prepared at least 10 hours before departure</strong> — moved up from 8 hours
        in December 2025 — and the final chart around 30 minutes before. Charting is when the status you have
        been watching turns into an actual berth allotment.
      </p>
      <p>At that moment several things happen at once:</p>
      <ul>
        <li>Confirmed passengers get their coach and berth numbers.</li>
        <li>RAC passengers are allotted their shared side-lower seats, and some clear to full berths.</li>
        <li><strong>Fully waitlisted e-tickets are cancelled automatically</strong> and refunded less clerkage.</li>
        <li>Unused quota berths are released and start appearing as <code>CURR_AVBL</code>.</li>
      </ul>
      <p>
        The <a href="/rail/chart-preparation-time">chart preparation tool</a> works out when charting falls for a
        given departure. The practical consequence of the earlier first chart is that you learn your fate with
        most of a day in hand rather than an evening — enough time to actually arrange an alternative, which was
        the point of the change.
      </p>

      <Callout tone="note">
        <p>
          <strong>Movement between the two charts is limited.</strong> Most waitlist clearing happens before the
          first chart, not in the ten hours after it. If you are still deep in a waitlist when the first chart
          runs, treating that as close to final is the realistic reading, not a pessimistic one.
        </p>
      </Callout>

      <h2>The short version</h2>
      <ul>
        <li>A PNR is <strong>10 digits</strong> and covers up to <strong>six passengers</strong>.</li>
        <li><strong>Booking status is frozen history; current status is live.</strong> Read the second one.</li>
        <li><code>CNF</code> without a berth number just means charting has not run yet.</li>
        <li><code>REGRET</code> means the waitlist is closed, not that you should keep trying.</li>
        <li><code>CURR_AVBL</code> is post-charting availability — worth checking even on a train that looked full.</li>
        <li>Fully waitlisted e-tickets <strong>cancel themselves at charting</strong>; RAC tickets do not.</li>
      </ul>

      <p>
        None of this requires checking a PNR more than a couple of times a day. The status changes when the
        railway runs a process, not when you refresh — and the processes happen on a schedule you can look up.
      </p>
    </GuidePageLayout>
  );
}
