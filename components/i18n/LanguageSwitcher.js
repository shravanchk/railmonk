import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Languages } from 'lucide-react';
import { counterpartHref, localeFromPath } from '../../utils/i18n';

/**
 * EN ⇄ हिं for the current page.
 *
 * Only rendered where a real counterpart exists. A switcher that appears on
 * every page and quietly dumps people on the Hindi home page when the page they
 * were reading has no translation teaches them not to trust the button — so on
 * untranslated pages this renders nothing at all, and the Hindi section is
 * reached through its own hub link instead.
 */
export default function LanguageSwitcher({ className = '' }) {
  const router = useRouter();
  const target = counterpartHref(router.pathname);
  if (!target) return null;

  const goingTo = localeFromPath(router.pathname) === 'hi' ? 'en' : 'hi';

  return (
    <Link
      href={target}
      hrefLang={goingTo === 'hi' ? 'hi-IN' : 'en-IN'}
      // lang on the element itself: the label is in the language being offered,
      // not the language of the page it sits on, and a screen reader should
      // switch voice for it.
      lang={goingTo}
      title={goingTo === 'hi' ? 'हिंदी में पढ़ें' : 'Read in English'}
      className={
        'inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-2 ' +
        'text-sm font-semibold text-ink-soft transition hover:border-brand-300 hover:text-brand-700 ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ' +
        'dark:border-slate-700 dark:text-slate-300 dark:hover:text-white ' +
        className
      }
    >
      <Languages aria-hidden="true" className="h-4 w-4 shrink-0" />
      {goingTo === 'hi' ? 'हिंदी' : 'EN'}
      <span className="sr-only">{goingTo === 'hi' ? 'में पढ़ें' : ' — read in English'}</span>
    </Link>
  );
}
