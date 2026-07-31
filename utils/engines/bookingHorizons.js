// When tickets go on sale, operator by operator, outside India.
//
// This is the foreign cousin of the IRCTC booking-date calculator. The mechanic
// is the same — a fixed number of days before departure, a window opens — but
// the number is not a national rule the way India's 60-day ARP is. It is set by
// each operator, and it moves: Deutsche Bahn went to twelve months domestically
// in 2024, Trenitalia has been trying to stretch four months to six.
//
// Two consequences shape the data below. First, every operator carries its own
// source, and the table carries a VERIFIED date, so a stale entry is visible
// rather than silently wrong. Second, where an operator is genuinely erratic — Renfe is the standing
// example — the horizon is stored as a range and the page says so, instead of
// picking a number and pretending to a precision nobody has.
//
// `horizonDays` is what the arithmetic uses. `horizonLabel` is what a person
// reads. They are kept separate because "12 months" and 365 days are the same
// fact told to two different audiences.
//
// VERIFIED is the date the whole table was last checked against its sources.
// It is not decoration: test/bookingHorizons.test.js fails once it passes
// STALE_AFTER_DAYS, which turns "review this annually" from a note somebody has
// to remember into something the build tells you about. When you re-check the
// operators, move this date; do not move it without re-checking them.
const VERIFIED = '2026-07-31';
const STALE_AFTER_DAYS = 365;

const DAY = 24 * 60 * 60 * 1000;

const REGIONS = [
  { id: 'north-america', label: 'United States & Canada' },
  { id: 'europe', label: 'Europe' },
  { id: 'uk', label: 'United Kingdom' },
  { id: 'australia', label: 'Australia' },
  { id: 'india', label: 'India (for comparison)' },
];

