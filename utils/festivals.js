// Festival travel calendar — the dates behind "when can I book my Diwali
// ticket?" and every page under /rail/festival-booking-dates.
//
// This file holds two things and derives everything else:
//   • the festival dates themselves, checked against Drik Panchang and the
//     mainstream Indian calendars at the time of writing;
//   • the travel window around each one — the days people actually go and
//     come back — from which the booking engine works out the day and time
//     every one of those journeys opens for reservation.
//
// The booking maths is never restated here. Each journey date is handed to
// `computeBookingWindow`, so the 60-day ARP, the 08:00 general clock and the
// 10:00 / 11:00 Tatkal clocks live in exactly one place and a rule change
// there flows through to every festival page automatically.
//
// `confidence` says how firm a date is:
//   'fixed'  — same Gregorian day every year (Christmas, New Year).
//   'lunar'  — fixed once the year's panchang is published; regional
//              calendars occasionally differ by a day.
//   'moon'   — depends on the sighting of the moon and can move by a day
//              at the last moment.
//
// CommonJS, like the engines, so the tests and the sitemap check can require
// it directly.

const { computeBookingWindow, parseIsoDate, toIsoDate } = require('./engines/bookingWindow');

const DAY_MS = 24 * 60 * 60 * 1000;

const addDays = (iso, n) => {
  const d = parseIsoDate(iso);
  return d ? toIsoDate(new Date(d.getTime() + n * DAY_MS)) : null;
};

// How far around the festival the rush runs. Outbound demand builds from a
// few days before the festival's first day; the return rush runs from its last
// day. Both are deliberately generous — a page that is silent about the day
// someone actually wants to travel is useless to them.
const OUTBOUND_DAYS_BEFORE = 3;
const RETURN_DAYS_AFTER = 3;

/**
 * Each occurrence:
 *   main  — the headline day people mean by the festival's name
 *   from  — first day of the festival period
 *   to    — last day of the festival period
 *   peak  — the single busiest outbound travel day, used for the reminder
 *           prefill and the page's headline booking date
 *   days  — named days inside the period, shown on the page
 */
