// Device-local journey store.
//
// Deliberately localStorage and nothing else: no account, no sync, no server
// copy. A saved journey is a date, a quota and an optional label — the whole
// point of the feature is a countdown, and none of that needs to leave the
// device. A journey saved from the ticket reader also carries `ticket`, the
// booked ticket without passenger names (utils/storedTicket.js), so its card
// can be rebuilt against a fresh clock. If sync is ever added it should be opt-in and explicit, not a
// silent upgrade of data people already stored under this promise.

import { toStored, fromStored } from './storedTicket';

const STORAGE_KEY = 'railmonk.savedJourneys.v1';
const MAX_JOURNEYS = 20;
const LABEL_MAX = 60;

const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

/** Reject anything that is not a well-formed record, so bad data can't render. */
const sanitize = (entry) => {
  if (!entry || typeof entry !== 'object') return null;
  if (!isIsoDate(entry.journeyDate)) return null;
  const id = typeof entry.id === 'string' && entry.id ? entry.id : null;
  if (!id) return null;
  return {
    id,
    journeyDate: entry.journeyDate,
    quotaId: typeof entry.quotaId === 'string' ? entry.quotaId : 'general',
    label: typeof entry.label === 'string' ? entry.label.slice(0, LABEL_MAX) : '',
    departureTime: /^\d{2}:\d{2}$/.test(entry.departureTime) ? entry.departureTime : '',
    savedAt: typeof entry.savedAt === 'string' ? entry.savedAt : new Date().toISOString(),
    ...(entry.ticket && fromStored(entry.ticket) ? { ticket: toStored(fromStored(entry.ticket)) } : {}),
  };
};

export const loadJourneys = () => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitize).filter(Boolean).sort((a, b) => a.journeyDate.localeCompare(b.journeyDate));
  } catch (e) {
    // Corrupt or unreadable storage (private mode, quota, hand-edited value):
    // an empty list is a better outcome than a crashed page.
    return [];
  }
};

const persist = (journeys) => {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys.slice(0, MAX_JOURNEYS)));
    return true;
  } catch (e) {
    return false;
  }
};

const makeId = () => `j_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Add a journey. Returns the new list, or null if storage is unavailable.
 * Re-saving the same date + quota updates the existing entry instead of
 * stacking duplicates.
 */
export const saveJourney = ({ journeyDate, quotaId = 'general', label = '', departureTime = '' }) => {
  if (!isIsoDate(journeyDate)) return null;
  const existing = loadJourneys();
  // Booked tickets are matched by PNR, not by date: two tickets on one day
  // are two journeys.
  const match = existing.find((j) => !j.ticket && j.journeyDate === journeyDate && j.quotaId === quotaId);
  const entry = sanitize({
    id: match ? match.id : makeId(),
    journeyDate,
    quotaId,
    label,
    departureTime,
    savedAt: new Date().toISOString(),
  });
  if (!entry) return null;
  const next = [...existing.filter((j) => j.id !== entry.id), entry].sort((a, b) => a.journeyDate.localeCompare(b.journeyDate));
  return persist(next) ? next : null;
};

/**
 * Save a booked ticket read by the ticket reader. Re-saving the same PNR
 * replaces the earlier copy, so a ticket re-read after charting updates its
 * statuses. Returns { list, id }, or null if storage is unavailable.
 */
export const saveTicketJourney = (ticket, label = '') => {
  const stored = toStored(ticket);
  if (!stored) return null;
  const existing = loadJourneys();
  const match = existing.find((j) => j.ticket && stored.pnr && j.ticket.pnr === stored.pnr);
  const tatkal = stored.quota && stored.quota.tatkal;
  const entry = sanitize({
    id: match ? match.id : makeId(),
    journeyDate: stored.departure.date,
    quotaId: tatkal ? 'tatkal-ac' : 'general',
    label,
    departureTime: stored.departure.time || '',
    savedAt: new Date().toISOString(),
    ticket: stored,
  });
  if (!entry) return null;
  const next = [...existing.filter((j) => j.id !== entry.id), entry].sort((a, b) => a.journeyDate.localeCompare(b.journeyDate));
  return persist(next) ? { list: next, id: entry.id } : null;
};

export const getJourney = (id) => loadJourneys().find((j) => j.id === id) || null;

export const removeJourney = (id) => {
  const next = loadJourneys().filter((j) => j.id !== id);
  return persist(next) ? next : null;
};

export const clearJourneys = () => (persist([]) ? [] : null);

/** Drop journeys whose date is in the past, relative to an ISO "today". */
export const prunePast = (todayIso) => {
  if (!isIsoDate(todayIso)) return loadJourneys();
  const next = loadJourneys().filter((j) => j.journeyDate >= todayIso);
  return persist(next) ? next : loadJourneys();
};

export const STORAGE_KEY_NAME = STORAGE_KEY;
export const MAX_SAVED_JOURNEYS = MAX_JOURNEYS;
