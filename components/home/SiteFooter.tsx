import React from 'react';
import Link from 'next/link';
import Container from '../ui/Container';

type Col = { heading: string; links: { label: string; href: string; external?: boolean }[] };

const COLUMNS: Col[] = [
  {
    heading: 'Rail Tools',
    links: [
      { label: 'IRCTC Booking Date Calculator', href: '/rail/irctc-calculator' },
      { label: 'Cancellation Refund Calculator', href: '/rail/irctc-cancellation-calculator' },
      { label: 'Tatkal Charges Calculator', href: '/rail/tatkal-charges-calculator' },
      { label: 'TDR Refund Checker', href: '/rail/tdr-refund-checker' },
      { label: 'Berth Position Finder', href: '/rail/berth-position-finder' },
    ],
  },
  {
    heading: 'Guides',
    links: [
      { label: 'IRCTC Booking Strategy', href: '/rail/guides/irctc-booking-strategy' },
      { label: 'All Guides', href: '/guides' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Railmonk Research Team', href: '/authors/railmonk-research-team' },
      { label: 'Finance calculators on Upaman', href: 'https://upaman.com/', external: true },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/railmonk-logo.svg" alt="" className="h-8 w-8" width={32} height={32} />
              <span className="font-display text-lg font-bold text-ink dark:text-white">Railmonk</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted dark:text-slate-400">
              Free IRCTC and Indian Railways tools — refunds, Tatkal charges, TDR claims, and berth positions,
              explained with the actual rules.
            </p>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-ink-muted dark:text-slate-500">
              Railmonk is independent and not affiliated with IRCTC or Indian Railways.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink dark:text-slate-200">{col.heading}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {l.external ? (
                      <a href={l.href} rel="noopener" className="text-sm text-ink-muted hover:text-brand-700 dark:text-slate-400 dark:hover:text-white">{l.label}</a>
                    ) : (
                      <Link href={l.href} className="text-sm text-ink-muted hover:text-brand-700 dark:text-slate-400 dark:hover:text-white">{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-ink-muted dark:border-slate-800 dark:text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Railmonk. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms-of-service" className="hover:text-brand-700 dark:hover:text-white">Terms</Link>
            <Link href="/privacy-policy" className="hover:text-brand-700 dark:hover:text-white">Privacy</Link>
            <Link href="/cookie-policy" className="hover:text-brand-700 dark:hover:text-white">Cookies</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
