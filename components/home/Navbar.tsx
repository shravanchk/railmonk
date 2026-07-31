import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BellRing, ChevronDown, Menu, X, Search, Sun, Moon, ArrowLeft } from 'lucide-react';
import { cn } from '../ui/cn';
import SiteSearch, { openSearch } from '../search/SiteSearch';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import { TOOLS as CATALOG_TOOLS, localizedTitle } from '../../utils/catalog';
import { localeFromPath, hasTranslation, toHindiHref, t } from '../../utils/i18n';

type NavLink = { label: string; href: string };

// Built from the catalog so a newly added tool appears in the menu without a
// second edit here — the old hand-kept copy of this list went stale twice.
//
// The two menus are split by category rather than merged: the Indian tools are
// what this site is for, and burying "Delay compensation in the EU" among them
// would misrepresent both.
const WORLD_TOOLS: NavLink[] = [
  { label: 'All trains-abroad tools', href: '/world' },
  ...CATALOG_TOOLS.filter((t) => t.category === 'world').map((t) => ({ label: t.nav || t.title, href: t.href })),
];

// Menus are rebuilt per locale rather than held as constants: on a Hindi page a
// tool that has a Hindi twin should be named in Hindi and link to that twin,
// while an untranslated one keeps its English name so the label matches the page
// it opens.
const buildTools = (locale: string): NavLink[] =>
  CATALOG_TOOLS.filter((t) => t.category !== 'world').map((tool) => ({
    label: locale === 'hi' && hasTranslation(tool.href)
      ? localizedTitle(tool, 'hi')
      : tool.nav || tool.title,
    href: locale === 'hi' && hasTranslation(tool.href) ? toHindiHref(tool.href) : tool.href,
  }));

const buildResources = (locale: string): NavLink[] => [
  { label: t('nav.ruleChanges', locale), href: '/rail/rule-updates' },
  { label: t('nav.savedJourneys', locale), href: '/rail/saved-journeys' },
  { label: t('nav.about', locale), href: '/about' },
  { label: t('nav.contact', locale), href: '/contact' },
];

function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const isDark = typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark';
    setDark(isDark);
    document.body.classList.toggle('dark-theme', isDark);
  }, []);
  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.body.classList.toggle('dark-theme', next);
      try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch (e) { /* ignore */ }
      return next;
    });
  };
  return [dark, toggle];
}

function Dropdown({ label, items }: { label: string; items: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  const linkCls = 'block rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white';
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:text-brand-700 dark:text-slate-300 dark:hover:text-white"
      >
        {label}
        <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-card dark:border-slate-700 dark:bg-slate-800">
          {items.map((it) => (
            <Link key={it.href} href={it.href} onClick={() => setOpen(false)} className={linkCls}>
              {it.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Navbar() {
  const router = useRouter();
  const isHome = router.pathname === '/';
  const [dark, toggleDark] = useDarkMode();
  const [drawer, setDrawer] = useState(false);
  const locale = localeFromPath(router.pathname);
  const TOOLS = buildTools(locale);
  const RESOURCES = buildResources(locale);

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/85">
      <nav className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 xl:px-16" aria-label="Primary">
        {/* min-w-0 so the wordmark can shrink rather than push the controls on
            the right off the edge — the language switcher made this row one
            item wider on a phone. */}
        <div className="flex min-w-0 items-center gap-2">
        {!isHome && (
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-ink-soft transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <img src="/railmonk-logo.svg" alt="" className="h-8 w-8 shrink-0" width={32} height={32} />
          <span className="min-w-0 leading-tight">
            <span className="block font-display text-lg font-bold text-ink dark:text-white">Railmonk</span>
            {/* Hidden until xl: between md and lg the row carries the menu, the
                search trigger and the reminder CTA, and the tagline is what
                forces them to wrap. */}
            <span className="hidden text-[0.68rem] text-ink-muted dark:text-slate-400 xl:block">Indian Railways tools, minus the guesswork</span>
          </span>
        </Link>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <Dropdown label={t('nav.railTools', locale)} items={TOOLS} />
          <Dropdown label={t('nav.trainsAbroad', locale)} items={WORLD_TOOLS} />
          <Link href="/guides" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:text-brand-700 dark:text-slate-300 dark:hover:text-white">{t('nav.guides', locale)}</Link>
          <Dropdown label={t('nav.resources', locale)} items={RESOURCES} />
        </div>

        <div className="flex items-center gap-1.5">
          {/* Below sm the row already carries back, wordmark, search, theme and
              menu; a sixth control clips the wordmark. The switcher moves into
              the drawer at that width rather than being dropped. */}
          <span className="hidden sm:block">
            <LanguageSwitcher />
          </span>
          <SiteSearch />
          <Link
            href="/rail/booking-reminder"
            className="hidden items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:inline-flex"
          >
            <BellRing aria-hidden="true" className="h-4 w-4" />
            {t('nav.setReminder', locale)}
          </Link>
          <button
            type="button"
            onClick={toggleDark}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-ink-soft transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-ink-soft transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden dark:border-slate-700 dark:text-slate-300"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>
      </header>

      {drawer ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-5 shadow-card dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold text-ink dark:text-white">{t('nav.menu', locale)}</span>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="rounded-lg p-2 text-ink-soft hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setDrawer(false); openSearch(); }}
              className="mt-5 flex w-full items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-ink-muted transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:text-slate-400"
            >
              <Search aria-hidden="true" className="h-4 w-4" />
              {t('nav.searchPlaceholder', locale)}
            </button>

            <div className="mt-2.5" onClick={() => setDrawer(false)}>
              <LanguageSwitcher className="w-full justify-center" />
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-ink-muted">{t('nav.railTools', locale)}</p>
            <div className="mt-1">
              {TOOLS.map((it) => (
                <Link key={it.href} href={it.href} onClick={() => setDrawer(false)} className="block rounded-lg px-2 py-2 text-sm text-ink-soft hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-slate-800">{it.label}</Link>
              ))}
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-muted">{t('nav.trainsAbroad', locale)}</p>
            <div className="mt-1">
              {WORLD_TOOLS.map((it) => (
                <Link key={it.href} href={it.href} onClick={() => setDrawer(false)} className="block rounded-lg px-2 py-2 text-sm text-ink-soft hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-slate-800">{it.label}</Link>
              ))}
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-muted">{t('nav.explore', locale)}</p>
            <div className="mt-1">
              <Link href="/guides" onClick={() => setDrawer(false)} className="block rounded-lg px-2 py-2 text-sm text-ink-soft hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-slate-800">{t('nav.guides', locale)}</Link>
              {RESOURCES.map((it) => (
                <Link key={it.href} href={it.href} onClick={() => setDrawer(false)} className="block rounded-lg px-2 py-2 text-sm text-ink-soft hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-slate-800">{it.label}</Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
