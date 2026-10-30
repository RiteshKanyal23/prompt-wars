# CivicPulse AI — Decision Log

| Field | Value |
| --- | --- |
| Purpose | Record scope-lock decisions and gate sign-offs |
| Owner | Solo developer |
| Started | 30 October 2026 (Phase 0) |
| Status | Active — append-only |
| Related | [`../prd.md`](../prd.md) · [`../trd.md`](../trd.md) · [`../architecture.md`](../architecture.md) · [`../phases.md`](../phases.md) |

This log is the audit trail for **decisions that change the build**, not a second copy of the specs. If a decision here contradicts a spec, the spec is wrong and must be updated in the same commit.

---

## 1. How to use

1. **Append, do not rewrite.** Superseded entries stay, marked `Superseded by D-0xx`.
2. **One decision per entry.** Each has context, decision, consequence, and the doc it affects.
3. **Gate sign-offs are entries too.** A gate is not passed until it is recorded here with evidence.
4. **Timeboxed reversals are allowed.** During the 8 hours, a reversal costs a note here plus a spec edit — not a redesign.

Entry format:

```text
### D-0NN — Title
Date · Phase · Status: accepted | superseded
Context: why a decision was needed
Decision: what was chosen
Consequence: what becomes harder or impossible
Affects: files/sections updated
```

---

## 2. G0 — Scope lock sign-off

**Gate question:** is scope unambiguous?

| # | G0 criterion | Evidence | Result |
| --- | --- | --- | --- |
| 1 | Six routes and audiences are unambiguous | `prd.md` §9.1 route map; §10 page requirements | Pass |
| 2 | AI capability list is fixed | `prd.md` §8; `trd.md` §10 — classify, summarise, dedupe, prioritise, cluster, brief | Pass |
| 3 | Seed composition sums to 42 with 8 duplicate groups, 3 P0s, 2 clusters | `trd.md` §8.5 composition table: categories 11+9+8+6+4+3+1 = 42; statuses 8+7+6+6+9+2+2+2 = 42; priority 3+11+17+11 = 42; duplicates 5×2 + 3×3 = 19 reports in 8 groups; clusters 7 + 5 | Pass |
| 4 | No document promises an integration the prototype will not have | `prd.md` §20 honesty note; `trd.md` §19 known limitations; `architecture.md` §11 deployment; all mocked surfaces labelled in UI per `phases.md` P8-T5 | Pass |
| 5 | Demo journey describable in five sentences | §4 below | Pass |
| 6 | Docs agree on timeline and phase order | `prd.md` §18 reconciled to `phases.md` §3 during P0 | Pass |

**G0 status: PASSED — 30 October 2026.** Next gate: G1 (runnable shell).

---

## 2b. G1 — Runnable shell sign-off

**Gate question:** does the shell run?

| # | G1 criterion | Evidence | Result |
| --- | --- | --- | --- |
| 1 | Dev server serves the app | `vite` on port 5180 returned HTTP 200 with `#root` and `/src/main.jsx` | Pass |
| 2 | Every route renders | 9/9 SSR smoke tests in `src/app/__tests__/routes.smoke.test.js` | Pass |
| 3 | Mobile drawer closes on ESC | `keydown` listener + body scroll lock in `MobileNav.jsx` | Pass |
| 4 | Data-mode badge is accurate | `env.js` resolves to `local` without Supabase credentials | Pass |
| 5 | Build, lint, tests | `build` 4.9 s · `lint` 0 problems · `test` 9 passed | Pass |

**G1 status: PASSED — 30 October 2026.** Next gate: G2 (data layer).

---

## 2c. G2 — Data layer sign-off

**Gate question:** does data flow?

| # | G2 criterion | Evidence | Result |
| --- | --- | --- | --- |
| 1 | `localStorage` contains `civicpulse:v1:reports` with 42 rows | `localRepository.test.js` asserts key + 42 rows; seed writes on first read | Pass |
| 2 | Category and status counts match the seed spec | Categories 11/9/8/6/4/3/1; statuses 8/7/6/6/9/2/2/2 — asserted in tests | Pass |
| 3 | Reset removes and reseeds cleanly | Create makes 43 rows, `reset()` restores 42; footer button wired in local mode | Pass |
| 4 | `useReports()` returns `{ data, loading, error, reload }` | `src/hooks/useReports.js` returns `{ ...state, reload: load }` | Pass |
| 5 | No component imports `localStorage` or Supabase directly | Grep across `src/components`, `src/pages`, `src/hooks` finds none; boundary is `src/services/index.js` | Pass |
| 6 | Build, lint, tests | `build` 4.6 s (1768 modules) · `lint` 0 problems · `test` 26 passed in 3 files | Pass |

