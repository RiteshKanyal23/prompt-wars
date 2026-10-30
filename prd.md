# CivicPulse AI — Product Requirements Document (PRD)

> **From Complaints to Action**

| Field | Value |
| --- | --- |
| Product | CivicPulse AI |
| Document version | 1.0 |
| Status | Approved for 8-hour hackathon build |
| Event | PromptWars x ASTRA — AI for Civic Impact |
| Team | Solo participant |
| Build window | 8 hours (single sitting) |
| Last updated | 30 October 2026 |
| Related documents | [`trd.md`](./trd.md), [`architecture.md`](./architecture.md) |

---

## 1. Executive summary

CivicPulse AI is a web platform that turns scattered civic complaints into **prioritized, explainable, trackable action**.

A citizen reports a problem in under a minute using text, an optional photo, a category and a map location. A deterministic AI pipeline immediately:

1. classifies the report,
2. writes a short summary,
3. checks for likely duplicates nearby,
4. computes an explainable priority score,
5. links the report to a geographic hotspot when one exists.

An operator then reviews the AI output, assigns the report to a department, moves it through a visible workflow, and the citizen follows every step using a tracking code.

The hackathon deliverable is a **working prototype**, not a production service. All AI is real, runnable code. Anything simulated (for example SMS notifications or government department integrations) is explicitly labelled **MOCKED** in the interface and in the README.

### 1.1 One-line pitch

> CivicPulse AI reads a city's complaints the way an experienced ward officer would: it groups the noise, spots the danger, explains its ranking, and shows the citizen what happened next.

### 1.2 What makes it credible

| Claim | How the prototype earns it |
| --- | --- |
| AI does real work | Category, summary, duplicate score, priority score and hotspot detection are computed by inspectable JavaScript functions over the actual submitted text and coordinates. |
| Explainable | Every priority decision exposes its factor breakdown and a plain-language sentence. Every duplicate suggestion exposes text, distance and time similarity. |
| Trackable | Every status change writes an event; the citizen timeline is rendered from those events. |
| Honest | The UI labels demo data, mocked notifications and the limits of the heuristics. No pretend integrations. |

---

## 2. Problem statement

Urban local bodies receive civic complaints through phone calls, WhatsApp messages, social media, walk-ins and paper registers. This creates five recurring failures:

1. **Fragmentation.** The same pothole is reported ten times by ten citizens and handled as ten unrelated tickets.
2. **No triage.** A live electrical wire and a faded road marking sit in the same first-in-first-out queue.
3. **Invisible patterns.** A drain blockage, waterlogging and road damage on the same street look like three categories, not one failing piece of infrastructure.
4. **No feedback loop.** Citizens rarely learn whether their complaint was received, assigned, fixed or rejected.
5. **No defensible decisions.** Decision-makers cannot explain why one ward received attention before another.

### 2.1 Problem statement (official framing)

> Build an AI-powered platform that transforms scattered citizen reports into prioritized, explainable and trackable action — one that understands reports, detects patterns, surfaces hotspots, and helps a decision-maker choose what to fix first, and why.

---

## 3. Vision, mission and product principles

**Vision.** Every neighbourhood complaint becomes a data point that decision-makers can act on and citizens can follow.

**Mission.** Ship a focused prototype that proves the full loop — capture → understand → reveal → act — with real AI logic and no inflated claims.

### 3.1 Product principles

| # | Principle | Consequence in the product |
| --- | --- | --- |
| P1 | **Under a minute to report** | One screen, smart defaults, optional photo, map tap for location, no account required in demo mode. |
| P2 | **AI advises, humans decide** | Duplicate merges and priority overrides require an operator action. AI output is always editable. |
| P3 | **Show your work** | Priority factors, duplicate evidence and cluster membership are visible, not hidden behind a score. |
| P4 | **Mobile-first, desktop-capable** | Every citizen flow works at 360 px; operator tables and maps use the extra width on desktop. |
| P5 | **No fake integrations** | Supabase is real when configured; otherwise a clearly labelled local demo adapter is used. Notifications are marked MOCKED. |
| P6 | **Calm, civic visual language** | Navy for authority, white for clarity, teal for action. No alarm-red UI except genuine P0 states. |
| P7 | **Demo determinism** | Same inputs produce the same AI outputs, so the live demo cannot drift. |

---

## 4. Goals and non-goals

### 4.1 Goals (MVP, must ship)

| ID | Goal | Measure |
| --- | --- | --- |
| G1 | A citizen can submit a complete report in under 60 seconds on a phone | Timed usability run, 3 attempts |
| G2 | AI produces category, summary, duplicate candidates and priority with reasoning | Visible on AI Analysis page for every report |
| G3 | Operators can assign, update status and resolve a report | Full workflow in Admin page |
| G4 | Citizens can track a report by code | Timeline reflects every status event |
| G5 | Dashboard reveals hotspots and priority distribution | At least 2 hotspots visible in seeded data |
| G6 | Demo runs end-to-end without network access (local mode) | Airplane-mode rehearsal |
| G7 | Design is consistent across all six routes | Same tokens, spacing, components |

### 4.2 Non-goals (explicitly out of scope for 8 hours)

- Real integration with any municipal CRM, 311 system, WhatsApp, SMS or email gateway.
- Image understanding / computer vision. Photos are stored as **evidence only**.
- Native mobile apps, offline PWA sync, push notifications.
- Multi-city tenancy, billing, SSO, audit-grade compliance.
- Live GPS tracking of field crews.
- LLM-generated text by default. An optional adapter exists but is **off unless a key is configured**; the deterministic pipeline is the source of truth.
- Automatic duplicate merging without human confirmation.
- Production-scale geospatial indexing (PostGIS/pgvector). The prototype computes in-memory over ≤500 reports.

### 4.3 Success definition

