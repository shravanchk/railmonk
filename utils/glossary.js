// The Railmonk glossary — one entry per code, abbreviation or term a traveller
// meets on a ticket, a PNR page or the IRCTC booking form, and one page each
// under /rail/glossary/<slug>.
//
// Where an engine already holds the definition (waitlist codes, class labels,
// cancellation charges, the ARP), the entry reads it from there rather than
// restating it. The prose is the only thing this file owns.
//
// Entry shape:
//   slug        URL segment
//   term        what it is called — "GNWL", "Tatkal"
//   fullForm    the expansion, or null when the term is a word
//   category    one of CATEGORIES below
//   short       one sentence, used in lists and as the meta description
//   body        paragraphs of plain text
//   aliases     other spellings people search for
//   tool        the page that acts on it, if any
//   related     slugs of the entries to cross-link
//
// CommonJS, like the engines, so the tests and the sitemap check can require it.

const { WL_TYPES } = require('./engines/waitlistChances');
const { QUOTAS } = require('./engines/bookingWindow');
const { CLASS_RULES, CLERKAGE } = require('./engines/irctcCancellation');
const { TATKAL_RULES } = require('./engines/tatkalCharges');

const CATEGORIES = [
  { id: 'class', label: 'Travel classes', blurb: 'The two-letter class codes on every ticket.' },
  { id: 'status', label: 'PNR & booking status', blurb: 'What the status line on a PNR actually says.' },
  { id: 'waitlist', label: 'Waitlist codes', blurb: 'The five waitlists, and why the same number behaves differently on each.' },
  { id: 'booking', label: 'Booking & quotas', blurb: 'The rules, windows and quotas that decide who gets a berth.' },
  { id: 'berth', label: 'Berths & coaches', blurb: 'Berth codes, coach types and the rules on board.' },
  { id: 'fare', label: 'Fares, charges & refunds', blurb: 'Every line item on the fare, and what comes back when you cancel.' },
];

const wl = (code) => WL_TYPES.find((t) => t.code === code);
const arpDays = QUOTAS.find((q) => q.id === 'general').advanceDays;
const flat = (code) => CLASS_RULES[code].flat;