**G2 status: PASSED — 30 October 2026.** C2 demo shows 42 seeded rows, real KPI counts, raw priority/status/category mixes, and two raw 0.003° location groups (Sector 12: 7; Ward 4 Market: 5). Next gate: G3 (AI pipeline).

---

## 2d. G3 — AI pipeline sign-off

**Gate question:** is the AI real and explainable?

| # | G3 criterion | Evidence | Result |
| --- | --- | --- | --- |
| 1 | Classification detects water/roads/waste/electricity on seed samples | `ai.test.js` classification tests + 39/42 seed reports classified above the low-confidence threshold | Pass |
| 2 | Band boundaries 80/60/40 behave exactly | `bandForScore` boundary table in `ai.test.js` (100, 80, 79, 60, 59, 40, 39, 0) | Pass |
| 3 | Identical text + location + time yields a `strong` duplicate | `ai.test.js` duplicate test asserts `level === 'strong'` and text similarity > 0.9 | Pass |
| 4 | Distant reports are not matched | `ai.test.js` uses a ~13 km candidate and asserts zero candidates | Pass |
| 5 | Three reports in one cell produce one cluster | `ai.test.js` cluster test asserts one cluster of three | Pass |
| 6 | Determinism test passes (ignoring `processingMs`) | `ai.test.js` deep-equals two runs and the full seed snapshot | Pass |
| 7 | ≥6/8 duplicate groups surfaced | `evaluate-seed.mjs`: **8/8** groups | Pass |
| 8 | 3/3 P0 reports in the top 5 by score | `evaluate-seed.mjs`: live wire 80, open manhole 80, road collapse 80 — ranks 1–3 | Pass |
| 9 | 2 clusters found | `evaluate-seed.mjs`: Sector 12 (7 reports, 31 m), Ward 4 Market (5 reports, 30 m) | Pass |
| 10 | Critical hazard escalation is explicit and testable | `ai.test.js` asserts the 80 floor, factor sum and that “will collapse” does not escalate; D-008 recorded | Pass |

**G3 status: PASSED — 30 October 2026.** `npm run test` 59 passed in 6 files · `npm run lint` 0 problems · `npm run build` passes. Metrics recorded in `phases.md` §7. Next gate: G4 (capture and tracking loop).

---

## 2e. G4 — Capture and tracking loop sign-off

**Gate question:** can a citizen submit and follow the result by code?

| # | G4 criterion | Evidence | Result |
| --- | --- | --- | --- |
| 1 | Submit flow is short and mobile-friendly at 390 px | `ReportIssue.jsx` has three groups (problem, location, evidence/contact), auto-detected category by default and a sticky bottom action bar below `lg` | Pass |
| 2 | Validation blocks <20 chars, missing pin and >5 MB images | `src/lib/__tests__/validation.test.js`: 9 tests covering description bounds, empty coordinates, category, 5 MB image limit and tracking-code formats; `isValidCoordinate` no longer treats `''` as `0` | Pass |
| 3 | Successful submit returns a code and navigates to analysis | `useCreateReport` persists via the repository, remembers the code, and `ReportIssue` navigates to `/analysis/:id` with `{ justSubmitted: true }`; `AnalysisDetail` renders the copyable success banner | Pass |
| 4 | `/track/<code>` renders the report and public events | `routes.smoke.test.js` renders `/track/CP-7K2M9Q`; `TrackDetail` uses `useReport(..., { byCode: true, publicOnly: true })` and `Timeline` | Pass |
| 5 | Unknown code shows a helpful empty state, not a 404 | `TrackDetail` returns an `EmptyState` with the code, format hint and links to `/track` and `/report` | Pass |
| 6 | Refresh does not lose persisted reports | Reports live in `civicpulse:v1:reports`; `localRepository.test.js` asserts create → 43 rows, reset → 42, and recent-code persistence/clear | Pass |
| 7 | Internal notes never appear on the public route | `localRepository.test.js` writes a private note and asserts `listEvents(..., { publicOnly: true })` excludes it | Pass |
| 8 | Build, lint, tests | `test` 59 passed in 6 files · `lint` 0 problems · `build` 1773 modules | Pass |