The prototype is successful if a judge can watch one report go from submission to resolution in **under five minutes**, see the AI explain itself, see a hotspot emerge, and leave believing the system could be extended to a real ward without rewriting it.

---

## 5. Personas

### 5.1 Riya — the citizen reporter

| Attribute | Detail |
| --- | --- |
| Context | 27, commutes by scooter, reports issues from her phone while standing on the street |
| Goals | Report quickly, know it was received, see progress, avoid re-reporting |
| Frustrations | Long forms, no acknowledgement, being asked for details she does not have |
| Device | Android phone, 360–412 px viewport, intermittent 4G |
| Success | Submits in <60 s; receives a tracking code; sees "Assigned to Public Works" the next day |
| Key needs | Location auto-capture, category suggestions, photo optional, clear confirmation |

### 5.2 Arjun — the ward operator

| Attribute | Detail |
| --- | --- |
| Context | Municipal operations desk, handles 40–80 complaints a day across 3 wards |
| Goals | Triage fast, merge duplicates, assign the right department, close the loop |
| Frustrations | Duplicate noise, no sense of urgency ordering, unclear ownership |
| Device | Desktop 1366×768, occasionally tablet |
| Success | Clears the morning queue in 20 minutes; trusts the priority ordering |
| Key needs | Sortable queue, AI reasoning, one-click assign, duplicate side-by-side, status history |

### 5.3 Meera — the decision-maker

| Attribute | Detail |
| --- | --- |
| Context | Ward committee member reviewing weekly infrastructure performance |
| Goals | Know which locations need money and attention first; justify decisions publicly |
| Frustrations | Spreadsheets, category silos, no geographic story |
| Device | Laptop, presents on a projector |
| Success | Opens Dashboard, sees a hotspot brief for Sector 12, forwards it |
| Key needs | Hotspot map, category trends, priority mix, one-minute action brief |

---

## 6. End-to-end journey

```text
Riya opens /report
  → writes "Severe waterlogging near Sunrise School, drain overflowing since last night"
  → picks "Water & Drainage" (AI pre-selects it)
  → taps the map pin at Sector 12
  → attaches an optional photo
  → submits

Pipeline (client-side, <300 ms)
  → normalise text
  → classify: water_drainage (0.91)
  → summarise: one-line brief
  → duplicate scan: 2 likely matches within 180 m
  → priority: 79 / P1 with 5 visible factors
  → cluster: Sector 12 waterlogging hotspot (5 reports)

Riya lands on /analysis/:id and /track/:code
  → sees "Received", AI summary, priority reason, linked reports, tracking code

Arjun opens /admin
  → sees the report at the top of the P1 queue with reasoning
  → confirms one duplicate, rejects the other
  → assigns to Drainage Cell, SLA 24 h
  → moves status: Assigned → In Progress → Resolved with a note

Meera opens /dashboard
  → sees the Sector 12 hotspot, 7 reports / 3 categories, trend rising
  → reads the generated action brief
  → presents it

Riya refreshes /track/:code
  → sees the full timeline and resolution note
```

---

## 7. Functional requirements by lifecycle stage

Requirement priorities: **M** = must ship, **S** = should ship if time permits, **C** = could ship.

### 7.1 Stage 1 — Capture

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| CAP-01 | Citizen can enter a free-text description (20–1,000 chars) | M | Validation blocks <20 chars with inline message; counter shows remaining |
| CAP-02 | Citizen selects one category from a fixed taxonomy, or accepts the AI suggestion | M | 7 categories; "Suggest category" calls the real classifier and shows confidence |
| CAP-03 | Citizen provides a location by tapping a Leaflet map | M | Tap/drag pin updates lat/lng and reverse-geocoded label is **not** claimed (no geocoding API); label is a user-editable free-text field |
| CAP-04 | Citizen can optionally enter an address/landmark label | M | Saved as `location_label`; shown on cards and tracking page |
| CAP-05 | Citizen can optionally attach one image (≤5 MB, jpg/png/webp) | M | Client-side validation, preview, stored in Supabase Storage or as a local object URL in demo mode; labelled "evidence only — not analysed by AI" |
| CAP-06 | Submission completes in under 60 seconds | M | Three-step form with progress indicator; no account wall in demo mode |
| CAP-07 | Submission returns a human-readable tracking code | M | Format `CP-XXXXXX`; shown on success screen with copy button |
| CAP-08 | Duplicate warning appears before submit if a strong match exists | S | Non-blocking panel: "This may already be reported" with link; citizen may continue |
| CAP-09 | Form remembers draft on accidental refresh | C | `sessionStorage` draft restore |
| CAP-10 | Works at 360 px width | M | No horizontal scroll; tap targets ≥44 px |

**Explicit non-requirement:** no live geocoding, no GPS permission requirement, no multi-photo upload, no voice input.

### 7.2 Stage 2 — Understand (AI pipeline)

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| UND-01 | Classify the report into one of 7 categories | M | Returns category, confidence 0–1, and top-3 alternatives; deterministic |
| UND-02 | Generate a concise summary (≤240 chars) | M | Extractive/template summary grounded in the submitted text; no invented facts |
| UND-03 | Detect likely duplicates | M | Returns ranked candidates with text/geo/time component scores; never auto-merges |
| UND-04 | Assign an explainable priority score and band | M | Score 0–100, band P0–P3, ≥3 factor rows with points and plain-language reasons |
| UND-05 | Link report to a geographic hotspot/cluster | M | Cluster key, member count, category mix, radius; shown on analysis page |
| UND-06 | Produce a one-minute action brief for a hotspot | S | Brief includes location, issue pattern, evidence count, risk, recommended owner and next action |
| UND-07 | Persist AI output with a model version | M | `ai.version = "rules-v1"`, `processed_at`, `processing_ms` stored |
| UND-08 | Allow operator to override category, priority and merge decision | M | Override writes an event with actor and reason; AI original preserved |
| UND-09 | Show AI confidence honestly | M | Low confidence (<0.45) displays "Low confidence — please review" |
| UND-10 | Re-run analysis on demand | C | Admin action "Re-analyse" recomputes with current corpus |