const FESTIVALS = [
  {
    slug: 'diwali',
    name: 'Diwali',
    shortName: 'Diwali',
    aliases: ['Deepavali', 'Dhanteras', 'Bhai Dooj', 'Lakshmi Puja'],
    confidence: 'lunar',
    blurb:
      'The single biggest rail rush of the year. Tickets on the Delhi, Mumbai and Bengaluru routes into Uttar Pradesh and Bihar sell out within minutes of the window opening.',
    corridors:
      'Delhi, Mumbai, Pune, Surat, Bengaluru and Hyderabad to Lucknow, Gorakhpur, Varanasi, Patna, Darbhanga and Bhagalpur — and the reverse a week later.',
    occurrences: [
      {
        year: 2026,
        main: '2026-11-08',
        from: '2026-11-06',
        to: '2026-11-10',
        peak: '2026-11-07',
        days: [
          { date: '2026-11-06', label: 'Dhanteras' },
          { date: '2026-11-07', label: 'Naraka Chaturdashi (Choti Diwali)' },
          { date: '2026-11-08', label: 'Diwali — Lakshmi Puja' },
          { date: '2026-11-09', label: 'Govardhan Puja' },
          { date: '2026-11-10', label: 'Bhai Dooj' },
        ],
      },
      {
        year: 2027,
        main: '2027-10-29',
        from: '2027-10-27',
        to: '2027-10-31',
        peak: '2027-10-28',
        days: [
          { date: '2027-10-27', label: 'Dhanteras' },
          { date: '2027-10-29', label: 'Diwali — Lakshmi Puja' },
          { date: '2027-10-31', label: 'Bhai Dooj' },
        ],
      },
    ],
  },
  {
    slug: 'chhath-puja',
    name: 'Chhath Puja',
    shortName: 'Chhath',
    aliases: ['Chhath', 'Chhat', 'Dala Chhath', 'Surya Shashthi'],
    confidence: 'lunar',
    blurb:
      'Six days after Diwali, and for Bihar, eastern Uttar Pradesh and Jharkhand the more important journey of the two. Trains towards Patna, Chhapra, Darbhanga and Samastipur run at 200% occupancy.',
    corridors:
      'Delhi, Mumbai, Ahmedabad, Kolkata and Bengaluru to Patna, Chhapra, Darbhanga, Samastipur, Muzaffarpur, Gaya, Deoghar and Gorakhpur.',
    occurrences: [
      {
        year: 2026,
        main: '2026-11-15',
        from: '2026-11-13',
        to: '2026-11-16',
        peak: '2026-11-12',
        days: [
          { date: '2026-11-13', label: 'Nahay Khay' },
          { date: '2026-11-14', label: 'Kharna' },
          { date: '2026-11-15', label: 'Sandhya Arghya (main day)' },
          { date: '2026-11-16', label: 'Usha Arghya' },
        ],
      },
      {
        year: 2027,
        main: '2027-11-04',
        from: '2027-11-02',
        to: '2027-11-05',
        peak: '2027-11-01',
        days: [
          { date: '2027-11-02', label: 'Nahay Khay' },
          { date: '2027-11-04', label: 'Sandhya Arghya (main day)' },
          { date: '2027-11-05', label: 'Usha Arghya' },
        ],
      },
    ],
  },
  {
    slug: 'durga-puja-dussehra',
    name: 'Durga Puja & Dussehra',
    shortName: 'Durga Puja',
    aliases: ['Durga Puja', 'Dussehra', 'Vijayadashami', 'Navratri', 'Puja holidays', 'Pujo'],
    confidence: 'lunar',
    blurb:
      'Kolkata empties into the districts and Bengalis everywhere head home for the five days of Pujo, while Dussehra sends a smaller wave across the north and the south.',
    corridors:
      'Delhi, Mumbai, Bengaluru, Chennai and Hyderabad to Kolkata (Howrah and Sealdah), plus Howrah and Sealdah outwards to Siliguri, Malda, Asansol, Bhubaneswar and Guwahati.',
    occurrences: [
      {
        year: 2026,
        main: '2026-10-20',
        from: '2026-10-16',
        to: '2026-10-20',
        peak: '2026-10-15',
        days: [
          { date: '2026-10-16', label: 'Maha Shashthi' },
          { date: '2026-10-17', label: 'Maha Saptami' },
          { date: '2026-10-18', label: 'Maha Ashtami' },
          { date: '2026-10-19', label: 'Maha Navami' },
          { date: '2026-10-20', label: 'Vijayadashami / Dussehra' },
        ],
      },
      {
        year: 2027,
        main: '2027-10-09',
        from: '2027-10-06',
        to: '2027-10-09',
        peak: '2027-10-05',
        days: [
          { date: '2027-10-06', label: 'Maha Shashthi' },
          { date: '2027-10-09', label: 'Vijayadashami / Dussehra' },
        ],
      },
    ],
  },
  {
    slug: 'christmas-new-year',
    name: 'Christmas & New Year',
    shortName: 'Christmas',
    aliases: ['Christmas', 'New Year', 'year end holidays', 'winter holidays', 'December holidays'],
    confidence: 'fixed',
    blurb:
      'School winter breaks, Goa and Kerala beach traffic and the Christmas homecoming across Kerala, Goa, Mumbai and the North-East all land in the same ten days.',
    corridors:
      'Mumbai, Bengaluru, Chennai and Delhi to Goa (Madgaon, Thivim), Kerala (Ernakulam, Thiruvananthapuram, Kottayam), Shillong-bound Guwahati, and the hill routes to Kathgodam and Kalka.',
    occurrences: [
      {
        year: 2026,
        main: '2026-12-25',
        from: '2026-12-24',
        to: '2027-01-01',
        peak: '2026-12-24',
        days: [
          { date: '2026-12-24', label: 'Christmas Eve' },
          { date: '2026-12-25', label: 'Christmas Day' },
          { date: '2026-12-31', label: 'New Year’s Eve' },
          { date: '2027-01-01', label: 'New Year’s Day' },
        ],
      },
      {
        year: 2027,
        main: '2027-12-25',
        from: '2027-12-24',
        to: '2028-01-01',
        peak: '2027-12-24',
        days: [
          { date: '2027-12-25', label: 'Christmas Day' },
          { date: '2028-01-01', label: 'New Year’s Day' },
        ],
      },
    ],
  },
  {
    slug: 'pongal-makar-sankranti',
    name: 'Pongal & Makar Sankranti',
    shortName: 'Pongal',
    aliases: ['Pongal', 'Makar Sankranti', 'Sankranti', 'Thai Pongal', 'Bhogi', 'Lohri', 'Magh Bihu', 'Uttarayan'],
    confidence: 'lunar',
    blurb:
      'The harvest festival that sends Chennai, Bengaluru and Hyderabad home to the districts. Tamil Nadu declares special trains every year and they still fill.',
    corridors:
      'Chennai to Madurai, Tiruchirappalli, Tirunelveli, Nagercoil and Coimbatore; Bengaluru to the same, and Hyderabad to Vijayawada, Rajahmundry and Visakhapatnam for Sankranti.',
    occurrences: [
      {
        year: 2027,
        main: '2027-01-15',
        from: '2027-01-14',
        to: '2027-01-17',
        peak: '2027-01-13',
        days: [
          { date: '2027-01-14', label: 'Bhogi / Lohri' },
          { date: '2027-01-15', label: 'Thai Pongal / Makar Sankranti' },
          { date: '2027-01-16', label: 'Mattu Pongal' },
          { date: '2027-01-17', label: 'Kaanum Pongal' },
        ],
      },
    ],
  },
  {
    slug: 'holi',
    name: 'Holi',
    shortName: 'Holi',
    aliases: ['Holi', 'Holika Dahan', 'Dhulandi', 'Rangwali Holi', 'Dol Jatra'],
    confidence: 'lunar',
    blurb:
      'A short, sharp rush: two days of festival, but the whole of the north travels for it and the Delhi–Uttar Pradesh–Bihar trains are as full as they are at Diwali.',
    corridors:
      'Delhi and Mumbai to Lucknow, Kanpur, Varanasi, Gorakhpur, Patna and Jaipur; Kolkata to the districts for Dol Jatra.',
    occurrences: [
      {
        year: 2027,
        main: '2027-03-22',
        from: '2027-03-21',
        to: '2027-03-22',
        peak: '2027-03-20',
        days: [
          { date: '2027-03-21', label: 'Holika Dahan' },
          { date: '2027-03-22', label: 'Rangwali Holi / Dhulandi' },
        ],
      },
    ],
  },
  {
    slug: 'eid-ul-fitr',
    name: 'Eid ul-Fitr',
    shortName: 'Eid',
    aliases: ['Eid', 'Eid al-Fitr', 'Ramzan Eid', 'Ramadan Eid', 'Meethi Eid'],
    confidence: 'moon',
    blurb:
      'The end of Ramzan. The date is confirmed by the moon sighting the night before, so book for the expected day and keep a day either side in mind.',
    corridors:
      'Mumbai, Delhi and Hyderabad to Lucknow, Bareilly, Moradabad, Malegaon, Bhopal and the Bihar and Bengal districts.',
    occurrences: [
      {
        year: 2027,
        main: '2027-03-10',
        from: '2027-03-09',
        to: '2027-03-11',
        peak: '2027-03-08',
        days: [
          { date: '2027-03-10', label: 'Eid ul-Fitr (expected — subject to moon sighting)' },
        ],
      },
    ],
  },
  {
    slug: 'ugadi-gudi-padwa',
    name: 'Ugadi & Gudi Padwa',
    shortName: 'Ugadi',
    aliases: ['Ugadi', 'Gudi Padwa', 'Yugadi', 'Telugu New Year', 'Kannada New Year', 'Marathi New Year', 'Cheti Chand'],
    confidence: 'lunar',
    blurb:
      'New Year for Andhra, Telangana, Karnataka and Maharashtra on the same day, which turns Hyderabad, Bengaluru and Mumbai outbound trains into a single rush.',
    corridors:
      'Hyderabad to Vijayawada, Guntur and Warangal; Bengaluru to Hubballi, Mysuru and Davangere; Mumbai and Pune to Nagpur, Nashik and Kolhapur.',
    occurrences: [
      {
        year: 2027,
        main: '2027-04-08',
        from: '2027-04-08',
        to: '2027-04-08',
        peak: '2027-04-07',
        days: [{ date: '2027-04-08', label: 'Ugadi / Gudi Padwa' }],
      },
    ],
  },
  {
    slug: 'raksha-bandhan',
    name: 'Raksha Bandhan',
    shortName: 'Rakhi',
    aliases: ['Rakhi', 'Rakshabandhan', 'Rakhi Purnima'],
    confidence: 'lunar',
    blurb:
      'One day, but it is the one day people cross the country to be with a sibling. Short-haul trains across the north and west are the ones that vanish.',
    corridors:
      'Delhi, Mumbai and Ahmedabad to Jaipur, Jodhpur, Indore, Bhopal, Lucknow and Kanpur — and the return the same evening or the next day.',
    occurrences: [
      {
        year: 2027,
        main: '2027-08-17',
        from: '2027-08-17',
        to: '2027-08-17',
        peak: '2027-08-16',
        days: [{ date: '2027-08-17', label: 'Raksha Bandhan' }],
      },
    ],
  },
  {
    slug: 'ganesh-chaturthi',
    name: 'Ganesh Chaturthi',
    shortName: 'Ganeshotsav',
    aliases: ['Ganeshotsav', 'Vinayaka Chaturthi', 'Ganpati', 'Anant Chaturdashi', 'Konkan Ganpati'],
    confidence: 'lunar',
    blurb:
      'Mumbai and Pune head to the Konkan. Central Railway runs Ganpati specials on the Konkan line every year and they are the most oversubscribed specials on the network.',
    corridors:
      'Mumbai, Thane and Pune to Ratnagiri, Chiplun, Kudal, Sawantwadi and Madgaon on the Konkan Railway; Hyderabad and Bengaluru to the districts for Vinayaka Chaturthi.',
    occurrences: [
      {
        year: 2026,
        main: '2026-09-14',
        from: '2026-09-14',
        to: '2026-09-23',
        peak: '2026-09-13',
        days: [
          { date: '2026-09-14', label: 'Ganesh Chaturthi' },
          { date: '2026-09-23', label: 'Anant Chaturdashi (immersion)' },
        ],
      },
      {
        year: 2027,
        main: '2027-09-04',
        from: '2027-09-04',
        to: '2027-09-13',
        peak: '2027-09-03',
        days: [
          { date: '2027-09-04', label: 'Ganesh Chaturthi' },
          { date: '2027-09-13', label: 'Anant Chaturdashi (immersion)' },
        ],
      },
    ],
  },
  {
    slug: 'onam',
    name: 'Onam',
    shortName: 'Onam',
    aliases: ['Onam', 'Thiruvonam', 'Thiru Onam', 'Onam holidays'],
    confidence: 'lunar',
    blurb:
      'Every Malayali outside Kerala tries to be home for Thiruvonam. Bengaluru, Chennai and Mumbai to Kerala is the corridor, and the Kerala-bound trains fill on the first morning.',
    corridors:
      'Bengaluru, Chennai, Mumbai, Hyderabad and Delhi to Ernakulam, Thrissur, Kozhikode, Kottayam, Kollam and Thiruvananthapuram.',
    occurrences: [
      {
        year: 2027,
        main: '2027-09-12',
        from: '2027-09-10',
        to: '2027-09-13',
        peak: '2027-09-10',
        days: [
          { date: '2027-09-11', label: 'Uthradom' },
          { date: '2027-09-12', label: 'Thiruvonam (main day)' },
        ],
      },
    ],
  },
];

