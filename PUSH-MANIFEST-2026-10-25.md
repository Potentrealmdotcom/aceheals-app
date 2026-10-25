# AceHeals push manifest — prepared Sun Oct 25, 2026 (research run, ~4:45 PM ET)

Status: NOT pushed. Working tree in ~/workspace/aceheals-live (repo Potentrealmdotcom/aceheals-app, HEAD 3ce502b). Verified `npm run build` passes (152 modules) on the full tree incl. beats, Oct 25 ~20:47 UTC.

## What ships if Tony says go (one push, auto-deploys to aceheals.netlify.app on Tony's pprdkt Netlify)

1. Book-code redemption — src/lib/paywall.js, src/tabs/Settings.jsx
   Codes ANIMALS7/DINOS7/TRUCKS7/PETS7/MAGIC7/HEROES7, 7 days each, stackable, per-device. Built + 24/24 functional tests Oct 25 (see REDEMPTION-NOTES.md). MUST ship before any coloring book goes on sale or buyers hit dead codes.
2. Back button + PIN-gate for deleting creations — src/App.jsx, src/lib/parental.js, src/tabs/Music.jsx, src/components/SongStudio.jsx, src/components/PhotoStudio.jsx
   Older uncommitted build in the same tree: global back button (long-open item) and parent-PIN gate before deleting beats/songs/photos (Music tab delete was one-tap, no PIN, in Kids Mode).
3. Tony's 10 beats — public/beats/beat-01.mp3 … beat-10.mp3 (19 MB)
   Copied Oct 25 from ~/workspace/aceheals/public/beats (stale clone) into aceheals-live; previously missing here, which is why the live Music tab 404'd every bundled beat (src/data/beats.js points at /beats/beat-NN.mp3). Build verified: dist/beats contains all 10.

## NOT in this push (separate blockers, unchanged by it)
- Stripe key invalid in AceHeals Netlify — checkout still errors until Tony pastes a fresh key. Nobody can pay $79/$12.99 until then.
- Fake Together numbers still live: src/data/content.js line 162 — COMMUNITY_STATS { families: '12,847', wins: '3,291', online: '847' }. Not edited (fix was offered Oct 25, Tony hasn't ruled). Recommend removing before the push if Tony agrees — one-line change, rides the same deploy for free.
- Token-board celebration crash (Maverick) — not verified fixed in this tree; no token-board change found in the diff.

## Push route
Same sanctioned channel as the Oct 25 potent-site ship: /opt/hatch/bin/github push-files with Tony's approval tap, from ~/workspace/aceheals-live. Do NOT use the stale ~/workspace/aceheals clone (origin potent-loadboard/aceheals-app, HEAD 26facba) — wrong repo.