### 7.3 Stage 3 — Reveal (dashboard and map)

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| REV-01 | Show all reports on a Leaflet map with priority-coloured markers | M | Marker colour by band; popup shows category, priority, status, link |
| REV-02 | Show hotspots as circles with counts | M | Cluster radius rendered; legend explains colour and size |
| REV-03 | Show KPI cards: total, open, P0/P1, resolved this week, duplicate rate | M | Values derived from the same repository as the map |
| REV-04 | Show priority distribution and category trend charts (Recharts) | M | Charts responsive; empty states handled |
| REV-05 | Show a ranked "Fix first" list with reasons | M | Top 5 by priority score; each row expands to factors |
| REV-06 | Filter by category, status, ward/area and priority | S | Filters compose; URL query params preserve state |
| REV-07 | Action brief panel for the selected hotspot | S | Generated from real cluster data; copy-to-clipboard |
| REV-08 | Explain what is mocked | M | Demo-mode banner and "About this data" note |

### 7.4 Stage 4 — Act (workflow and tracking)

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| ACT-01 | Operator sees a priority-sorted queue | M | Default sort: band, then score, then recency |
| ACT-02 | Operator can assign a report to a department/owner | M | 6 departments; assignment writes event and sets status `assigned` |
| ACT-03 | Operator can move status through the lifecycle | M | Allowed transitions enforced; invalid transition disabled with tooltip |
| ACT-04 | Operator can confirm or reject a duplicate link | M | Confirm marks report `duplicate`, links to parent, adds corroboration to parent, writes event |
| ACT-05 | Operator can add a public note and an internal note | M | Public note appears on citizen timeline; internal does not |
| ACT-06 | Operator can set an SLA due time | S | Default by priority: P0 4 h, P1 24 h, P2 72 h, P3 7 d |
| ACT-07 | Citizen can look up a report by tracking code | M | Case-insensitive, trims spaces; invalid code shows helpful empty state |
| ACT-08 | Citizen sees a vertical timeline of public events | M | Received → Triaged → Assigned → In progress → Resolved, with timestamps |
| ACT-09 | Citizen sees resolution evidence/note | S | Resolution note and optional after-photo placeholder |
| ACT-10 | Admin page is protected in Supabase mode | S | Unauthenticated users see a labelled demo notice or login prompt |

### 7.5 Cross-cutting requirements

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| X-01 | Working navigation between all six routes | M | No dead links; active route highlighted; mobile menu works |
| X-02 | Consistent layout shell (header, footer, container) | M | All pages use `AppLayout` or `AdminLayout` |
| X-03 | Loading, empty, error states for every data view | M | No blank screens; retry action where relevant |
| X-04 | Toasts for mutations | S | Success/error feedback for submit, assign, status change |
| X-05 | Accessible semantics | M | Landmarks, labels, focus rings, keyboard-operable map alternative (list view) |
| X-06 | Honesty banner | M | "Demo mode — local data" or "Connected to Supabase" visible in footer/header |
| X-07 | No fake network calls | M | No `fetch` to invented endpoints; only Supabase SDK or local adapter |

---

## 8. AI capability specification (product view)

The prototype implements **five** AI/heuristic capabilities. All run locally in the browser in `rules-v1`. They are deliberately classical, explainable and deterministic.

### 8.1 Capability summary

| Capability | Technique | Input | Output | Why it is credible |
| --- | --- | --- | --- | --- |
| Categorisation | Weighted keyword lexicon + token overlap | Description, optional title | Category, confidence, top 3 | Inspectable weights; reproducible |
| Summarisation | Extractive sentence selection + template | Description, location, category | ≤240-char summary | Uses only words the citizen wrote |
| Duplicate detection | TF-IDF cosine + category + haversine + time decay | New report + corpus | Ranked candidates with component scores | Standard IR technique; thresholds documented |
| Explainable prioritisation | Weighted additive model | Category, urgency terms, cluster density, corroboration, recency | 0–100 score, band, factor list | Every point traceable to a factor |
| Hotspot detection | Grid bucketing (≈330 m cells) + category family | Coordinates, category, timestamps | Clusters, hotspot score, brief | Mirrors DBSCAN's intent without the tuning cost |

**Not implemented:** vision, speech, live LLM, geocoding, translation, predictive time-to-fix. The UI must not imply otherwise.

### 8.2 Explainability contract (what the user sees)

For every report the AI Analysis page shows:

1. **Category** with confidence bar and top alternatives.
2. **Summary** labelled "Generated from your description".
3. **Priority** as score + band, with a table of factors:
   `Factor | Points | Why`
   e.g. `Water & Drainage base severity | +30 | Category has public-health impact`
   `Urgency language | +13 | Contains "school", "severe" and "since last night"`
   `Cluster impact | +16 | 5 reports within 330 m in 14 days`
   `Duplicate corroboration | +10 | 2 confirmed duplicates`
   `Recency | +10 | Reported less than 24 h ago`
4. **Duplicate candidates** with a similarity bar and the three component values.
5. **Hotspot membership** with count, category mix and link to dashboard.
6. **Model card** line: `rules-v1 · deterministic · processed in 18 ms`.

### 8.3 Honesty rules

- If confidence < 0.45, show "Low confidence — operator review required".
- If no cluster exists, say "No hotspot yet — needs at least 3 related reports within 330 m".
- If the image is present, state "Photo stored as evidence; not analysed by AI."
- If an LLM adapter is enabled later, label generated text "LLM-assisted" and keep the deterministic output as fallback.

---

## 9. Information architecture and navigation

### 9.1 Route map