const OPERATORS = [
  // ── North America ────────────────────────────────────────────────────────
  {
    id: 'amtrak',
    name: 'Amtrak',
    country: 'United States',
    region: 'north-america',
    horizonDays: 330,
    horizonLabel: '11 months',
    reliable: true,
    note:
      'One of the longest windows anywhere, and worth using: Amtrak prices dynamically by demand, so the cheapest buckets on long-distance routes and sleeper accommodation go early.',
    source: { label: 'Amtrak — top questions', url: 'https://www.amtrak.com/top-10-questions' },
  },

  // ── Europe ───────────────────────────────────────────────────────────────
  {
    id: 'db-domestic',
    name: 'Deutsche Bahn — within Germany',
    country: 'Germany',
    region: 'europe',
    horizonDays: 365,
    horizonLabel: '12 months',
    reliable: true,
    note:
      'Extended from six months to twelve in 2024, and it also covers ICE services to and from Brussels. Cheap Sparpreis fares are capacity-controlled, so the twelve-month window is the real advantage.',
    source: { label: 'Seat61 — European booking horizons', url: 'https://www.seat61.com/european-train-booking-horizons.htm' },
  },
  {
    id: 'db-international',
    name: 'Deutsche Bahn — international routes',
    country: 'Germany',
    region: 'europe',
    horizonDays: 180,
    horizonLabel: '6 months',
    reliable: true,
    note:
      'Most cross-border routes still open at six months because the partner railway on the other side sets the pace. Trains to Poland are the outlier, opening only about 60 days ahead.',
    source: { label: 'Seat61 — European booking horizons', url: 'https://www.seat61.com/european-train-booking-horizons.htm' },
  },
  {
    id: 'eurostar',
    name: 'Eurostar',
    country: 'Cross-Channel',
    region: 'europe',
    horizonDays: 330,
    horizonLabel: 'up to 11 months',
    reliable: false,
    note:
      'Dates open early but the timetable firms up later; the schedule you see beyond five or six months out can still change. Booking very early is safe for the fare, less so for the exact departure time.',
    source: { label: 'Seat61 — European booking horizons', url: 'https://www.seat61.com/european-train-booking-horizons.htm' },
  },
  {
    id: 'sncf-domestic',
    name: 'SNCF — TGV INOUI & Intercités (domestic)',
    country: 'France',
    region: 'europe',
    horizonDays: 120,
    horizonLabel: 'about 4 months',
    reliable: true,
    note:
      'French domestic sales open in batches rather than rolling day by day, so the exact date can jump. Overnight Intercités de Nuit often open much later — sometimes only a month ahead.',
    source: { label: 'Seat61 — European booking horizons', url: 'https://www.seat61.com/european-train-booking-horizons.htm' },
  },
  {
    id: 'sncf-international',
    name: 'SNCF — TGV Lyria, Paris–Barcelona, Paris–Milan',
    country: 'France',
    region: 'europe',
    horizonDays: 180,
    horizonLabel: '6 months',
    reliable: true,
    note:
      'International TGVs open earlier than French domestic services. Dates falling after the mid-December timetable change are handled separately and can appear late.',
    source: { label: 'Seat61 — European booking horizons', url: 'https://www.seat61.com/european-train-booking-horizons.htm' },
  },
  {
    id: 'ouigo',
    name: 'OUIGO',
    country: 'France & Spain',
    region: 'europe',
    horizonDays: 120,
    horizonLabel: '2–9 months (varies)',
    reliable: false,
    note:
      'The least predictable major operator in Europe. Sales open in campaigns, so the only reliable approach is to check every couple of weeks once you are inside about six months.',
    source: { label: 'Seat61 — European booking horizons', url: 'https://www.seat61.com/european-train-booking-horizons.htm' },
  },
  {
    id: 'oebb',
    name: 'ÖBB',
    country: 'Austria',
    region: 'europe',
    horizonDays: 180,
    horizonLabel: '6 months',
    reliable: true,
    note:
      'Six months for Austrian domestic travel. Nightjet sleepers on the long international runs — Paris, Brussels and Amsterdam to Vienna — usually open only two to four months ahead, and sell out fastest.',
    source: { label: 'Seat61 — European booking horizons', url: 'https://www.seat61.com/european-train-booking-horizons.htm' },
  },
  {
    id: 'sbb',
    name: 'SBB',
    country: 'Switzerland',
    region: 'europe',
    horizonDays: 180,
    horizonLabel: '6 months',
    reliable: true,
    note:
      'Swiss domestic fares are mostly fixed, so early booking matters only for the discounted Supersaver tickets, which are capacity-controlled and do go early on busy routes.',
    source: { label: 'Seat61 — European booking horizons', url: 'https://www.seat61.com/european-train-booking-horizons.htm' },
  },
  {
    id: 'trenitalia',
    name: 'Trenitalia',
    country: 'Italy',
    region: 'europe',
    horizonDays: 120,
    horizonLabel: 'about 4 months',
    reliable: false,
    note:
      'Around four months, with an ongoing push to extend it towards six. Italian sales also reset at the timetable change, so a date in mid-December may open later than the pattern suggests.',
    source: { label: 'Seat61 — European booking horizons', url: 'https://www.seat61.com/european-train-booking-horizons.htm' },
  },
  {
    id: 'renfe',
    name: 'Renfe',
    country: 'Spain',
    region: 'europe',
    horizonDays: 60,
    horizonLabel: '30–90 days (varies widely)',
    reliable: false,
    note:
      'The most erratic horizon in western Europe — sometimes three months, sometimes barely one. Do not plan a Spanish trip around booking early; plan it around the seat being there when sales open.',
    source: { label: 'Seat61 — European booking horizons', url: 'https://www.seat61.com/european-train-booking-horizons.htm' },
  },
  {
    id: 'cee-60',
    name: 'Poland, Slovakia, Croatia, Slovenia, Romania',
    country: 'Central & eastern Europe',
    region: 'europe',
    horizonDays: 60,
    horizonLabel: '60 days',
    reliable: true,
    note:
      'A common 60-day pattern across the region, dropping to 30 days for purely domestic Polish travel. Short horizons, but these routes rarely sell out the way a TGV does.',
    source: { label: 'Seat61 — European booking horizons', url: 'https://www.seat61.com/european-train-booking-horizons.htm' },
  },

  // ── United Kingdom ───────────────────────────────────────────────────────
  {
    id: 'uk-advance',
    name: 'Great Britain — Advance fares',
    country: 'United Kingdom',
    region: 'uk',
    horizonDays: 84,
    horizonLabel: 'about 12 weeks',
    reliable: false,
    note:
      'Tied to the timetable being confirmed twelve weeks out rather than to a sales rule, so engineering work, bank holidays and short-notice changes routinely delay a specific date. Some operators release earlier, occasionally around 20 weeks.',
    source: { label: 'National Rail — advance booking dates', url: 'https://www.nationalrail.co.uk/travel-information/advance-booking-dates/' },
  },

  // ── Australia ────────────────────────────────────────────────────────────
  {
    id: 'nsw-trainlink',
    name: 'NSW TrainLink',
    country: 'Australia',
    region: 'australia',
    horizonDays: 180,
    horizonLabel: 'up to 6 months',
    reliable: true,
    note:
      'Six months for most regional services. Short hops on a long-distance train are restricted and can only be booked closer in — if you get "service not available" a long way out, that is usually why, not a sold-out train.',
    source: { label: 'Transport for NSW — booking restrictions', url: 'https://transportnsw.info/travel-info/using-public-transport/regional-booking-travel-information/booking-restrictions' },
  },
  {
    id: 'vline',
    name: 'V/Line',
    country: 'Australia',
    region: 'australia',
    horizonDays: 90,
    horizonLabel: 'about 3 months',
    reliable: false,
    note:
      'Most V/Line trains need no reservation at all — you turn up and travel. The horizon matters only where seats are reserved, principally on coach connections and long-distance services.',
    source: { label: 'V/Line — reservations FAQ', url: 'https://www.vline.com.au/Information/FAQs/Question-1' },
  },
  {
    id: 'journey-beyond',
    name: 'Journey Beyond — The Ghan, Indian Pacific, Great Southern',
    country: 'Australia',
    region: 'australia',
    horizonDays: 365,
    horizonLabel: 'season-based, roughly 12–18 months',
    reliable: false,
    note:
      'Not a rolling window: these run as seasons, and a whole year of departures goes on sale at once when that season opens. In mid-2026 the 2027 season is already selling. Cabins on the premium journeys go far earlier than the horizon suggests.',
    source: { label: 'Journey Beyond Rail', url: 'https://www.journeybeyondrail.com.au/' },
  },

  // ── India, for the comparison the site's readers will make ───────────────
  {
    id: 'irctc',
    name: 'Indian Railways (IRCTC)',
    country: 'India',
    region: 'india',
    horizonDays: 60,
    horizonLabel: '60 days',
    reliable: true,
    note:
      'The reference point most readers of this site already have. India’s advance reservation period was cut from 120 days to 60 in November 2024, which makes it one of the shortest windows of any large network.',
    source: { label: 'Railmonk — IRCTC booking date calculator', url: 'https://railmonk.com/rail/irctc-calculator' },
  },
];

