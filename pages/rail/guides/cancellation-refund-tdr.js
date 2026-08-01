import GuidePageLayout from '../../../components/guides/GuidePageLayout';
import Callout from '../../../components/guides/Callout';
import {
  CLASS_RULES,
  CLERKAGE,
  GST_RATE,
  clerkagePerPassenger,
  computeCancellationRefund,
  flatChargePerPassenger,
} from '../../../utils/engines/irctcCancellation';
import { TDR_SCENARIOS } from '../../../utils/engines/tdrRules';

const CANONICAL = '/rail/guides/cancellation-refund-tdr';

// Every figure below is read from the same engines the calculators run, so the
// prose cannot quote a charge the tools would not actually compute.
const rupees = (n) => `₹${Number(n).toFixed(2).replace(/\.00$/, '')}`;
const CLERKAGE_TOTAL = clerkagePerPassenger();
const GST_PERCENT = `${GST_RATE * 100}%`;

// Worked example carried through the page. One 3A ticket, ₹1,800, two passengers,
// cancelled at three different moments — the slab boundaries are the whole point.
const EXAMPLE = { classCode: '3A', ticketType: 'confirmed', fare: 1800, passengers: 2 };
const at = (hoursBeforeDeparture) =>
  computeCancellationRefund({ ...EXAMPLE, hoursBeforeDeparture });
const EARLY = at(96);
const MID = at(48);
const LATE = at(12);
const TOO_LATE = at(4);

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Train Ticket Cancellation Charges, Refunds and TDR Explained',
  description:
    'What Indian Railways actually deducts when you cancel — the 72, 24 and 8 hour slabs, flat charges by class, RAC and waitlist clerkage, why Tatkal is different, and when you need to file a TDR instead.',
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
      name: 'How much is deducted if I cancel a confirmed train ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `More than 72 hours before departure you lose only the flat charge for your class — ${rupees(
          CLASS_RULES['1A'].flat
        )} in AC First and Executive, down to ${rupees(
          CLASS_RULES['2S'].flat
        )} in Second Sitting, plus ${GST_PERCENT} GST on AC classes. Between 72 and 24 hours you lose 25% of the fare, between 24 and 8 hours you lose 50%, and inside 8 hours of departure a confirmed ticket earns no refund at all. The flat charge is a minimum, so on a cheap ticket the percentage slab may not bite.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Do I get a refund if I cancel less than 8 hours before the train?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Not on a confirmed ticket. Under the rules effective 1 April 2026, voluntary cancellation inside 8 hours of scheduled departure carries no refund. RAC and waitlisted tickets are different: they can be cancelled up to 30 minutes before departure and refund the fare less clerkage.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the refund on a waitlisted ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `A fully waitlisted e-ticket is cancelled automatically when the chart is prepared and the fare comes back less clerkage of ${rupees(
          CLERKAGE
        )} plus GST per passenger — ${rupees(
          CLERKAGE_TOTAL
        )} in total. No TDR and no action are needed. Only counter-booked waitlisted tickets have to be surrendered at a reservation counter.`,
      },
    },
    {
      '@type': 'Question',
      name: 'Is a Tatkal ticket refundable?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A confirmed Tatkal ticket gets no refund on cancellation, at any notice. Tatkal tickets that are still RAC or waitlisted are refunded like any other RAC or waitlisted ticket, less clerkage. The exception is when the railway is at fault — a cancelled train or a 3-hour delay refunds a confirmed Tatkal ticket in full.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is a TDR and when do I need to file one?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A Ticket Deposit Receipt is a claim you raise when something went wrong that ordinary cancellation cannot handle — the AC failed, you were moved to a lower class, the train ran more than 3 hours late and you chose not to travel, or you missed a connection. You do not file a TDR to cancel a ticket, and a TDR cannot turn a change of plans into a refund: claims are verified against the train running record.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does an IRCTC refund take to arrive?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A straightforward online cancellation is normally credited back to the payment source within 3 to 7 working days. TDR claims take considerably longer because they are verified before settlement — typically 60 to 90 days, and sometimes longer where a TTE certificate has to be matched against the on-board record.',
      },
    },
  ],
};

