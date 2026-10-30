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

## 3. Frozen constants

These values may not drift during the build. Changing one requires a new entry here.

| Constant | Frozen value | Source |
| --- | --- | --- |
| Categories | 7: `water`, `roads`, `waste`, `electricity`, `sanitation`, `public_safety`, `other` | `prd.md` App. A |
| Statuses | 8: `submitted`, `triaged`, `assigned`, `in_progress`, `resolved`, `closed`, `rejected`, `duplicate` | `prd.md` §13 |
| Priority bands | P0 ≥ 80, P1 60–79, P2 40–59, P3 < 40 | `prd.md` §14 |
| Worked example | Waterlogging near school = **79 / P1** | `prd.md` §14, `trd.md` §10.5 |
| Duplicate thresholds | 300 m radius, 21 days, review ≥ 0.68, strong ≥ 0.82 | `trd.md` §10.4 |
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

*End of decision log. Next entry: G1 sign-off after Phase 1.*