**G4 status: PASSED — 30 October 2026.** The loop is implemented end to end. The <60 s submission is a layout/flow claim, not a lab measurement; rehearse it once on a real 390 px device before judging. Metrics recorded in `phases.md` §8. Next gate: G5 (analysis UI).

---

## 2f. G5 — AI analysis UI sign-off

**Gate question:** can a judge trace every AI number to its source in under 30 seconds?

| # | G5 criterion | Evidence | Result |
| --- | --- | --- | --- |
| 1 | Every AI field is rendered somewhere | `AnalysisDetail` renders category + confidence + alternatives (`AiSummaryCard`), the factor table (`PriorityFactors`), duplicate components (`DuplicateList`), cluster membership (`HotspotMembershipCard`) and the model card (`rules-v1 · deterministic · N ms`) | Pass |
| 2 | Factor points sum to the displayed score | `ai.test.js` asserts factor sum == score for normal and hazard-escalated reports; `analysis.test.js` covers `sumFactorPoints()` and `factorsMatchScore()`, including a mismatched score | Pass |
| 3 | Low confidence (<0.45) shows the review notice | `classify.js` sets `lowConfidence: confidence < 0.45`; `AiSummaryCard` swaps the badge to "Low confidence" and renders the amber review note with the reason | Pass |
| 4 | No cluster shows the "needs 3 related reports" message | `HotspotMembershipCard` renders the not-yet-clustered explanation instead of an empty card; `ai.test.js` asserts clusters require 3 reports | Pass |
| 5 | Unknown id shows a lookup, not a crash | `AnalysisDetail` falls back to `EmptyState` with links to `/analysis`, `/dashboard` and `/report`; `routes.smoke.test.js` covers the routed pages | Pass |
| 6 | Page works at 360 px with stacked cards | Detail page is a single column below `lg`; header, factor table and duplicate bars wrap rather than scroll horizontally. Manual check at 360/390 px | Pass |
| 7 | Copy summary uses only stored fields | `analysis.test.js` asserts `buildCopySummary()` output order, the `rules-v1` footer and clean degradation when `ai` is missing | Pass |
| 8 | Build, lint, tests | `test` 86 passed in 10 files · `lint` 0 problems · `build` passes with lazy charts and split vendor chunks | Pass |

**G5 status: PASSED — 30 October 2026.** The analysis page is the explainability core and every claim is either rendered from stored fields or asserted by a unit test. No image analysis and no accuracy percentages are claimed. Metrics recorded in `phases.md` §9. Next gate: G6 (dashboard).

---

## 2g. G6 — Dashboard, map and hotspots sign-off

**Gate question:** are patterns visible that a list hides?

| # | G6 criterion | Evidence | Result |
| --- | --- | --- | --- |
| 1 | Sector 12 and Ward 4 Market clusters are visible | `ai.test.js` and `reportStats.test.js` assert exactly 2 clusters on the seed — Sector 12 (7 reports) and Ward 4 Market (5); both render as map circles and hotspot cards | Pass |
| 2 | Clicking a marker opens a popup with a working analysis link | `ReportMapInner` popups link to `/analysis/:id`; the map degrades to the `DashboardReportTable` list when tiles fail | Pass |
| 3 | KPI values match a manual count on the same filters | KPIs, pins, charts, ranking and hotspot cards all derive from one `filterReports()` array; `reportStats.test.js` asserts the hotspot card count equals the filtered subset (Sector 12 water = 5) | Pass |
| 4 | Charts render with no animation and handle empty data | `DashboardCharts` sets `isAnimationActive={false}` on Bar/Pie/Area, exposes `role="img"` summaries and renders empty-data branches | Pass |
| 5 | Brief contains count, category mix, owner, action and MOCKED note | `buildActionBrief` asserted in `ai.test.js`: title contains the cluster label, pattern contains the report count, risk contains high-priority count, `mocked` matches "recommendation only" | Pass |
| 6 | No horizontal scroll at 360 px; map has a list alternative | Tables are `hidden sm:block` and replaced by stacked `<ul>` cards on mobile; `DashboardReportTable` is the explicit list alternative | Pass |
| 7 | Charts stay out of the first paint | `DashboardCharts` is `React.lazy` + `Suspense`; build emits a separate 416 kB charts chunk instead of loading Recharts on every route | Pass |
| 8 | Build, lint, tests | `test` 86 passed in 10 files · `lint` 0 problems · `build` passes, no >500 kB warning | Pass |