const OPERATOR_INDEX = Object.fromEntries(OPERATORS.map((o) => [o.id, o]));

const getOperator = (id) => OPERATOR_INDEX[id] || null;

const operatorsInRegion = (regionId) => OPERATORS.filter((o) => o.region === regionId);

/** ISO date (YYYY-MM-DD) → a UTC-backed instant, so day arithmetic never
 *  crosses a timezone boundary. Mirrors the approach in chartPreparation.js. */
const parseIsoDate = (isoDate) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || '').trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const instant = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  return Number.isNaN(instant.getTime()) ? null : instant;
};

const toIso = (instant) => instant.toISOString().slice(0, 10);

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "Thursday, 24 July 2026" */
const formatDate = (instant) =>
  `${DAY_NAMES[instant.getUTCDay()]}, ${instant.getUTCDate()} ${MONTH_NAMES[instant.getUTCMonth()]} ${instant.getUTCFullYear()}`;

/**
 * When does booking open for this journey, and is it open already?
 *
 * @param {{ operatorId: string, travelDate: string, today?: string }} input
 * @returns {null | {
 *   operator: object, travelDate: Date, opensOn: Date,
 *   daysUntilTravel: number, daysUntilOpen: number,
 *   status: 'open' | 'not-yet' | 'past',
 *   openIso: string, travelIso: string
 * }}
 */
const computeBookingOpening = ({ operatorId, travelDate, today }) => {
  const operator = getOperator(operatorId);
  if (!operator) return null;

  const travel = parseIsoDate(travelDate);
  if (!travel) return null;

  const now = today ? parseIsoDate(today) : parseIsoDate(new Date().toISOString().slice(0, 10));
  if (!now) return null;

  const opensOn = new Date(travel.getTime() - operator.horizonDays * DAY);
  const daysUntilTravel = Math.round((travel.getTime() - now.getTime()) / DAY);
  const daysUntilOpen = Math.round((opensOn.getTime() - now.getTime()) / DAY);

  let status;
  if (daysUntilTravel < 0) status = 'past';
  else if (daysUntilOpen <= 0) status = 'open';
  else status = 'not-yet';

  return {
    operator,
    travelDate: travel,
    opensOn,
    daysUntilTravel,
    daysUntilOpen,
    status,
    openIso: toIso(opensOn),
    travelIso: toIso(travel),
  };
};

/**
 * The same journey date seen through every operator's window, sorted by how
 * early each opens. This is the comparison the tool exists for: someone
 * planning a multi-country trip needs to know that Germany opens in twelve
 * months and Spain might not open until six weeks out.
 */
const compareHorizons = ({ travelDate, today, regionId }) => {
  const list = regionId ? operatorsInRegion(regionId) : OPERATORS;
  return list
    .map((o) => computeBookingOpening({ operatorId: o.id, travelDate, today }))
    .filter(Boolean)
    .sort((a, b) => a.opensOn.getTime() - b.opensOn.getTime());
};

module.exports = {
  VERIFIED,
  STALE_AFTER_DAYS,
  REGIONS,
  OPERATORS,
  getOperator,
  operatorsInRegion,
  computeBookingOpening,
  compareHorizons,
  formatDate,
  parseIsoDate,
  toIso,
};