| Route | Page | Primary audience | Layout |
| --- | --- | --- | --- |
| `/` | Home | Everyone | `AppLayout` |
| `/report` | Report Issue | Citizen | `AppLayout` (focused) |
| `/analysis` | AI Analysis — latest/pipeline overview | Citizen, operator | `AppLayout` |
| `/analysis/:id` | AI Analysis — one report | Citizen, operator | `AppLayout` |
| `/dashboard` | Dashboard | Decision-maker, public | `AppLayout` (wide) |
| `/admin` | Admin console | Operator | `AdminLayout` |
| `/track` | Track Complaint — lookup | Citizen | `AppLayout` |
| `/track/:code` | Track Complaint — timeline | Citizen | `AppLayout` |
| `*` | Not Found | Everyone | `AppLayout` |

### 9.2 Primary navigation

Desktop header: logo → Home · Report Issue · Dashboard · Track Complaint · Admin · `Report an issue` CTA.
Mobile: logo + hamburger; drawer contains the same links plus CTA. Active link uses teal underline/pill.

AI Analysis is reachable contextually (after submission, from admin queue, from dashboard "Fix first" rows) rather than as a top-level nav item, to keep the citizen nav to four intents.

### 9.3 Navigation rules

- After successful submission → `/analysis/:id` with a success banner and links to `/track/:code`.
- From any report card → its analysis or tracking view depending on audience.
- Admin rows → `/analysis/:id` (opens in same tab; back link returns to queue).
- Unknown tracking code → inline empty state, never a 404 page.
- `*` route → friendly 404 with links home/report.

---

## 10. Page requirements

Each page lists purpose, key components, states and acceptance criteria. Visual details are in §11.

### 10.1 Home (`/`)

**Purpose.** Explain the product in 10 seconds, establish trust, route to the two primary actions.

**Sections**

1. Hero: eyebrow "AI for civic impact", H1 "From complaints to action.", supporting line, CTAs `Report an issue` (teal) and `View dashboard` (ghost), small honesty chip "Prototype · synthetic data".
2. Live-ish stat strip: reports captured, hotspots found, duplicates linked, median priority response (computed from seed, labelled "sample data").
3. "How it works" 4-step cards: Capture → Understand → Reveal → Act, each with Lucide icon.
4. AI capability strip: categorise, summarise, deduplicate, prioritise, cluster — with one-line explanations.
5. Featured hotspot preview card (from real cluster computation) linking to dashboard.
6. CTA band + footer.

**States.** If data fails to load, stat strip shows em dashes and a retry link; the rest of the page still renders.

**Acceptance.** All CTAs navigate; no layout shift at 360 px; hero text does not overflow; stats come from the repository (not hard-coded numbers).

### 10.2 Report Issue (`/report`)

**Purpose.** Capture a complete, AI-ready report in under a minute.

**Layout.** Two-column on `lg` (form 7/12, live "what happens next" panel 5/12); single column on mobile with a compact sticky submit bar.

**Steps (single page, three visual groups — not a wizard that hides progress)**

1. **What is the problem?** Title (optional, ≤80), description (required, 20–1,000), category select with "Suggest" button, urgency hint chips (optional).
2. **Where is it?** Leaflet map (tap to pin, draggable marker), lat/lng readout, address/landmark input. Default centre: city demo centre; no geolocation prompt on load.
3. **Evidence and contact.** Photo upload (optional), name/phone (optional, labelled "not shared publicly"), consent checkbox for demo data.

**Behaviour**

- Category suggestion calls the real classifier on the current text; shows "Suggested: Water & Drainage (91%)" with Apply.
- On blur of description, a lightweight duplicate pre-check runs against the corpus and shows a non-blocking warning card.
- Submit validates all required fields, runs the full pipeline, persists the report + events + AI output, then navigates.
- Submit button shows spinner and disables during processing; errors keep the form intact.

**Acceptance.** Submitting seeded example text produces a report with AI output in <1 s locally; refresh mid-form restores draft (if CAP-09 shipped); keyboard-only completion works.

### 10.3 AI Analysis (`/analysis` and `/analysis/:id`)

**Purpose.** Make the AI's work legible and auditable.

**`/analysis` (overview)**

- Pipeline diagram (5 stages) with counts processed.
- "Latest analysis" card for the most recent report.
- Table of recent reports: category, confidence, priority, duplicate count, cluster, processed time.
- Model card panel: version, determinism note, thresholds, limitations.

**`/analysis/:id` (detail)**

- Header: tracking code, status chip, category, priority band, submitted time, location.
- Left column: original description, photo (labelled evidence only), location mini-map.
- Right column: AI Summary card, Category card with confidence + alternatives, Priority card with factor table and plain-language verdict, Duplicate candidates card with component bars and "Open comparison", Hotspot card.
- Footer actions: `Track this complaint`, `Open in admin` (if operator), `Copy summary`.

**States.** Unknown id → "Report not found" with search-by-code input. Missing AI output (legacy/seed edge) → "Analysis pending" with a run button (admin only).

**Acceptance.** Every number displayed is derived from stored AI output; no placeholder "98% accuracy" claims; confidence and thresholds explained.

### 10.4 Dashboard (`/dashboard`)

**Purpose.** Reveal patterns that a list hides.

**Sections**

1. Header with scope chips (All wards / demo wards), date range (7/30/all), refresh.
2. KPI row (5 cards): Total reports, Open, P0 + P1, Resolved (30 d), Duplicate rate.
3. Main grid: map (8/12) + "Fix first" ranked list (4/12). Map has priority legend, hotspot circles, popups.
4. Charts row: reports by category (bar), reports over time (line/area), priority mix (donut or stacked bar).
5. Hotspot panel: cards for each cluster with count, categories, avg priority, trend sparkline, "View brief".
6. Action brief drawer/modal: generated brief with copy button and "MOCKED: no dispatch performed" note.
7. Data honesty footer: "Synthetic dataset · 42 reports · generated for demonstration".