const FESTIVAL_INDEX = Object.fromEntries(FESTIVALS.map((f) => [f.slug, f]));

const getFestival = (slug) => FESTIVAL_INDEX[slug] || null;

const CONFIDENCE_NOTE = {
  fixed: 'Fixed date every year.',
  lunar: 'Set by the lunar calendar; a regional panchang can differ by a day.',
  moon: 'Depends on the moon sighting the evening before and can move by a day.',
};

/** Journey dates for the outbound and return rush around one occurrence. */
const travelWindows = (occurrence) => {
  const outbound = [];
  const inbound = [];
  for (let d = addDays(occurrence.from, -OUTBOUND_DAYS_BEFORE); d <= occurrence.main; d = addDays(d, 1)) {
    outbound.push(d);
  }
  for (let d = occurrence.to; d <= addDays(occurrence.to, RETURN_DAYS_AFTER); d = addDays(d, 1)) {
    inbound.push(d);
  }
  return { outbound, inbound };
};

/**
 * One journey date turned into its three booking moments plus a status
 * against `today` (null status when today is unknown, e.g. at build time).
 */
const journeyBooking = (journeyDate, today, labels) => {
  const general = computeBookingWindow({ journeyDate, quotaId: 'general', today });
  const tatkalAc = computeBookingWindow({ journeyDate, quotaId: 'tatkal-ac', today });
  const tatkalNonAc = computeBookingWindow({ journeyDate, quotaId: 'tatkal-non-ac', today });
  return {
    journeyDate,
    label: labels[journeyDate] || null,
    general,
    tatkalAc,
    tatkalNonAc,
    status: general.status,
  };
};

