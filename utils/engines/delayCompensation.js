// What a delayed train entitles you to outside India.
//
// The important thing this engine encodes is that the world splits into two
// kinds of place. In the EU/EEA, the UK and Switzerland a delay creates a legal
// entitlement with a percentage attached, and the operator has to pay it. In the
// United States and Australia there is no equivalent statute: what you get is
// whatever the operator's own policy and goodwill produce. A tool that printed a
// confident rupee-style number for an Amtrak delay would be inventing a right
// that does not exist, so those schemes return guidance instead of an amount —
// `kind` tells the page which of the two it is looking at.
//
// Percentages are applied to the price of the delayed leg, not the whole
// booking: that is how Regulation (EU) 2021/782 measures it, and how Delay Repay
// treats a return ticket, with the one documented exception of the UK 120-minute
// band which pays out on the full return fare.
//
// Rules verified July 2026 against the sources listed on each scheme.

const MINUTES_PER_HOUR = 60;

/**
 * Delay bands. `from` is inclusive, `to` exclusive (null = open-ended).
 * `basis` picks what the percentage is applied to:
 *   'leg'    — the delayed single journey (half a return fare)
 *   'ticket' — everything the passenger paid, including the unused return
 */
const SCHEMES = [
  {
    id: 'eu',
    label: 'EU / EEA — statutory',
    shortLabel: 'EU / EEA',
    region: 'Europe',
    coverage:
      'All EU member states plus Iceland, Liechtenstein and Norway, under Regulation (EU) 2021/782 (applies from 7 June 2023).',
    kind: 'statutory',
    currency: '€',
    currencyCode: 'EUR',
    bands: [
      { from: 60, to: 120, percent: 25, basis: 'leg' },
      { from: 120, to: null, percent: 50, basis: 'leg' },
    ],
    // Article 19(6): operators may refuse to pay out trivial amounts, but the
    // threshold they set cannot be higher than this.
    minPayout: 4,
    claimWindowDays: 90,
    payWithinDays: 30,
    rerouteThresholdMinutes: 60,
    assistance:
      'At 60 minutes or more you must be offered meals and refreshments proportionate to the wait, and a hotel plus transfers if you are forced to stay overnight.',
    choiceAtThreshold:
      'From 60 minutes you can instead take a full refund (with a ride back to where you started if the journey no longer has a point), continue, or be re-routed to your destination at no extra cost — on the same day or a later date you choose.',
    exemptions: [
      'Extraordinary circumstances — extreme weather, major natural disaster, a public-health crisis',
      'The behaviour of a third party, such as a person on the line, cable theft or sabotage',
      'Your own fault, or a delay you were told about before you bought the ticket',
    ],
    exemptionNote:
      'A strike by the railway’s own staff is explicitly not an extraordinary circumstance, so a strike delay is still compensated. The operator has to prove the exemption, not you.',
    caveat:
      'Member states may exempt their purely domestic urban, suburban, regional and long-distance services from parts of the regulation. Cross-border journeys inside the EU can never be exempted, so an international trip is always covered.',
    sources: [
      { label: 'Your Europe — rail passenger rights', url: 'https://europa.eu/youreurope/citizens/travel/passenger-rights/rail/index_en.htm' },
      { label: 'Regulation (EU) 2021/782', url: 'https://eur-lex.europa.eu/eli/reg/2021/782/oj' },
    ],
  },
  {
    id: 'uk-dr15',
    label: 'Great Britain — Delay Repay 15',
    shortLabel: 'GB (Delay Repay 15)',
    region: 'United Kingdom',
    coverage:
      'The more generous of the two British schemes, used by most large operators. Check your operator’s page — the rest run Delay Repay 30.',
    kind: 'statutory',
    currency: '£',
    currencyCode: 'GBP',
    bands: [
      { from: 15, to: 30, percent: 25, basis: 'leg' },
      { from: 30, to: 60, percent: 50, basis: 'leg' },
      { from: 60, to: 120, percent: 100, basis: 'leg' },
      { from: 120, to: null, percent: 100, basis: 'ticket' },
    ],
    minPayout: 0,
    claimWindowDays: 28,
    payWithinDays: null,
    rerouteThresholdMinutes: 60,
    assistance:
      'Delay Repay is paid on the delay itself. Separately, if you are stranded overnight because of a delay the operator caused, the National Rail Conditions of Travel oblige it to get you to your destination or find you accommodation.',
    choiceAtThreshold:
      'If the delay is bad enough that you choose not to travel at all, you can hand the ticket back unused for a full refund with no administration fee instead of claiming Delay Repay.',
    exemptions: [
      'Delay Repay is no-fault — it is paid even when the cause was outside the operator’s control',
      'Not payable if you were told of the delay before you travelled and chose to travel anyway on a different basis',
    ],
    exemptionNote:
      'This is what makes the British scheme unusual: unlike the EU regulation there is no extraordinary-circumstances escape, so storms and third-party incidents are still paid.',
    caveat:
      'Thresholds are the minimum in the National Rail Conditions of Travel; individual operators can and do pay more generously. Season-ticket holders claim on a different basis, worked out from the daily value of the season.',
    sources: [
      { label: 'National Rail — compensation and refunds', url: 'https://www.nationalrail.co.uk/help-and-assistance/compensation-and-refunds/' },
    ],
  },
  {
    id: 'uk-dr30',
    label: 'Great Britain — Delay Repay 30',
    shortLabel: 'GB (Delay Repay 30)',
    region: 'United Kingdom',
    coverage:
      'The minimum British standard, still used by some regional operators. Nothing is payable below 30 minutes.',
    kind: 'statutory',
    currency: '£',
    currencyCode: 'GBP',
    bands: [
      { from: 30, to: 60, percent: 50, basis: 'leg' },
      { from: 60, to: 120, percent: 100, basis: 'leg' },
      { from: 120, to: null, percent: 100, basis: 'ticket' },
    ],
    minPayout: 0,
    claimWindowDays: 28,
    payWithinDays: null,
    rerouteThresholdMinutes: 60,
    assistance:
      'As with Delay Repay 15, the National Rail Conditions of Travel oblige the operator to get you to your destination, or to arrange accommodation if you are stranded overnight by a delay it caused.',
    choiceAtThreshold:
      'You can hand an unused ticket back for a full refund without an administration fee instead of claiming, if the delay makes you abandon the journey.',
    exemptions: [
      'Delay Repay is no-fault — the cause of the delay does not affect your claim',
      'Not payable if you were told of the delay before travelling and chose to travel anyway on a different basis',
    ],
    exemptionNote:
      'Most major operators have moved to the 15-minute threshold. If your delay was 15–29 minutes, check whether yours has before assuming nothing is due.',
    caveat:
      'Thresholds are minimums; operators can pay more. Season-ticket compensation is calculated separately from the daily value of the season.',
    sources: [
      { label: 'National Rail — compensation and refunds', url: 'https://www.nationalrail.co.uk/help-and-assistance/compensation-and-refunds/' },
    ],
  },
  {
    id: 'eurostar',
    label: 'Eurostar — operator scheme',
    shortLabel: 'Eurostar',
    region: 'Europe',
    coverage:
      'Cross-Channel and Eurostar-operated services. The scheme goes beyond the EU minimum and adds a third band at three hours.',
    kind: 'statutory',
    currency: '€',
    currencyCode: 'EUR',
    bands: [
      { from: 60, to: 120, percent: 25, basis: 'leg', voucherPercent: 30 },
      { from: 120, to: 180, percent: 50, basis: 'leg', voucherPercent: 60 },
      { from: 180, to: null, percent: 50, basis: 'leg', voucherPercent: 75 },
    ],
    minPayout: 0,
    claimWindowDays: 90,
    payWithinDays: 30,
    rerouteThresholdMinutes: 60,
    assistance:
      'Meals and refreshments during a long wait, and accommodation if you are forced to stay overnight, as under the EU regulation.',
    choiceAtThreshold:
      'You are offered a choice: cash back on the affected leg, or a larger e-voucher. The voucher is worth more but has to be spent on Eurostar, and expires 12 months after the delay.',
    exemptions: [
      'Extraordinary circumstances outside the operator’s control',
      'Delays you were told about before purchase',
    ],
    exemptionNote:
      'Wait at least 24 hours after the delay before claiming — the claim system needs the journey to have closed first.',
    caveat:
      'The voucher percentages are higher than the cash percentages by design. Take the cash if you have no firm plan to travel with Eurostar again inside a year.',
    sources: [
      { label: 'Eurostar — claiming compensation', url: 'https://www.eurostar.com/uk-en/travel-info/service-information/claiming-compensation' },
      { label: 'Eurostar — rail passenger rights', url: 'https://www.eurostar.com/rw-en/rail-passengers-rights' },
    ],
  },
  {
    id: 'ch',
    label: 'Switzerland — SBB and public transport',
    shortLabel: 'Switzerland',
    region: 'Europe',
    coverage:
      'Swiss domestic and international journeys on SBB and other Swiss public transport operators, which apply the same thresholds as the EU.',
    kind: 'statutory',
    currency: 'CHF',
    currencyCode: 'CHF',
    bands: [
      { from: 60, to: 120, percent: 25, basis: 'leg' },
      { from: 120, to: null, percent: 50, basis: 'leg' },
    ],
    minPayout: 5,
    claimWindowDays: 30,
    payWithinDays: null,
    rerouteThresholdMinutes: 60,
    assistance:
      'Meals and accommodation on the same basis as the EU regulation where the delay forces a long wait or an overnight stay.',
    choiceAtThreshold:
      'Travelcard holders are compensated too: a delay of 60 minutes or more pays the pro-rata daily value of the card, or CHF 5, whichever is higher.',
    exemptions: [
      'Circumstances outside the operator’s control, on the same lines as the EU regulation',
    ],
    exemptionNote:
      'The Swiss claim window is much shorter than the EU’s three months — 30 days from the journey — and claims are made online, not at station travel centres.',
    caveat:
      'Amounts under CHF 5 are not paid out, which rules out most short domestic hops.',
    sources: [
      { label: 'SBB — compensation for delays', url: 'https://www.sbb.ch/en/help-and-contact/refunds-compensation/refunds-compensation/compensation-for-delays.html' },
    ],
  },
  {
    id: 'us',
    label: 'United States — Amtrak',
    shortLabel: 'United States',
    region: 'North America',
    coverage:
      'Amtrak long-distance, Northeast Corridor and state-supported services. State commuter operators run their own policies.',
    kind: 'discretionary',
    currency: '$',
    currencyCode: 'USD',
    bands: [],
    minPayout: 0,
    claimWindowDays: null,
    payWithinDays: null,
    rerouteThresholdMinutes: null,
    assistance:
      'Amtrak commits to making every reasonable effort to rebook you on the next available service and to re-route checked baggage with you.',
    choiceAtThreshold:
      'If Amtrak cancels your train or delays it significantly, you can take a full refund of the affected travel regardless of how restrictive your fare normally is — the usual change and refund restrictions are lifted during a disruption.',
    exemptions: [],
    exemptionNote:
      'Delays caused by freight-railroad congestion, host-railroad track work or severe weather are the ones Amtrak is least likely to compensate, and they are also the commonest cause of long delays on routes Amtrak does not own.',
    caveat:
      'There is no federal law requiring an American railroad to compensate you for a delay, and Amtrak publishes no percentage table. Anything beyond a refund is a goodwill decision made case by case.',
    asks: [
      'A refund of the affected segment — the firmest of the three, and near-automatic if the train was cancelled',
      'A transportation eVoucher toward a future trip, which is what Customer Relations most often offers for a long delay within Amtrak’s control',
      'Amtrak Guest Rewards points, sometimes offered instead of or alongside a voucher',
    ],
    evidence: [
      'Your reservation number and the scheduled versus actual arrival time',
      'What you were told on board and by whom, if a cause was announced',
      'Any onward cost the delay caused you — a missed connection, an extra night, a taxi',
    ],
    sources: [
      { label: 'Amtrak — customer service commitments', url: 'https://www.amtrak.com/amtrak-customer-service-commitments' },
      { label: 'Amtrak — refund and cancellation policy', url: 'https://www.amtrak.com/refund-and-cancellation-policy' },
    ],
  },
  {
    id: 'au',
    label: 'Australia — state operators',
    shortLabel: 'Australia',
    region: 'Australia',
    coverage:
      'Each state runs its own railway and its own policy. Victoria is the only one with a published compensation scheme tied to punctuality.',
    kind: 'discretionary',
    currency: 'A$',
    currencyCode: 'AUD',
    bands: [],
    minPayout: 0,
    claimWindowDays: null,
    payWithinDays: null,
    rerouteThresholdMinutes: null,
    assistance:
      'Where a train is replaced by a coach or terminated short, operators arrange onward transport, but this is service recovery rather than compensation.',
    choiceAtThreshold:
      'Victoria is the exception worth knowing: V/Line pays the value of a daily fare to pass holders delayed 60 minutes or more on a single journey, and Metro Trains and V/Line both compensate pass holders in months when published punctuality targets are missed.',
    exemptions: [],
    exemptionNote:
      'Outside Victoria there is no delay-based entitlement to claim. What you do have is the Australian Consumer Law: services must be delivered with due care and within a reasonable time, and a major failure entitles you to cancel and be refunded.',
    caveat:
      'Nothing here is an equivalent of the EU regulation. Treat a delay claim in Australia as a refund request plus a complaint, not as an entitlement with a percentage attached.',
    asks: [
      'A refund of the fare where the service was cancelled or terminated short of your destination',
      'In Victoria, the punctuality compensation you are actually owed — claimed from the operator, within 60 days of the monthly results being published',
      'On long-distance services (NSW TrainLink, Queensland Rail Travel, Journey Beyond), the refund set out in that operator’s own booking conditions',
    ],
    evidence: [
      'Booking reference, scheduled and actual times, and the service number',
      'Any announcement of the cause, and whether a replacement coach was provided',
      'Receipts for costs the delay forced on you, for a consumer-law claim',
    ],
    sources: [
      { label: 'V/Line — compensation', url: 'https://www.vline.com.au/About-V-Line/Additional-pages/Compensation' },
      { label: 'Metro Trains — compensation and refunds', url: 'https://www.metrotrains.com.au/compensation-and-refunds/' },
      { label: 'Transport Victoria — compensation', url: 'https://www.ptv.vic.gov.au/tickets/refunds-compensation-and-replacement-tickets/compensation/' },
    ],
  },
];

