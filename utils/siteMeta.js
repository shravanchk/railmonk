import buildMeta from '../generated/buildMeta.json';

// Single source of truth for the "Last reviewed" date shown across calculators
// and legal pages that do not pass an explicit, page-specific review date.
// Update this one constant to refresh every defaulting page at once.
export const DEFAULT_REVIEW_DATE = 'June 28, 2026';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});

export const getBuildTimestamp = () => {
  const timestamp = buildMeta?.buildTimestamp;
  return timestamp || new Date().toISOString();
};

export const getBuildDate = () => getBuildTimestamp().slice(0, 10);

export const formatDateLabel = (dateValue) => {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return DATE_FORMATTER.format(parsed);
};

export const getAutoUpdatedLabel = () => {
  const label = formatDateLabel(getBuildTimestamp());
  return label ? `Auto-updated on ${label}` : 'Auto-updated';
};

export const getDataFreshnessLabel = () => {
  const latest = buildMeta?.dataFreshness?.latestAvailable;
  const parsed = latest ? new Date(latest) : null;
  const staleAfterMs = 180 * 24 * 60 * 60 * 1000;
  if (!parsed || Number.isNaN(parsed.getTime()) || Date.now() - parsed.getTime() > staleAfterMs) return null;
  const label = formatDateLabel(latest);
  return label ? `Data snapshot: ${label}` : null;
};