**Responsive.** Map height 320 px mobile / 480 px desktop; KPI grid 2 cols mobile, 3 tablet, 5 desktop; charts stack.

**Acceptance.** Map renders without missing marker icons; hotspot circles match cluster data; filters update all widgets consistently; empty filters show "No reports match" rather than a broken chart.

### 10.5 Admin (`/admin`)

**Purpose.** Run the workflow.

**Layout.** `AdminLayout`: slim sidebar (Queue, Duplicates, Hotspots, Reports, back to site), top bar with operator identity and environment badge.

**Tabs**

1. **Queue** — table/cards: priority band + score, category, location, age, duplicate badge, status, assignee. Sort/filter. Row click opens detail drawer with AI reasoning, assignment select, status stepper, notes, duplicate actions.
2. **Duplicates** — pending pairs with side-by-side text, similarity breakdown, `Confirm merge` / `Not a duplicate`. Confirm requires a reason (prefilled).
3. **Hotspots** — cluster list with map preview and brief generation.
4. **Reports** — full table with search, status/category filters, CSV export (client-side, real).

**Workflow rules**

- Allowed transitions: `submitted → triaged → assigned → in_progress → resolved → closed`; `submitted|triaged → duplicate`; any open state → `rejected` with reason.
- Assigning sets `assigned` if currently `submitted`/`triaged`.
- Resolving requires a public note.
- Every action appends a `report_events` row.

**Acceptance.** A judge can assign and resolve a report in under 60 seconds; timeline on `/track/:code` reflects it immediately (same repository); invalid transitions are impossible via UI and guarded in the service.

### 10.6 Track Complaint (`/track`, `/track/:code`)

**Purpose.** Close the feedback loop.

**Lookup.** Large code input (`CP-XXXXXX`), helper text "Found on your submission receipt", recent codes from local storage in demo mode. Invalid code → friendly message + link to report.

**Timeline view**

- Status hero: current status, last update, expected SLA (if set), priority (citizen-friendly wording, e.g. "High — being treated as urgent").
- Vertical timeline from public events with icons, timestamps, actor role (not personal names), public notes.
- Report summary card: category, location label, photo thumbnail, AI summary (collapsed by default).
- "Something changed?" action → prefilled report link or note (MOCKED: no outbound message).
- Honesty note: "Status updates are entered by operators in this prototype."

**Acceptance.** Case-insensitive lookup; timeline ordered ascending; internal notes never shown; resolved state shows resolution note and date.

### 10.7 Not Found (`*`)

Friendly illustration/icon, "This page is not on the map", links to Home and Report. No stack traces.

---

## 11. Design system

### 11.1 Brand direction

Civic, calm, trustworthy. Navy carries authority and structure; white creates breathing room; teal signals action and progress. Avoid neon, heavy gradients and dashboard clutter.

### 11.2 Colour tokens

| Token | Hex | Usage |
| --- | --- | --- |
| `navy-950` | `#071527` | Footer, deepest text |
| `navy-900` | `#0B1F3A` | Primary text, header, primary buttons |
| `navy-800` | `#102A4C` | Hero background, sidebar |
| `navy-700` | `#173B66` | Hover states, borders on dark |
| `teal-600` | `#0C9A8D` | Hover, links on light |
| `teal-500` | `#0FB5A6` | Primary accent, focus ring, active nav |
| `teal-100` | `#CCFBF1` | Chips, selected states |
| `teal-50` | `#E6FAF7` | AI panels, callouts |
| `white` | `#FFFFFF` | Cards, page surface |
| `mist` | `#F5F8FC` | App background |
| `slate-600` | `#475569` | Secondary text |
| `slate-300` | `#CBD5E1` | Borders |
| `amber-500` | `#F59E0B` | P1 |
| `red-600` | `#DC2626` | P0, destructive |
| `blue-600` | `#2563EB` | P2 |
| `slate-500` | `#64748B` | P3 |
| `green-600` | `#16A34A` | Resolved |

**Rule:** teal is for action/progress, never for "success" alone; success uses green with a check icon. Red only for P0 and destructive actions.

### 11.3 Typography

- Family: `Inter`, fallback `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`.
- Display: 40/44/56 px, weight 700, tracking -0.02em.
- H1 32/40, H2 24/32, H3 20/28, body 15–16/24, small 13/20, caption 12/16.
- Numeric KPIs use `tabular-nums`.

### 11.4 Spacing, radius, elevation

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Container: max-width 1280 px, gutter 16 px mobile / 24 px tablet / 32 px desktop.
- Radius: `sm 8`, `md 12`, `lg 16`, `xl 20`, pill `999`.
- Shadow: `card` = `0 1px 2px rgba(11,31,58,.06), 0 8px 24px -12px rgba(11,31,58,.18)`.
- Borders: 1 px `slate-200`; dark surfaces use `navy-700`.

### 11.5 Core components

| Component | Notes |
| --- | --- |
| `Button` | variants primary (navy), accent (teal), ghost, danger; sizes sm/md/lg; loading state |
| `Card` | white, radius lg, card shadow, optional header/action |
| `Badge` | status and priority variants with dot; accessible text, not colour-only |
| `Input`, `Textarea`, `Select` | label, hint, error, required marker, 44 px min height |
| `PriorityBadge` | P0–P3 with icon + label ("P0 · Critical") |
| `StatusBadge` | lifecycle status with dot |
| `StatCard` | label, value, delta, icon, loading skeleton |
| `EmptyState` | icon, title, description, action |
| `Skeleton` | shimmer blocks for cards/tables |
| `Timeline` | vertical event list |
| `Modal` / `Drawer` | focus trap, ESC close, scroll lock |
| `Toast` | top-right desktop, bottom mobile; auto-dismiss 4 s |
| `MapView` | Leaflet wrapper, markers, cluster circles, legend |
| `ChartCard` | title, subtitle, responsive Recharts child |
| `AiFactorTable` | factor, points, reason |
| `HonestyNote` | small info panel with "What's real" text |