**G6 status: PASSED — 30 October 2026.** The dashboard answers "where is the problem worst and why" from a single filtered dataset. Charts are static by design and every visual has a text/table equivalent. Metrics recorded in `phases.md` §10. Next gate: G7 (admin workflow).

---

## 2h. G7 — Admin workflow sign-off

**Gate question:** can an operator take a report from submitted to resolved, with a public trail?

| # | G7 criterion | Evidence | Result |
| --- | --- | --- | --- |
| 1 | Assign a report → status becomes `assigned` and an event appears | `AdminReportDrawer.handleAssign` writes department/owner/SLA, promotes `submitted`/`triaged` to `assigned` and posts a public `status_changed` event | Pass |
| 2 | Move to `in_progress` → public event appears on tracking | `localRepository.test.js` asserts transitions persist with events; `TrackDetail` reads `publicOnly: true` and re-queries after each mutation | Pass |
| 3 | Resolve without a note is blocked; with a note it succeeds | `workflow.test.js` covers the resolve-note requirement; the drawer disables resolve until a public note is entered | Pass |
| 4 | Confirm a duplicate → child becomes `duplicate`, parent gains an event | `localRepository.test.js` confirms both reports receive events and the child status becomes `duplicate`; merge is human-only (D-005) | Pass |
| 5 | Reject a duplicate → both reports remain open | `localRepository.test.js` asserts reject leaves both statuses untouched and records the decision | Pass |
| 6 | Refresh preserves all changes | All state lives in `civicpulse:v1:*`; `localRepository.test.js` re-reads after create/update/reset and asserts the same rows | Pass |
| 7 | No direct repository calls from components | Components and hooks import only `@/services`; `src/services/index.js` is the single adapter switch (`local` ↔ `supabase`) | Pass |
| 8 | CSV export is formula-injection safe | `csv.test.js` asserts `escapeCsvCell()` prefixes `=`, `+`, `-`, `@`, tab and CR and double-quotes commas/newlines | Pass |
| 9 | Invalid transitions are disabled and guarded | `workflow.js` `assertTransition()` throws `INVALID_TRANSITION`; the repository calls it, so a direct call cannot bypass the state machine | Pass |
| 10 | Build, lint, tests | `test` 86 passed in 10 files · `lint` 0 problems · `build` passes | Pass |

**G7 status: PASSED — 30 October 2026.** The operator loop is complete and every mutation goes through the guarded repository, so the citizen timeline is always the source of truth. CSV export is client-side and hardened against spreadsheet injection. Metrics recorded in `phases.md` §11. Next gate: G8 (demo readiness).

---

## 3. Frozen constants

These values may not drift during the build. Changing one requires a new entry here.

