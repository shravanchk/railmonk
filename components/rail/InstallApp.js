import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Smartphone } from 'lucide-react';
import { promptInstall, useInstallState } from '../../utils/install';
import { cn } from '../ui/cn';

/**
 * "Install the app", wherever the browser can install it. `card` is the full
 * pitch shown on the ticket reader; `link` is a footer-sized button. On iPhone
 * it explains Add to Home Screen, since Safari has no install prompt.
 * Renders nothing once installed, or where installing is not possible.
 *
 * `t` is the install block of the ticket reader's copy (en or hi).
 */
export default function InstallApp({ t, variant = 'link', className = '' }) {
  const state = useInstallState();
  const [help, setHelp] = useState(false);

  if (state === 'none') return null;
  const onClick = () => (state === 'prompt' ? promptInstall() : setHelp(true));
  const label = state === 'ios' ? t.ios : t.cta;

  return (
    <>
      {variant === 'card' ? (
        <div
          className={cn(
            'flex flex-col gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 p-4 sm:flex-row sm:items-center dark:border-brand-800/60 dark:bg-brand-900/20',
            className
          )}
        >
          <Smartphone aria-hidden="true" className="h-6 w-6 shrink-0 text-brand-700 dark:text-brand-300" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-ink dark:text-white">{t.title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-ink-soft dark:text-slate-300">{t.body}</p>
          </div>
          <button
            type="button"
            onClick={onClick}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            {label}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className={cn('inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-brand-700 dark:text-slate-400 dark:hover:text-white', className)}
        >
          <Smartphone aria-hidden="true" className="h-4 w-4" />
          {label}
        </button>
      )}
      {help && typeof document !== 'undefined' ? createPortal(<IosHelp t={t} onClose={() => setHelp(false)} />, document.body) : null}
    </>
  );
}

function IosHelp({ t, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-install-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] dark:border-slate-700 dark:bg-slate-900"
      >
        <h2 id="ios-install-title" className="font-display text-lg font-bold text-ink dark:text-white">
          {t.iosTitle}
        </h2>
        <ol className="mt-4 space-y-3 text-sm text-ink-soft dark:text-slate-300">
          {t.iosSteps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-ink-muted dark:text-slate-400">{t.iosNote}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 min-h-[44px] w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-slate-300 dark:border-slate-700 dark:text-white"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}
