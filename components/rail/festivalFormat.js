// Small date helpers shared by the festival pages. Weekday-aware, locale-free,
// and IST-safe because they never construct a local-time Date.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const parts = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return null;
  const [, y, mo, d] = m.map(Number);
  return { y, mo, d, weekday: new Date(Date.UTC(y, mo - 1, d)).getUTCDay() };
};

/** "Sunday, 8 November 2026" */
export const formatLong = (iso) => {
  const p = parts(iso);
  return p ? `${WEEKDAYS[p.weekday]}, ${p.d} ${MONTHS[p.mo - 1]} ${p.y}` : '';
};

/** "8 November 2026" */
export const formatDate = (iso) => {
  const p = parts(iso);
  return p ? `${p.d} ${MONTHS[p.mo - 1]} ${p.y}` : '';
};

/** "Sun 8 Nov" */
export const formatShort = (iso) => {
  const p = parts(iso);
  return p ? `${WEEKDAYS_SHORT[p.weekday]} ${p.d} ${MONTHS_SHORT[p.mo - 1]}` : '';
};

/** "8 Nov" */
export const formatDayMonth = (iso) => {
  const p = parts(iso);
  return p ? `${p.d} ${MONTHS_SHORT[p.mo - 1]}` : '';
};

/** Human status for one booking window row, given its engine status. */
export const statusLabel = (row) => {
  const s = row?.status;
  const n = row?.general?.daysUntilOpen;
  if (s === 'window-open') return { text: 'Open now', tone: 'open' };
  if (s === 'open-today') return { text: 'Opens today, 08:00', tone: 'today' };
  if (s === 'upcoming') return { text: n === 1 ? 'Opens tomorrow' : `Opens in ${n} days`, tone: 'soon' };
  if (s === 'journey-passed') return { text: 'Date has passed', tone: 'muted' };
  return { text: '', tone: 'muted' };
};

export const toneCls = {
  open: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800',
  today: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-800',
  soon: 'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-800',
  muted: 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
};
