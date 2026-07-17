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

Calculation engines live in `utils/engines/` with tests in `test/`. Worked examples in page prose
are computed from the same engines the calculators run, so text can't drift from results.

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
