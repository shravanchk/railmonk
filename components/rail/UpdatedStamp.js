import React from 'react';
import Link from 'next/link';
import { CalendarCheck, ShieldCheck } from 'lucide-react';
import { ruleUpdatesFor } from '../../utils/ruleUpdates';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** ISO date → "24 July 2026", without dragging in a locale-dependent formatter. */
export const formatIsoDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return null;
  const [, y, mo, d] = m;
  return `${Number(d)} ${MONTHS[Number(mo) - 1]} ${y}`;
};

/**
 * Freshness line for a rule-sensitive page: when we last reviewed it, and which
 * dated rule changes the page currently reflects.
 *
 * @param {{ updated: string, href?: string, note?: string }} props
 */
const UpdatedStamp = ({ updated, href, note }) => {
  const label = formatIsoDate(updated);
  const changes = href ? ruleUpdatesFor(href) : [];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted dark:text-slate-500">
      {label ? (
        <span className="inline-flex items-center gap-1.5">
          <CalendarCheck aria-hidden="true" className="h-3.5 w-3.5" />
          Rules reviewed <time dateTime={updated}>{label}</time>
        </span>
      ) : null}
      {changes.length ? (
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
          Reflects{' '}
          <Link href="/rail/rule-updates" className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800 dark:text-brand-300">
            {changes.length === 1 ? `the ${changes[0].effectiveLabel} rule change` : `${changes.length} rule changes`}
          </Link>
        </span>
      ) : null}
      {note ? <span>{note}</span> : null}
    </div>
  );
};

export default UpdatedStamp;
