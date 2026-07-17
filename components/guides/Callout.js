import React from 'react';

// Simple callout used inside guide prose to carry the highlighted "box" blocks
// migrated from the legacy static guides. Inner p/ul/ol/strong pick up the
// GuidePageLayout prose styles; the wrapper adds the light/dark background.
const Callout = ({ children, tone = 'default' }) => (
  <div
    className={`mt-4 rounded-lg border bg-slate-50 p-4 dark:bg-slate-800/40 ${
      tone === 'note'
        ? 'border-slate-200 border-l-4 border-l-teal-600 dark:border-slate-700/60 dark:border-l-teal-500'
        : 'border-slate-200 dark:border-slate-700/60'
    }`}
  >
    {children}
  </div>
);

export default Callout;
