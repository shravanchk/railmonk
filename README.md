# Railmonk

[railmonk.com](https://railmonk.com) — free IRCTC and Indian Railways tools, split out from
[upaman.com](https://upaman.com) so rail content lives on a dedicated, topically focused domain.

## Tools

| Route | Tool |
|---|---|
| `/rail/irctc-calculator` | IRCTC booking date calculator (general + Tatkal windows) |
| `/rail/irctc-cancellation-calculator` | Cancellation refund calculator (April 2026 refund rules) |
| `/rail/tatkal-charges-calculator` | Tatkal charges calculator |
| `/rail/tdr-refund-checker` | TDR refund eligibility checker |
| `/rail/train-fare-calculator` | Train fare calculator |
| `/rail/waitlist-confirmation-chances` | Waitlist confirmation chances |
| `/rail/chart-preparation-time` | Chart preparation time |
| `/rail/berth-position-finder` | Coach berth position finder |
| `/rail/coach-position-finder` | Coach position on the platform |
| `/rail/booking-reminder` | Booking and Tatkal reminders |
| `/rail/luggage-allowance` | Luggage allowance, size limits and excess charges |
| `/rail/penalty-calculator` | Penalties and excess fare under the Railways Act |
| `/rail/concession-calculator` | Child fares and the surviving concessions |
| `/rail/rule-updates` | Dated log of rule changes |

`luggageAllowance.js` and `penalties.js` are deliberately coupled to what already
exists: the penalty engine imports `trainFare.js` for every fare it needs and
`luggageAllowance.js` for the 6× unbooked-luggage multiple, rather than restating
either. A penalty is *defined* in terms of the fare, so the two have to move
together or the site will eventually quote a penalty that no longer matches its
own fare calculator.

Both are careful about which numbers they claim. The weights, size limits and
charge multipliers are published rules. The rupee amounts derive from a modelled
luggage rate and the fare engine, and every one of them is flagged `estimated`.
The statutory sections in `penalties.js` carry the *ceiling* a court may impose,
never a single figure, because a magistrate sets the actual amount — which is
also why that table is reference data and not a calculator. The ₹250 excess
charge and the e-ticket ID rule are labelled `confidence: 'practice'` rather than
`'act'`, matching the same distinction `ruleUpdates.js` draws.

`concessions.js` follows the same coupling rule and adds one of its own. It
imports `trainFare.js` and discounts the **basic fare component only**, because
that is the actual rule: the reservation fee, the superfast surcharge and GST
are charged in full to concession holders. That single fact is why the tool
exists — a "75% concession" is never 75% off a ticket, and the engine computes
both the headline percentage and the `effectivePercent` that actually comes off,
so the page can show the gap instead of leaving the reader to discover it at the
counter.

What it claims and how confidently is deliberate. The child fare arithmetic and
the general rules — basic fare only, the 300 km minimum and its exemptions,
counter issue, one concession at a time — come from the published Indian
Railways rules and are `confidence: 'rule'`. Every per-category percentage is
`confidence: 'reported'`, because those come from the IRCA Coaching Tariff table
as reproduced by secondary sources rather than a circular we could retrieve, and
the UI says so on each result. Where a concession does not apply the engine
refuses it with a reason rather than silently returning the full fare:
`blockedReason` covers a class the category does not cover, the 300 km minimum,
and Rajdhani/Shatabdi services. Categories withdrawn in March 2020 — senior
citizens above all — are carried in `WITHDRAWN` and rendered, because "it no
longer exists" is the answer most people arrive looking for.

## Guides (`/rail/guides`)

Thirteen guides, all listed in `utils/catalog.js` and grouped by the same
categories as the tools. The ones carrying numbers import the engines rather
than restating them — `cancellation-refund-tdr` renders its slab table and its
worked example straight out of `irctcCancellation.js` and `tdrRules.js`, so a
change to the refund rules moves the prose and the calculator together.

Adding a guide means three edits and nothing else: the page under
`pages/rail/guides/`, an entry in `GUIDES` in the catalog, and a `<url>` in
`public/sitemap.xml`. `test/sitemap.test.js` fails if any of the three is
missing, and site search, `/guides`, the navbar and the related-links blocks
all pick it up from the catalog automatically.

## Trains abroad (`/world`)

A separate section for travel outside India, kept apart from the IRCTC tools so
the site's India focus stays legible.

| Route | Tool |
|---|---|
| `/world/delay-compensation` | Delay compensation checker — EU 2021/782, UK Delay Repay, Eurostar, SBB, Amtrak, Australia |
| `/world/booking-windows` | Booking window calculator — when tickets go on sale, by operator |
| `/world/reservation-required` | Which trains force a compulsory seat reservation, and what it costs |
| `/world/rail-pass-calculator` | Interrail/Eurail pass vs point-to-point tickets, reservation fees included |

Two things these engines do deliberately. `delayCompensation.js` refuses to
produce a number for the US and Australia, because no statutory entitlement
exists there and a percentage would invent one. `bookingHorizons.js` flags
operators whose horizon genuinely moves (`reliable: false`) so the page hedges
instead of implying a precision nobody has.

`railPasses.js` imports its reservation fees from `reservationRules.js` rather
than holding its own copy, because the fees are exactly what decides a pass
comparison and two tables would eventually disagree. Three things it is
deliberate about: it separates the pass-holder fee from the ticket-buyer fee
(different inventories, different prices — "TGV reservations cost €10" is true
only for pass holders); it charges the *full fare* for Italo and OUIGO, which
refuse passes outright, since counting them as covered would overstate a pass by
a whole ticket; and it keeps non-euro fees in their own currency instead of
converting at a rate that would be wrong within a month.

Pass prices are the one thing it will not assert. The field is named
`indicativePriceEur`, the UI prefills it into an **editable** input, and the copy
asks for the price you are actually quoted — Interrail resets prices annually, so
a hard-coded figure would be wrong long before anyone noticed. The break-even
arithmetic is the durable part; the price is the traveller's to supply.

All four `/world` engines carry a `VERIFIED` date, and their test suites **fail**
once it is more than `STALE_AFTER_DAYS` (365) old. These are operator policy and national law rather
than anything static — DB doubled its booking window in 2024 — so going quietly
stale is the real failure mode. When the test fails, re-check each entry against
its source and then move `VERIFIED`; the pages read their "checked in …" line off
that same constant, so the claim on the page cannot drift from the data.

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
so the two languages cannot disagree about a number.

The copy has had an editorial pass (number agreement, consistent gender for
`टिकट`, NFC-consistent Devanagari, no duplicate breadcrumb URLs) but **not a
native-speaker review** — worth doing before pushing these for indexing. Note
that the search normaliser folds the nukta, so `ज्यादा` and `ज़्यादा` are the
same token; spelling variants that are different characters rather than a
diacritic (`कन्फर्म`/`कंफर्म`, `टिकट`/`टिकिट`) still have to be listed by hand
in `HINDI_KEYWORDS`.

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
