# Railmonk

[railmonk.com](https://railmonk.com) — free IRCTC and Indian Railways tools, split out from
[upaman.com](https://upaman.com) so rail content lives on a dedicated, topically focused domain.

## Tools

| Route | Tool |
|---|---|
| `/irctc-calculator` | IRCTC booking date calculator (general + Tatkal windows) |
| `/irctc-cancellation-calculator` | Cancellation refund calculator (April 2026 refund rules) |
| `/tatkal-charges-calculator` | Tatkal charges calculator |
| `/tdr-refund-checker` | TDR refund eligibility checker |
| `/berth-position-finder` | Coach berth position finder |
| `/guides/irctc-booking-strategy` | Booking strategy guide |

## Trains abroad (`/world`)

A separate section for travel outside India, kept apart from the IRCTC tools so
the site's India focus stays legible.

| Route | Tool |
|---|---|
| `/world/delay-compensation` | Delay compensation checker — EU 2021/782, UK Delay Repay, Eurostar, SBB, Amtrak, Australia |
| `/world/booking-windows` | Booking window calculator — when tickets go on sale, by operator |

Two things these engines do deliberately. `delayCompensation.js` refuses to
produce a number for the US and Australia, because no statutory entitlement
exists there and a percentage would invent one. `bookingHorizons.js` flags
operators whose horizon genuinely moves (`reliable: false`) so the page hedges
instead of implying a precision nobody has.

Calculation engines live in `utils/engines/` with tests in `test/`. Worked examples in page prose
are computed from the same engines the calculators run, so text can't drift from results.

## Hindi (`/hi`)

Next's built-in i18n routing does not work with `output: 'export'`, so a translated
page is a real page: `/rail/x` has its Hindi twin at `/hi/rail/x`. That is also the
only arrangement a crawler can index — a client-side toggle would leave Google
looking at English markup.

`utils/i18n.js` holds the single source of truth. `TRANSLATED` lists which English
routes have a Hindi twin, and everything derives from it: the language switcher's
target, the hreflang pair, the Devanagari font that only `/hi` pages load, and the
`lang` attribute set per route by `_document`. `test/i18n.test.js` fails if the
registry and the files on disk ever disagree, or if an hreflang points at a page
that does not exist.

Currently translated: the home hub plus the booking-date, cancellation-refund,
waitlist-chances and Tatkal-charges calculators. To add another, write the page
under `pages/hi/…` and add one line to `TRANSLATED`.

Hindi copy lives in the page's own file in one block rather than in a key-value
dictionary — only shared chrome (buttons, headings, breadcrumbs) is keyed, in
`STRINGS`. Calculations are never duplicated: Hindi pages import the same engines,
so the two languages cannot disagree about a number. **The Hindi prose has not been
reviewed by a native speaker** — that pass is still worth doing before promoting
these pages.

## Stack

- Next.js (pages router), static export (`output: 'export'` → `out/`)
- Tailwind CSS (brand palette in `tailwind.config.js`)
- Deployed to Cloudflare Pages via wrangler

## Develop

```bash
npm install
npm run dev     # local dev server
npm test        # engine tests
npm run build   # static export to out/
```

## Deploy

```bash
npm run build
npx wrangler pages deploy out --project-name=railmonk
```