### 11.6 Responsive rules

| Breakpoint | Width | Behaviour |
| --- | --- | --- |
| Base | <640 | Single column; stacked KPIs (2 cols); hamburger nav; sticky submit bar; map 280–320 px |
| `sm` | ≥640 | 2-col KPI; inline form fields; larger type |
| `md` | ≥768 | 2-col content grids; sidebar collapses to icon rail on admin |
| `lg` | ≥1024 | Full header nav; dashboard map + list split; report form 7/5 split |
| `xl` | ≥1280 | Max container; 5-col KPI; wider charts |

**Mobile acceptance:** no horizontal scrolling at 360 px; tables become cards below `md`; all interactive targets ≥44×44 px; text ≥14 px.

### 11.7 Accessibility

- WCAG 2.1 AA contrast for text; teal on navy checked at large sizes only.
- Visible `focus-visible` ring: 2 px teal + 2 px offset.
- Every icon-only button has `aria-label`.
- Status conveyed by text + dot, not colour alone.
- Map has an adjacent list view for keyboard/screen-reader users.
- Form errors linked with `aria-describedby`; toast region `aria-live="polite"`.
- `prefers-reduced-motion` disables non-essential transitions.

---

## 12. Data requirements

### 12.1 Synthetic dataset

| Attribute | Requirement |
| --- | --- |
| Size | 42 reports (minimum 30, target 40–50) |
| Time span | Last 30 days relative to demo date |
| Categories | All 7, weighted toward water, roads, waste |
| Locations | 3 wards / 6 sectors around a fictional city centre (e.g. 12.9716, 77.5946) |
| Duplicates | 8 duplicate groups (5 pairs + 3 triplets) deliberately similar (paraphrases, same street) |
| Urgent | 3 P0: live wire, open manhole near a school, partial road collapse |
| Cluster | Sector 12: 7 reports (waterlogging ×3, drain blockage ×2, pothole ×2) within 330 m / 14 days |
| Second cluster | Ward 4 market: 5 waste reports within 300 m / 10 days |
| Images | 6 local placeholder images, labelled sample |
| Personal data | None real; names like "R. Kumar" are fictional; phone numbers masked |
| Statuses | Mix across all lifecycle states, including 2 resolved with notes |

Seed data lives in `src/data/seedReports.js` and (optionally) `supabase/seed.sql`. It is loaded by the local adapter on first run and can be reset from the footer ("Reset demo data").

### 12.2 Data quality rules

- Every report has lat/lng within the demo bounding box.
- Every report has at least one event (`submitted`).
- AI fields are consistent: score matches band; factor points sum to score (clamped).
- Duplicate links are directional (`report_id` → `duplicate_of`) and never cyclic.
- Timestamps are ISO 8601 UTC; display in local time.

### 12.3 Privacy

- No real personal data; demo contact fields optional and never displayed publicly.
- Only the tracking code is needed to view a citizen timeline.
- Internal notes are never exposed on public routes.
- Images are synthetic placeholders or user-provided demo images.

---

## 13. Complaint lifecycle and status model

```text
submitted ──► triaged ──► assigned ──► in_progress ──► resolved ──► closed
    │            │            │             │
    ├────────────┴────────────┴─────────────┴──► rejected (reason required)
    └──────────────────────────────────────────► duplicate (linked to parent)
```

| Status | Citizen label | Meaning | Who sets it |
| --- | --- | --- | --- |
| `submitted` | Received | Stored and analysed | System on create |
| `triaged` | Under review | Operator has reviewed AI output | Operator |
| `assigned` | Assigned | Owner/department set | Operator |
| `in_progress` | In progress | Field work started | Operator |
| `resolved` | Resolved | Fix reported; public note required | Operator |
| `closed` | Closed | Citizen-confirmed or auto-closed after 7 days | Operator/system (manual in MVP) |
| `rejected` | Not accepted | Invalid/out of scope; reason required | Operator |
| `duplicate` | Linked to existing report | Merged into parent | Operator |

**SLA defaults:** P0 4 h, P1 24 h, P2 72 h, P3 7 days. SLA is displayed, not enforced.

**Events:** `created`, `ai_processed`, `triaged`, `assigned`, `status_changed`, `note_added`, `duplicate_confirmed`, `duplicate_rejected`, `priority_overridden`, `category_overridden`, `resolved`.

---

## 14. Priority model (product view)

Priority answers: *"If we can only fix five things today, which five and why?"*

### 14.1 Bands

| Band | Label | Score | Citizen wording | Target response |
| --- | --- | --- | --- | --- |
| P0 | Critical | 80–100 | "Urgent — safety risk" | 4 hours |
| P1 | High | 60–79 | "High — being treated as urgent" | 24 hours |
| P2 | Medium | 40–59 | "Medium — scheduled" | 72 hours |
| P3 | Low | 0–39 | "Low — routine" | 7 days |

### 14.2 Factors shown to users

1. **Category severity** — inherent risk of the issue type.
2. **Urgency language** — safety words and vulnerable-location mentions.
3. **Cluster impact** — how many related reports are nearby.
4. **Corroboration** — confirmed duplicates.
5. **Recency** — newer unresolved reports rank higher.
6. **Critical hazard escalation** — live wire, open manhole, gas leak, drowning, electrocution or a road/structure that has already collapsed raise the score to the P0 floor of 80, even when the citizen writes calmly. Predictions ("it might collapse") do not escalate.

Exact weights and formulas are specified in [`trd.md`](./trd.md) §10.7. The UI must always show the arithmetic, not just the result. The escalation is a floor, not a hidden bonus: the factor row shows the points needed to reach 80, so the factors always sum to the displayed score.

### 14.3 Overrides

Operators may override the band with a mandatory reason. The original AI score remains visible with an "Overridden by operator" chip. Overrides are logged as events.

