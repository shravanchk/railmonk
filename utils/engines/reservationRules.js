// Which trains force you to hold a seat reservation, and what it costs.
//
// This is the question that catches out rail-pass holders. A pass buys the
// right to travel; on a large minority of European services it does not buy
// the right to board. France, Spain, Italy and every international high-speed
// service sell a compulsory reservation on top, from a quota that is separate
// from — and much smaller than — the ordinary seat inventory. Germany, Austria,
// Switzerland and the UK mostly do not, which is why the same pass is excellent
// value in one half of Europe and mediocre in the other.
//
// Three fields carry the whole model and they are deliberately separate:
//
//   `requirement`  — can you legally board without a reservation?
//   `passFee`      — what a pass holder pays for one, which is NOT the same as
//                    the price a ticket buyer pays, because pass holders draw
//                    on a separate quota with its own price.
//   `ticketFee`    — what someone without a pass pays, where a reservation is
//                    sold separately at all. On most high-speed services it is
//                    `null` because the reservation is baked into the fare and
//                    quoting a number would imply a charge that does not exist.
//
// Conflating those three is the commonest error in the guidance people find
// online: "TGV reservations cost €10" is true for pass holders and meaningless
// for anyone else, whose reservation is simply part of the ticket.
//
// Fees are stored as a range with a currency, not a single number, because most
// of them genuinely are ranges — ÖBB Nightjet runs from a couchette to a
// private sleeper, and Eurostar's pass quota is priced by season. Where a fee is
// a firm single figure, min and max are equal and the UI renders one number.
//
// VERIFIED is the date the whole table was last checked against its sources.
// test/reservationRules.test.js fails once it is more than STALE_AFTER_DAYS old:
// these are operator prices, they move every timetable change, and going quietly
// stale is the real failure mode. Re-check the services, then move the date —
// never the other way round.
const VERIFIED = '2026-08-14';
const STALE_AFTER_DAYS = 365;

const REGIONS = [
  { id: 'western-europe', label: 'France, Spain, Portugal & Italy' },
  { id: 'central-europe', label: 'Germany, Austria & Switzerland' },
  { id: 'international', label: 'International & cross-border' },
  { id: 'northern-europe', label: 'UK, Benelux & the Nordics' },
  { id: 'night-trains', label: 'Night trains' },
  { id: 'india', label: 'India (for comparison)' },
];

// How binding the reservation is. Order matters: the UI sorts and colours by
// `severity`, and the pass calculator uses it to decide which fees are
// unavoidable costs and which are optional extras a traveller can skip.
const REQUIREMENTS = {
  compulsory: {
    id: 'compulsory',
    label: 'Compulsory',
    severity: 3,
    summary: 'You cannot board without one. Budget the fee as part of the journey.',
  },
  recommended: {
    id: 'recommended',
    label: 'Optional but advisable',
    severity: 2,
    summary: 'You may board without one, but the train sells out and you risk standing.',
  },
  optional: {
    id: 'optional',
    label: 'Optional',
    severity: 1,
    summary: 'Free seating is the norm. A reservation buys certainty, nothing more.',
  },
  none: {
    id: 'none',
    label: 'Not offered',
    severity: 0,
    summary: 'No reservations exist on these trains. Turn up and sit down.',
  },
};

const fee = (currency, min, max = min) => ({ currency, min, max });

