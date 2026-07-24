import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BellRing, ChevronDown, Menu, X, Search, Sun, Moon, ArrowLeft } from 'lucide-react';
import { cn } from '../ui/cn';
import SiteSearch, { openSearch } from '../search/SiteSearch';
import { TOOLS as CATALOG_TOOLS } from '../../utils/catalog';

type NavLink = { label: string; href: string };

// Built from the catalog so a newly added tool appears in the menu without a
// second edit here — the old hand-kept copy of this list went stale twice.
const TOOLS: NavLink[] = CATALOG_TOOLS.map((t) => ({ label: t.nav || t.title, href: t.href }));

const RESOURCES: NavLink[] = [
  { label: 'Rule changes', href: '/rail/rule-updates' },
  { label: 'Saved journeys', href: '/rail/saved-journeys' },
  { label: 'About Railmonk', href: '/about' },
  { label: 'Contact', href: '/contact' },
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
        <div className="flex items-center gap-2">
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
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/railmonk-logo.svg" alt="" className="h-8 w-8" width={32} height={32} />
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold text-ink dark:text-white">Railmonk</span>
            {/* Hidden until xl: between md and lg the row carries the menu, the
                search trigger and the reminder CTA, and the tagline is what
                forces them to wrap. */}
            <span className="hidden text-[0.68rem] text-ink-muted dark:text-slate-400 xl:block">Indian Railways tools, minus the guesswork</span>
          </span>
        </Link>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <Dropdown label="Rail Tools" items={TOOLS} />
          <Link href="/guides" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:text-brand-700 dark:text-slate-300 dark:hover:text-white">Guides</Link>
          <Dropdown label="Resources" items={RESOURCES} />
        </div>

        <div className="flex items-center gap-1.5">
          <SiteSearch />
          <Link
            href="/rail/booking-reminder"
            className="hidden items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:inline-flex"
          >
            <BellRing aria-hidden="true" className="h-4 w-4" />
            Set a reminder
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
              <span className="font-display text-lg font-bold text-ink dark:text-white">Menu</span>
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
              Search tools, guides and rules…
            </button>

            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-ink-muted">Rail Tools</p>
            <div className="mt-1">
              {TOOLS.map((it) => (
                <Link key={it.href} href={it.href} onClick={() => setDrawer(false)} className="block rounded-lg px-2 py-2 text-sm text-ink-soft hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-slate-800">{it.label}</Link>
              ))}
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-muted">Explore</p>
            <div className="mt-1">
              <Link href="/guides" onClick={() => setDrawer(false)} className="block rounded-lg px-2 py-2 text-sm text-ink-soft hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-slate-800">Guides</Link>
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