---

## 15. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Performance | First contentful paint <2 s on a mid-range phone (local build); AI pipeline <300 ms for 500 reports; route chunk loads <500 ms |
| Reliability | `npm run dev` and `npm run build` succeed on Node 20 LTS; no console errors on the six routes |
| Offline demo | Local mode works with no network after first load; no remote images/fonts required for core function (font falls back) |
| Browser support | Latest Chrome, Edge, Firefox, Safari; Android Chrome; iOS Safari 16+ |
| Responsiveness | 360, 390, 768, 1024, 1366, 1440 widths verified |
| Accessibility | Keyboard-complete citizen flow; AA contrast; reduced motion respected |
| Security | Anon key only in client; RLS on all tables; no service role key; image type/size validation |
| Maintainability | Feature folders, service layer, no business logic in components; ESLint clean |
| Honesty | Every simulated element labelled; README limitations section matches UI |
| Observability | Client logs AI version, processing time and errors to console in dev; no PII |

---

## 16. Success metrics

### 16.1 Demo metrics (measured live)

| Metric | Target |
| --- | --- |
| Time to submit a report | <60 s |
| AI processing latency (42-report corpus) | <300 ms |
| Duplicate suggestions correct on the seeded duplicate set | ≥6 of 8 groups surfaced |
| Priority ordering sanity (3 P0s in top 5) | 3 of 3 |
| Hotspot detection | Both seeded clusters found |
| Full journey demo | <5 min |
| Console errors during demo | 0 |

### 16.2 Product metrics (post-hackathon, not measured now)

Median time-to-acknowledge, duplicate merge rate, P0 acknowledgement within SLA, citizen tracking views per report, resolution rate by ward.

### 16.3 Guardrail metrics

False-merge rate (must stay near zero because merges are human-confirmed), low-confidence rate, operator override rate (high override rate signals poor calibration).

---

## 17. Five-minute demo script

| Time | Beat | What the judge sees |
| --- | --- | --- |
| 0:00–0:30 | Hook | Home: "Cities don't lack complaints. They lack a way to act on them." Show the 4-stage strip. |
| 0:30–1:30 | Capture | Open `/report` on a phone-sized window. Paste prepared text about waterlogging near a school, tap map, attach sample photo, submit. |
| 1:30–2:30 | Understand | `/analysis/:id`: category + confidence, summary, duplicate candidates with scores, priority factor table, hotspot membership. Say the exact score aloud: "79, P1, because…" |
| 2:30–3:15 | Reveal | `/dashboard`: point at Sector 12 cluster circle, priority mix, "Fix first" list. Open action brief. |
| 3:15–4:15 | Act | `/admin`: confirm one duplicate, assign Drainage Cell, move to In Progress, add public note, resolve. |
| 4:15–4:45 | Close the loop | `/track/:code`: timeline shows Received → Assigned → In progress → Resolved with the note. |
| 4:45-5:00 | Honesty | State what is real (AI pipeline, repository and workflow — local storage by default, Supabase when configured), what is mocked (notifications, departments), and one limitation (no image AI). |

**Backup plan:** the build defaults to local mode. If a Supabase demo is attempted and the network fails, set `VITE_DATA_MODE=local`, reload, and the seeded data and all AI still work. The footer badge always states which mode is active.

---

## 18. Delivery plan (8 hours)

| Window | Phase | Focus | Exit criteria |
| --- | --- | --- | --- |
| 0:00-0:30 | P0 | Scope lock, docs, seed specification | This PRD + TRD + architecture agreed; 42-report seed schema defined |
| 0:30-1:30 | P1 | Scaffold, Tailwind tokens, layout, routing, placeholder pages | All six routes navigable; responsive shell |
| 1:30-2:30 | P2 | Repository, 42-report seed, hooks | Data persists; reset restores seed |
| 2:30-4:00 | P3 | AI pipeline: classify, summarise, duplicates, priority, cluster | Unit-checked outputs on seed set |
| 4:00-5:00 | P4 | Report form, submission, tracking code + timeline | Submit <60 s; code lookup works |
| 5:00-5:45 | P5 | AI Analysis page | Full explainability visible |
| 5:45-6:35 | P6 | Dashboard: map, KPIs, charts, hotspot brief | Two clusters visible |
| 6:35-7:20 | P7 | Admin workflow + tracking timeline | End-to-end status update works |
| 7:20-8:00 | P8 | Polish, empty/error states, README, rehearsal | 360/768/1366 verified; timed run <5 min |

**Cut order if behind:** see [`phases.md`](./phases.md) §14 for the authoritative 14-item cut list. Summary: CSV export → SLA → charts → duplicate pre-check → brief modal → filters → photo upload → Recharts. Never cut: submit, AI factor table, tracking timeline, hotspot map, honesty labels.

**Source of truth:** [`phases.md`](./phases.md) is the granular execution schedule (task IDs, gates G0-G8, checkpoints C1-C8). This table is the executive summary; if the two disagree, `phases.md` wins.

---

## 19. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Tailwind/Leaflet setup issues eat time | Medium | High | Pin versions; import `leaflet/dist/leaflet.css`; use `divIcon` to avoid marker asset bugs |
| Supabase env/RLS blocks the demo | Medium | High | Local adapter as default; Supabase is opt-in via env; demo mode banner |
| AI looks like a black box | Medium | High | Factor table + component scores + model card; no accuracy claims |
| Duplicate false positives embarrass the demo | Medium | Medium | Human confirmation; conservative thresholds; show evidence |
| Scope creep into vision/LLM | High | High | Explicit non-goals; LLM adapter off by default |
| Mobile layout breaks | Medium | Medium | Mobile-first CSS; test 360 px each hour |
| Time lost on auth | High | Medium | Demo mode has no auth wall; Supabase auth is stretch |
| Seeded data looks unrealistic | Low | Medium | Realistic local names/landmarks, varied timestamps, deliberate duplicates |