| Constant | Frozen value | Source |
| --- | --- | --- |
| Categories | 7: `water`, `roads`, `waste`, `electricity`, `sanitation`, `public_safety`, `other` | `prd.md` App. A |
| Statuses | 8: `submitted`, `triaged`, `assigned`, `in_progress`, `resolved`, `closed`, `rejected`, `duplicate` | `prd.md` §13 |
| Priority bands | P0 ≥ 80, P1 60–79, P2 40–59, P3 < 40 | `prd.md` §14 |
| Worked example | Waterlogging near school = **79 / P1** | `prd.md` §14, `trd.md` §10.5 |
| Duplicate thresholds | 300 m radius, 21 days, review ≥ 0.62 (D-009), strong ≥ 0.82 | `trd.md` §10.4 |
| Cluster thresholds | 0.003° grid, 30-day window, minimum 3 reports | `trd.md` §10.7 |
| Tracking code | `CP-XXXXXX`, 6 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` | `trd.md` §9.2 |
| AI version string | `rules-v1` | `trd.md` §10.1 |
| Seed size | 42 reports, 8 duplicate groups, 3 P0s, 2 clusters | `trd.md` §8.5 |
| Demo centre | 12.9716, 77.5946 (Bengaluru) | D-003 |
| Storage namespace | `civicpulse:v1:*` | `trd.md` §8.6 |

---

## 4. The demo journey in five sentences

This is the contract every phase is built to satisfy.

1. Riya reports knee-deep water outside Sunrise School in Sector 12 from her phone in under a minute.
2. CivicPulse classifies it as water with high confidence, writes a one-line summary, flags two likely duplicates, and scores it 79/P1 with five visible factors.
3. The dashboard shows Sector 12 as a hotspot of seven related reports and generates an action brief for the Drainage Cell.
4. An operator confirms one duplicate, assigns the report, moves it to in progress, and resolves it with a public note.
5. Riya opens her tracking code and sees the timeline from received to resolved, with no internal notes exposed.

If a feature does not serve one of these five sentences, it is out of scope for the hackathon.

---

## 5. Decisions

### D-001 — Deterministic rules AI instead of an LLM

**Date:** 30 Oct 2026 · **Phase:** P0 · **Status:** accepted
**Context:** An 8-hour build cannot tune prompts, handle API failures, or defend hallucinated output under judging.
**Decision:** `rules-v1` — weighted keyword classifier, extractive summary, TF-IDF cosine duplicates, additive priority scoring, grid clustering, template briefs. Fully offline and deterministic.
**Consequence:** Weaker paraphrase recall than embeddings; English-first. Accepted and documented as a limitation.
**Affects:** `architecture.md` ADR-001, ADR-014; `trd.md` §10.

### D-002 — Local-first repository with dormant Supabase adapter

**Date:** 30 Oct 2026 · **Phase:** P0 · **Status:** accepted
**Context:** Supabase availability and RLS debugging are the top demo risks.
**Decision:** `localStorage` + 42-report seed is the default runtime. Supabase adapter exists behind `VITE_DATA_MODE`, unconfigured env resolves to local.
**Consequence:** No multi-device demo, no real auth. Both are P9 work.
**Affects:** `architecture.md` ADR-002, ADR-011; `trd.md` §8.

### D-003 — Demo geography is Bengaluru, Sector 12 / Ward 4 Market

**Date:** 30 Oct 2026 · **Phase:** P0 · **Status:** accepted
**Context:** Map, clusters and the demo narrative need one fixed, believable place.
**Decision:** Centre 12.9716, 77.5946. Cluster A = Sector 12 (7 reports, ≤180 m, 14 days). Cluster B = Ward 4 Market (5 waste reports, ≤120 m, 10 days).
**Consequence:** Seed coordinates must stay inside these radii; moving them invalidates C6.
**Affects:** `trd.md` §8.5; `prd.md` §22 D2.

### D-004 — No auth wall in local mode

**Date:** 30 Oct 2026 · **Phase:** P0 · **Status:** accepted
**Context:** Login screens cost demo time and add failure modes.
**Decision:** `/admin` is open in local mode with a visible "unauthenticated demo" banner. RLS, roles and auth land in P9.
**Consequence:** The build is not deployable to the public internet as-is. The README must say so.
**Affects:** `prd.md` §22 D4; `trd.md` §19.

### D-005 — Duplicate merges are human-confirmed, never automatic

**Date:** 30 Oct 2026 · **Phase:** P0 · **Status:** accepted
**Context:** False merges hide real complaints; automatic merging is indefensible in a civic tool.
**Decision:** The pipeline only proposes. An operator confirms or rejects; both reports receive events; the child becomes `duplicate`.
**Consequence:** Duplicate reduction depends on operator action, so the KPI must be measured on reviewed pairs.
**Affects:** `architecture.md` ADR-005; `trd.md` §10.4, §12.

### D-006 — Time boxes are the `phases.md` schedule, not the PRD summary

**Date:** 30 Oct 2026 · **Phase:** P0 · **Status:** accepted
**Context:** `prd.md` §18 and `phases.md` §3 disagreed on windows and on whether data/AI came before or after the report form.
**Decision:** `phases.md` wins. Build order is P1 shell → P2 data → P3 AI → P4 capture → P5 analysis → P6 dashboard → P7 admin → P8 polish. PRD §18 rewritten to match.
**Consequence:** AI is demonstrable before the form exists; C3 uses a debug panel, not the UI.
**Affects:** `prd.md` §18; `phases.md` §2, §3.

### D-007 — Buffer comes from cuts, not from extending the clock

**Date:** 30 Oct 2026 · **Phase:** P0 · **Status:** accepted
**Context:** Hackathon overruns are normal; silent scope creep is what kills demos.
**Decision:** The 14-item cut order in `phases.md` §14 is the only buffer mechanism. Never-cut list: submit, AI factor table, tracking timeline, hotspot map, honesty labels.
**Consequence:** Some planned UI will be missing at 8:00; the five-sentence journey will not be.
**Affects:** `phases.md` §13, §14; `prd.md` §18.

### D-008 — Critical hazards get an explicit P0 floor

**Date:** 30 Oct 2026 · **Phase:** P3 · **Status:** accepted
**Context:** The additive formula caps urgency at 20 and the highest base severity is 38, so a solitary report could never reach the 80-point P0 band. The seed deliberately contains three life-safety cases (live/electric wire, open manhole, road collapse) that must surface as P0 and rank in the top five.
**Decision:** A small, event-based hazard list (`CRITICAL_HAZARDS`: live wire, open manhole, manhole cover missing, gas leak, collapse that has already happened, electrocution, drowning) raises the final score to the 80-point floor. Predictions such as “will collapse” do **not** escalate. The escalation appears as an explicit `hazard` factor, so factor points still sum to the score.
**Consequence:** The priority factor table can contain a sixth row for hazard escalations; the five base factors are unchanged. The documented P0 distribution is recalibrated to 3 P0 / 5 P1 / 11 P2 / 23 P3 for this seed.
**Affects:** `src/services/ai/priority.js`, `trd.md` §10.7, `src/services/ai/__tests__/ai.test.js`, `scripts/evaluate-seed.mjs`, `phases.md` §7.

### D-009 — Review threshold lowered to 0.62 for the seeded demo

**Date:** 30 Oct 2026 · **Phase:** P3/P7 · **Status:** accepted
**Context:** At the original 0.68 review floor the 42-report seed surfaced zero pending duplicate pairs: the only two review-scored pairs were already confirmed duplicates and were therefore excluded from the queue. The Duplicates tab (P7-T7/T8) and G7 confirm/reject checks had no work to show. `phases.md` §19 names this exact risk and sanctions 0.62 as the demo mitigation.
**Decision:** Set `DUPLICATE_REVIEW_THRESHOLD` / `DUPLICATE_THRESHOLDS.review` to 0.62. Strong stays at 0.82 and the floor stays at 0.55; weights, radius and window are unchanged. `SEED_VERSION` is bumped to 3 so existing local stores rebuild with the new pairs.
**Consequence:** `evaluate-seed` now recovers 8/8 duplicate groups, P0 stays 3/3 in the top five, and the admin queue starts with four pending pairs. Citizens still see a human decision; nothing auto-merges.
**Affects:** `src/lib/constants.js`, `src/services/ai/duplicates.js`, `src/services/local/seed.js`, `trd.md` §10.4, `phases.md` §19, `scripts/evaluate-seed.mjs`.

---

## 6. ADR index

The architectural decisions with full trade-off analysis live in [`architecture.md` §15](../architecture.md). This log records only build-affecting choices.

| ADR | Decision | Mirrored here |
| --- | --- | --- |
| ADR-001 | Deterministic rules AI | D-001 |
| ADR-002 | Local-first repository | D-002 |
| ADR-003 | TF-IDF cosine duplicates | — |
| ADR-004 | Grid clustering, not DBSCAN | — |
| ADR-005 | Human-confirmed merges | D-005 |
| ADR-006 | AI payload in `reports.ai` JSONB | — |
| ADR-007 | No global state library | — |
| ADR-008 | Tailwind tokens, no component library | — |
| ADR-009 | OpenStreetMap tiles | — |
| ADR-010 | Tracking code as public identifier | — |
| ADR-011 | Public read on reports (prototype only) | D-002, D-004 |
| ADR-012 | No image AI | — |
| ADR-013 | Client-side AI before insert | D-001 |
| ADR-014 | English-first copy and lexicon | D-001 |

---

## 7. Change policy

| Change | Required action |
| --- | --- |
| A frozen constant (§3) | New entry + update `prd.md`/`trd.md` + rerun the affected gate |
| Route added or renamed | Entry + `prd.md` §9.1 + nav + 404 check |
| AI threshold change | Entry + `trd.md` §10 + `evaluate-seed` rerun + record new metrics |
| Scope cut | Entry naming the cut-order item + tick the checkbox in `phases.md` §14 |
| Supabase enabled | Entry + RLS test evidence + honesty banner change |

---

*End of decision log. Next entry: G8 sign-off after Phase 8.*