const SERVICES = [
  // ── France, Spain, Portugal, Italy ───────────────────────────────────────
  {
    id: 'tgv-inoui',
    name: 'TGV INOUI',
    operator: 'SNCF',
    country: 'France',
    region: 'western-europe',
    requirement: 'compulsory',
    passFee: fee('EUR', 10, 20),
    ticketFee: null,
    quotaLimited: true,
    note:
      'The single biggest reason a pass underperforms in France. Pass holders draw on a fixed per-train quota — typically a few dozen seats — and once it is gone the train is closed to passes even with hundreds of ordinary seats unsold. Book the reservation the day the window opens, not the week you travel. Domestic journeys are €10; international TGVs to Italy, Spain and Switzerland run to €20.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'ouigo-fr',
    name: 'OUIGO',
    operator: 'SNCF',
    country: 'France & Spain',
    region: 'western-europe',
    requirement: 'compulsory',
    passFee: null,
    ticketFee: null,
    quotaLimited: false,
    note:
      'Not valid with a rail pass at all — OUIGO is a separate low-cost airline-style product with no pass acceptance, so there is no reservation to buy. If a route is OUIGO-only that day, a pass holder pays the full fare like everyone else. Worth checking before assuming a French route is covered.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'ter',
    name: 'TER regional trains',
    operator: 'SNCF',
    country: 'France',
    region: 'western-europe',
    requirement: 'none',
    passFee: null,
    ticketFee: null,
    quotaLimited: false,
    note:
      'No reservations, no fees, no quota. This is the escape route from the TGV quota problem: slower and with changes, but a pass covers TER travel completely and spontaneously. Paris–Lyon by TER instead of TGV costs nothing extra and takes about twice as long.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'renfe-ave',
    name: 'AVE & Avant high-speed',
    operator: 'Renfe',
    country: 'Spain',
    region: 'western-europe',
    requirement: 'compulsory',
    passFee: fee('EUR', 10, 10),
    ticketFee: null,
    quotaLimited: true,
    note:
      'Compulsory and quota-limited, with the added problem that Renfe releases pass-holder seats erratically and its own booking system has historically been the hardest in Europe to use from abroad. Reserve through a national operator counter or an agency rather than assuming you can do it on the day.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'renfe-regional',
    name: 'Media Distancia & Cercanías',
    operator: 'Renfe',
    country: 'Spain',
    region: 'western-europe',
    requirement: 'none',
    passFee: null,
    ticketFee: null,
    quotaLimited: false,
    note:
      'Regional and suburban Spanish trains take no reservations and cost a pass holder nothing. Note that some Media Distancia services on high-speed track are branded Avant and do require one — check the train type, not the route.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'frecciarossa',
    name: 'Frecciarossa, Frecciargento & Frecciabianca',
    operator: 'Trenitalia',
    country: 'Italy',
    region: 'western-europe',
    requirement: 'compulsory',
    passFee: fee('EUR', 13, 13),
    ticketFee: null,
    quotaLimited: true,
    note:
      'A flat €13 for pass holders on Italian domestic high-speed, which is poor value on a short hop like Florence–Bologna and reasonable on Milan–Naples. The quota is generous by French standards, so same-day reservation is usually possible outside peak summer weekends.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'italo',
    name: 'Italo',
    operator: 'NTV Italo',
    country: 'Italy',
    region: 'western-europe',
    requirement: 'compulsory',
    passFee: null,
    ticketFee: null,
    quotaLimited: false,
    note:
      'A private open-access operator that does not accept rail passes. It runs the same Rome–Milan corridor as Frecciarossa and often undercuts it, so it can be worth buying an Italo ticket outright and saving a travel day for elsewhere.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'trenitalia-regionale',
    name: 'Regionale & Regionale Veloce',
    operator: 'Trenitalia',
    country: 'Italy',
    region: 'western-europe',
    requirement: 'none',
    passFee: null,
    ticketFee: null,
    quotaLimited: false,
    note:
      'No reservations and no supplement. Italy is unusually well served by regional trains, so a pass holder avoiding Frecciarossa fees can still cross the country — Rome to Florence by Regionale is a common, free alternative.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'cp-alfa',
    name: 'Alfa Pendular & Intercidades',
    operator: 'CP',
    country: 'Portugal',
    region: 'western-europe',
    requirement: 'compulsory',
    passFee: fee('EUR', 5, 10),
    ticketFee: null,
    quotaLimited: false,
    note:
      'Modest fees by western European standards and rarely sold out. Portuguese regional and urban trains take no reservation at all.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },

  // ── Germany, Austria, Switzerland ────────────────────────────────────────
  {
    id: 'db-ice',
    name: 'ICE, IC & EC (domestic)',
    operator: 'Deutsche Bahn',
    country: 'Germany',
    region: 'central-europe',
    requirement: 'recommended',
    passFee: fee('EUR', 6, 6),
    ticketFee: fee('EUR', 6, 6),
    quotaLimited: false,
    note:
      'Genuinely optional — a pass holder can board any ICE and sit in any unreserved seat. Germany is where a rail pass works best for exactly this reason: no quota, no compulsory fee, turn up and go. Pay the seat fee only on Friday and Sunday afternoons and around holidays, when standing for three hours is a real prospect.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'db-regional',
    name: 'RE, RB & S-Bahn',
    operator: 'Deutsche Bahn',
    country: 'Germany',
    region: 'central-europe',
    requirement: 'none',
    passFee: null,
    ticketFee: null,
    quotaLimited: false,
    note: 'No reservations exist. Fully covered by a pass with no supplement of any kind.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'obb-railjet',
    name: 'Railjet & InterCity',
    operator: 'ÖBB',
    country: 'Austria',
    region: 'central-europe',
    requirement: 'optional',
    passFee: fee('EUR', 3, 8),
    ticketFee: fee('EUR', 3, 8),
    quotaLimited: false,
    note:
      'Optional and cheap. Austria behaves like Germany: the pass alone gets you aboard, and the fee only buys a guaranteed seat. Vienna–Salzburg and the Railjets on to Zurich and Budapest are the ones worth reserving in summer.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'sbb-domestic',
    name: 'IC, IR & regional trains',
    operator: 'SBB',
    country: 'Switzerland',
    region: 'central-europe',
    requirement: 'none',
    passFee: null,
    ticketFee: null,
    quotaLimited: false,
    note:
      'Switzerland runs no reservation system on ordinary domestic trains — there is nothing to book and nothing to pay. Combined with a dense timetable, it is the country where a pass delivers the most freedom per euro.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'glacier-bernina',
    name: 'Glacier Express & Bernina Express',
    operator: 'RhB / MGB',
    country: 'Switzerland',
    region: 'central-europe',
    requirement: 'compulsory',
    passFee: fee('CHF', 24, 79),
    ticketFee: fee('CHF', 24, 79),
    quotaLimited: true,
    note:
      'The exception to the Swiss rule, and an expensive one. These are panoramic tourist trains with compulsory paid reservation on top of any pass, priced by season — the Glacier Express is the high end. The ordinary regional trains along the identical Bernina route need no reservation and cost a pass holder nothing, which is the best-value trick in Swiss rail travel.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },

  // ── International & cross-border ─────────────────────────────────────────
  {
    id: 'eurostar',
    name: 'Eurostar (London–Paris/Brussels/Amsterdam)',
    operator: 'Eurostar',
    country: 'Cross-Channel',
    region: 'international',
    requirement: 'compulsory',
    passFee: fee('EUR', 30, 46),
    ticketFee: null,
    quotaLimited: true,
    note:
      'The most expensive pass reservation in Europe and the tightest quota — a handful of seats per train, released a few months out and gone quickly, with the price rising by season. Treat a Eurostar leg as a fixed cost to be booked first and planned around, not as something a pass makes flexible. On a short trip it is often cheaper to buy an advance Eurostar ticket outright and keep the pass for the continent.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'eurostar-red',
    name: 'Eurostar Red (ex-Thalys, Paris–Brussels–Amsterdam–Köln)',
    operator: 'Eurostar',
    country: 'France, Belgium, Netherlands, Germany',
    region: 'international',
    requirement: 'compulsory',
    passFee: fee('EUR', 20, 38),
    ticketFee: null,
    quotaLimited: true,
    note:
      'Compulsory and quota-limited on the whole former Thalys network. There is a well-known way around it: ordinary IC trains run Brussels–Amsterdam with no reservation and no fee, taking about an hour longer, and Brussels–Köln can be done by regional trains via Aachen. A pass holder unwilling to pay is not stranded, only slowed.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'tgv-lyria',
    name: 'TGV Lyria (France–Switzerland)',
    operator: 'SNCF / SBB',
    country: 'France & Switzerland',
    region: 'international',
    requirement: 'compulsory',
    passFee: fee('EUR', 20, 20),
    ticketFee: null,
    quotaLimited: true,
    note:
      'Paris–Geneva, Lausanne, Zurich and Basel, all compulsory with a small pass quota. The slower alternative via Dijon and Neuchâtel on regional trains needs no reservation.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },

  // ── UK, Benelux, Nordics ─────────────────────────────────────────────────
  {
    id: 'uk-domestic',
    name: 'All domestic operators',
    operator: 'National Rail',
    country: 'United Kingdom',
    region: 'northern-europe',
    requirement: 'optional',
    passFee: fee('GBP', 0, 0),
    ticketFee: fee('GBP', 0, 0),
    quotaLimited: false,
    note:
      'Britain charges nothing for a seat reservation on any operator, pass or no pass, and none is compulsory. Reserve for free on long-distance East Coast, West Coast and Great Western services in advance; walk on to anything else.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'ns-domestic',
    name: 'Intercity & Sprinter',
    operator: 'NS',
    country: 'Netherlands',
    region: 'northern-europe',
    requirement: 'none',
    passFee: null,
    ticketFee: null,
    quotaLimited: false,
    note:
      'No reservations on Dutch domestic trains. The Intercity Direct on the high-speed line carries a small supplement for ordinary ticket holders but is covered by a pass without one.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'sj-highspeed',
    name: 'SJ high-speed & InterCity',
    operator: 'SJ',
    country: 'Sweden',
    region: 'northern-europe',
    requirement: 'compulsory',
    passFee: fee('SEK', 65, 130),
    ticketFee: null,
    quotaLimited: false,
    note:
      'Compulsory on SJ fast trains but rarely a problem to obtain — the quota is not the constraint it is in France. Swedish regional trains take no reservation.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },

  // ── Night trains ─────────────────────────────────────────────────────────
  {
    id: 'nightjet',
    name: 'Nightjet & EuroNight',
    operator: 'ÖBB',
    country: 'Austria & across central Europe',
    region: 'night-trains',
    requirement: 'compulsory',
    passFee: fee('EUR', 15, 120),
    ticketFee: null,
    quotaLimited: true,
    note:
      'The fee depends entirely on what you sleep in: a reclining seat is at the bottom of the range, a six-berth couchette in the middle, a private sleeper with a shower at the top. Sleepers sell out months ahead in summer. The compensation is real — a night train that departs after 19:00 uses only that day from a flexi pass and still carries you to the morning, so a well-placed night train buys back a travel day as well as a hotel night.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },
  {
    id: 'european-sleeper',
    name: 'European Sleeper (Brussels–Berlin–Prague)',
    operator: 'European Sleeper',
    country: 'Belgium, Netherlands, Germany, Czechia',
    region: 'night-trains',
    requirement: 'compulsory',
    passFee: fee('EUR', 30, 110),
    ticketFee: null,
    quotaLimited: true,
    note:
      'A small open-access night operator that does accept passes, with a correspondingly small quota. Book directly and early; there is no walk-up option.',
    source: { label: 'Seat61 — Interrail & Eurail reservations', url: 'https://www.seat61.com/interrail-and-eurail-reservations.htm' },
  },

  // ── India, for comparison ────────────────────────────────────────────────
  {
    id: 'india-reserved',
    name: 'All reserved classes (SL, 3A, 2A, 1A, CC, EC)',
    operator: 'Indian Railways',
    country: 'India',
    region: 'india',
    requirement: 'compulsory',
    passFee: null,
    ticketFee: fee('INR', 15, 60),
    quotaLimited: true,
    note:
      'India inverts the European model. There is no pass, the reservation is the ticket, and the fee is a fixed per-class reservation charge already inside the fare. What is scarce is not a seat on a given train but a berth at all — which is why the waitlist, not a supplement, is the thing Indian travellers plan around.',
    source: { label: 'IRCTC', url: 'https://www.irctc.co.in/' },
  },
  {
    id: 'india-unreserved',
    name: 'General & Second Sitting (unreserved)',
    operator: 'Indian Railways',
    country: 'India',
    region: 'india',
    requirement: 'none',
    passFee: null,
    ticketFee: null,
    quotaLimited: false,
    note:
      'Unreserved coaches carry no reservation and no guaranteed seat — the ticket buys carriage, not a place. This is the closest Indian equivalent to walking on to a German ICE, minus the seat.',
    source: { label: 'IRCTC', url: 'https://www.irctc.co.in/' },
  },
];

// ── Lookups ─────────────────────────────────────────────────────────────────

const SERVICE_INDEX = Object.fromEntries(SERVICES.map((s) => [s.id, s]));

const getService = (id) => SERVICE_INDEX[id] || null;

const servicesInRegion = (regionId) => SERVICES.filter((s) => s.region === regionId);

const requirementOf = (service) => REQUIREMENTS[service?.requirement] || null;

/** Services a pass holder cannot board without paying — the unavoidable costs. */
const compulsoryServices = () => SERVICES.filter((s) => s.requirement === 'compulsory');

/**
 * Services that accept a rail pass at all. Italo and OUIGO do not, and a
 * calculator that silently counted them as "covered" would overstate a pass by
 * the entire fare rather than by a reservation fee.
 */
const acceptsPass = (service) => !['italo', 'ouigo-fr'].includes(service?.id);

/**
 * Total reservation cost for a set of services, as a range.
 *
 * Returns a per-currency breakdown rather than one number: converting CHF and
 * SEK into euros would need a live FX rate this site does not have, and a
 * hard-coded rate would be wrong within a month. `EUR` is reported separately
 * so the pass calculator — which works in euros — can use it without pretending
 * the Swiss and Swedish fees are euros too.
 *
 * @param {{ serviceIds: string[], passHolder?: boolean }} input
 * @returns {{ byCurrency: Record<string, {min:number,max:number}>,
 *             eur: {min:number,max:number}, unpriced: object[], notCovered: object[] }}
 */
const reservationCost = ({ serviceIds = [], passHolder = true }) => {
  const byCurrency = {};
  const unpriced = [];
  const notCovered = [];

  serviceIds.forEach((id) => {
    const service = getService(id);
    if (!service) return;

    if (!acceptsPass(service) && passHolder) {
      notCovered.push(service);
      return;
    }

    const f = passHolder ? service.passFee : service.ticketFee;
    if (!f) {
      // No separately-priced reservation. For a compulsory service that means
      // the cost is inside the fare, which is a fact worth surfacing rather
      // than silently treating as zero.
      if (service.requirement === 'compulsory') unpriced.push(service);
      return;
    }

    const bucket = byCurrency[f.currency] || (byCurrency[f.currency] = { min: 0, max: 0 });
    bucket.min += f.min;
    bucket.max += f.max;
  });

  return {
    byCurrency,
    eur: byCurrency.EUR || { min: 0, max: 0 },
    unpriced,
    notCovered,
  };
};

/** "€10", "€15–120", "free" — one fee rendered for a human. */
const SYMBOLS = { EUR: '€', GBP: '£', CHF: 'CHF ', SEK: 'SEK ', INR: '₹' };

const formatFee = (f) => {
  if (!f) return null;
  const symbol = SYMBOLS[f.currency] || `${f.currency} `;
  if (f.min === 0 && f.max === 0) return 'free';
  return f.min === f.max ? `${symbol}${f.min}` : `${symbol}${f.min}–${f.max}`;
};

/**
 * A one-line verdict for a service, assembled from the fields rather than
 * written out per entry, so the two can never disagree.
 */
const verdict = (serviceId, { passHolder = true } = {}) => {
  const service = getService(serviceId);
  if (!service) return null;
  const req = requirementOf(service);

  if (!acceptsPass(service)) {
    return passHolder
      ? 'Does not accept rail passes — you pay the full fare, so there is no reservation to buy.'
      : 'Ordinary ticket only; the fare includes your seat.';
  }

  const f = passHolder ? service.passFee : service.ticketFee;
  const price = formatFee(f);

  if (service.requirement === 'none') return 'No reservation exists. Board freely.';
  if (!price) {
    return service.requirement === 'compulsory'
      ? 'A reservation is required and its cost is built into the fare, not charged separately.'
      : req.summary;
  }
  if (price === 'free') return 'Reservations are compulsory in practice only where you want a guaranteed seat — and they cost nothing.';
  return service.requirement === 'compulsory'
    ? `Compulsory — ${price} on top of your pass${service.quotaLimited ? ', from a limited quota, so book early' : ''}.`
    : `Optional — ${price} if you want a guaranteed seat.`;
};

module.exports = {
  VERIFIED,
  STALE_AFTER_DAYS,
  REGIONS,
  REQUIREMENTS,
  SERVICES,
  getService,
  servicesInRegion,
  requirementOf,
  compulsoryServices,
  acceptsPass,
  reservationCost,
  formatFee,
  verdict,
};
