# CivicPulse AI — Demo Rehearsal Runbook

| Field | Value |
| --- | --- |
| Purpose | Make the five-minute demo repeatable, timed and recoverable |
| Owner | Solo presenter |
| Last automated audit | 30 October 2026 |
| Demo script | [`../README.md` §9](../README.md#9-five-minute-demo) |
| Gate | G8 in [`../phases.md` §12](../phases.md#12-phase-8--polish-qa-and-demo-readiness) |

This runbook is the operational companion to the README demo script. The README says **what** to show; this file says **how to set it up, what can go wrong, and how the run was verified**.

> **Honesty rule:** automated checks below prove the mechanics. They are not a substitute for two human stopwatch runs. Do not call G8 fully passed until both rows in §5 are filled in on the demo machine.

---

## 1. Pre-flight (10 minutes before presenting)

1. **Use the production build**, not the dev overlay:
   ```bash
   npm install
   npm run build
   npm run preview
   ```
   Open <http://localhost:4173/>. The dev server at 5173 is fine for development, but the preview build is what the audit below used.
2. **Confirm local mode.** The footer badge must read **Demo mode · local data**. No Supabase credentials should be present in the shell that started the server.
3. **Reset the seed.** Footer → **Reset demo data**. This restores 42 reports, 3 P0 hazards, 2 hotspots and 4 pending duplicate pairs.
4. **Close noisy tabs** and disable notifications. The demo only needs one browser window.
5. **Open the three fallback tabs in advance:** `/dashboard`, `/track/CP-7K2M9Q`, and `/admin?tab=duplicates`.
6. **Phone-sized window ready.** Resize to roughly 390 × 844 (or use device emulation) for the capture beat; return to desktop width for dashboard/admin.
7. **Warm the map once.** Load `/dashboard` while online so tiles are cached. If the venue network is unreliable, expect grey tiles — the list and KPIs carry the beat.
8. **Timer visible.** Use a phone stopwatch, not the laptop clock.
9. **Read the honesty lines once.** They are in §7; saying "mocked" before a judge asks is stronger than being caught.

---

## 2. Five-minute beat sheet (stopwatch targets)

| Clock | Beat | Action | Hard stop if behind |
| --- | --- | --- | --- |
| 0:00–0:30 | Hook | Home; four-stage strip; one sentence: complaints exist, action does not | Skip the stage strip, go to `/report` |
| 0:30–1:30 | Capture | Submit one waterlogging report from the phone-sized window: title, 20+ character description, category, map pin, consent | Use the prefilled fields in §4; do not fight the map |
| 1:30–2:30 | Understand | `/analysis/:id`: summary, duplicate candidates, priority factor table, hotspot membership | Read only the score, the top two factors, and one duplicate |
| 2:30–3:15 | Reveal | `/dashboard`: Sector 12 hotspot, priority mix, Fix-first list, action brief | Skip the brief if the modal fights you; point at Fix-first |
| 3:15–4:15 | Act | `/admin`: confirm one duplicate, assign Drainage Cell, move to In progress, add a public note, resolve | Do one transition only; the timeline still proves the loop |
| 4:15–4:45 | Close the loop | `/track/:code`: timeline Received → Assigned → In progress → Resolved | Use `CP-7K2M9Q` if the new code is not to hand |
| 4:45–5:00 | Honesty | What is real, what is mocked, one limitation | Say the one-liner in §7 and stop |

**Rule:** the demo is a story about the loop, not a feature tour. If a beat exceeds its hard stop, cut the optional UI, not the loop.

---

## 3. Recovery cards

| Symptom | Recovery |
| --- | --- |
| Map tiles grey / request failures | Keep going. Say "tiles are optional; the data is local", point at the hotspot card and report table. |
| Submit button appears stuck | Wait for "Analysing report…"; if still stuck after ~5 s, open the pre-seeded `/track/CP-7K2M9Q` fallback and continue the analysis beat. |
| New tracking code lost | Footer recent codes or `/track` list; fallback code is `CP-7K2M9Q`. |
| Admin drawer will not close | Press `Escape` (verified); if a browser extension interferes, reload `/admin` — local data persists. |
| A route shows the error fallback | Press **Reload the app**. Data is in `localStorage`; reload re-seeds only if storage is empty. |
| Demo data polluted by earlier attempts | Footer → **Reset demo data**, then reload. |
| Network died entirely | The local server keeps serving; only Google Fonts and OSM tiles fail. Core flow is verified offline in §6. |

---

## 4. Copy-paste demo report

Use this when typing on stage is risky. It is 20+ characters and deterministic.

- **Title:** Storm drain blocked outside Sunrise School
- **Description:** Storm drain is blocked by silt and plastic, so rainwater floods the school gate every evening and hides the kerb.
- **Category:** Drainage
- **Location:** tap inside the Sector 12 hotspot on the map (or type `12.9716`, `77.5946`)
- **Consent:** tick the demo-report checkbox

---

## 5. Timed rehearsal log

Fill this in on the demo machine. Two consecutive runs under five minutes are required by G8.

| Run | Date / time | Start mode | Stopwatch | Under 5:00? | What overran | Fix before next run |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | _pending human run_ | Reset seed | — | — | — | — |
| 2 | _pending human run_ | Reset seed | — | — | — | — |

**What the automated proxy run already proves:** a scripted submit → analysis → tracking → admin-drawer journey completes in ~5 seconds of machine time with zero console errors. That validates the mechanics, not the talk track; a presenter who explains every factor can still overrun.

---

## 6. Automated evidence (30 October 2026)

Environment: `npm run build` output served by `npm run preview` on `http://localhost:4173`, driven by headless Chrome through the DevTools Protocol. Scripts lived in a temporary directory and are **not** part of the repository.

| Check | Method | Result |
| --- | --- | --- |
| Preview serves the SPA | HTTP GET `/`, `/dashboard`, `/admin`, `/track/CP-7K2M9Q` | **200** for all; JS, CSS and favicon assets 200 |
| Console clean on every route | CDP `Runtime`, `Log` and `Network` listeners across 9 routes | **0 errors, 0 exceptions, 0 failed requests** |
| No horizontal scroll | 6 widths (360, 390, 768, 1024, 1366, 1440) × 6 routes | **36/36 pass** (`scrollWidth ≤ innerWidth + 1`) |
| Accessible names | Every route: form controls have labels, buttons/links have text, images have `alt` | **0 unlabeled controls, 0 nameless controls, 0 missing `alt`** |
| End-to-end citizen flow | Scripted fill + submit at 390 × 844 | Reached `/analysis/:id`, correct title, tracking code issued, `/track/:code` shows 2 timeline items |
| Operator drawer | Click first queue row, inspect focus, press `Escape` | Dialog opens, focus moves inside, `Escape` closes it |
| Offline core flow | Blocked `fonts.googleapis.com`, `fonts.gstatic.com` and OSM tile hosts, repeated route + flow audit | **0 console errors**; submit, analysis, tracking and admin drawer still pass; map degrades to placeholder/table |
| Unit + SSR smoke tests | `npm run test` | **127 passed in 15 files** |
| Lint | `npm run lint` | **0 problems** |
| Production build | `npm run build` | Passes; charts split into a 416 kB lazy chunk (113 kB gzip) |

Re-run the automated half with:

```bash
npm run lint
npm run test
npm run build
npm run preview
```

Then load the routes listed above and confirm the footer badge, map fallback and reset action by hand. The CDP scripts are intentionally not committed; they depend on a local Chrome path and are not part of the product.

---

## 7. Judge-style answers

- **"Why this priority?"** The score is additive: severity, people affected, duration, sensitivity and corroboration, plus an explicit hazard floor for life-safety reports. The factor table on `/analysis/:id` shows every point.
- **"Is this AI real?"** Yes, but it is deterministic rules AI, not an LLM: a weighted keyword classifier, extractive summary, TF-IDF cosine duplicate scoring and grid clustering, all browser-side and covered by unit tests. The model card is at `/analysis`.
- **"What is mocked?"** Notifications, department routing and dispatch are labels only. No message is sent and no crew is dispatched. Photos are stored as evidence and are **never analysed**.
- **"What is not production-ready?"** No auth on `/admin`, local storage instead of a database by default, public read model in the Supabase adapter, and no image AI. The README limitations section lists these deliberately.

---

*Keep this file open beside the demo. Fill §5 after each run; do not edit past rows.*