/**
 * The occurrence a reader landing today cares about: the first one whose
 * return rush has not yet finished. Once every listed year has passed, the
 * last one is returned so the page still renders rather than going blank —
 * that is the signal to add next year's dates.
 */
const currentOccurrence = (festival, today) => {
  const list = festival.occurrences;
  if (!today) return list[0];
  const live = list.find((o) => addDays(o.to, RETURN_DAYS_AFTER) >= today);
  return live || list[list.length - 1];
};

/**
 * Everything a festival page needs, for one festival and one occurrence.
 *
 * @param {object} festival
 * @param {string|null} today  ISO date, or null when the calendar position is unknown
 * @param {object} [occurrence] defaults to `currentOccurrence(festival, today)`
 */
const festivalPlan = (festival, today = null, occurrence = null) => {
  const occ = occurrence || currentOccurrence(festival, today);
  const labels = Object.fromEntries((occ.days || []).map((d) => [d.date, d.label]));
  const { outbound, inbound } = travelWindows(occ);
  const outboundRows = outbound.map((d) => journeyBooking(d, today, labels));
  const inboundRows = inbound.map((d) => journeyBooking(d, today, labels));
  const peak = journeyBooking(occ.peak, today, labels);
  const main = journeyBooking(occ.main, today, labels);

  const all = [...outboundRows, ...inboundRows];
  const allOpen = today ? all.every((r) => r.status === 'window-open' || r.status === 'journey-passed') : false;
  const noneOpen = today ? all.every((r) => r.status === 'upcoming') : false;
  const festivalOver = today ? today > addDays(occ.to, RETURN_DAYS_AFTER) : false;

  let phase = 'unknown';
  if (today) {
    if (festivalOver) phase = 'over';
    else if (noneOpen) phase = 'before';
    else if (allOpen) phase = 'open';
    else phase = 'opening';
  }

  return {
    festival,
    occurrence: occ,
    today,
    phase,
    peak,
    main,
    outbound: outboundRows,
    inbound: inboundRows,
    firstOpens: outboundRows[0].general.opensDate,
    lastOpens: inboundRows[inboundRows.length - 1].general.opensDate,
    confidenceNote: CONFIDENCE_NOTE[festival.confidence] || CONFIDENCE_NOTE.lunar,
  };
};

/** Every festival with its current occurrence, soonest first. */
const upcomingFestivals = (today = null) =>
  FESTIVALS.map((f) => festivalPlan(f, today))
    .filter((p) => p.phase !== 'over')
    .sort((a, b) => (a.occurrence.main < b.occurrence.main ? -1 : a.occurrence.main > b.occurrence.main ? 1 : 0));

module.exports = {
  FESTIVALS,
  CONFIDENCE_NOTE,
  OUTBOUND_DAYS_BEFORE,
  RETURN_DAYS_AFTER,
  addDays,
  getFestival,
  currentOccurrence,
  travelWindows,
  festivalPlan,
  upcomingFestivals,
};
