// TDR (Ticket Deposit Receipt) refund scenarios per published IRCTC/Indian
// Railways refund rules. Data-driven so the checker UI, tests, and prose all
// read from one table. Deadlines are the published filing limits; outcomes for
// individual claims are decided by the railway after verification.

// refundExtent: 'full' | 'partial' | 'difference' | 'auto-full' | 'auto-clerkage'
// needsTdr: whether a TDR filing is required for an e-ticket in this scenario.
const TDR_SCENARIOS = [
  {
    id: 'train-cancelled',
    label: 'Train was cancelled by the railways',
    eligible: true,
    needsTdr: false,
    refundExtent: 'auto-full',
    refundText: 'Full fare, automatically',
    deadlineText: 'No action needed for e-tickets — refund is automatic. Counter tickets: surrender at a reservation counter within 3 days of scheduled departure.',
    detail:
      'When Indian Railways cancels the train, e-ticket refunds are processed automatically for the full fare — no cancellation charge, no TDR. If the refund does not arrive within a week, raise it with IRCTC customer care rather than filing a TDR.'
  },
  {
    id: 'delay-3h',
    label: 'Train is running 3+ hours late and I chose not to travel',
    eligible: true,
    needsTdr: true,
    refundExtent: 'full',
    refundText: 'Full fare',
    deadlineText: 'File the TDR before the actual departure of the train from your boarding station.',
    detail:
      'A delay of 3 hours or more over the scheduled departure entitles you to a full refund if you do not travel. The critical part is timing: the TDR must be filed before the train actually leaves your station — after it departs, the claim window is gone.'
  },
  {
    id: 'ac-failure',
    label: 'AC was not working for part of the journey',
    eligible: true,
    needsTdr: true,
    refundExtent: 'difference',
    refundText: 'Difference between AC and non-AC fare for the affected distance',
    deadlineText: 'File the TDR within 20 hours of the train’s actual arrival at your destination.',
    detail:
      'You are refunded the difference between the AC-class fare and the corresponding non-AC fare for the distance the AC did not work. Get a certificate from the TTE on board noting the failure — claims with the TTE certificate number are verified much faster.'
  },
  {
    id: 'travelled-lower-class',
    label: 'I was made to travel in a lower class than booked',
    eligible: true,
    needsTdr: true,
    refundExtent: 'difference',
    refundText: 'Difference between the booked-class and travelled-class fare',
    deadlineText: 'File the TDR within 2 days of the date of issue of the certificate from the TTE.',
    detail:
      'If the railway accommodates you in a lower class (for example, 2A booking travelling in 3A), the fare difference is refundable. Ask the TTE for a certificate stating the class actually travelled — the TDR references it.'
  },
  {
    id: 'rac-not-travelled',
    label: 'Ticket was RAC / partially waitlisted and I did not travel',
    eligible: true,
    needsTdr: true,
    refundExtent: 'partial',
    refundText: 'Fare minus clerkage (₹60 + GST per passenger)',
    deadlineText: 'File the TDR (or cancel online) at least 30 minutes before scheduled departure.',
    detail:
      'RAC tickets are not auto-cancelled at charting the way fully waitlisted e-tickets are. If you will not travel, act at least 30 minutes before departure — after that window closes, no refund is admissible for RAC tickets.'
  },
  {
    id: 'wl-not-travelled',
    label: 'E-ticket was still fully waitlisted at chart preparation',
    eligible: true,
    needsTdr: false,
    refundExtent: 'auto-clerkage',
    refundText: 'Fare minus clerkage, automatically',
    deadlineText: 'No action needed — fully waitlisted e-tickets are auto-cancelled and refunded at charting.',
    detail:
      'A fully waitlisted e-ticket is dropped automatically when the chart is prepared, and the fare minus the clerkage charge comes back to the payment source. Only counter-booked waitlisted tickets need surrendering at a counter (up to 30 minutes before departure).'
  },
  {
    id: 'partial-party-travelled',
    label: 'Some passengers on the ticket travelled, others did not',
    eligible: true,
    needsTdr: true,
    refundExtent: 'partial',
    refundText: 'Fare for the confirmed passengers who did not travel, less the cancellation charge',
    deadlineText: 'Get a certificate from the TTE, then file the TDR within 72 hours of the train’s actual arrival.',
    detail:
      'When a family or group ticket is partially used, the passengers who did not travel can claim their portion. The on-board TTE certificate stating who travelled is what makes or breaks this claim — get it during the journey, not after.'
  },
  {
    id: 'missed-connection',
    label: 'Missed my connecting train because the first train ran late',
    eligible: true,
    needsTdr: true,
    refundExtent: 'full',
    refundText: 'Full fare of the missed (untravelled) leg',
    deadlineText: 'File the TDR within 3 days of the scheduled departure of the missed connecting train.',
    detail:
      'Applies to connecting journeys booked against the same account where the delay of the first train caused the miss. The untravelled leg is refundable in full; the travelled leg is not.'
  },
  {
    id: 'inside-8h-change-of-plans',
    label: 'I simply changed my plans less than 8 hours before departure',
    eligible: false,
    needsTdr: false,
    refundExtent: 'none',
    refundText: 'No refund',
    deadlineText: '—',
    detail:
      'Voluntary cancellation inside 8 hours of departure (under the April 2026 rules) gets no refund, and a TDR cannot convert a change of plans into a valid claim. TDR reasons are verified against train running records — a claim without a qualifying event will be rejected.'
  }
];

const getScenario = (id) => TDR_SCENARIOS.find((s) => s.id === id) || null;

module.exports = { TDR_SCENARIOS, getScenario };