---

## 20. Limitations and honesty note (source of truth for README)

**What is real**

- Report capture, validation, persistence (local adapter or Supabase).
- Classification, extractive summary, duplicate scoring, priority scoring, hotspot detection and brief generation — all executed by code in this repository.
- Status workflow, event log, citizen tracking timeline.
- Map, charts and KPIs computed from stored reports.

**What is mocked or simulated**

- Department names and assignment targets (fictional: Public Works, Drainage Cell, Sanitation, Electrical, Traffic, Parks).
- SMS/email/WhatsApp notifications — not sent; UI labels them MOCKED.
- Citizen identity — demo mode uses a local anonymous profile.
- Photos — synthetic placeholders; no image analysis.
- "Live" dashboard — refreshes on load, not real-time streaming.

**Where the AI can be wrong**

- Keyword classification misses sarcasm, code-mixed language (e.g. Hinglish), and novel issue types.
- TF-IDF duplicates miss paraphrases with no shared vocabulary; thresholds are tuned on a small synthetic set.
- Priority weights are expert guesses, not learned from outcomes; they can over-rank dramatic language.
- Grid clustering splits issues that straddle cell boundaries and merges unrelated issues in dense areas.
- Summaries are extractive and can repeat typos.

**What we would do next**

- Replace grid clustering with PostGIS/DBSCAN; add multilingual embeddings for duplicates; calibrate priority against real resolution outcomes; add image triage with human review; integrate a real 311/CRM; add auth, audit logs and SLA automation.

---

## 21. Future roadmap (post-hackathon)

| Horizon | Item |
| --- | --- |
| Next 2 weeks | Supabase auth + RLS hardening, pgvector duplicate search, multilingual copy |
| Next 2 months | PostGIS clustering, department routing rules, SLA automation, notification adapters |
| Next 6 months | Image triage, predictive hotspot forecasting, ward-level budgets, public API |

---

## 22. Decisions resolved at scope lock (P0)

All five were open during drafting and are now closed for the 8-hour build. Any change requires a note in [`docs/decision-log.md`](./docs/decision-log.md).

| # | Decision | Resolution for the prototype | Consequence if wrong |
| --- | --- | --- | --- |
| D1 | Supabase project available at build time? | **No.** Local adapter only. Supabase client and repository stay wired but dormant; missing env resolves to `local`. | None for the demo; Supabase mode is post-hackathon (P9). |
| D2 | Demo city coordinates | **Bengaluru centre 12.9716, 77.5946.** Hotspots at Sector 12 and Ward 4 Market. | Cosmetic only; seed locations are relative to these. |
| D3 | Recharts trend chart or only bar/donut? | **Bar + donut in P6.** 14-day trend line only if ahead of schedule (cut item 3). | Losing the trend chart costs one demo sentence, not a beat. |
| D4 | Admin auth in MVP? | **No auth wall in local mode.** A banner states the admin console is unauthenticated demo data; RLS and auth are P9. | Must never be deployed publicly as-is; honesty banner stays. |
| D5 | Optional LLM adapter? | **Off.** Deterministic `rules-v1` only; no network AI calls. | No API keys, no latency, no hallucination risk. |

---

## 23. Submission checklist

- [ ] Working prototype runnable with `npm install && npm run dev`
- [ ] Hosted link (Vercel/Netlify) or local run instructions
- [ ] Source repository with README: setup, architecture, AI approach
- [ ] `prd.md`, `trd.md`, `architecture.md`
- [ ] Synthetic dataset (≥30 reports) with duplicates, urgent cases and a cluster
- [ ] Demo video or live script (≤5 min)
- [ ] Limitations and honesty note (README section + in-app)
- [ ] No real personal data
- [ ] No claimed live integrations
- [ ] Console clean on all six routes

---

## Appendix A — Category taxonomy

| Key | Label | Example issues | Base severity |
| --- | --- | --- | --- |
| `roads` | Roads & Potholes | potholes, broken footpath, road collapse, missing signage | 26 |
| `water` | Water & Drainage | waterlogging, drain overflow, leaking pipe, no supply | 30 |
| `waste` | Waste Management | overflowing bin, illegal dumping, missed pickup | 18 |
| `electricity` | Streetlights & Electricity | dark street, live wire, flickering light, exposed box | 32 |
| `sanitation` | Sanitation & Public Health | open defecation, stagnant water, public toilet, pest | 22 |
| `public_safety` | Public Safety | open manhole, unsafe structure, stray dogs, fire risk | 38 |
| `other` | Other | anything not covered | 12 |

## Appendix B — Microcopy

- Hero: **From complaints to action.** "CivicPulse AI reads scattered reports, finds the pattern, and shows what to fix first — with reasons."
- Submit CTA: **Submit report**
- Success: **Report received. Here's what our AI found.**
- Tracking helper: **Enter the code from your submission receipt.**
- Low confidence: **Low confidence — an operator will review this.**
- No hotspot: **No hotspot yet — at least 3 related reports within 330 m are needed.**
- Demo banner: **Demo mode: data is stored in this browser. No messages are sent.**
- AI disclaimer: **AI output is advisory. A human makes the final call.**

## Appendix C — Glossary

| Term | Meaning |
| --- | --- |
| Report | A citizen-submitted civic issue |
| Event | An immutable workflow log entry |
| Cluster / hotspot | ≥3 related reports in a ~330 m grid cell within 30 days |
| Duplicate candidate | A report with similarity above the review threshold, not yet merged |
| Band | P0–P3 priority grouping |
| Corroboration | Confirmed duplicates that increase confidence/impact |
| Tracking code | Public identifier `CP-XXXXXX` |
| Demo mode | Local-storage data adapter, explicitly labelled |
| `rules-v1` | Version tag for the deterministic AI pipeline |
