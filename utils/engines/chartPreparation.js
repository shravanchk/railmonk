// Reservation chart preparation timing for Indian Railways.
//
// Current rules (Railway Board revision reported December 2025, superseding the
// 8-hour rule of Commercial Circular No. 10 of 2025):
//   • Trains departing 05:00–14:00  → first chart prepared by 20:00 the
//     previous evening.
//   • All other departures (14:01–23:59 and 00:00–04:59) → first chart
//     prepared 10 hours before scheduled departure.
//   • Final (second) chart → about 30 minutes before scheduled departure for
//     every train.
//
// All arithmetic is wall-clock IST. Times are held in a UTC-backed Date purely
// so that date rollovers are exact and identical on any machine — never format
// these with local-timezone getters, use the helpers below.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const FIRST_CHART_LEAD_HOURS = 10;
const FINAL_CHART_LEAD_MINUTES = 30;
const EVENING_CHART_HOUR = 20; // 20:00 previous day
const MORNING_BAND_START_HOUR = 5; // 05:00 inclusive
const MORNING_BAND_END_HOUR = 14; // 14:00 inclusive

// Build a wall-clock instant from an ISO date (YYYY-MM-DD) and a HH:MM time.
const wallClock = (isoDate, timeHHMM) => {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || '').trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(String(timeHHMM || '').trim());
  if (!dateMatch || !timeMatch) return null;
  const [, y, m, d] = dateMatch;
  const [, hh, mm] = timeMatch;
  const hours = Number(hh);
  const minutes = Number(mm);
  if (hours > 23 || minutes > 59) return null;
  const instant = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), hours, minutes));
  return Number.isNaN(instant.getTime()) ? null : instant;
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n) => String(n).padStart(2, '0');

/** "Thursday, 24 July 2026" — always read back in wall-clock terms. */
const formatWallDate = (instant) =>
  `${DAY_NAMES[instant.getUTCDay()]}, ${instant.getUTCDate()} ${MONTH_NAMES[instant.getUTCMonth()]} ${instant.getUTCFullYear()}`;

/** "08:05 PM" */
const formatWallTime = (instant) => {
  const h24 = instant.getUTCHours();
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${pad(h12)}:${pad(instant.getUTCMinutes())} ${suffix}`;
};

/** "2026-07-24T20:00" — for datetime attributes and calendar exports. */
const toWallIso = (instant) =>
  `${instant.getUTCFullYear()}-${pad(instant.getUTCMonth() + 1)}-${pad(instant.getUTCDate())}` +
  `T${pad(instant.getUTCHours())}:${pad(instant.getUTCMinutes())}`;

/**
 * @param {{ departureDate: string, departureTime: string }} input ISO date + HH:MM (IST)
 * @returns {null | {
 *   departure: Date, firstChart: Date, finalChart: Date,
 *   rule: 'previous-evening' | 'ten-hours',
 *   firstChartLeadHours: number, chartsOnPreviousDay: boolean
 * }}
 */
const computeChartTimes = ({ departureDate, departureTime }) => {
  const departure = wallClock(departureDate, departureTime);
  if (!departure) return null;

  const departureHour = departure.getUTCHours();
  const inMorningBand =
    departureHour >= MORNING_BAND_START_HOUR &&
    (departureHour < MORNING_BAND_END_HOUR ||
      (departureHour === MORNING_BAND_END_HOUR && departure.getUTCMinutes() === 0));

  let firstChart;
  let rule;
  if (inMorningBand) {
    firstChart = new Date(departure.getTime());
    firstChart.setUTCDate(firstChart.getUTCDate() - 1);
    firstChart.setUTCHours(EVENING_CHART_HOUR, 0, 0, 0);
    rule = 'previous-evening';
  } else {
    firstChart = new Date(departure.getTime() - FIRST_CHART_LEAD_HOURS * HOUR);
    rule = 'ten-hours';
  }

  const finalChart = new Date(departure.getTime() - FINAL_CHART_LEAD_MINUTES * MINUTE);

  return {
    departure,
    firstChart,
    finalChart,
    rule,
    firstChartLeadHours: Math.round(((departure.getTime() - firstChart.getTime()) / HOUR) * 10) / 10,
    chartsOnPreviousDay: firstChart.getUTCDate() !== departure.getUTCDate(),
  };
};

module.exports = {
  FIRST_CHART_LEAD_HOURS,
  FINAL_CHART_LEAD_MINUTES,
  EVENING_CHART_HOUR,
  computeChartTimes,
  formatWallDate,
  formatWallTime,
  toWallIso,
  wallClock,
};