const SCHEME_INDEX = Object.fromEntries(SCHEMES.map((s) => [s.id, s]));

const getScheme = (id) => SCHEME_INDEX[id] || null;

/** Round money to 2dp without the floating-point tail. */
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const bandFor = (scheme, delayMinutes) =>
  scheme.bands.find((b) => delayMinutes >= b.from && (b.to === null || delayMinutes < b.to)) || null;

/**
 * The delay at which the payout would next increase, so the page can say
 * "20 more minutes and this doubles" rather than leaving the reader to compare
 * their delay against a table.
 */
const nextBandFor = (scheme, delayMinutes) =>
  scheme.bands.find((b) => b.from > delayMinutes) || null;

/**
 * @param {{
 *   schemeId: string,
 *   delayMinutes: number|string,
 *   ticketPrice?: number|string,
 *   ticketType?: 'single'|'return'
 * }} input
 * @returns {null | {
 *   scheme: object, kind: 'statutory'|'discretionary',
 *   delayMinutes: number, qualifies: boolean,
 *   band: object|null, percent: number|null, basisAmount: number|null,
 *   amount: number|null, voucherAmount: number|null,
 *   belowMinimum: boolean, nextBand: object|null, minutesToNextBand: number|null,
 *   shortfallMinutes: number|null
 * }}
 */