export default function CancellationRefundTdrGuide() {
  return (
    <GuidePageLayout
      title="Cancellation Charges, Refunds & TDR"
      description="What Indian Railways actually deducts when you cancel — the 72, 24 and 8 hour slabs, flat charges by class, RAC and waitlist clerkage, why Tatkal is the exception, and the cases where you file a TDR instead."
      canonicalPath={CANONICAL}
      reviewedOn="August 1, 2026"
      articleSchema={[articleSchema, faqSchema]}
    >
      <p>
        Cancelling a train ticket is two different transactions wearing the same name. One is voluntary — you
        changed your mind, and the railway keeps a share of the fare that grows as departure approaches. The
        other is a claim: something went wrong that was not your doing, and you are asking for money back that
        the ordinary cancellation flow will not give you. The first is a button. The second is a{' '}
        <strong>TDR</strong>. Confusing them is the single most common way people lose a refund they were
        entitled to.
      </p>

      <h2>Voluntary cancellation: the three thresholds</h2>
      <p>
        Under the rules effective <strong>1 April 2026</strong>, a confirmed ticket falls into one of four
        bands, measured from the train&rsquo;s scheduled departure:
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-ink-muted dark:border-slate-700 dark:text-slate-400">
              <th scope="col" className="py-2 pr-3 font-semibold">When you cancel</th>
              <th scope="col" className="py-2 pr-3 font-semibold">What you lose</th>
              <th scope="col" className="py-2 font-semibold">On the example ticket</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['More than 72 hours before', 'The flat charge for your class only', EARLY],
              ['72 to 24 hours before', '25% of the fare (or the flat charge, whichever is higher)', MID],
              ['24 to 8 hours before', '50% of the fare (or the flat charge, whichever is higher)', LATE],
              ['Less than 8 hours before', 'The whole fare — no refund', TOO_LATE],
            ].map(([when, what, result]) => (
              <tr key={when} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <th scope="row" className="py-2.5 pr-3 font-medium text-ink dark:text-white">{when}</th>
                <td className="py-2.5 pr-3 text-ink-muted dark:text-slate-400">{what}</td>
                <td className="py-2.5 text-ink-muted dark:text-slate-400">
                  {rupees(result.refund)} back
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        The example is a single <strong>AC 3-Tier ticket for two passengers at {rupees(EXAMPLE.fare)}</strong>,
        and the figures in that last column are computed by the same engine that powers the{' '}
        <a href="/rail/irctc-cancellation-calculator">cancellation calculator</a> — put your own fare in and it
        will do the arithmetic for your ticket rather than this one.
      </p>

      <Callout tone="note">
        <p>
          <strong>The 8-hour cliff is the one to remember.</strong> Between the 24-hour and the 8-hour mark you
          still recover half the fare; a few hours later you recover nothing. On the example ticket that is the
          difference between {rupees(LATE.refund)} and {rupees(TOO_LATE.refund)}. If a trip is looking
          doubtful, deciding the evening before is worth real money.
        </p>
      </Callout>

      <h3>The flat charge by class</h3>
      <p>
        The flat charge is both the whole deduction in the earliest band and the <em>minimum</em> deduction in
        every other band. That second role is what surprises people on cheap tickets: 25% of a small fare can
        easily be less than the flat charge, and the flat charge wins.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-ink-muted dark:border-slate-700 dark:text-slate-400">
              <th scope="col" className="py-2 pr-3 font-semibold">Class</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Flat charge</th>
              <th scope="col" className="py-2 font-semibold">With GST, per passenger</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(CLASS_RULES).map(([code, rule]) => (
              <tr key={code} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <th scope="row" className="py-2.5 pr-3 font-medium text-ink dark:text-white">{rule.label}</th>
                <td className="py-2.5 pr-3 text-ink-muted dark:text-slate-400">{rupees(rule.flat)}</td>
                <td className="py-2.5 text-ink-muted dark:text-slate-400">
                  {rupees(flatChargePerPassenger(code))}
                  {rule.gst ? '' : ' — no GST'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        GST of {GST_PERCENT} applies to the cancellation charge on <strong>AC classes only</strong>. Sleeper and
        Second Sitting are charged flat. And the charge is <em>per passenger</em>, not per ticket — a family of
        four cancelling a Sleeper booking loses four times {rupees(CLASS_RULES.SL.flat)}, not one.
      </p>

      <h2>RAC and waitlisted tickets: clerkage, and a 30-minute deadline</h2>
      <p>
        RAC and waitlisted tickets do not use the slabs at all. They refund the fare less{' '}
        <strong>clerkage of {rupees(CLERKAGE)} plus GST</strong> — {rupees(CLERKAGE_TOTAL)} per passenger — and
        the deadline is much later than for a confirmed ticket: up to <strong>30 minutes</strong> before
        scheduled departure. Miss that half-hour and the refund is gone entirely.
      </p>
      <p>
        There is one case where you do not have to do anything at all. A <strong>fully waitlisted e-ticket</strong>{' '}
        is dropped automatically at chart preparation and refunded less clerkage, without a cancellation and
        without a TDR. This is also why boarding on one is a serious mistake — the ticket no longer exists, so
        it is a ticketless journey. An <a href="/rail/waitlist-confirmation-chances">honest read of your
        waitlist number</a> beforehand is worth more than the refund.
      </p>

      <Callout>
        <p>
          <strong>RAC is not auto-cancelled.</strong> Only <em>fully</em> waitlisted e-tickets are dropped at
          charting. An RAC ticket is a valid ticket to travel on, so nobody cancels it for you — if you are not
          going to use it, you have to act at least 30 minutes before departure yourself.
        </p>
      </Callout>

      <h2>Tatkal: confirmed means non-refundable</h2>
      <p>
        A <strong>confirmed Tatkal ticket earns no refund on cancellation</strong>, however much notice you
        give. That is the trade for jumping the queue, and it is not a slab you can beat by cancelling early.
        Tatkal tickets still sitting at RAC or waitlisted are treated like any other RAC or waitlisted ticket
        and refund the fare less clerkage.
      </p>
      <p>
        The exception is fault. If the railway cancels the train, or it runs more than three hours late and you
        decide not to travel, a confirmed Tatkal ticket is refunded in full like any other. Non-refundable
        describes <em>your</em> change of mind, not theirs. The{' '}
        <a href="/rail/tatkal-charges-calculator">Tatkal charges calculator</a> shows what the premium costs
        before you commit to it.
      </p>

      <h2>When you need a TDR instead</h2>
      <p>
        A Ticket Deposit Receipt is a claim against a specific qualifying event. You are not cancelling; you are
        telling the railway that something happened and asking it to check the record. Each scenario carries its
        own deadline, and the deadlines are short — most claims that fail, fail on timing rather than merit.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-ink-muted dark:border-slate-700 dark:text-slate-400">
              <th scope="col" className="py-2 pr-3 font-semibold">Situation</th>
              <th scope="col" className="py-2 pr-3 font-semibold">You get back</th>
              <th scope="col" className="py-2 font-semibold">Deadline</th>
            </tr>
          </thead>
          <tbody>
            {TDR_SCENARIOS.filter((s) => s.eligible).map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <th scope="row" className="py-2.5 pr-3 font-medium text-ink dark:text-white">{s.label}</th>
                <td className="py-2.5 pr-3 text-ink-muted dark:text-slate-400">{s.refundText}</td>
                <td className="py-2.5 text-ink-muted dark:text-slate-400">{s.deadlineText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        The <a href="/rail/tdr-refund-checker">TDR refund checker</a> walks through these case by case, including
        the ones that are not eligible.
      </p>

      <h3>The TTE certificate is the evidence</h3>
      <p>
        Three of those claims — AC failure, travelling in a lower class than booked, and a partly used group
        ticket — depend on a certificate you can only get <em>on the train</em>. Ask the TTE at the time, note
        the certificate number, and photograph it. Once you have got off, the claim is your word against a
        record that does not mention you, and it will be rejected.
      </p>

      <Callout tone="note">
        <p>
          <strong>A TDR is not a way to cancel late.</strong> Filing one because you changed your plans inside
          8 hours does not work: TDR reasons are verified against the train running record, and a claim with no
          qualifying event behind it is refused. It also costs you weeks of waiting to find that out.
        </p>
      </Callout>

      <h2>How long the money takes</h2>
      <p>
        A normal online cancellation is credited back to the original payment method in roughly{' '}
        <strong>3 to 7 working days</strong>. TDR claims are slower by design, because each is verified before
        it is settled — plan on <strong>60 to 90 days</strong>, and longer where a TTE certificate has to be
        matched against the on-board record. Neither is instant, and chasing on day three achieves nothing.
      </p>
      <p>
        Counter-booked tickets refund at a counter, not to a card. If you booked at a window, you surrender at a
        window — and for a cancelled train, within three days of scheduled departure.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>Confirmed tickets: flat charge beyond 72 hours, <strong>25%</strong> inside 72, <strong>50%</strong> inside 24, <strong>nothing inside 8</strong>.</li>
        <li>The flat charge is a <strong>minimum</strong> and is charged per passenger — on cheap tickets it beats the percentage.</li>
        <li>RAC and waitlisted: fare less {rupees(CLERKAGE_TOTAL)} clerkage, but you must act <strong>30 minutes</strong> before departure.</li>
        <li>Fully waitlisted e-tickets cancel themselves at charting. <strong>RAC does not.</strong></li>
        <li>Confirmed Tatkal is non-refundable unless the railway is at fault.</li>
        <li>File a TDR only for a qualifying event, and get the TTE certificate <strong>before you get off the train</strong>.</li>
      </ul>

      <p>
        Most of the money lost to cancellation charges is lost to a clock rather than a rule. The bands are
        published, the deadlines are fixed, and the only genuinely irreversible one is the eight-hour mark.
      </p>
    </GuidePageLayout>
  );
}
