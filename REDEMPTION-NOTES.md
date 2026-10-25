# AceHeals — Coloring-Book Promo Code Redemption

Built 2026-10-25. Working tree only — NOT pushed/deployed. Must ship before any
POTENT Publishing coloring book goes on sale, so no buyer hits a dead code.

## How premium already worked (pre-existing model)

- Premium state lives **locally** in the `access` record in localStorage
  (`aceheals:access`, via `src/lib/store.js`), managed by `src/lib/paywall.js`:
  `{ paid, plan, trialStart, graceUntil }`.
- Guest trial = 24h from first `getAccess()`; `hasAccess()` = trial OR paid.
  Every tab gates on `hasAccess()`. Paid = $79 lifetime / $12.99 mo via Stripe;
  the Supabase `users` table (`paid`, `plan`, `grace_until`) is only a restore
  mirror (`restorePurchase()`), written by the Stripe webhook.

## What was added

### `src/lib/paywall.js`
- Access record extended with two optional fields: `promoUntil` (timestamp),
  `redeemedCodes` (array of codes). Old stored records without them still work.
- `PROMO_CODES` — the code table (see below). Codes grant **7 days**.
- `redeemPromoCode(raw)` — normalizes input (trim/uppercase/strip spaces &
  hyphens), then:
  - unknown code → `{ ok:false, reason:'invalid' }` with a friendly message;
  - code already in `redeemedCodes` → `{ ok:false, reason:'used' }`, friendly
    "already counted" message, no double grant;
  - success → new `promoUntil` = max(now, current `promoUntil`) + 7 days
    (so a second book's code **stacks**), code recorded, returns
    `{ ok:true, code, book, daysAdded:7, until }`.
- `isPaid()` now also returns true while a promo is running, so promo access
  unlocks every premium gate exactly like a purchase. Helpers:
  `promoActive()`, `promoDaysLeft()`.
- `restorePurchase()` / `handlePaymentReturn()` now spread the existing access
  record when setting `paid`, so a Stripe restore can no longer wipe a running
  promo or the redeemed-code history.

### `src/tabs/Settings.jsx` — the redeem UI
- Location: **Settings → 💳 Subscription card**, under Upgrade / Restore
  Purchase. This is the app's paywall surface — App.jsx renders the same
  Settings component inside the "Unlock" modal, so the redeem box appears
  there too. It is NOT in Kids Mode (Kids Mode tabs are manny/maverick/music/
  potty only; Settings and Parents are grown-up side, and leaving Kids Mode
  requires the parent PIN).
- When a promo is running, the card shows a green banner: "🎁 Book code
  active — full access until <date> (N days left)".
- Success: inline confirmation "🎉 7 days added! Full access until <date>." +
  confetti + toast. Failure: friendly inline message + toast.

## Codes (as implemented, 7 days each)

| Code | Book |
|---|---|
| ANIMALS7 | Bold & Easy Animals |
| DINOS7 | Bold & Easy Dinosaurs |
| TRUCKS7 | Bold & Easy Trucks & Machines |
| PETS7 | Bold & Easy Cats & Dogs |
| MAGIC7 | Bold & Easy Unicorns & Magic |
| HEROES7 | POTENT Heroes |

## Enforcement limit (honest)

Redemption is enforced **per device / local store**: one redemption per code
in this browser's `aceheals:access` record — the same enforcement level as
the existing 24h trial and the parent PIN. It survives reloads and works
offline after redemption. It is NOT enforced per Supabase account server-side:
the same code could be redeemed again on a second device or after clearing
site data, and a signed-in user's promo does not sync across devices. (The
codes are printed in physical books, so they are semi-public by nature; each
one only ever grants 7 days.) True per-account enforcement would need a
`promo_redemptions` table + a Netlify function checking the Supabase session —
not built, deliberately out of scope for the smallest fit.

## Disclaimer

`src/lib/disclaimer.js` untouched — wording intact, word for word.

## Verification (2026-10-25)

- `npm run build` (vite build): **passes** (152 modules, built clean).
- Functional test of the real `src/lib/paywall.js` + `src/lib/store.js`
  (bundled with esbuild, Supabase client stubbed, localStorage shim):
  **24/24 checks pass** — fresh/trial states, expired-trial lockout, invalid
  code rejected and grants nothing, ANIMALS7 grants exactly now+7d and flips
  `hasAccess()`, state persisted in `aceheals:access` and survives fresh
  reads, re-redemption refused as 'used' with no extension, second code
  (DINOS7) stacks to 14 days, all six codes valid (42 days stacked),
  expired promo grants nothing, paid flag unaffected.
- Test harness kept at /tmp/redeem-test/ (test.mjs + build.mjs), not in repo.
- Files changed by this build: `src/lib/paywall.js`, `src/tabs/Settings.jsx`
  (+ this notes file). The working tree also contains older uncommitted
  changes in App.jsx, PhotoStudio.jsx, SongStudio.jsx, parental.js, Music.jsx
  that predate this build and were not touched by it.
