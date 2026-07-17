import React from 'react';
import { getAutoUpdatedLabel } from '../../utils/siteMeta';

const titleCls = 'm-0 text-[0.84rem] font-bold text-ink dark:text-slate-100';
const valueCls = 'mt-0.5 text-[0.84rem] leading-relaxed text-ink-soft dark:text-slate-300';
const linkCls = 'font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200';

const renderIdentity = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value.url) return <a href={value.url} className={linkCls}>{value.label}</a>;
  return value.label || null;
};

const EEATPanel = ({ author, reviewer, reviewedOn, scope, sources = [] }) => {
  const updatedLabel = getAutoUpdatedLabel();

  return (
    <section
      className="mb-3.5 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-700/70 dark:bg-slate-800/60"
      aria-label="Editorial trust and source panel"
    >
      <p className="mb-2 text-[0.78rem] font-bold uppercase tracking-[0.03em] text-teal-700 dark:text-teal-300">Editorial Trust Panel</p>
      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className={titleCls}>Author</p>
          <p className={valueCls}>{renderIdentity(author)}</p>
        </div>
        <div>
          <p className={titleCls}>Reviewed by</p>
          <p className={valueCls}>{renderIdentity(reviewer)}</p>
        </div>
        <div>
          <p className={titleCls}>Last reviewed</p>
          <p className={valueCls}>{reviewedOn}</p>
        </div>
        <div>
          <p className={titleCls}>Content update</p>
          <p className={valueCls}>{updatedLabel}</p>
        </div>
      </div>

      {scope ? (
        <p className={`${valueCls} mt-2.5`}>
          <strong className="text-ink dark:text-slate-100">Scope:</strong> {scope}
        </p>
      ) : null}

      {sources.length ? (
        <div className="mt-2.5">
          <p className={titleCls}>Primary references</p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5">
            {sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className={`text-[0.82rem] ${linkCls}`}>
                {source.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default EEATPanel;