const computeDelayCompensation = ({ schemeId, delayMinutes, ticketPrice, ticketType = 'single' }) => {
  const scheme = getScheme(schemeId);
  if (!scheme) return null;

  // An empty field is "not answered yet", not "delayed by zero minutes" —
  // Number('') would quietly make it the latter.
  if (delayMinutes === '' || delayMinutes === null || delayMinutes === undefined) return null;
  const minutes = Number(delayMinutes);
  if (!Number.isFinite(minutes) || minutes < 0) return null;

  const price = Number(ticketPrice);
  const hasPrice = Number.isFinite(price) && price > 0;
  const isReturn = ticketType === 'return';

  // Discretionary schemes deliberately produce no number: there is no
  // percentage to apply, and printing one would misrepresent the position.
  if (scheme.kind === 'discretionary') {
    return {
      scheme,
      kind: 'discretionary',
      delayMinutes: minutes,
      qualifies: false,
      band: null,
      percent: null,
      basisAmount: null,
      amount: null,
      voucherAmount: null,
      belowMinimum: false,
      nextBand: null,
      minutesToNextBand: null,
      shortfallMinutes: null,
    };
  }

  const band = bandFor(scheme, minutes);
  const nextBand = nextBandFor(scheme, minutes);
  const firstBand = scheme.bands[0];

  if (!band) {
    return {
      scheme,
      kind: 'statutory',
      delayMinutes: minutes,
      qualifies: false,
      band: null,
      percent: null,
      basisAmount: null,
      amount: null,
      voucherAmount: null,
      belowMinimum: false,
      nextBand,
      minutesToNextBand: nextBand ? nextBand.from - minutes : null,
      shortfallMinutes: firstBand ? firstBand.from - minutes : null,
    };
  }

  // A return fare covers two journeys; only the delayed one is compensated,
  // except where the band explicitly pays out on the whole ticket.
  const basisAmount = hasPrice
    ? band.basis === 'ticket' || !isReturn
      ? price
      : round2(price / 2)
    : null;

  const amount = basisAmount === null ? null : round2((basisAmount * band.percent) / 100);
  const voucherAmount =
    basisAmount === null || !band.voucherPercent
      ? null
      : round2((basisAmount * band.voucherPercent) / 100);

  return {
    scheme,
    kind: 'statutory',
    delayMinutes: minutes,
    qualifies: true,
    band,
    percent: band.percent,
    basisAmount,
    amount,
    voucherAmount,
    // The operator is allowed to withhold amounts under the threshold, so the
    // page has to warn rather than promise.
    belowMinimum: amount !== null && scheme.minPayout > 0 && amount < scheme.minPayout,
    nextBand,
    minutesToNextBand: nextBand ? nextBand.from - minutes : null,
    shortfallMinutes: null,
  };
};

/** "2 h 15 min" — delays are quoted in hours everywhere except the claim form. */
const formatDelay = (minutes) => {
  const n = Math.max(0, Math.round(Number(minutes) || 0));
  const h = Math.floor(n / MINUTES_PER_HOUR);
  const m = n % MINUTES_PER_HOUR;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
};

/** "€42.50" — currency symbols here are prefixes in every scheme we carry. */
const formatMoney = (amount, currency) => {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return null;
  const value = round2(Number(amount));
  const decimals = Number.isInteger(value) ? 0 : 2;
  return `${currency}${value.toFixed(decimals)}`;
};

module.exports = {
  SCHEMES,
  getScheme,
  computeDelayCompensation,
  bandFor,
  nextBandFor,
  formatDelay,
  formatMoney,
};