const TERMS = [
  // ── Travel classes ───────────────────────────────────────────────────────
  {
    slug: '1a',
    term: '1A',
    fullForm: 'AC First Class',
    category: 'class',
    short: 'The highest class on an Indian train: lockable cabins of two or four berths, full air-conditioning, bedding and the highest fare on the scale.',
    body: [
      'AC First Class coaches are divided into private coupés of two berths and cabins of four, each with a door that locks from inside. Bedding is provided, an attendant is assigned to the coach, and the fare is roughly six and a half times the Sleeper fare for the same distance. Rajdhani and a few long-distance expresses carry 1A; most Mail and Express trains do not.',
      `On cancellation 1A carries the highest flat charge, ₹${flat('1A')} plus GST per passenger, and for berth allotment the coach layout is unlike any other, with berths numbered by cabin rather than by bay.`,
    ],
    aliases: ['1AC', 'first AC', 'AC first', 'H1', 'HA'],
    tool: { href: '/rail/train-fare-calculator', label: 'Estimate the 1A fare' },
    related: ['2a', 'ec', 'cancellation-charge'],
  },
  {
    slug: '2a',
    term: '2A',
    fullForm: 'AC 2-Tier',
    category: 'class',
    short: 'Air-conditioned sleeper coach with two berths stacked per side of a bay, curtains for privacy, and bedding included.',
    body: [
      'A 2A coach has bays of four berths, a lower and an upper on each side, plus a side lower and side upper along the corridor, for 46 to 54 berths in total depending on the coach type. Curtains close off each bay and the side berths. Bedding is provided. It is the class most families choose for overnight journeys when the 3A crowd and the middle berth are the objection.',
      `The fare sits at roughly three and three-quarter times the Sleeper fare. The cancellation flat charge is ₹${flat('2A')} plus GST per passenger.`,
    ],
    aliases: ['2AC', 'second AC', 'AC 2 tier', 'two tier'],
    tool: { href: '/rail/berth-position-finder', label: 'Find a 2A berth position' },
    related: ['3a', '1a', 'lb', 'side-lower'],
  },
  {
    slug: '3a',
    term: '3A',
    fullForm: 'AC 3-Tier',
    category: 'class',
    short: 'The most common AC class: three berths stacked per side of a bay, 64 to 72 berths a coach, bedding included.',
    body: [
      'A 3A coach has bays of six berths, a lower, middle and upper on each side, plus a side lower and side upper by the corridor. The middle berth folds down for sleeping between 10 pm and 6 am and stays up during the day so the lower berth can be sat on. Bedding is provided. It is the workhorse class of Indian long-distance travel and the one most Tatkal and waitlist questions are about.',
      `The fare is roughly two and three-quarter times Sleeper. The cancellation flat charge is ₹${flat('3A')} plus GST per passenger, a table 3A shares with AC Chair Car and AC 3 Economy.`,
    ],
    aliases: ['3AC', 'third AC', 'AC 3 tier', 'three tier'],
    tool: { href: '/rail/berth-position-finder', label: 'Find a 3A berth position' },
    related: ['3e', '2a', 'mb', 'sl'],
  },
  {
    slug: '3e',
    term: '3E',
    fullForm: 'AC 3-Tier Economy',
    category: 'class',
    short: 'A denser version of 3A introduced in 2021, with more berths per coach and a fare a little below 3A.',
    body: [
      'AC 3 Economy coaches squeeze more berths into the same LHB shell than a standard 3A coach, with narrower berths and an extra berth per bay along the side. Each berth has its own reading light, charging point and bottle holder. The fare is set slightly below 3A on the same route, which is the whole reason to choose it.',
      'For cancellation purposes 3E is treated exactly like 3A. It does not appear on every train; where a train has both, 3E is usually listed as a separate class in the availability table.',
    ],
    aliases: ['AC 3 economy', 'economy AC', 'M coach'],
    tool: { href: '/rail/train-fare-calculator', label: 'Compare the 3E and 3A fares' },
    related: ['3a', 'cancellation-charge'],
  },
  {
    slug: 'sl',
    term: 'SL',
    fullForm: 'Sleeper Class',
    category: 'class',
    short: 'The non-AC sleeping class that carries most of India: 72 berths a coach, open windows, no bedding, and the base fare every other class is a multiple of.',
    body: [
      'Sleeper coaches have the same layout as 3A, six berths per bay plus two side berths, without air-conditioning or bedding. The windows open and have bars. A standard ICF Sleeper coach has 72 berths; LHB coaches have 80. It is the cheapest reserved class with a berth and the class the fare table is built around: every AC fare is a published multiple of the Sleeper fare for the same distance.',
      `Tatkal for Sleeper opens at 11:00 IST, an hour after the AC classes. The cancellation flat charge is ₹${flat('SL')} per passenger with no GST.`,
    ],
    aliases: ['sleeper', 'sleeper class', 'S coach', 'non-AC sleeper'],
    tool: { href: '/rail/berth-position-finder', label: 'Find a Sleeper berth position' },
    related: ['3a', '2s', 'tatkal', 'mb'],
  },
  {
    slug: 'cc',
    term: 'CC',
    fullForm: 'AC Chair Car',
    category: 'class',
    short: 'Air-conditioned reclining seats for daytime trains: Shatabdi, Jan Shatabdi, Vande Bharat and the intercity expresses.',
    body: [
      'Chair Car is a seat, not a berth, in a 3+2 layout with reclining backs, meant for journeys of a few hours. It is the standard class on Shatabdi, Vande Bharat and most day-time intercity trains, and appears on a few overnight trains as a cheaper alternative to a berth.',
      'For cancellation CC follows the same table as 3A. On Vande Bharat and Shatabdi the fare is a dynamic or premium one and can run above the base scale.',
    ],
    aliases: ['chair car', 'AC chair car', 'C coach'],
    tool: { href: '/rail/train-fare-calculator', label: 'Estimate a Chair Car fare' },
    related: ['ec', '2s', 'flexi-fare'],
  },
  {
    slug: 'ec',
    term: 'EC',
    fullForm: 'Executive Chair Car',
    category: 'class',
    short: 'The premium seat on Shatabdi and Vande Bharat: 2+2 layout, more legroom, and a fare close to AC First.',
    body: [
      'Executive Chair Car is the wider, quieter seating class on premium daytime trains, in a 2+2 layout instead of Chair Car’s 3+2. On Vande Bharat the executive seats rotate to face the direction of travel. Catering, where opted in, is included in the fare shown.',
      'For cancellation EC is grouped with AC First Class and carries the same flat charge.',
    ],
    aliases: ['executive class', 'executive chair car', 'E coach', 'Vande Bharat executive'],
    tool: { href: '/rail/guides/vande-bharat-guide', label: 'Read the Vande Bharat guide' },
    related: ['cc', '1a'],
  },
  {
    slug: '2s',
    term: '2S',
    fullForm: 'Second Sitting',
    category: 'class',
    short: 'A reserved, numbered seat in a non-AC coach: the cheapest way to have a guaranteed place on a daytime train.',
    body: [
      'Second Sitting is the reserved seating class without air-conditioning, in 3+3 rows, on intercity and passenger-type expresses. Unlike the General coach, every 2S seat is numbered and booked to a passenger. It is the class most short daytime journeys are booked in when a berth is not needed.',
      `The cancellation flat charge is ₹${flat('2S')} per passenger, no GST. Tatkal for 2S opens at 11:00 IST with the other non-AC classes.`,
    ],
    aliases: ['second sitting', 'sitting class', 'D coach', 'reserved seat'],
    tool: { href: '/rail/train-fare-calculator', label: 'Estimate a 2S fare' },
    related: ['cc', 'sl', 'general-unreserved'],
  },
  {
    slug: 'general-unreserved',
    term: 'GN / UR',
    fullForm: 'General (Unreserved) coach',
    category: 'class',
    short: 'The unreserved coaches at each end of the train: no seat number, no booking, a ticket bought at the counter or on the UTS app and valid on any train of the type.',
    body: [
      'A General ticket does not carry a seat. It is bought at the station counter or through the UTS app, is valid for a set number of hours, and lets you board the unreserved coaches of any train of that category on the route. There is no reservation, no chart and no PNR in the reserved sense.',
      'Travelling in a reserved coach on a General ticket is ticketless travel for the purposes of the penalty rules, and the difference in fare plus the penalty is charged on board.',
    ],
    aliases: ['general coach', 'unreserved', 'UR', 'GS coach', 'general ticket', 'UTS'],
    tool: { href: '/rail/penalty-calculator', label: 'See the penalty for boarding a reserved coach' },
    related: ['2s', 'tte'],
  },

  // ── PNR & status ─────────────────────────────────────────────────────────
  {
    slug: 'pnr',
    term: 'PNR',
    fullForm: 'Passenger Name Record',
    category: 'status',
    short: 'The ten-digit number that identifies one booking, every passenger on it, and its current status.',
    body: [
      'A PNR is created for every reserved booking and printed at the top of the ticket. One PNR covers up to six passengers booked together, and everything about the booking is looked up against it: the train, date, class, boarding station, each passenger’s status and, after charting, their coach and berth.',
      'A PNR status page shows two columns: the booking status, which is what you were given at the moment of booking and never changes, and the current status, which moves as cancellations come in and is what matters. The first digit of the PNR indicates the zone that issued it.',
    ],
    aliases: ['PNR number', 'PNR status', 'passenger name record'],
    tool: { href: '/rail/guides/pnr-status-availability-codes', label: 'How to read a PNR status' },
    related: ['cnf', 'wl', 'rac', 'chart'],
  },
  {
    slug: 'cnf',
    term: 'CNF',
    fullForm: 'Confirmed',
    category: 'status',
    short: 'You have a berth or seat. The coach and berth number appear once the chart is prepared.',
    body: [
      'CNF means the booking is confirmed against the quota it was booked in. Until the chart is prepared the status may read CNF without a berth number; the coach and berth are allotted at charting and appear on the PNR page and by SMS then. A ticket booked as WL or RAC that later clears also moves to CNF.',
      'A confirmed ticket is the only kind that can be cancelled for a slab-based refund. Once the chart is prepared a confirmed e-ticket can no longer be cancelled online; the only route to a refund after that is a TDR, and only for the reasons the rules allow.',
    ],
    aliases: ['confirmed', 'confirm ticket', 'CNF status'],
    tool: { href: '/rail/irctc-cancellation-calculator', label: 'Refund on a confirmed ticket' },
    related: ['rac', 'wl', 'chart', 'tdr'],
  },
  {
    slug: 'rac',
    term: 'RAC',
    fullForm: wl('RAC').name,
    category: 'status',
    short: 'You may board and travel, on a shared side-lower berth to begin with, and get a full berth if a confirmed passenger drops out.',
    body: [
      wl('RAC').meaning,
      wl('RAC').chartingNote,
      `If you cancel an RAC ticket you get the fare back minus a clerkage of ₹${CLERKAGE} plus GST per passenger, provided you cancel at least 30 minutes before departure.`,
    ],
    aliases: ['reservation against cancellation', 'RAC ticket', 'RAC meaning', 'RAC seat'],
    tool: { href: '/rail/waitlist-confirmation-chances', label: 'Chances of an RAC clearing to a berth' },
    related: ['cnf', 'wl', 'side-lower', 'clerkage'],
  },
  {
    slug: 'wl',
    term: 'WL',
    fullForm: 'Waitlist',
    category: 'status',
    short: 'No berth yet. The number is your position in the queue for that quota, and the code before it says which queue.',
    body: [
      'A waitlisted ticket has no berth and no guarantee of one. The number after WL is how many people are ahead of you in that quota’s queue; it falls as passengers ahead cancel or are confirmed from other quotas. A PNR shows two waitlist numbers: the one at booking and the current one, and only the current one matters.',
      'The letters before the number are what decide your odds. GNWL clears from the largest pool; RLWL, PQWL and RSWL from small ones; TQWL barely moves. A fully waitlisted e-ticket is cancelled automatically at charting and refunded minus clerkage, and it is not valid for travel.',
    ],
    aliases: ['waiting list', 'waitlist', 'WL ticket', 'waiting ticket', 'WL meaning'],
    tool: { href: '/rail/waitlist-confirmation-chances', label: 'Will this waitlist clear?' },
    related: ['gnwl', 'rlwl', 'pqwl', 'tqwl', 'rac'],
  },
  {
    slug: 'can',
    term: 'CAN',
    fullForm: 'Cancelled',
    category: 'status',
    short: 'The passenger or the whole booking has been cancelled, either by the passenger or automatically at charting.',
    body: [
      'CAN against a passenger means that passenger’s ticket no longer exists. It appears when you cancel online, when a fully waitlisted e-ticket is dropped at charting, or when the railway cancels the train and refunds the booking. CAN/MOD together means the booking was modified after a partial cancellation, for example one passenger removed from a group.',
      'A cancelled status is final for travel purposes. The refund that goes with it depends on why it was cancelled: the slab rules for a voluntary cancellation, clerkage for a waitlist drop, and a full refund when the train itself was cancelled.',
    ],
    aliases: ['cancelled ticket', 'CAN status', 'CAN/MOD'],
    tool: { href: '/rail/irctc-cancellation-calculator', label: 'What the refund will be' },
    related: ['cnf', 'wl', 'clerkage'],
  },
  {
    slug: 'nosb',
    term: 'NOSB',
    fullForm: 'No Seat Berth',
    category: 'status',
    short: 'A child aged 5 to 11 booked at half fare without a berth: they travel on the accompanying adult’s berth.',
    body: [
      'Since 2016 a child between 5 and 11 can be booked either at full fare with a berth or at half fare without one, and the second option shows on the PNR as NOSB. The child is a passenger on the ticket and must travel, but has no berth or seat of their own. Children under 5 travel free and do not appear on the ticket at all.',
      'NOSB is a booking choice made at the time of reservation, not a status that changes. It cannot be upgraded to a berth after booking.',
    ],
    aliases: ['no seat berth', 'child without berth', 'child half ticket'],
    tool: { href: '/rail/concession-calculator', label: 'Child fare with and without a berth' },
    related: ['cnf', 'lb'],
  },
  {
    slug: 'curr-avbl',
    term: 'CURR_AVBL',
    fullForm: 'Current Availability',
    category: 'status',
    short: 'Berths still free after the chart is prepared, bookable at the counter or online as current booking until the final chart.',
    body: [
      'Once the first chart is prepared, any berths that remain unallotted, including those released from unused quotas, become current availability. They show as CURR_AVBL in the availability table and can be booked at normal fare, without a waitlist, until the final chart shortly before departure.',
      'It is the last legitimate way to get a confirmed berth on a train that showed a waitlist all week, and worth checking in the hours after the first chart is out.',
    ],
    aliases: ['current availability', 'current booking', 'CURR AVBL'],
    tool: { href: '/rail/chart-preparation-time', label: 'When the chart is prepared' },
    related: ['chart', 'regret', 'cnf'],
  },
  {
    slug: 'regret',
    term: 'REGRET',
    fullForm: null,
    category: 'status',
    short: 'Not even a waitlist is available: the quota and its waitlist are both full, and no ticket can be issued.',
    body: [
      'REGRET in the availability table means the waitlist for that quota has reached its ceiling. You cannot book at all, not even as WL. The ceiling varies by train and class, so a train may show REGRET in Sleeper and a long waitlist in 3A on the same day.',
      'The practical responses are a different quota, a different train, VIKALP on a waitlisted booking for a nearby date, or Tatkal the day before.',
    ],
    aliases: ['regret status', 'not available', 'regret meaning'],
    tool: { href: '/rail/irctc-calculator', label: 'Book earlier next time: when windows open' },
    related: ['wl', 'tatkal', 'vikalp'],
  },
  {
    slug: 'chart',
    term: 'Chart',
    fullForm: 'Reservation chart',
    category: 'status',
    short: 'The list of who has which berth. The first chart, prepared hours before departure, is when waitlists stop moving and berths are allotted.',
    body: [
      'The reservation chart is prepared in two passes. The first chart, now at least 10 hours before departure and the previous evening for early-morning trains, allots coaches and berths to confirmed passengers, clears what waitlist it can, and drops fully waitlisted e-tickets. The final chart, about 30 minutes before departure, adds current bookings made in between.',
      'Everything about a ticket freezes at the first chart: online cancellation closes, the status you have is the status you travel on, and anything you want back after that goes through a TDR.',
    ],
    aliases: ['chart prepared', 'charting', 'chart preparation', 'first chart', 'final chart'],
    tool: { href: '/rail/chart-preparation-time', label: 'Work out your train’s chart time' },
    related: ['cnf', 'wl', 'curr-avbl', 'tdr'],
  },

  // ── Waitlist codes ───────────────────────────────────────────────────────
  ...['GNWL', 'RLWL', 'PQWL', 'RSWL', 'TQWL'].map((code) => {
    const t = wl(code);
    const short = {
      GNWL: 'The general waitlist, issued from the train’s origin: the largest pool of cancellations and the best-clearing waitlist by far.',
      RLWL: 'The waitlist for journeys between intermediate stations: a small pool, so the same number clears far less often than GNWL.',
      PQWL: 'A pooled waitlist shared by several intermediate stations: one small quota, many claimants, and among the weakest waitlists.',
      RSWL: 'The waitlist from the origin to a smaller roadside station: a modest quota with few cancellations against it.',
      TQWL: 'The Tatkal waitlist: almost nobody cancels a Tatkal ticket, so it barely moves and clears behind GNWL at charting.',
    }[code];
    return {
      slug: code.toLowerCase(),
      term: code,
      fullForm: t.name,
      category: 'waitlist',
      short,
      body: [t.meaning, t.chartingNote],
      aliases: [`${code} meaning`, `${code} full form`, `${code} confirmation`, ...(code === 'TQWL' ? ['CKWL', 'tatkal waiting'] : [])],
      tool: { href: '/rail/waitlist-confirmation-chances', label: `Chances of a ${code} ticket confirming` },
      related: ['wl', 'rac', 'chart', ...['gnwl', 'rlwl', 'pqwl', 'tqwl'].filter((s) => s !== code.toLowerCase()).slice(0, 2)],
    };
  }),

  // ── Booking & quotas ─────────────────────────────────────────────────────
  {
    slug: 'arp',
    term: 'ARP',
    fullForm: 'Advance Reservation Period',
    category: 'booking',
    short: `How far ahead a train can be booked: ${arpDays} days before the journey date, excluding the journey day, since 1 November 2024.`,
    body: [
      `The ARP is the window between the day booking opens and the day of travel. For regular trains it is ${arpDays} days, not counting the journey day, and reservation opens at 08:00 IST on the first day. It was 120 days until 31 October 2024; the Railway Board cut it to ${arpDays} to reduce speculative bookings and cancellations.`,
      'The Foreign Tourist quota keeps a 365-day ARP, Tatkal has its own one-day window, and special trains open on whatever date their notification says. A handful of short day-time expresses also keep a shorter ARP of their own.',
    ],
    aliases: ['advance reservation period', 'ARP full form', '60 day rule', 'how many days before can I book'],
    tool: { href: '/rail/irctc-calculator', label: 'Find your booking-open date' },
    related: ['tatkal', 'quota', 'foreign-tourist-quota'],
  },
  {
    slug: 'tatkal',
    term: 'Tatkal',
    fullForm: null,
    category: 'booking',
    short: 'A last-minute quota that opens one day before travel, at 10:00 IST for AC classes and 11:00 for non-AC, at a premium over the fare and with no refund on a confirmed cancellation.',
    body: [
      `Tatkal berths are held back from general booking and released one day before the journey date, at 10:00 IST for AC classes and 11:00 for Sleeper and other non-AC classes. The charge is ${TATKAL_RULES.SL.rate * 100}% of the basic fare in Sleeper and ${TATKAL_RULES['3A'].rate * 100}% in AC classes, within class-wise minimum and maximum amounts. A Tatkal ticket can carry up to four passengers and needs an ID to be entered at booking.`,
      'Since July 2025 online Tatkal can be booked only from an Aadhaar-authenticated IRCTC account with an OTP, and agents are barred for the first 30 minutes of the window. A confirmed Tatkal ticket gets no refund on cancellation; a waitlisted one that never confirms is refunded minus clerkage.',
    ],
    aliases: ['tatkal ticket', 'tatkal booking', 'tatkal time', 'tatkal quota', 'TQ'],
    tool: { href: '/rail/tatkal-charges-calculator', label: 'Work out the Tatkal charge' },
    related: ['premium-tatkal', 'tqwl', 'arp', 'quota'],
  },
  {
    slug: 'premium-tatkal',
    term: 'Premium Tatkal',
    fullForm: null,
    category: 'booking',
    short: 'A Tatkal quota on selected trains sold at a dynamic fare that rises as berths sell, with the same one-day window and no refund at all.',
    body: [
      'Premium Tatkal is a separate quota, offered on a subset of popular trains, whose fare is not fixed: it starts at the Tatkal fare and rises in steps as the quota fills. It opens at the same time as ordinary Tatkal, follows the AC clock, and is available only online, never at a counter or through an agent.',
      'No refund is given on a Premium Tatkal ticket for any reason short of the train being cancelled. It is a way to buy a confirmed berth at a price, not a cheaper Tatkal.',
    ],
    aliases: ['PT quota', 'premium tatkal fare', 'dynamic tatkal'],
    tool: { href: '/rail/tatkal-charges-calculator', label: 'Tatkal charges by class' },
    related: ['tatkal', 'flexi-fare'],
  },
  {
    slug: 'quota',
    term: 'Quota',
    fullForm: null,
    category: 'booking',
    short: 'A share of the berths on a train set aside for one kind of passenger or booking. Which quota you book in decides your waitlist and your odds.',
    body: [
      'Every berth on a train belongs to a quota. General (GN) is the large default; the rest are reserved for a purpose: Tatkal (TQ) and Premium Tatkal (PT) for last-minute booking, Ladies (LD), Lower Berth and Senior Citizen (SS), Divyangjan (PH), Defence (DF), Foreign Tourist (FT), Duty Pass (DP), Head Office or Emergency (HO), and the Pooled (PQ) and Remote Location (RL) quotas for intermediate legs. Unused special quotas are released to general passengers at charting.',
      'The quota you book in sets the waitlist you get. A GNWL ticket is drawing on the biggest pool; a PQWL ticket on one of the smallest. Choosing the right quota, where you are eligible, is the single biggest thing you control at booking.',
    ],
    aliases: ['quota list', 'GN quota', 'LD quota', 'SS quota', 'PH quota', 'DF quota', 'ladies quota', 'lower berth quota', 'senior citizen quota'],
    tool: { href: '/rail/guides/quotas-vikalp-break-journey', label: 'Every quota explained' },
    related: ['gnwl', 'ho-quota', 'tatkal', 'foreign-tourist-quota'],
  },
  {
    slug: 'ho-quota',
    term: 'HO quota',
    fullForm: 'Head Office (Emergency) quota',
    category: 'booking',
    short: 'A small reserve of berths released by the railway headquarters against written requests, allotted at charting.',
    body: [
      'The Head Office or Emergency quota is a handful of berths per train that the zonal headquarters controls. A passenger with a waitlisted ticket can apply for it through an Emergency Quota form at the divisional or zonal office, usually with a reason such as a medical need, a bereavement or official duty, and the allotment is decided at charting.',
      'It is not a booking channel and it is not for the general public in practice: the quota is tiny, the request must reach the right office in time, and many stations do not accept applications from unconnected passengers at all. Most people who mention it are describing a request made through an MP, MLA or railway officer.',
    ],
    aliases: ['emergency quota', 'EQ', 'HO quota meaning', 'head office quota'],
    tool: { href: '/rail/waitlist-confirmation-chances', label: 'What clears at charting' },
    related: ['quota', 'chart', 'wl'],
  },
  {
    slug: 'foreign-tourist-quota',
    term: 'FT quota',
    fullForm: 'Foreign Tourist quota',
    category: 'booking',
    short: 'Berths reserved for foreign passport holders, bookable 365 days ahead, at a fare paid in foreign currency or its rupee equivalent.',
    body: [
      'The Foreign Tourist quota is a small allotment on many long-distance trains for passengers travelling on a foreign passport. It keeps a 365-day advance reservation period, far longer than the general 60 days, and can be booked online through IRCTC with a passport number or at the International Tourist Bureaux at major stations.',
      'The berths are released to general passengers if unsold close to departure. NRIs holding a foreign passport are eligible; Indian passport holders living abroad are not.',
    ],
    aliases: ['foreign tourist quota', 'FT quota', 'tourist quota', 'foreigner train booking'],
    tool: { href: '/rail/irctc-calculator', label: 'The 365-day window on the booking calculator' },
    related: ['arp', 'quota'],
  },
  {
    slug: 'vikalp',
    term: 'VIKALP',
    fullForm: 'Alternate Train Accommodation Scheme (ATAS)',
    category: 'booking',
    short: 'Opt in at booking and a waitlisted ticket may be moved to a confirmed berth on another train on the same route, at no extra fare.',
    body: [
      'VIKALP lets a passenger booking a waitlisted ticket tick a box choosing up to seven alternative trains. If the ticket is still waitlisted at charting and one of the alternatives has a spare berth, the passenger is shifted to it, in the same or a higher class, with no extra charge and no refund of any difference. The alternative may depart from or arrive at a nearby station and at a different time.',
      'Once shifted, the passenger is a confirmed passenger of the new train and the original ticket is no longer valid. Opting in costs nothing and is one of the few free ways to improve a waitlist’s odds.',
    ],
    aliases: ['ATAS', 'alternate train', 'vikalp scheme', 'vikalp meaning'],
    tool: { href: '/rail/guides/quotas-vikalp-break-journey', label: 'How VIKALP works, step by step' },
    related: ['wl', 'chart', 'regret'],
  },
  {
    slug: 'break-journey',
    term: 'Break journey',
    fullForm: null,
    category: 'booking',
    short: 'Stopping over at a station en route on a single long-distance ticket, allowed once per 500 km for up to two days.',
    body: [
      'On a journey of more than 500 km a passenger may break the journey at an intermediate station once for every 500 km, for up to two days, not counting the days of arrival and departure, provided the ticket is endorsed by the station master at the break. The rule exists for point-to-point tickets; it does not apply on Rajdhani, Shatabdi, Duronto and similar trains, or within the first 500 km.',
      'Reserved e-tickets are in practice booked for one train and one berth, so a break journey means giving up the reservation for the onward leg and travelling in the unreserved coach or booking again. The rule matters most for the fare, which stays that of the single through journey.',
    ],
    aliases: ['break journey rules', 'stopover', 'break of journey'],
    tool: { href: '/rail/guides/quotas-vikalp-break-journey', label: 'Break journey rules in full' },
    related: ['quota', 'tte'],
  },
  {
    slug: 'master-list',
    term: 'Master list',
    fullForm: null,
    category: 'booking',
    short: 'Passengers saved in your IRCTC profile in advance so they can be added to a booking in one click, which is what makes a Tatkal booking fast.',
    body: [
      'The master list is a saved list of up to 20 passengers in an IRCTC account, each with name, age, gender, berth preference and ID details. During booking they are added to the form from a dropdown instead of being typed, which saves the minute that decides a Tatkal booking.',
      'Passengers on the master list can be Aadhaar-verified individually, and a booking made only with verified passengers on a verified account counts towards the higher monthly booking limit.',
    ],
    aliases: ['IRCTC master list', 'saved passengers', 'add passenger list'],
    tool: { href: '/rail/guides/tatkal-booking-masterclass', label: 'The Tatkal preparation checklist' },
    related: ['tatkal', 'irctc'],
  },
  {
    slug: 'irctc',
    term: 'IRCTC',
    fullForm: 'Indian Railway Catering and Tourism Corporation',
    category: 'booking',
    short: 'The public-sector company that runs online ticketing for Indian Railways, plus catering, tourism and Rail Neer. Its website and app are where every e-ticket is booked.',
    body: [
      'IRCTC is a subsidiary of Indian Railways that operates the online reservation system used by the public, the Rail Connect app, on-board and station catering, tourist trains and packaged water. Booking a train ticket online means booking through IRCTC or an app that connects to it; the rules the ticket follows are Indian Railways’ rules.',
      'IRCTC charges a convenience fee per e-ticket, which is not refunded on cancellation. Counter tickets are sold by Indian Railways directly at the station and follow slightly different cancellation and TDR procedures.',
    ],
    aliases: ['IRCTC full form', 'IRCTC meaning', 'IRCTC app', 'rail connect'],
    tool: { href: '/rail/guides/how-to-book-train-ticket-online', label: 'Booking on IRCTC, step by step' },
    related: ['pnr', 'master-list', 'tdr'],
  },

  // ── Berths & coaches ─────────────────────────────────────────────────────
  {
    slug: 'lb',
    term: 'LB',
    fullForm: 'Lower Berth',
    category: 'berth',
    short: 'The bottom berth in a bay, which doubles as the seat for the bay in the daytime. The most requested berth, with a quota of its own for seniors and women over 45.',
    body: [
      'The lower berth is the one everyone in the bay sits on between 6 am and 10 pm, so the person holding it shares it during the day and gets it to themselves at night. Senior citizens, women aged 45 and over and pregnant women get priority for lower berths through a dedicated quota when they book alone or in a small group, and the system tries to allot one automatically.',
      'On the PNR and ticket it appears as LB after the berth number. In Sleeper and 3A coaches the lower berths are the odd-numbered ones in each bay pattern, a detail the berth position finder works out for any number.',
    ],
    aliases: ['lower berth', 'lower berth quota', 'LB meaning'],
    tool: { href: '/rail/berth-position-finder', label: 'Which berths are lower' },
    related: ['mb', 'ub', 'side-lower', 'quota'],
  },
  {
    slug: 'mb',
    term: 'MB',
    fullForm: 'Middle Berth',
    category: 'berth',
    short: 'The berth between lower and upper in Sleeper and 3A, folded flat against the wall during the day and opened for sleeping between 10 pm and 6 am.',
    body: [
      'The middle berth exists only in three-tier coaches. During the day it stays folded so the lower berth can be used as a seat by everyone in the bay; the rule is that it may be opened for sleeping only between 10 pm and 6 am, and a passenger who wants it down outside those hours has no right to insist. Inside those hours the lower-berth passenger has no right to keep it up.',
      'It is the berth most often argued over on board and the one the railway’s own rule on sleeping hours is written for. It is also the hardest to climb into and out of, which is why it is the last to be chosen when a preference is offered.',
    ],
    aliases: ['middle berth', 'middle berth rules', 'middle berth timing', 'MB meaning'],
    tool: { href: '/rail/guides/train-travel-rules', label: 'The berth timing rules' },
    related: ['lb', 'ub', '3a', 'sl'],
  },
  {
    slug: 'ub',
    term: 'UB',
    fullForm: 'Upper Berth',
    category: 'berth',
    short: 'The top berth in a bay: yours all day, out of the daytime traffic, and the usual answer when a lower berth cannot be had.',
    body: [
      'The upper berth is not shared during the day, so it is the berth to have for sleeping whenever you like or for a long daytime stretch without company. The trade-off is the climb and the reduced headroom, especially in Sleeper and 3A where three berths are stacked in the height of one compartment.',
      'It is allotted to younger passengers by default when a lower berth quota is exhausted, and is the berth preference most likely to be honoured because it is the least requested.',
    ],
    aliases: ['upper berth', 'UB meaning', 'top berth'],
    tool: { href: '/rail/berth-position-finder', label: 'Which berths are upper' },
    related: ['lb', 'mb', 'side-upper'],
  },
  {
    slug: 'side-lower',
    term: 'SL (berth)',
    fullForm: 'Side Lower berth',
    category: 'berth',
    short: 'The lower berth along the corridor, shorter than a bay berth and split into two seats by day. The berth RAC passengers share.',
    body: [
      'Side berths run lengthwise along the corridor, opposite the bays. The side lower converts into two facing seats by day and is the berth two RAC passengers share, each with a seat, until one of them is allotted a full berth. On older ICF coaches it is noticeably shorter than a bay berth; LHB coaches improved it.',
      'On a ticket the code SL after the berth number means side lower; SL as the class on the same ticket means Sleeper. The two are unrelated and the context makes clear which is meant.',
    ],
    aliases: ['side lower', 'side lower berth', 'side lower RAC'],
    tool: { href: '/rail/berth-position-finder', label: 'Which berths are side lower' },
    related: ['side-upper', 'rac', 'lb'],
  },
  {
    slug: 'side-upper',
    term: 'SU',
    fullForm: 'Side Upper berth',
    category: 'berth',
    short: 'The upper berth along the corridor: private, a little short, and the coldest spot in an AC coach.',
    body: [
      'The side upper sits above the side lower, along the corridor, and is not shared at any time of day. It is the shortest berth in the coach on ICF stock, sits directly under the air-conditioning duct in AC coaches, and has the corridor light on all night; regular travellers either love it or avoid it.',
      'It appears as SU after the berth number on a ticket and is one of the two berth codes, with side lower, that are only found on the corridor side of a coach.',
    ],
    aliases: ['side upper', 'side upper berth', 'SU meaning'],
    tool: { href: '/rail/berth-position-finder', label: 'Which berths are side upper' },
    related: ['side-lower', 'ub'],
  },
  {
    slug: 'lhb-icf',
    term: 'LHB / ICF',
    fullForm: 'Linke Hofmann Busch / Integral Coach Factory coaches',
    category: 'berth',
    short: 'The two coach designs on the network. LHB coaches are newer, faster, safer and have more berths per coach, which changes the berth numbering.',
    body: [
      'ICF coaches are the older design built at the Integral Coach Factory in Chennai from the 1950s; LHB coaches are the stainless-steel design licensed from the German firm Linke Hofmann Busch and built since 2000, rated for 160 km/h, with anti-climbing couplers and a quieter ride. Indian Railways is replacing ICF stock with LHB across the network.',
      'For a passenger the visible difference is the berth count: 72 versus 80 in Sleeper, 64 versus 72 in 3A, 46 versus 54 in 2A. That changes which berth numbers are lower, middle, upper or side, which is why a berth position finder has to know the coach type.',
    ],
    aliases: ['LHB coach', 'ICF coach', 'LHB meaning', 'LHB vs ICF'],
    tool: { href: '/rail/berth-position-finder', label: 'Berth position by coach type' },
    related: ['lb', 'sl', '3a'],
  },
  {
    slug: 'tte',
    term: 'TTE',
    fullForm: 'Travelling Ticket Examiner',
    category: 'berth',
    short: 'The on-board official who checks tickets and IDs, allots vacant berths after departure, and collects penalties and excess fares.',
    body: [
      'The TTE, often called the TC or TT, holds the chart for the coaches assigned to them, checks each passenger’s ticket and ID, marks no-shows, and allots berths that fall vacant to RAC passengers and then to passengers travelling on lower classes or without reservation, in that order. Since 2018 that allotment is done on a hand-held terminal that updates the chart in real time.',
      'The TTE is also the person who charges the penalty and the excess fare for travelling without a valid ticket, without the ID the ticket was booked on, or in a higher class than booked, and who can be asked to help with a medical emergency or a security problem on board.',
    ],
    aliases: ['ticket checker', 'TC', 'TT', 'ticket collector', 'TTE full form'],
    tool: { href: '/rail/penalty-calculator', label: 'What a TTE can charge' },
    related: ['chart', 'rac', 'general-unreserved'],
  },

  // ── Fares, charges & refunds ─────────────────────────────────────────────
  {
    slug: 'basic-fare',
    term: 'Basic fare',
    fullForm: null,
    category: 'fare',
    short: 'The distance-based part of the fare, before the reservation fee, superfast charge and GST. Concessions and Tatkal charges are calculated on this figure alone.',
    body: [
      'The basic fare is what the class and distance tables give for the journey, and is the only part of the fare that concessions discount and that the Tatkal percentage is applied to. The reservation fee, the superfast charge and GST are added on top and charged in full regardless of any concession.',
      'That is why a 50% concession never halves the ticket, and why a Tatkal charge shown as 30% is 30% of a smaller number than the fare you see.',
    ],
    aliases: ['base fare', 'basic fare meaning', 'fare components', 'fare breakup'],
    tool: { href: '/rail/train-fare-calculator', label: 'See the fare itemised' },
    related: ['reservation-fee', 'superfast-charge', 'tatkal'],
  },
  {
    slug: 'reservation-fee',
    term: 'Reservation fee',
    fullForm: null,
    category: 'fare',
    short: 'A fixed per-passenger charge for booking a reserved berth or seat, set by class and added to every reserved ticket.',
    body: [
      'The reservation fee is a flat amount per passenger that depends only on the class, from ₹15 in Second Sitting to ₹60 in AC First, and is added to the basic fare on every reserved ticket. It is not refunded on cancellation: the flat cancellation charge is deducted from the total fare, of which it forms part.',
      'It is separate from the IRCTC convenience fee, which is charged only on e-tickets and is also non-refundable.',
    ],
    aliases: ['reservation charge', 'reservation charges by class', 'booking fee'],
    tool: { href: '/rail/train-fare-calculator', label: 'Reservation fee by class' },
    related: ['basic-fare', 'superfast-charge', 'cancellation-charge'],
  },
  {
    slug: 'superfast-charge',
    term: 'Superfast charge',
    fullForm: null,
    category: 'fare',
    short: 'A fixed surcharge, by class, on every ticket for a train classified as Superfast, which is most named expresses today.',
    body: [
      'Trains whose average speed clears the superfast threshold carry a superfast surcharge on every ticket, from ₹15 in Second Sitting to ₹75 in the top classes. Superfast trains have a 2 as the second digit of their five-digit number, which is the quick way to tell whether the charge applies.',
      'The charge is part of the fare for cancellation and refund purposes. It is not refunded because the train ran late, but a train more than three hours late does ground a TDR for the full fare if you choose not to travel.',
    ],
    aliases: ['superfast surcharge', 'superfast charges', 'SF charge'],
    tool: { href: '/rail/train-fare-calculator', label: 'Fare with and without the superfast charge' },
    related: ['basic-fare', 'reservation-fee', 'tdr'],
  },
  {
    slug: 'flexi-fare',
    term: 'Flexi fare',
    fullForm: 'Dynamic fare',
    category: 'fare',
    short: 'On Rajdhani, Shatabdi and Duronto the fare rises in steps as berths sell, up to about 1.4 times the base fare.',
    body: [
      'Flexi fare, introduced in 2016, prices berths on the premium trains in tiers: the base fare for the first tenth of berths, then 10% more for each further tenth sold, up to a cap of 1.4 times the base. The reservation fee, superfast charge and GST are added at the normal rates. Some trains and classes have since been taken out of the scheme, and discounts are offered on poorly filled ones.',
      'The practical effect is that booking a Rajdhani on the first morning and booking it a fortnight later can differ by a third. Cancellation charges are calculated on the fare actually paid.',
    ],
    aliases: ['dynamic fare', 'dynamic pricing train', 'flexi fare meaning', 'Rajdhani fare increase'],
    tool: { href: '/rail/train-fare-calculator', label: 'The premium-train fare range' },
    related: ['basic-fare', 'premium-tatkal'],
  },
  {
    slug: 'cancellation-charge',
    term: 'Cancellation charge',
    fullForm: null,
    category: 'fare',
    short: 'What is deducted when you cancel: a flat amount by class if you cancel early, 25% or 50% of the fare closer to departure, and nothing back inside the last hours.',
    body: [
      `For a confirmed ticket cancelled more than 72 hours before departure the deduction is a flat charge per passenger by class: ₹${flat('1A')} in AC First and Executive, ₹${flat('2A')} in 2A, ₹${flat('3A')} in 3A, Chair Car and 3E, ₹${flat('SL')} in Sleeper and ₹${flat('2S')} in Second Sitting, with 5% GST on the AC classes. Between 72 and 24 hours it is 25% of the fare, between 24 and 8 hours it is 50%, in each case not less than the flat charge, and inside 8 hours there is no refund. These slabs took effect on 1 April 2026.`,
      `RAC and waitlisted tickets are charged only clerkage, ₹${CLERKAGE} plus GST per passenger, if cancelled at least 30 minutes before departure. A confirmed Tatkal ticket gets no refund at all.`,
    ],
    aliases: ['cancellation charges', 'ticket cancellation charges', 'cancellation deduction', 'refund rules'],
    tool: { href: '/rail/cancellation-charges', label: 'Cancellation charges by class, with examples' },
    related: ['clerkage', 'tdr', 'tatkal', 'cnf'],
  },
  {
    slug: 'clerkage',
    term: 'Clerkage',
    fullForm: null,
    category: 'fare',
    short: `The small fixed deduction, ₹${CLERKAGE} plus GST per passenger, on cancelling an RAC or waitlisted ticket, and on a waitlisted e-ticket dropped at charting.`,
    body: [
      `Clerkage is the charge for processing a cancellation where no berth was ever held. It applies per passenger to RAC and waitlisted tickets cancelled up to 30 minutes before departure, and to fully waitlisted e-tickets that the system cancels automatically at charting. The amount is ₹${CLERKAGE} plus 5% GST.`,
      'A partially confirmed booking, where some passengers are confirmed and others waitlisted, has the confirmed passengers charged under the slab rules and the waitlisted ones charged clerkage. Inside the last 30 minutes before departure no refund is given on an RAC or waitlisted ticket.',
    ],
    aliases: ['clerkage charge', 'clerkage meaning', 'clerkage fee'],
    tool: { href: '/rail/irctc-cancellation-calculator', label: 'Refund on an RAC or waitlisted ticket' },
    related: ['cancellation-charge', 'wl', 'rac'],
  },
  {
    slug: 'tdr',
    term: 'TDR',
    fullForm: 'Ticket Deposit Receipt',
    category: 'fare',
    short: 'The claim you file when you did not travel and cannot cancel normally: train cancelled or hours late, AC failed, no berth given, or you never boarded. Refund is decided later, not on the spot.',
    body: [
      'A TDR is filed online for an e-ticket, or at the station for a counter ticket, in the situations the refund rules list: the train was cancelled or ran more than three hours late and you chose not to travel, the AC did not work, you were not given the berth you were confirmed on, you travelled part of the way, or you did not travel at all after the chart was prepared. The deadline runs from before departure to 72 hours after it, depending on the reason.',
      'The claim goes to the zonal railway, which checks it against the train’s record and pays out, in full or in part, typically within weeks. It is not a cancellation: a TDR does not free the berth and does not guarantee a refund.',
    ],
    aliases: ['ticket deposit receipt', 'file TDR', 'TDR full form', 'TDR refund', 'TDR rules'],
    tool: { href: '/rail/tdr-refund-checker', label: 'Does your case qualify for a TDR?' },
    related: ['cancellation-charge', 'chart', 'cnf'],
  },
];

const TERM_INDEX = Object.fromEntries(TERMS.map((t) => [t.slug, t]));
const getTerm = (slug) => TERM_INDEX[slug] || null;
const termsInCategory = (id) => TERMS.filter((t) => t.category === id);
const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || '';
const relatedTerms = (term) => (term?.related || []).map(getTerm).filter(Boolean);

module.exports = { CATEGORIES, TERMS, getTerm, termsInCategory, categoryLabel, relatedTerms };
