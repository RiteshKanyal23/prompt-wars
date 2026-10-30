# CivicPulse AI — Technical Requirements Document (TRD)

| Field | Value |
| --- | --- |
| Product | CivicPulse AI |
| Document version | 1.0 |
| Status | Implementation-ready |
| Event | PromptWars x ASTRA — AI for Civic Impact |
| Build window | 8 hours, solo |
| Last updated | 30 October 2026 |
| Companion docs | [`prd.md`](./prd.md), [`architecture.md`](./architecture.md) |

---

## Table of contents

1. [Purpose and constraints](#1-purpose-and-constraints)
2. [Technology decisions](#2-technology-decisions)
3. [Exact setup commands](#3-exact-setup-commands)
4. [Environment configuration](#4-environment-configuration)
5. [Project structure](#5-project-structure)
6. [Foundational configuration files](#6-foundational-configuration-files)
7. [Design tokens and global CSS](#7-design-tokens-and-global-css)
8. [Data layer](#8-data-layer)
9. [Domain model and service contracts](#9-domain-model-and-service-contracts)
10. [AI pipeline specification](#10-ai-pipeline-specification)
11. [Frontend architecture](#11-frontend-architecture)
12. [Map, charts and forms](#12-map-charts-and-forms)
13. [Security and privacy](#13-security-and-privacy)
14. [Performance](#14-performance)
15. [Testing](#15-testing)
16. [Build, deployment and operations](#16-build-deployment-and-operations)
17. [Coding standards](#17-coding-standards)
18. [Definition of done](#18-definition-of-done)
19. [Known limitations](#19-known-limitations)

---

## 1. Purpose and constraints

This document specifies **how** CivicPulse AI is built: versions, commands, schema, formulas, module contracts, failure behaviour and acceptance tests.

### 1.1 Hard constraints

| Constraint | Consequence |
| --- | --- |
| Solo build, 8 hours | No auth-heavy flows, no custom backend, no model training |
| React + Vite, **JavaScript** | JSDoc for contracts; no `.ts`/`.tsx` files |
| Tailwind, React Router, Lucide, Supabase client, Recharts, Leaflet | These exact libraries; no UI kit or state library added |
| No fake API integrations | Only the Supabase SDK or the local adapter; no invented endpoints |
| Demo must survive bad Wi-Fi | Local adapter is the default; Supabase is opt-in |
| Judges must see real AI work | Deterministic `rules-v1` pipeline runs in the browser over real submitted text |
| Honesty | Every simulated element is labelled `MOCKED` or `SAMPLE DATA` in the UI |

### 1.2 Design constraints derived from the PRD

- Seven categories, eight statuses, four priority bands.
- Duplicate review distance 300 m, window 21 days, weights `0.55/0.20/0.15/0.10`.
- Hotspot grid ≈330 m (`0.003°`), window 30 days, minimum 3 reports.
- Priority score 0–100 with a visible factor breakdown; bands at 80/60/40.
- Tracking code format `CP-XXXXXX`.
- AI version string `rules-v1`; deterministic output for identical inputs and corpus.

### 1.3 Non-goals

No server-side rendering, no background jobs, no PostGIS, no pgvector, no image ML, no live notifications, no government API integration, no multi-tenant auth.

---

## 2. Technology decisions

### 2.1 Stack and pinned versions

| Layer | Choice | Version | Why this version |
| --- | --- | --- | --- |
| Runtime | Node.js LTS | ≥ 20.11 | Vite 5 + tooling compatibility |
| Build | Vite | 5.4.11 | Stable, fast, no Node 22 requirement |
| UI | React | 18.3.1 | `react-leaflet@4` peer dependency |
| Language | JavaScript (ESM) | ES2022 | Required by brief |
| Styling | Tailwind CSS | 3.4.17 | Stable config-based theming (v4 changes config model) |
| Routing | react-router-dom | 6.28.0 | Nested layouts, `useParams`, `NavLink` |
| Icons | lucide-react | 0.468.0 | Tree-shaken SVG icons |
| Backend | @supabase/supabase-js | 2.47.10 | Postgres, Storage, Auth, RLS |
| Charts | recharts | 2.13.3 | Responsive SVG charts, no canvas |
| Maps | leaflet / react-leaflet | 1.9.4 / 4.2.1 | Mature, free OSM tiles, React 18 support |
| Tests | vitest | 2.1.8 | Native Vite integration for AI unit tests |
| Lint | eslint + plugins | 9.x | Template default, flat config |

### 2.2 Deliberate exclusions

| Not used | Reason |
| --- | --- |
| TypeScript | Brief specifies JavaScript; JSDoc gives editor safety without build friction |
| Redux / Zustand | 42-report demo does not need global state; hooks + context suffice |
| TanStack Query | One more concept to explain; repository hooks refetch on mutation |
| react-hook-form | Two forms; controlled components are simpler to debug in 8 hours |
| Tailwind v4 | Config and plugin ecosystem still shifting; v3 is predictable |
| Mapbox / Google Maps | API keys and billing; OSM tiles are sufficient and honest |
| LLM SDK | Would put secrets in the client or require a backend; adapter is optional and off |

### 2.3 Architecture at a glance

```text
React pages ──► hooks ──► reportsRepository (interface)
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
        localRepository                supabaseRepository
     (localStorage + seed)          (Postgres + Storage + Auth)
                 │                           │
                 └─────────────┬─────────────┘
                               ▼
                     AI pipeline (rules-v1)
        classify → summarise → duplicates → cluster → priority
```

The AI pipeline is **client-side and shared** by both adapters. In production it would move to a Supabase Edge Function; the contract is designed so that move is a swap, not a rewrite (see `architecture.md` §15).

---

## 3. Exact setup commands

Run in PowerShell or a POSIX shell from the folder that should contain the project. Commands are intentionally one per line.

### 3.1 Scaffold

```bash
node -v
npm -v

npm create vite@latest civicpulse-ai -- --template react
cd civicpulse-ai
```

### 3.2 Install dependencies (authoritative)

```bash
npm install react@18.3.1 react-dom@18.3.1
npm install react-router-dom@6.28.0 lucide-react@0.468.0 @supabase/supabase-js@2.47.10 recharts@2.13.3 leaflet@1.9.4 react-leaflet@4.2.1
npm install -D vite@5.4.11 @vitejs/plugin-react@4.3.4 tailwindcss@3.4.17 postcss@8.4.49 autoprefixer@10.4.20 vitest@2.1.8
npm install -D eslint@9.16.0 @eslint/js@9.16.0 eslint-plugin-react@7.37.2 eslint-plugin-react-hooks@5.0.0 eslint-plugin-react-refresh@0.4.14 globals@15.13.0
```

### 3.3 Initialise Tailwind

```bash
npx tailwindcss init -p
```

This creates `tailwind.config.js` and `postcss.config.js`. Replace them with the versions in §6.3 and §6.4.

### 3.4 Run and verify

```bash
npm run dev
```

Expected output:

```text
  VITE v5.4.11  ready in 412 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open `http://localhost:5173/`. There must be **zero** red console errors.

### 3.5 Production build check

```bash
npm run build
npm run preview
```

### 3.6 Tests

```bash
npm run test
```

### 3.7 If the scaffold already installed React 19

The explicit `react@18.3.1` install above downgrades it. Verify:

```bash
npm ls react react-dom react-leaflet
```

Expected: `react@18.3.1`, `react-dom@18.3.1`, `react-leaflet@4.2.1`. If npm reports `ERESOLVE`, run:

```bash
npm install --legacy-peer-deps
```

Do not use `--force`; it hides the real conflict.

### 3.8 Optional: Supabase CLI (only if using Supabase)

```bash
npm install -D supabase
npx supabase login
npx supabase init
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

---

## 4. Environment configuration

### 4.1 `.env.example` (commit this file)

```bash
# Data mode: auto | local | supabase
# auto = supabase when both URL and anon key exist, otherwise local demo mode
VITE_DATA_MODE=auto

# Supabase project (safe to expose: anon key is protected by RLS)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Demo map centre (fictional Bengaluru demo area)
VITE_DEMO_CENTER_LAT=12.9716
VITE_DEMO_CENTER_LNG=77.5946
VITE_DEMO_CITY_LABEL=Sector 12, Demo City

# Optional LLM adapter. Off by default. NEVER put a provider secret in a VITE_ var.
VITE_AI_LLM_ENABLED=false
VITE_AI_PROXY_URL=
```

### 4.2 Local `.env.local` (never commit)

```bash
VITE_DATA_MODE=local
```

To use Supabase:

```bash
VITE_DATA_MODE=supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 4.3 Resolution rules (`src/lib/env.js`)

```js
const rawMode = (import.meta.env.VITE_DATA_MODE || 'auto').trim().toLowerCase();
const requestedMode = ['auto', 'local', 'supabase'].includes(rawMode) ? rawMode : 'auto';
const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const hasSupabase = Boolean(url && anonKey);

export const DATA_MODE =
  requestedMode === 'supabase' && !hasSupabase
    ? 'local'
    : requestedMode === 'auto'
      ? (hasSupabase ? 'supabase' : 'local')
      : requestedMode;

export const IS_LOCAL_MODE = DATA_MODE === 'local';
export const DEMO_CENTER = {
  lat: Number(import.meta.env.VITE_DEMO_CENTER_LAT || 12.9716),
  lng: Number(import.meta.env.VITE_DEMO_CENTER_LNG || 77.5946),
  label: import.meta.env.VITE_DEMO_CITY_LABEL || 'Sector 12, Demo City',
};
export const LLM_ENABLED = import.meta.env.VITE_AI_LLM_ENABLED === 'true';
export const AI_PROXY_URL = (import.meta.env.VITE_AI_PROXY_URL || '').trim();
```

**Failure behaviour:** if `VITE_DATA_MODE=supabase` but credentials are missing, the app falls back to local mode and renders the banner: *"Supabase not configured — using local demo data."* It never crashes on missing env.

### 4.4 Secrets policy

- `VITE_*` values are bundled into the client and are **public**. Only the Supabase anon key is allowed.
- The Supabase **service role key must never appear** in any `VITE_*` variable or in the repo.
- If an LLM is enabled, the provider key lives in a Supabase Edge Function; the client calls `VITE_AI_PROXY_URL` without a secret.
- `.env.local` is git-ignored.

---

## 5. Project structure

```text
civicpulse-ai/
├─ public/
│  └─ favicon.svg
├─ src/
│  ├─ assets/
│  │  ├─ images/                  # bundled sample photos / placeholders
│  │  └─ logo-mark.svg
│  ├─ app/
│  │  ├─ App.jsx                  # router + providers
│  │  └─ providers.jsx            # ToastProvider, DataModeProvider
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ AppLayout.jsx
│  │  │  ├─ AdminLayout.jsx
│  │  │  ├─ Header.jsx
│  │  │  ├─ Footer.jsx
│  │  │  ├─ MobileNav.jsx
│  │  │  ├─ Container.jsx
│  │  │  └─ PageHeader.jsx
│  │  ├─ ui/
│  │  │  ├─ Button.jsx
│  │  │  ├─ Card.jsx
│  │  │  ├─ Badge.jsx
│  │  │  ├─ PriorityBadge.jsx
│  │  │  ├─ StatusBadge.jsx
│  │  │  ├─ StatCard.jsx
│  │  │  ├─ EmptyState.jsx
│  │  │  ├─ Skeleton.jsx
│  │  │  ├─ Modal.jsx
│  │  │  ├─ Toast.jsx
│  │  │  ├─ ToastViewport.jsx
│  │  │  ├─ Field.jsx
│  │  │  ├─ Tabs.jsx
│  │  │  ├─ Timeline.jsx
│  │  │  └─ HonestyNote.jsx
│  │  ├─ charts/
│  │  │  ├─ CategoryBarChart.jsx
│  │  │  ├─ PriorityDonut.jsx
│  │  │  └─ TrendAreaChart.jsx
│  │  ├─ map/
│  │  │  ├─ MapView.jsx
│  │  │  ├─ LocationPicker.jsx
│  │  │  └─ MapLegend.jsx
│  │  └─ reports/
│  │     ├─ ReportCard.jsx
│  │     ├─ ReportTable.jsx
│  │     ├─ AiSummaryCard.jsx
│  │     ├─ PriorityFactors.jsx
│  │     ├─ DuplicateList.jsx
│  │     └─ HotspotCard.jsx
│  ├─ data/
│  │  ├─ seedReports.js           # 42 synthetic reports (single source of truth)
│  │  └─ seedEvents.js
│  ├─ types/
│  │  └─ index.js                 # JSDoc typedefs only
│  ├─ hooks/
│  │  ├─ useReports.js
│  │  ├─ useReport.js
│  │  ├─ useClusters.js
│  │  ├─ useToast.js
│  │  └─ useDocumentTitle.js
│  ├─ lib/
│  │  ├─ constants.js
│  │  ├─ env.js
│  │  ├─ geo.js
│  │  ├─ format.js
│  │  ├─ validation.js
│  │  ├─ referenceCode.js
│  │  ├─ errors.js
│  │  ├─ image.js
│  │  └─ logger.js
│  ├─ pages/
│  │  ├─ Home.jsx
│  │  ├─ ReportIssue.jsx
│  │  ├─ Analysis.jsx
│  │  ├─ AnalysisDetail.jsx
│  │  ├─ Dashboard.jsx
│  │  ├─ Admin.jsx
│  │  ├─ Track.jsx
│  │  ├─ TrackDetail.jsx
│  │  └─ NotFound.jsx
│  ├─ services/
│  │  ├─ supabase/
│  │  │  ├─ client.js
│  │  │  ├─ mappers.js
│  │  │  └─ supabaseRepository.js
│  │  ├─ local/
│  │  │  ├─ localRepository.js
│  │  │  └─ storage.js
│  │  ├─ ai/
│  │  │  ├─ normalize.js
│  │  │  ├─ tfidf.js
│  │  │  ├─ classify.js
│  │  │  ├─ summarize.js
│  │  │  ├─ duplicates.js
│  │  │  ├─ priority.js
│  │  │  ├─ clusters.js
│  │  │  ├─ brief.js
│  │  │  ├─ pipeline.js
│  │  │  └─ __tests__/ai.test.js
│  │  └─ index.js                 # chooses adapter
│  ├─ index.css                   # Tailwind entry (template default path)
│  └─ main.jsx
├─ scripts/
│  ├─ evaluate-seed.mjs
│  └─ seed-supabase.mjs
├─ supabase/
│  ├─ schema.sql
│  └─ seed.sql                    # optional, generated
├─ .env.example
├─ .gitignore
├─ eslint.config.js
├─ index.html
├─ jsconfig.json
├─ package.json
├─ postcss.config.js
├─ tailwind.config.js
└─ vite.config.js
```

### 5.1 Dependency direction (enforced by review)

```text
pages ──► components ──► hooks ──► services ──► lib
  │                                      │
  └──────────────► lib ◄─────────────────┘
```

- `pages/` may import components, hooks, lib.
- `components/` may import ui/charts/map/reports, lib. **Never** pages or services directly (except `reports/` presentational components receiving props).
- `hooks/` may import services and lib.
- `services/ai/` may import only `lib/` and its own modules.
- `lib/` imports nothing from the app.
- No component calls `supabase` directly. Ever.

---

## 6. Foundational configuration files

### 6.1 `package.json`

```json
{
  "name": "civicpulse-ai",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.47.10",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1",
    "react-router-dom": "^6.28.0",
    "recharts": "^2.13.3"
  },
  "devDependencies": {
    "@eslint/js": "^9.16.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.16.0",
    "eslint-plugin-react": "^7.37.2",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.14",
    "globals": "^15.13.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "vite": "^5.4.11",
    "vitest": "^2.1.8"
  }
}
```

### 6.2 `vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
```

### 6.3 `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F1F5FA',
          100: '#DCE7F5',
          700: '#173B66',
          800: '#102A4C',
          900: '#0B1F3A',
          950: '#071527',
        },
        teal: {
          50: '#E6FAF7',
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#0FB5A6',
          600: '#0C9A8D',
          700: '#0A7C72',
        },
        mist: '#F5F8FC',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,31,58,.06), 0 8px 24px -12px rgba(11,31,58,.18)',
        lift: '0 12px 32px -16px rgba(11,31,58,.28)',
      },
      borderRadius: {
        xl: '1.25rem',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        'fade-in': 'fade-in .18s ease-out both',
      },
    },
  },
  plugins: [],
};
```

### 6.4 `postcss.config.js`

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 6.5 `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0B1F3A" />
    <meta
      name="description"
      content="CivicPulse AI turns scattered civic complaints into prioritized, explainable and trackable action."
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <title>CivicPulse AI — From Complaints to Action</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

> Fonts are loaded from Google Fonts. If the network is unavailable, the CSS stack falls back to system fonts; no functionality depends on the font.

### 6.6 `jsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

### 6.7 `eslint.config.js`

```js
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    settings: { react: { version: '18.3' } },
    plugins: { react, 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
```

### 6.8 `.gitignore`

```gitignore
node_modules
dist
dist-ssr
*.local
.env
.env.local
.env.*.local
.DS_Store
coverage
supabase/.temp
```

### 6.9 `src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from '@/app/App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### 6.10 `src/app/App.jsx` (routing skeleton)

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import Home from '@/pages/Home';
import ReportIssue from '@/pages/ReportIssue';
import Analysis from '@/pages/Analysis';
import AnalysisDetail from '@/pages/AnalysisDetail';
import Dashboard from '@/pages/Dashboard';
import Admin from '@/pages/Admin';
import Track from '@/pages/Track';
import TrackDetail from '@/pages/TrackDetail';
import NotFound from '@/pages/NotFound';
import { ToastProvider } from '@/app/providers';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="report" element={<ReportIssue />} />
            <Route path="analysis" element={<Analysis />} />
            <Route path="analysis/:id" element={<AnalysisDetail />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="track" element={<Track />} />
            <Route path="track/:code" element={<TrackDetail />} />
            <Route path="404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
            <Route path="home" element={<Navigate to="/" replace />} />
          </Route>

          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Admin />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
```

**Route notes**

- `AdminLayout` is a **sibling** of `AppLayout`, not a child. It renders its own sidebar/header and an `<Outlet />`; nesting it inside `AppLayout` would render two headers.
- The public `*` route catches unknown URLs inside `AppLayout`; `/admin` is matched before it by React Router's static-segment ranking.
- `Home` must be `index` at `/`, not `/home`; the redirect exists only for old links.

---

## 7. Design tokens and global CSS

### 7.1 `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    color-scheme: light;
  }

  html {
    -webkit-text-size-adjust: 100%;
    scroll-behavior: smooth;
  }

  body {
    @apply bg-mist text-navy-900 antialiased;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }

  h1, h2, h3, h4 {
    @apply font-semibold tracking-tight text-navy-900;
    text-wrap: balance;
  }

  p {
    text-wrap: pretty;
  }

  :focus-visible {
    @apply outline-none ring-2 ring-teal-500 ring-offset-2 ring-offset-white;
  }

  ::selection {
    @apply bg-teal-100 text-navy-900;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}

@layer components {
  .container-page {
    @apply mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8;
  }

  .card {
    @apply rounded-2xl border border-slate-200/80 bg-white shadow-card;
  }

  .card-pad {
    @apply p-5 sm:p-6;
  }

  .btn {
    @apply inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold
      transition-colors disabled:cursor-not-allowed disabled:opacity-60;
  }

  .btn-primary {
    @apply btn bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950;
  }

  .btn-accent {
    @apply btn bg-teal-500 text-navy-950 hover:bg-teal-600 hover:text-white active:bg-teal-700;
  }

  .btn-ghost {
    @apply btn border border-slate-300 bg-white text-navy-900 hover:border-navy-900 hover:bg-navy-50;
  }

  .btn-danger {
    @apply btn bg-red-600 text-white hover:bg-red-700;
  }

  .btn-sm {
    @apply min-h-[36px] rounded-lg px-3 text-xs;
  }

  .label {
    @apply mb-1.5 block text-sm font-medium text-navy-900;
  }

  .hint {
    @apply mt-1.5 text-xs text-slate-500;
  }

  .error-text {
    @apply mt-1.5 text-xs font-medium text-red-600;
  }

  .input {
    @apply w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px]
      text-navy-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none
      focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-50;
  }

  .chip {
    @apply inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1
      text-xs font-medium text-slate-600;
  }

  .chip-active {
    @apply border-teal-500 bg-teal-50 text-teal-700;
  }

  .ai-panel {
    @apply rounded-2xl border border-teal-200 bg-teal-50/70;
  }

  .skeleton {
    @apply animate-shimmer rounded-lg bg-slate-200/70;
    background-image: linear-gradient(90deg, #e2e8f0 0px, #f1f5f9 40px, #e2e8f0 80px);
    background-size: 600px 100%;
  }

  .table-base {
    @apply w-full border-collapse text-left text-sm;
  }

  .table-base th {
    @apply whitespace-nowrap border-b border-slate-200 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500;
  }

  .table-base td {
    @apply border-b border-slate-100 px-3 py-3 align-middle text-slate-700;
  }
}

/* Leaflet must not create a stacking context above the sticky header. */
.leaflet-container {
  z-index: 0;
  width: 100%;
  height: 100%;
  font-family: inherit;
  background: #e8eef6;
}

.leaflet-control-attribution {
  font-size: 10px;
}

.cp-map-pin {
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  border: 3px solid #ffffff;
  box-shadow: 0 2px 10px rgba(7, 21, 39, 0.45);
}

.cp-map-pin--P0 { background: #dc2626; }
.cp-map-pin--P1 { background: #f59e0b; }
.cp-map-pin--P2 { background: #2563eb; }
.cp-map-pin--P3 { background: #64748b; }
```

### 7.2 Token usage rules

- Page background is always `bg-mist`; cards are white.
- Primary CTA is navy; the *one* action that moves the journey forward is teal.
- Priority colours are used **only** in badges, markers and charts, never as page backgrounds.
- Text on teal-500 is `navy-950` (contrast ≥ 7:1); text on navy is white or `navy-50`.
- Never use colour alone: pair every dot with a label (`P0 · Critical`).
- Border radius is 12–16 px for cards, 8 px for small controls, pill for chips.

---

## 8. Data layer

### 8.1 Adapter selection (`src/services/index.js`)

```js
import { DATA_MODE } from '@/lib/env';
import { localRepository } from '@/services/local/localRepository';
import { supabaseRepository } from '@/services/supabase/supabaseRepository';

export const reportsRepository =
  DATA_MODE === 'supabase' ? supabaseRepository : localRepository;
```

Both adapters implement the **same async interface** (§9.3). Components and hooks never know which one is active. This is the single most important boundary in the codebase: it lets the demo run offline and lets Supabase be added without touching UI code.

### 8.2 Supabase schema (`supabase/schema.sql`)

Run this in the Supabase SQL editor or via `supabase db push`. It is idempotent enough to re-run during the hackathon.

```sql
-- ============================================================
-- CivicPulse AI — schema v1 (prototype)
-- ============================================================
create extension if not exists pgcrypto;

do $$ begin
  create type public.report_status as enum
    ('submitted','triaged','assigned','in_progress','resolved','closed','rejected','duplicate');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.priority_band as enum ('P0','P1','P2','P3');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_role as enum ('citizen','operator','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.duplicate_status as enum ('pending','confirmed','rejected');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        public.user_role not null default 'citizen',
  ward        text,
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- reports ----------
create table if not exists public.reports (
  id                  uuid primary key default gen_random_uuid(),
  reference_code      text not null unique,
  citizen_id          uuid references public.profiles(id) on delete set null,
  title               text,
  description         text not null check (char_length(description) between 20 and 1000),
  category            text not null check (category in
                        ('roads','water','waste','electricity','sanitation','public_safety','other')),
  location_label      text,
  latitude            double precision not null check (latitude between -90 and 90),
  longitude           double precision not null check (longitude between -180 and 180),
  image_url           text,
  status              public.report_status not null default 'submitted',
  priority_score      smallint check (priority_score between 0 and 100),
  priority_band       public.priority_band,
  ai                  jsonb not null default '{}'::jsonb,
  ai_version          text,
  cluster_key         text,
  department          text,
  assigned_to         uuid references public.profiles(id) on delete set null,
  sla_due_at          timestamptz,
  duplicate_of        uuid references public.reports(id) on delete set null,
  duplicate_confirmed boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  resolved_at         timestamptz
);

create index if not exists reports_status_priority_idx
  on public.reports (status, priority_score desc nulls last);
create index if not exists reports_category_idx on public.reports (category);
create index if not exists reports_cluster_idx on public.reports (cluster_key);
create index if not exists reports_created_idx on public.reports (created_at desc);
create index if not exists reports_geo_idx on public.reports (latitude, longitude);

-- ---------- contacts (PII isolated from the public reports table) ----------
create table if not exists public.report_contacts (
  report_id  uuid primary key references public.reports(id) on delete cascade,
  name       text,
  phone      text,
  created_at timestamptz not null default now()
);

-- ---------- events (append-only) ----------
create table if not exists public.report_events (
  id          bigserial primary key,
  report_id   uuid not null references public.reports(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_role  text not null default 'system',
  type        text not null,
  from_status public.report_status,
  to_status   public.report_status,
  is_public   boolean not null default true,
  note        text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists report_events_report_idx
  on public.report_events (report_id, created_at asc);

-- ---------- duplicate links ----------
create table if not exists public.report_duplicates (
  id            uuid primary key default gen_random_uuid(),
  report_id     uuid not null references public.reports(id) on delete cascade,
  duplicate_of  uuid not null references public.reports(id) on delete cascade,
  similarity    numeric(4,3) not null check (similarity between 0 and 1),
  components    jsonb not null default '{}'::jsonb,
  level         text not null check (level in ('strong','review','low')),
  status        public.duplicate_status not null default 'pending',
  reviewed_by   uuid references public.profiles(id) on delete set null,
  reviewed_at   timestamptz,
  reason        text,
  created_at    timestamptz not null default now(),
  unique (report_id, duplicate_of),
  check (report_id <> duplicate_of)
);

create index if not exists report_duplicates_status_idx
  on public.report_duplicates (status, created_at desc);

-- ---------- updated_at trigger ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reports_touch_updated_at on public.reports;
create trigger reports_touch_updated_at
  before update on public.reports
  for each row execute function public.touch_updated_at();

-- ---------- staff helper ----------
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('operator','admin')
  );
$$;

-- ---------- RLS ----------
alter table public.profiles         enable row level security;
alter table public.reports          enable row level security;
alter table public.report_contacts  enable row level security;
alter table public.report_events    enable row level security;
alter table public.report_duplicates enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists "profiles staff read" on public.profiles;
create policy "profiles staff read" on public.profiles
  for select using (public.is_staff());

-- Prototype choice: reports are publicly readable so the demo dashboard works
-- without a login. No PII lives in this table. Documented in the honesty note.
drop policy if exists "reports public read" on public.reports;
create policy "reports public read" on public.reports
  for select using (true);

drop policy if exists "reports citizen insert" on public.reports;
create policy "reports citizen insert" on public.reports
  for insert with check (auth.uid() = citizen_id or citizen_id is null);

drop policy if exists "reports staff update" on public.reports;
create policy "reports staff update" on public.reports
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "contacts owner read" on public.report_contacts;
create policy "contacts owner read" on public.report_contacts
  for select using (
    public.is_staff()
    or exists (select 1 from public.reports r where r.id = report_id and r.citizen_id = auth.uid())
  );

drop policy if exists "contacts owner insert" on public.report_contacts;
create policy "contacts owner insert" on public.report_contacts
  for insert with check (
    exists (select 1 from public.reports r where r.id = report_id and r.citizen_id = auth.uid())
  );

drop policy if exists "events public read" on public.report_events;
create policy "events public read" on public.report_events
  for select using (is_public = true or public.is_staff());

drop policy if exists "events staff insert" on public.report_events;
create policy "events staff insert" on public.report_events
  for insert with check (public.is_staff());

drop policy if exists "events citizen insert" on public.report_events;
create policy "events citizen insert" on public.report_events
  for insert with check (
    type in ('created', 'ai_processed')
    and exists (select 1 from public.reports r where r.id = report_id and r.citizen_id = auth.uid())
  );

drop policy if exists "duplicates staff read" on public.report_duplicates;
create policy "duplicates staff read" on public.report_duplicates
  for select using (public.is_staff());

drop policy if exists "duplicates staff write" on public.report_duplicates;
create policy "duplicates staff write" on public.report_duplicates
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------- atomic duplicate confirmation ----------
create or replace function public.confirm_duplicate(
  p_report_id uuid,
  p_duplicate_of uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not authorised';
  end if;

  update public.reports
     set status = 'duplicate',
         duplicate_of = p_duplicate_of,
         duplicate_confirmed = true,
         resolved_at = now()
   where id = p_report_id;

  update public.report_duplicates
     set status = 'confirmed',
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         reason = p_reason
   where report_id = p_report_id and duplicate_of = p_duplicate_of;

  insert into public.report_events
    (report_id, actor_id, actor_role, type, is_public, note, metadata)
  values
    (p_report_id, auth.uid(), 'operator', 'duplicate_confirmed', true,
     coalesce(p_reason, 'Linked to an existing report'),
     jsonb_build_object('duplicate_of', p_duplicate_of));
end;
$$;

-- ---------- storage ----------
insert into storage.buckets (id, name, public)
values ('report-images', 'report-images', true)
on conflict (id) do nothing;

drop policy if exists "report images public read" on storage.objects;
create policy "report images public read" on storage.objects
  for select using (bucket_id = 'report-images');

drop policy if exists "report images auth upload" on storage.objects;
create policy "report images auth upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'report-images');
```

### 8.3 Schema decisions and trade-offs

| Decision | Reason | Cost |
| --- | --- | --- |
| AI output stored as `reports.ai` JSONB plus denormalised `priority_score` / `priority_band` / `cluster_key` | Fast queue sorting and filtering without joins; full explanation retained | Duplication; a re-analysis must update both |
| No `ai_runs` history table | 8-hour scope | Cannot compare model versions over time |
| Public read on reports | Demo dashboard without login; no PII in table | Not suitable for production; documented |
| PII in `report_contacts` | Isolates name/phone from public reads | Extra insert; optional in demo |
| Client-generated reference code | No RPC needed; unique constraint catches collisions | Retry loop on rare collision |
| Client-side AI | Zero infra, works offline, explainable | Trust boundary: a determined user could forge `ai` JSON; acceptable for prototype, noted |
| `cluster_key` stored but clusters recomputed on read | Clusters change as reports arrive | Slight client CPU; fine at 42–500 reports |

### 8.4 Reference code generation (`src/lib/referenceCode.js`)

```js
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1

export function createReferenceCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = '';
  for (const byte of bytes) code += ALPHABET[byte % ALPHABET.length];
  return `CP-${code}`;
}

export function normalizeCode(value = '') {
  return String(value).trim().toUpperCase().replace(/\s+/g, '');
}
```

The repository retries **once** on a unique-constraint violation (`23505`) with a fresh code, then surfaces a friendly error.

### 8.5 Seed data specification (`src/data/seedReports.js`)

42 reports, generated once and committed. Shape:

```js
export const seedReports = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    referenceCode: 'CP-7K2M9Q',
    title: 'Drain overflowing near Sunrise School',
    description:
      'The storm drain outside Sunrise School has been overflowing since last night. Water is knee deep on the footpath and children are walking through it. The smell is very bad.',
    category: 'water',
    locationLabel: '4th Cross, Sector 12',
    latitude: 12.97194,
    longitude: 77.59512,
    imageUrl: null,
    status: 'triaged',
    department: 'Drainage Cell',
    assignedTo: null,
    slaDueAt: null,
    duplicateOf: null,
    duplicateConfirmed: false,
    createdAt: '2026-10-28T08:15:00.000Z',
    updatedAt: '2026-10-28T09:02:00.000Z',
    resolvedAt: null,
    citizenId: null,
    // priorityScore, priorityBand, clusterKey and ai are derived by
    // analyzeReport() at seed time — never hand-authored.
  },
  // ... 41 more
];
```

**Composition rules**

| Dimension | Distribution |
| --- | --- |
| Total | 42 |
| Categories | water 11, roads 9, waste 8, electricity 6, sanitation 4, public_safety 3, other 1 |
| Statuses | submitted 8, triaged 7, assigned 6, in_progress 6, resolved 9, closed 2, rejected 2, duplicate 2 |
| Priority | P0 3, P1 11, P2 17, P3 11 |
| Duplicate groups | 8 groups: 5 pairs + 3 triplets (19 reports involved) |
| Cluster A | Sector 12: 7 reports (water ×3, drain-related water ×2, roads ×2) within 180 m / 14 days |
| Cluster B | Ward 4 Market: 5 waste reports within 120 m / 10 days |
| Urgent | live wire near bus stop, open manhole near school, partial road collapse |
| Time | `createdAt` spread over the 30 days before 2026-10-30; 6 reports in the last 48 h |
| Images | 6 local placeholder paths under `src/assets/images/`; the rest `null` |
| PII | none real; names are fictional initials; no phone numbers stored |

Seed reports must **not** ship pre-baked AI JSON copied from a different text. Either:

- run `analyzeReport` on each seed item at load time (preferred; guarantees consistency), or
- commit generated `ai` objects and add a unit test asserting `priorityScore` matches the formula.

The local adapter chooses option A: `seedReports` contains human-authored content and status, and `analyzeReport` fills AI fields on first load. This keeps the demo honest and avoids stale numbers.

### 8.6 Local adapter (`src/services/local/localRepository.js`)

Storage keys: `civicpulse:v1:reports`, `civicpulse:v1:events`, `civicpulse:v1:duplicates`, `civicpulse:v1:meta`.

```js
import { seedReports } from '@/data/seedReports';
import { createReferenceCode } from '@/lib/referenceCode';
import { analyzeReport } from '@/services/ai/pipeline';
import { computeClusters } from '@/services/ai/clusters';
import { nowIso, clone } from '@/lib/format';

const KEY = {
  reports: 'civicpulse:v1:reports',
  events: 'civicpulse:v1:events',
  duplicates: 'civicpulse:v1:duplicates',
  meta: 'civicpulse:v1:meta',
};

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

function ensureSeed() {
  const meta = read(KEY.meta, null);
  if (meta?.seeded) return;
  const now = new Date();
  const reports = seedReports.map((report) => ({ ...report }));

  // Pass 1: analyse each report against every other seeded report, so
  // duplicate candidates and cluster counts are real rather than pre-baked.
  for (let index = 0; index < reports.length; index += 1) {
    const corpus = reports.filter((_, otherIndex) => otherIndex !== index);
    const ai = analyzeReport(reports[index], corpus, { now });
    reports[index] = {
      ...reports[index],
      ai,
      priorityScore: ai.priority.score,
      priorityBand: ai.priority.band,
      clusterKey: ai.cluster?.key ?? null,
    };
  }

  // Pass 2: enrich cluster snapshots now that every report has a priority score.
  const clusters = computeClusters(reports, { now });
  for (const report of reports) {
    const cluster = clusters.find((item) => item.members.some((member) => member.id === report.id));
    if (!cluster) continue;
    report.clusterKey = cluster.key;
    report.ai = {
      ...report.ai,
      cluster: {
        key: cluster.key,
        id: cluster.id,
        label: cluster.label,
        count: cluster.count,
        categories: cluster.categories,
        avgPriority: cluster.avgPriority,
        hotspotScore: cluster.hotspotScore,
        radiusMeters: cluster.radiusMeters,
        trend: cluster.trend,
      },
    };
  }

  const events = reports.map((report) => ({
    id: `${report.id}-created`,
    reportId: report.id,
    type: 'created',
    actorRole: 'system',
    isPublic: true,
    note: 'Report received',
    createdAt: report.createdAt,
    metadata: {},
  }));

  const duplicates = [];
  const seenPairs = new Set();
  for (const report of reports) {
    for (const candidate of report.ai?.duplicates ?? []) {
      if (candidate.level === 'low') continue;
      const pairKey = [report.id, candidate.reportId].sort().join('|');
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      duplicates.push({
        id: crypto.randomUUID(),
        reportId: report.id,
        duplicateOf: candidate.reportId,
        similarity: candidate.score,
        components: candidate.components,
        level: candidate.level,
        status: 'pending',
        createdAt: now.toISOString(),
      });
    }
  }

  write(KEY.reports, reports);
  write(KEY.events, events);
  write(KEY.duplicates, duplicates);
  write(KEY.meta, { seeded: true, seededAt: now.toISOString(), version: 1 });
}

ensureSeed();

export const localRepository = {
  mode: 'local',

  async listReports(filters = {}) {
    let reports = read(KEY.reports, []);
    if (filters.status) reports = reports.filter((r) => r.status === filters.status);
    if (filters.category) reports = reports.filter((r) => r.category === filters.category);
    if (filters.band) reports = reports.filter((r) => r.priorityBand === filters.band);
    if (filters.clusterKey) reports = reports.filter((r) => r.clusterKey === filters.clusterKey);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      reports = reports.filter((r) =>
        `${r.referenceCode} ${r.title} ${r.description} ${r.locationLabel}`.toLowerCase().includes(q));
    }
    reports.sort((a, b) =>
      (b.priorityScore ?? -1) - (a.priorityScore ?? -1) ||
      new Date(b.createdAt) - new Date(a.createdAt));
    return clone(reports);
  },

  async getReportById(id) {
    return clone(read(KEY.reports, []).find((r) => r.id === id) ?? null);
  },

  async getReportByCode(code) {
    const target = String(code).trim().toUpperCase();
    return clone(read(KEY.reports, []).find((r) => r.referenceCode.toUpperCase() === target) ?? null);
  },

  async listEvents(reportId, { publicOnly = false } = {}) {
    return clone(read(KEY.events, [])
      .filter((e) => e.reportId === reportId && (!publicOnly || e.isPublic))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
  },

  async createReport(input) {
    const reports = read(KEY.reports, []);
    const now = new Date();
    const id = crypto.randomUUID();
    const referenceCode = createReferenceCode();
    const base = {
      id,
      referenceCode,
      citizenId: input.citizenId ?? null,
      title: input.title?.trim() || null,
      description: input.description.trim(),
      category: input.category === 'auto' ? 'other' : input.category,
      locationLabel: input.locationLabel?.trim() || null,
      latitude: Number(input.latitude),
      longitude: Number(input.longitude),
      imageUrl: input.imageUrl ?? null,
      status: 'submitted',
      priorityScore: null,
      priorityBand: null,
      department: null,
      assignedTo: null,
      slaDueAt: null,
      duplicateOf: null,
      duplicateConfirmed: false,
      clusterKey: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      resolvedAt: null,
    };
    const ai = analyzeReport(base, reports, { now });
    const report = {
      ...base,
      category: input.category === 'auto' ? ai.category : base.category,
      priorityScore: ai.priority.score,
      priorityBand: ai.priority.band,
      clusterKey: ai.cluster?.key ?? null,
      ai,
    };
    reports.push(report);
    write(KEY.reports, reports);

    const events = read(KEY.events, []);
    events.push(
      { id: `${id}-created`, reportId: id, type: 'created', actorRole: 'citizen', isPublic: true,
        note: 'Report received', createdAt: now.toISOString(), metadata: {} },
      { id: `${id}-ai`, reportId: id, type: 'ai_processed', actorRole: 'system', isPublic: true,
        note: `AI ${ai.version}: ${ai.category} · ${ai.priority.band}`,
        createdAt: now.toISOString(), metadata: { version: ai.version, ms: ai.processingMs } },
    );
    write(KEY.events, events);

    const duplicates = read(KEY.duplicates, []);
    for (const candidate of ai.duplicates) {
      if (candidate.level === 'low') continue;
      duplicates.push({
        id: crypto.randomUUID(), reportId: id, duplicateOf: candidate.reportId,
        similarity: candidate.score, components: candidate.components,
        level: candidate.level, status: 'pending', createdAt: now.toISOString(),
      });
    }
    write(KEY.duplicates, duplicates);
    return clone(report);
  },

  async updateReport(id, patch, event = null) {
    const reports = read(KEY.reports, []);
    const index = reports.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Report not found');
    const previous = reports[index];
    const next = { ...previous, ...patch, updatedAt: nowIso() };
    if (patch.status === 'resolved') next.resolvedAt = nowIso();
    reports[index] = next;
    write(KEY.reports, reports);

    if (event) {
      const events = read(KEY.events, []);
      events.push({
        id: crypto.randomUUID(), reportId: id, type: event.type,
        actorRole: event.actorRole ?? 'operator', isPublic: event.isPublic ?? true,
        note: event.note ?? null, createdAt: nowIso(),
        fromStatus: event.fromStatus ?? previous.status,
        toStatus: event.toStatus ?? next.status,
        metadata: event.metadata ?? {},
      });
      write(KEY.events, events);
    }
    return clone(next);
  },

  async listDuplicatePairs() {
    return clone(read(KEY.duplicates, []));
  },

  async reviewDuplicate(pairId, decision, reason = '') {
    const duplicates = read(KEY.duplicates, []);
    const pair = duplicates.find((p) => p.id === pairId);
    if (!pair) throw new Error('Duplicate pair not found');
    pair.status = decision; // 'confirmed' | 'rejected'
    pair.reason = reason;
    pair.reviewedAt = nowIso();
    write(KEY.duplicates, duplicates);

    if (decision === 'confirmed') {
      await localRepository.updateReport(pair.reportId,
        { status: 'duplicate', duplicateOf: pair.duplicateOf, duplicateConfirmed: true },
        { type: 'duplicate_confirmed', note: reason || 'Linked to an existing report', isPublic: true });
      const parent = read(KEY.reports, []).find((r) => r.id === pair.duplicateOf);
      if (parent) {
        await localRepository.updateReport(parent.id, {}, {
          type: 'duplicate_confirmed',
          note: `Another report was linked to this issue`,
          isPublic: true,
          metadata: { duplicateReportId: pair.reportId },
        });
      }
    }
    return clone(pair);
  },

  async listClusters() {
    return computeClusters(read(KEY.reports, []));
  },

  async reset() {
    Object.values(KEY).forEach((key) => localStorage.removeItem(key));
    ensureSeed();
  },
};
```

**Notes**

- Every method is `async` even though localStorage is synchronous, so the Supabase adapter is a drop-in.
- `clone()` uses `structuredClone` with a JSON fallback to prevent callers mutating stored state.
- Seeding is a **two-pass** process: the first pass analyses every report against the full corpus (so duplicate candidates and cluster counts are real), and the second pass refreshes cluster snapshots after all priority scores exist. It is O(n²) over 42 reports and completes in well under 100 ms.
- Seeded duplicate pairs are written as `pending`; the admin Duplicates tab therefore has real work to review on first load.

### 8.7 Supabase adapter (`src/services/supabase/supabaseRepository.js`)

`src/services/supabase/client.js` must not create a client when credentials are absent, otherwise importing the adapter would crash local mode:

```js
import { createClient } from '@supabase/supabase-js';
import { DATA_MODE } from '@/lib/env';

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const supabase =
  DATA_MODE === 'supabase' && url && anonKey ? createClient(url, anonKey) : null;
```

The adapter maps `snake_case` rows to the camelCase domain object and back. Key mappings:

| DB column | Domain field |
| --- | --- |
| `reference_code` | `referenceCode` |
| `priority_score` | `priorityScore` |
| `priority_band` | `priorityBand` |
| `cluster_key` | `clusterKey` |
| `duplicate_of` | `duplicateOf` |
| `duplicate_confirmed` | `duplicateConfirmed` |
| `assigned_to` | `assignedTo` |
| `sla_due_at` | `slaDueAt` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |
| `resolved_at` | `resolvedAt` |
| `citizen_id` | `citizenId` |
| `image_url` | `imageUrl` |
| `location_label` | `locationLabel` |

`src/services/supabase/mappers.js`:

```js
const FIELD_MAP = {
  referenceCode: 'reference_code',
  citizenId: 'citizen_id',
  priorityScore: 'priority_score',
  priorityBand: 'priority_band',
  clusterKey: 'cluster_key',
  duplicateOf: 'duplicate_of',
  duplicateConfirmed: 'duplicate_confirmed',
  assignedTo: 'assigned_to',
  slaDueAt: 'sla_due_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  resolvedAt: 'resolved_at',
  imageUrl: 'image_url',
  locationLabel: 'location_label',
};

export function mapReport(row) {
  if (!row) return null;
  const report = { ...row };
  for (const [domain, column] of Object.entries(FIELD_MAP)) {
    report[domain] = row[column];
    delete report[column];
  }
  return report;
}

export function toRow(input = {}) {
  const row = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    row[FIELD_MAP[key] ?? key] = value;
  }
  return row;
}
```

Reference implementation of the critical methods:

```js
import { supabase } from '@/services/supabase/client';
import { analyzeReport } from '@/services/ai/pipeline';
import { computeClusters } from '@/services/ai/clusters';
import { createReferenceCode } from '@/lib/referenceCode';
import { mapReport, toRow } from '@/services/supabase/mappers';

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

export const supabaseRepository = {
  mode: 'supabase',

  async listReports(filters = {}) {
    let query = supabase.from('reports').select('*');
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.band) query = query.eq('priority_band', filters.band);
    if (filters.clusterKey) query = query.eq('cluster_key', filters.clusterKey);
    if (filters.search) query = query.or(
      `reference_code.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location_label.ilike.%${filters.search}%`);
    const { data, error } = await query
      .order('priority_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(filters.limit ?? 500);
    if (error) throw error;
    return data.map(mapReport);
  },

  async getReportById(id) {
    const { data, error } = await supabase.from('reports').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapReport(data) : null;
  },

  async getReportByCode(code) {
    const { data, error } = await supabase.from('reports').select('*')
      .eq('reference_code', String(code).trim().toUpperCase()).maybeSingle();
    if (error) throw error;
    return data ? mapReport(data) : null;
  },

  async listEvents(reportId, { publicOnly = false } = {}) {
    let query = supabase.from('report_events').select('*').eq('report_id', reportId);
    if (publicOnly) query = query.eq('is_public', true);
    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;
    return data.map((e) => ({
      id: String(e.id), reportId: e.report_id, actorId: e.actor_id, actorRole: e.actor_role,
      type: e.type, fromStatus: e.from_status, toStatus: e.to_status,
      isPublic: e.is_public, note: e.note, metadata: e.metadata, createdAt: e.created_at,
    }));
  },

  async createReport(input) {
    const existing = await this.listReports({ limit: 500 });
    const citizenId = await currentUserId();
    const draft = {
      id: crypto.randomUUID(), referenceCode: createReferenceCode(), citizenId,
      title: input.title?.trim() || null, description: input.description.trim(),
      category: input.category === 'auto' ? 'other' : input.category,
      locationLabel: input.locationLabel?.trim() || null,
      latitude: Number(input.latitude), longitude: Number(input.longitude),
      imageUrl: input.imageUrl ?? null, status: 'submitted', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const ai = analyzeReport(draft, existing);
    const finalCategory = input.category === 'auto' ? ai.category : draft.category;
    const row = {
      ...toRow({ ...draft, category: finalCategory }),
      priority_score: ai.priority.score,
      priority_band: ai.priority.band,
      cluster_key: ai.cluster?.key ?? null,
      ai,
      ai_version: ai.version,
    };
    const { data, error } = await supabase.from('reports').insert(row).select('*').single();
    if (error) throw error;

    await supabase.from('report_events').insert([
      { report_id: data.id, actor_id: citizenId, actor_role: 'citizen', type: 'created',
        is_public: true, note: 'Report received' },
      { report_id: data.id, actor_role: 'system', type: 'ai_processed', is_public: true,
        note: `AI ${ai.version}: ${ai.category} · ${ai.priority.band}`,
        metadata: { version: ai.version, ms: ai.processingMs } },
    ]);

    if (input.contact?.name || input.contact?.phone) {
      await supabase.from('report_contacts').insert({
        report_id: data.id, name: input.contact.name || null, phone: input.contact.phone || null,
      });
    }
    return mapReport(data);
  },

  async updateReport(id, patch, event = null) {
    const { data, error } = await supabase.from('reports')
      .update(toRow(patch)).eq('id', id).select('*').single();
    if (error) throw error;
    if (event) {
      const { error: eventError } = await supabase.from('report_events').insert({
        report_id: id, actor_role: event.actorRole ?? 'operator', type: event.type,
        from_status: event.fromStatus ?? null, to_status: event.toStatus ?? null,
        is_public: event.isPublic ?? true, note: event.note ?? null,
        metadata: event.metadata ?? {},
      });
      if (eventError) throw eventError;
    }
    return mapReport(data);
  },

  async listDuplicatePairs() { /* select report_duplicates order created_at desc */ },
  async reviewDuplicate(pairId, decision, reason = '') { /* rpc confirm_duplicate or update */ },
  async listClusters() { return computeClusters(await this.listReports({ limit: 500 })); },
  async reset() { throw new Error('Reset is only available in local demo mode'); },
};
```

**Important:** the Supabase adapter performs AI **before** insert, so the row is complete on arrival. In production this moves into an Edge Function triggered after insert; see `architecture.md` §15.3.

### 8.8 Image handling

| Mode | Behaviour |
| --- | --- |
| Local | Downscale to max 1280 px, JPEG quality 0.8, store as data URL if ≤1.5 MB; otherwise keep an object URL for the session and label "preview only — not persisted" |
| Supabase | Upload to `report-images/{userId}/{uuid}.{ext}`, max 5 MB, MIME allowlist `image/jpeg,image/png,image/webp`; store the public URL |
| AI | Never analyses pixels. UI copy: **"Photo stored as evidence. Image analysis is not enabled."** |

Client-side compression helper belongs in `src/lib/image.js` and must reject SVG (XSS risk) and files >5 MB before reading.

---

## 9. Domain model and service contracts

### 9.1 Domain objects (JSDoc)

```js
/**
 * @typedef {'roads'|'water'|'waste'|'electricity'|'sanitation'|'public_safety'|'other'} Category
 * @typedef {'submitted'|'triaged'|'assigned'|'in_progress'|'resolved'|'closed'|'rejected'|'duplicate'} ReportStatus
 * @typedef {'P0'|'P1'|'P2'|'P3'} PriorityBand
 */

/**
 * @typedef {Object} Report
 * @property {string} id
 * @property {string} referenceCode
 * @property {string|null} citizenId
 * @property {string|null} title
 * @property {string} description
 * @property {Category} category
 * @property {string|null} locationLabel
 * @property {number} latitude
 * @property {number} longitude
 * @property {string|null} imageUrl
 * @property {ReportStatus} status
 * @property {number|null} priorityScore
 * @property {PriorityBand|null} priorityBand
 * @property {AiAnalysis|null} ai
 * @property {string|null} clusterKey
 * @property {string|null} department
 * @property {string|null} assignedTo
 * @property {string|null} slaDueAt
 * @property {string|null} duplicateOf
 * @property {boolean} duplicateConfirmed
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} resolvedAt
 */

/**
 * @typedef {Object} AiAnalysis
 * @property {'rules-v1'} version
 * @property {Category} category
 * @property {number} confidence
 * @property {{category: Category, score: number, confidence: number}[]} alternatives
 * @property {string} summary
 * @property {DuplicateCandidate[]} duplicates
 * @property {{score: number, band: PriorityBand, factors: PriorityFactor[], verdict: string}} priority
 * @property {{key: string, count: number, categories: Record<string, number>, avgPriority: number, hotspotScore: number, radiusMeters: number, label: string}|null} cluster
 * @property {number} processingMs
 * @property {string} processedAt
 */

/**
 * @typedef {Object} DuplicateCandidate
 * @property {string} reportId
 * @property {string} referenceCode
 * @property {number} score
 * @property {'strong'|'review'|'low'} level
 * @property {{text: number, category: number, geo: number, time: number}} components
 * @property {number} distanceMeters
 * @property {number} ageDays
 * @property {string[]} reasons
 */

/**
 * @typedef {Object} PriorityFactor
 * @property {string} code
 * @property {string} label
 * @property {number} points
 * @property {string} detail
 */

/**
 * @typedef {Object} ReportEvent
 * @property {string} id
 * @property {string} reportId
 * @property {string|null} actorId
 * @property {'citizen'|'operator'|'admin'|'system'} actorRole
 * @property {string} type
 * @property {ReportStatus|null} fromStatus
 * @property {ReportStatus|null} toStatus
 * @property {boolean} isPublic
 * @property {string|null} note
 * @property {Object} metadata
 * @property {string} createdAt
 */
```

### 9.2 Category and status constants (`src/lib/constants.js`)

```js
export const AI_VERSION = 'rules-v1';
export const CLUSTER_CELL_SIZE = 0.003;
export const CLUSTER_WINDOW_DAYS = 30;
export const CLUSTER_MIN_REPORTS = 3;

export const CATEGORIES = [
  { key: 'roads',         label: 'Roads & Potholes',        short: 'Roads',        baseSeverity: 26 },
  { key: 'water',         label: 'Water & Drainage',        short: 'Water',        baseSeverity: 30 },
  { key: 'waste',         label: 'Waste Management',        short: 'Waste',        baseSeverity: 18 },
  { key: 'electricity',   label: 'Streetlights & Electricity', short: 'Electricity', baseSeverity: 32 },
  { key: 'sanitation',    label: 'Sanitation & Public Health', short: 'Sanitation', baseSeverity: 22 },
  { key: 'public_safety', label: 'Public Safety',           short: 'Safety',       baseSeverity: 38 },
  { key: 'other',         label: 'Other',                   short: 'Other',        baseSeverity: 12 },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

export const CATEGORY_FAMILIES = {
  roads: 'roads', water: 'water', sanitation: 'water',
  waste: 'waste', electricity: 'electricity',
  public_safety: 'safety', other: 'other',
};

export const STATUS_META = {
  submitted:   { label: 'Submitted',   citizenLabel: 'Received',          tone: 'slate',  order: 0 },
  triaged:     { label: 'Triaged',     citizenLabel: 'Under review',      tone: 'blue',   order: 1 },
  assigned:    { label: 'Assigned',    citizenLabel: 'Assigned',          tone: 'teal',   order: 2 },
  in_progress: { label: 'In progress', citizenLabel: 'In progress',       tone: 'amber',  order: 3 },
  resolved:    { label: 'Resolved',    citizenLabel: 'Resolved',          tone: 'green',  order: 4 },
  closed:      { label: 'Closed',      citizenLabel: 'Closed',            tone: 'slate',  order: 5 },
  rejected:    { label: 'Rejected',    citizenLabel: 'Not accepted',      tone: 'red',    order: 6 },
  duplicate:   { label: 'Duplicate',   citizenLabel: 'Linked to existing', tone: 'slate', order: 6 },
};

export const PRIORITY_META = {
  P0: { label: 'Critical', tone: 'red',   min: 80, slaHours: 4,   citizen: 'Urgent — safety risk' },
  P1: { label: 'High',     tone: 'amber', min: 60, slaHours: 24,  citizen: 'High — treated as urgent' },
  P2: { label: 'Medium',   tone: 'blue',  min: 40, slaHours: 72,  citizen: 'Medium — scheduled' },
  P3: { label: 'Low',      tone: 'slate', min: 0,  slaHours: 168, citizen: 'Low — routine' },
};

export const DEPARTMENTS = [
  'Public Works', 'Drainage Cell', 'Sanitation', 'Electrical', 'Public Safety', 'Ward Office',
];

export const ALLOWED_TRANSITIONS = {
  submitted:   ['triaged', 'rejected', 'duplicate'],
  triaged:     ['assigned', 'in_progress', 'rejected', 'duplicate'],
  assigned:    ['in_progress', 'resolved', 'rejected', 'duplicate'],
  in_progress: ['resolved', 'rejected', 'duplicate'],
  resolved:    ['closed'],
  closed:      [],
  rejected:    [],
  duplicate:   [],
};

export const REPORT_IMAGE_BUCKET = 'report-images';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
```

### 9.3 Repository interface

| Method | Signature | Contract |
| --- | --- | --- |
| `mode` | `'local' \| 'supabase'` | For the honesty banner |
| `listReports` | `(filters?) => Promise<Report[]>` | Sorted by priority desc, createdAt desc; default limit 500 |
| `getReportById` | `(id) => Promise<Report \| null>` | `null` when absent, never throws for not-found |
| `getReportByCode` | `(code) => Promise<Report \| null>` | Case-insensitive, trimmed |
| `listEvents` | `(reportId, {publicOnly}?) => Promise<ReportEvent[]>` | Ascending by time |
| `createReport` | `(input) => Promise<Report>` | Persists report + `created`/`ai_processed` events + duplicate candidates; returns enriched report |
| `updateReport` | `(id, patch, event?) => Promise<Report>` | Applies patch; appends event atomically enough for demo |
| `listDuplicatePairs` | `() => Promise<DuplicatePair[]>` | Pending first, then newest |
| `reviewDuplicate` | `(pairId, 'confirmed'\|'rejected', reason?) => Promise<DuplicatePair>` | Confirm updates both reports/events |
| `listClusters` | `() => Promise<Cluster[]>` | Recomputed from current reports |
| `reset` | `() => Promise<void>` | Local only; throws in Supabase mode |

### 9.4 Error contract

- Services throw `Error` objects with human-readable messages; no raw Supabase errors leak to UI.
- `lib/errors.js` exposes `toUserMessage(error)` mapping common codes:
  - `23505` → "That tracking code was already used. Please retry."
  - `42501` / RLS → "You do not have permission for this action."
  - network/`Failed to fetch` → "Could not reach the server. Your report is still in the form."
- UI catches at the hook or page boundary and renders a retryable error state.

### 9.5 Mutation and refresh strategy

No global cache. After a mutation:

1. The page calls `await reload()` from its hook.
2. The hook re-queries the repository.
3. Components re-render from the new array.

At 42–500 reports this is fast and removes an entire class of cache-invalidation bugs. A custom `civicpulse:data-changed` `window` event is dispatched by the repository after mutations so open tabs can refresh:

```js
window.dispatchEvent(new CustomEvent('civicpulse:data-changed'));
```

`useReports` listens for it and reloads.

---

## 10. AI pipeline specification

### 10.1 Pipeline contract and invariants

```text
analyzeReport(report, corpus, { now })
  1. classify      → category, confidence, alternatives
  2. summarise     → ≤220-char extractive summary
  3. duplicates    → top 3 candidates with component scores
  4. clusters      → hotspot containing this report (or null)
  5. priority      → 0–100 score, band, factor list, verdict
  6. package       → AiAnalysis with version, timings, processedAt
```

**Invariants**

| # | Invariant | Test |
| --- | --- | --- |
| I1 | Deterministic: same report + corpus + clock → identical output | Deep-equal two runs |
| I2 | `priority.factors` points sum to `priority.score` | Sum assertion |
| I3 | Band is derived from score, never passed in | Boundary tests at 39/40/59/60/79/80 |
| I4 | Duplicate candidates exclude self, rejected and duplicate reports | Filter test |
| I5 | Cluster count includes the current report | Cluster test |
| I6 | Summary contains only substrings/paraphrases of input (no invented facts) | Manual review |
| I7 | No network call, no `Date.now()` inside pure helpers (clock injected) | Code review |
| I8 | Output is JSON-serialisable | `JSON.stringify` round-trip |

`now` is injected everywhere. `processingMs` is the only non-deterministic field and is excluded from equality checks.

### 10.2 Text normalisation (`src/services/ai/normalize.js`)

```js
const STOPWORDS = new Set(
  `a an the and or but if then than that this these those is are was were be been being
   to of in on at for with from by as it its into over under near after before since about
   across along around there here their they we you i he she my our your report reported
   please kindly very really just also has have had do does did can could would should
   will may might must not no`.split(/\s+/).filter(Boolean),
);

export function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(value = '') {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

export function splitSentences(value = '') {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function truncate(value = '', max = 220) {
  const text = String(value).trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, Math.max(1, max - 1));
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : cut.length).trim()}…`;
}
```

**Language note:** this normaliser is English-centric. Hinglish words that survive tokenisation are still matched if the lexicon contains them (e.g. `nali`, `kooda`). Code-mixed input lowers confidence, which the UI surfaces. This is a documented limitation, not a hidden failure.

### 10.3 TF-IDF and cosine similarity (`src/services/ai/tfidf.js`)

```js
import { tokenize } from './normalize';

/**
 * Build an IDF table from a corpus of strings.
 * @param {string[]} documents
 */
export function buildIndex(documents) {
  const df = new Map();
  for (const document of documents) {
    const unique = new Set(tokenize(document));
    for (const token of unique) df.set(token, (df.get(token) || 0) + 1);
  }
  const N = Math.max(documents.length, 1);
  const idf = new Map();
  for (const [token, count] of df) {
    idf.set(token, Math.log((N + 1) / (count + 1)) + 1);
  }
  return { idf, N };
}

export function vectorize(tokens, index) {
  const counts = new Map();
  for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);
  const length = Math.max(tokens.length, 1);
  const vector = new Map();
  for (const [token, count] of counts) {
    const idf = index.idf.get(token) ?? 1; // unseen token gets max-ish weight
    vector.set(token, (count / length) * idf);
  }
  return vector;
}

export function cosine(a, b) {
  if (!a.size || !b.size) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const value of a.values()) normA += value * value;
  for (const value of b.values()) normB += value * value;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [token, value] of small) dot += value * (large.get(token) || 0);
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function textSimilarity(a, b, index) {
  return cosine(vectorize(tokenize(a), index), vectorize(tokenize(b), index));
}
```

**Why TF-IDF instead of embeddings:** it is deterministic, runs in microseconds for 50–500 reports, needs no key, and every score can be explained by shared terms. It is weaker on paraphrases; the limitations note says so. The interface (`textSimilarity`) is where an embedding adapter would slot in later.

### 10.4 Classification (`src/services/ai/classify.js`)

```js
import { normalizeText, tokenize } from './normalize';
import { CATEGORY_MAP } from '@/lib/constants';

/**
 * Weighted lexicon. Weights: 4 = decisive, 3 = strong, 2 = moderate, 1 = weak.
 * Multi-word entries are matched against the normalised text.
 */
export const CATEGORY_LEXICON = {
  roads: {
    pothole: 4, potholes: 4, road: 2, roads: 2, footpath: 3, pavement: 2,
    crack: 2, cracked: 2, tar: 2, asphalt: 2, 'speed breaker': 3, signboard: 1,
    'road collapse': 4, collapse: 2, cave: 2, 'broken road': 4, divider: 1,
  },
  water: {
    waterlogging: 4, waterlogged: 4, waterlog: 3, drain: 3, drainage: 3,
    sewer: 3, sewage: 3, overflow: 3, overflowing: 3, leak: 2, leaking: 2,
    pipeline: 2, pipe: 2, 'water supply': 3, tap: 1, stagnant: 3, flood: 3,
    flooded: 3, 'storm drain': 3, 'manhole cover': 2, muddy: 1,
  },
  waste: {
    garbage: 4, waste: 3, trash: 3, bin: 4, bins: 4, dumping: 4, dump: 3,
    litter: 3, littering: 3, pickup: 2, collection: 2, smell: 1, stink: 2,
    'overflowing bin': 4, 'solid waste': 3, debris: 2,
  },
  electricity: {
    streetlight: 4, 'street light': 4, 'street lights': 4, lamp: 3, lampost: 3,
    wire: 4, wires: 4, electric: 3, electricity: 3, transformer: 3, pole: 2,
    power: 2, outage: 3, spark: 3, sparking: 4, shock: 3, 'live wire': 4,
    'dark street': 3, flickering: 2,
  },
  sanitation: {
    toilet: 4, toilets: 4, sanitation: 3, defecation: 4, 'public health': 3,
    mosquito: 3, mosquitoes: 3, pest: 3, rodents: 3, rats: 3, hygiene: 3,
    cleaning: 2, sweeper: 2, sweeping: 2, 'garbage burning': 3,
  },
  public_safety: {
    manhole: 4, 'open manhole': 4, unsafe: 3, collapse: 3, 'collapsed wall': 4,
    stray: 3, dogs: 3, fire: 3, hazard: 3, accident: 3, injury: 3, injured: 3,
    building: 1, wall: 2, tree: 2, 'fallen tree': 3, 'exposed wire': 4,
    drowning: 4, 'dangerous': 3,
  },
  other: {},
};

const LOW_CONFIDENCE = 0.45;

export function classifyReport({ title = '', description = '' }) {
  const text = normalizeText(`${title} ${description}`);
  const tokens = new Set(tokenize(`${title} ${description}`));

  const scored = Object.entries(CATEGORY_LEXICON).map(([category, lexicon]) => {
    let score = 0;
    const matches = [];
    for (const [term, weight] of Object.entries(lexicon)) {
      const hit = term.includes(' ') ? text.includes(term) : tokens.has(term);
      if (hit) {
        score += weight;
        matches.push(term);
      }
    }
    return { category, score, matches };
  });

  scored.sort((a, b) => b.score - a.score || a.category.localeCompare(b.category));
  const top = scored[0];

  if (!top || top.score === 0) {
    return {
      category: 'other',
      confidence: 0.25,
      lowConfidence: true,
      alternatives: scored.slice(0, 3).map((item) => ({
        category: item.category, score: 0, confidence: 0, matches: [],
      })),
      matches: [],
    };
  }

  const topThree = scored.slice(0, 3);
  const denominator = topThree.reduce((sum, item) => sum + item.score, 0) || top.score;
  const confidence = Math.min(0.98, Math.max(0.35, top.score / denominator));

  return {
    category: top.category,
    confidence: Number(confidence.toFixed(2)),
    lowConfidence: confidence < LOW_CONFIDENCE,
    alternatives: topThree.map((item) => ({
      category: item.category,
      label: CATEGORY_MAP[item.category]?.label ?? item.category,
      score: item.score,
      confidence: Number((item.score / denominator).toFixed(2)),
      matches: item.matches,
    })),
    matches: top.matches,
  };
}
```

**Worked example**

Input: *"Severe waterlogging near Sunrise School, drain overflowing since last night."*

| Category | Matches | Score |
| --- | --- | --- |
| water | waterlogging 4, drain 3, overflowing 3 | 10 |
| roads | — | 0 |
| sanitation | — | 0 |
| others | — | 0 |

`confidence = 10 / 10 = 1.0 → clamped 0.98`. Category `water`, high confidence.

If the text also said *"road has cracked"*, roads scores 2 and water 10 → confidence `10/12 = 0.83`.

**Failure behaviour:** no matches → `other` at 0.25 with `lowConfidence: true`; the UI shows an operator-review notice.

### 10.5 Extractive summarisation (`src/services/ai/summarize.js`)

```js
import { splitSentences, tokenize, truncate } from './normalize';
import { CATEGORY_LEXICON } from './classify';

export function summarizeReport({ title = '', description = '', category = 'other' }) {
  const sentences = splitSentences(description);
  if (sentences.length === 0) return truncate(title || 'No description provided.', 220);
  if (sentences.length === 1) return truncate(sentences[0], 220);

  const lexicon = CATEGORY_LEXICON[category] ?? {};
  const categoryTerms = new Set(Object.keys(lexicon).flatMap((term) => term.split(' ')));
  const titleTerms = new Set(tokenize(title));

  const ranked = sentences.map((sentence, index) => {
    const tokens = new Set(tokenize(sentence));
    let hits = 0;
    for (const token of tokens) {
      if (categoryTerms.has(token)) hits += 1;
      if (titleTerms.has(token)) hits += 1;
    }
    const lengthBonus = Math.min(sentence.length / 140, 1);
    const positionBonus = index === 0 ? 3 : 0;
    return { sentence, index, score: hits * 2 + lengthBonus + positionBonus };
  });

  const chosen = [...ranked]
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2)
    .sort((a, b) => a.index - b.index);

  return truncate(chosen.map((item) => item.sentence).join(' '), 220);
}
```

**Properties**

- Every word comes from the citizen's description; no hallucinated locations or causes.
- First sentence gets a bonus because citizens usually lead with the core issue.
- Maximum two sentences / 220 characters keeps cards scannable.
- Typos are preserved rather than "corrected", which is honest.

---

### 10.6 Duplicate detection (`src/services/ai/duplicates.js`)

```js
import { haversineMeters } from '@/lib/geo';
import { CATEGORY_FAMILIES } from '@/lib/constants';
import { buildIndex, vectorize, cosine } from './tfidf';
import { tokenize } from './normalize';

export const DUPLICATE_WEIGHTS = { text: 0.55, category: 0.2, geo: 0.15, time: 0.1 };
export const DUPLICATE_THRESHOLDS = { strong: 0.82, review: 0.68, floor: 0.55 };

const MAX_DISTANCE_METERS = 300;
const MAX_AGE_DAYS = 21;
const DAY_MS = 86_400_000;

function categorySimilarity(a, b) {
  if (a === b) return 1;
  if (CATEGORY_FAMILIES[a] && CATEGORY_FAMILIES[a] === CATEGORY_FAMILIES[b]) return 0.5;
  return 0;
}

function toTime(value) {
  const time = new Date(value ?? 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

/**
 * @param {import('@/types').Report} report
 * @param {import('@/types').Report[]} corpus
 */
export function findDuplicateCandidates(report, corpus, { now = new Date(), limit = 3 } = {}) {
  const nowMs = new Date(now).getTime();
  const pool = corpus.filter(
    (candidate) =>
      candidate.id !== report.id &&
      candidate.status !== 'duplicate' &&
      candidate.status !== 'rejected' &&
      Number.isFinite(Number(candidate.latitude)) &&
      Number.isFinite(Number(candidate.longitude)),
  );
  if (pool.length === 0) return [];

  const documents = [
    `${report.title ?? ''} ${report.description ?? ''}`,
    ...pool.map((candidate) => `${candidate.title ?? ''} ${candidate.description ?? ''}`),
  ];
  const index = buildIndex(documents);
  const targetVector = vectorize(tokenize(documents[0]), index);

  const results = [];

  for (const candidate of pool) {
    const distanceMeters = haversineMeters(report, candidate);
    const ageDays = Math.abs(nowMs - toTime(candidate.createdAt)) / DAY_MS;
    if (distanceMeters > MAX_DISTANCE_METERS || ageDays > MAX_AGE_DAYS) continue;

    const candidateVector = vectorize(
      tokenize(`${candidate.title ?? ''} ${candidate.description ?? ''}`),
      index,
    );
    const text = cosine(targetVector, candidateVector);
    const category = categorySimilarity(report.category, candidate.category);

    // Require either a category/family match or meaningful lexical overlap.
    if (category === 0 && text < 0.3) continue;

    const geo = Math.max(0, 1 - distanceMeters / MAX_DISTANCE_METERS);
    const time = Math.max(0, 1 - ageDays / MAX_AGE_DAYS);
    const score =
      DUPLICATE_WEIGHTS.text * text +
      DUPLICATE_WEIGHTS.category * category +
      DUPLICATE_WEIGHTS.geo * geo +
      DUPLICATE_WEIGHTS.time * time;

    if (score < DUPLICATE_THRESHOLDS.floor) continue;

    const level =
      score >= DUPLICATE_THRESHOLDS.strong
        ? 'strong'
        : score >= DUPLICATE_THRESHOLDS.review
          ? 'review'
          : 'low';

    const reasons = [];
    if (text >= 0.4) reasons.push(`Shared wording (${Math.round(text * 100)}% text similarity)`);
    if (category === 1) reasons.push('Same category');
    else if (category === 0.5) reasons.push('Related category');
    if (distanceMeters <= 100) reasons.push(`Only ${Math.round(distanceMeters)} m apart`);
    if (ageDays <= 3) reasons.push(`Reported ${Math.round(ageDays)} day(s) apart`);

    results.push({
      reportId: candidate.id,
      referenceCode: candidate.referenceCode,
      score: Number(score.toFixed(3)),
      level,
      components: {
        text: Number(text.toFixed(3)),
        category,
        geo: Number(geo.toFixed(3)),
        time: Number(time.toFixed(3)),
      },
      distanceMeters: Math.round(distanceMeters),
      ageDays: Number(ageDays.toFixed(1)),
      reasons,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
```

**Thresholds**

| Score | Level | UI behaviour |
| --- | --- | --- |
| ≥ 0.82 | `strong` | Red/amber "Very likely duplicate" with side-by-side comparison |
| 0.68–0.81 | `review` | "Possible duplicate — review" |
| 0.55–0.67 | `low` | Shown only in the AI detail table, collapsed by default |
| < 0.55 | — | Discarded |

**Worked example**

Two reports 80 m apart, same category, 2 days apart, cosine 0.71:

```text
0.55(0.71) + 0.20(1.00) + 0.15(0.733) + 0.10(0.905)
= 0.3905 + 0.2000 + 0.1100 + 0.0905
= 0.791  → review
```

**Human-in-the-loop:** the pipeline only *suggests*. `reviewDuplicate` is an explicit operator action. Confirming sets the child to `duplicate`, links `duplicate_of`, and adds a public event to both reports.

### 10.7 Explainable priority (`src/services/ai/priority.js`)

```js
import { CATEGORY_MAP } from '@/lib/constants';
import { normalizeText } from './normalize';

export const PRIORITY_BANDS = [
  { band: 'P0', min: 80 },
  { band: 'P1', min: 60 },
  { band: 'P2', min: 40 },
  { band: 'P3', min: 0 },
];

/** Urgency phrases and their points. Matched on normalised, space-padded text. */
const URGENCY_TERMS = [
  ['live wire', 8], ['electrocution', 8], ['open manhole', 8], ['gas leak', 8],
  ['drowning', 8], ['fire', 7], ['collapse', 7], ['sinkhole', 7], ['emergency', 6],
  ['exposed wire', 6], ['accident', 5], ['injury', 5], ['injured', 5], ['danger', 5],
  ['hazard', 5], ['school', 4], ['hospital', 4], ['children', 4], ['child', 4],
  ['elderly', 4], ['urgent', 4], ['severe', 4], ['since last night', 3], ['blocked', 3],
  ['deep', 3], ['huge', 3], ['overflowing', 2], ['night', 2], ['market', 2],
  ['bus stop', 2], ['playground', 2],
];

function urgencyPoints(text) {
  const padded = ` ${text} `;
  const matched = [];
  let points = 0;
  for (const [term, value] of URGENCY_TERMS) {
    if (padded.includes(` ${term} `)) {
      points += value;
      matched.push(term);
    }
  }
  return { points: Math.min(20, points), matched, capped: points > 20 };
}

function clusterPoints(count) {
  if (count <= 1) return 0;
  if (count === 2) return 4;
  if (count === 3) return 8;
  if (count === 4) return 12;
  if (count === 5) return 16;
  return 20;
}

function recencyPoints(createdAt, now) {
  const created = new Date(createdAt ?? 0).getTime();
  const current = new Date(now).getTime();
  if (!Number.isFinite(created) || !Number.isFinite(current)) return 0;
  const hours = Math.max(0, (current - created) / 3_600_000);
  if (hours <= 24) return 10;
  if (hours <= 72) return 7;
  if (hours <= 168) return 4;
  if (hours <= 336) return 2;
  return 0;
}

export function bandForScore(score) {
  return PRIORITY_BANDS.find((entry) => score >= entry.min)?.band ?? 'P3';
}

/**
 * @returns {{score:number, band:string, factors:Array, verdict:string, matchedUrgency:string[]}}
 */
export function computePriority({
  category = 'other',
  title = '',
  description = '',
  clusterCount = 1,
  confirmedDuplicates = 0,
  createdAt,
  now = new Date(),
}) {
  const baseSeverity = CATEGORY_MAP[category]?.baseSeverity ?? 12;
  const urgency = urgencyPoints(normalizeText(`${title} ${description}`));
  const impact = clusterPoints(clusterCount);
  const corroboration = Math.min(10, Math.max(0, confirmedDuplicates) * 5);
  const recency = recencyPoints(createdAt, now);

  const factors = [
    {
      code: 'severity',
      label: 'Category severity',
      points: baseSeverity,
      detail: `${CATEGORY_MAP[category]?.label ?? category} has an inherent risk weight of ${baseSeverity}/40.`,
    },
    {
      code: 'urgency',
      label: 'Urgency language',
      points: urgency.points,
      detail: urgency.matched.length
        ? `Matched: ${urgency.matched.join(', ')}.${urgency.capped ? ' Capped at 20.' : ''}`
        : 'No urgent or vulnerable-location language detected.',
    },
    {
      code: 'cluster',
      label: 'Cluster impact',
      points: impact,
      detail:
        clusterCount > 1
          ? `${clusterCount} related reports within ~330 m in the last 30 days.`
          : 'No nearby cluster yet.',
    },
    {
      code: 'corroboration',
      label: 'Duplicate corroboration',
      points: corroboration,
      detail: `${confirmedDuplicates} confirmed duplicate(s) increase confidence.`,
    },
    {
      code: 'recency',
      label: 'Recency',
      points: recency,
      detail: 'Newer unresolved reports rank higher than older ones.',
    },
  ];

  const raw = factors.reduce((sum, factor) => sum + factor.points, 0);
  const score = Math.min(100, raw);

  if (raw > 100) {
    factors.push({
      code: 'cap',
      label: 'Maximum score cap',
      points: 100 - raw,
      detail: `Raw score ${raw} is capped at 100.`,
    });
  }

  const band = bandForScore(score);
  const drivers = factors
    .filter((factor) => factor.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map((factor) => `${factor.label.toLowerCase()} (+${factor.points})`);

  const verdict = `Priority ${band} (${score}/100). Main drivers: ${drivers.join(', ')}.`;

  return {
    score,
    band,
    factors,
    verdict,
    matchedUrgency: urgency.matched,
  };
}
```

**Weight table**

| Factor | Max | Source |
| --- | --- | --- |
| Category severity | 40 | `CATEGORY_MAP[category].baseSeverity` |
| Urgency language | 20 | Phrase matches in title + description |
| Cluster impact | 20 | Count in ~330 m / 30 days, including this report |
| Corroboration | 10 | Confirmed duplicates × 5 |
| Recency | 10 | ≤24 h: 10 · ≤72 h: 7 · ≤7 d: 4 · ≤14 d: 2 |
| **Total** | **100** | Clamped, with a negative `cap` factor if raw > 100 |

**Worked example** — waterlogging near a school, 5-report cluster, 2 confirmed duplicates, 6 hours old:

```text
severity 30 + urgency 13 (school 4, severe 4, overflowing 2, since last night 3)
+ impact 16 + corroboration 10 + recency 10 = 79 → P1
```

(The exact urgency sum depends on the phrase list; the UI shows the matched terms and the final arithmetic, so there is nothing to memorise.)

**Boundary tests**

| Score | Band |
| --- | --- |
| 100 | P0 |
| 80 | P0 |
| 79 | P1 |
| 60 | P1 |
| 59 | P2 |
| 40 | P2 |
| 39 | P3 |
| 0 | P3 |

### 10.8 Hotspot detection (`src/services/ai/clusters.js`)

```js
import { haversineMeters } from '@/lib/geo';
import {
  CLUSTER_CELL_SIZE, CLUSTER_MIN_REPORTS, CLUSTER_WINDOW_DAYS, CATEGORY_MAP,
} from '@/lib/constants';

const DAY_MS = 86_400_000;

export function cellKey(latitude, longitude) {
  return `${Math.floor(Number(latitude) / CLUSTER_CELL_SIZE)}:${Math.floor(Number(longitude) / CLUSTER_CELL_SIZE)}`;
}

function centroid(members) {
  const latitude = members.reduce((sum, report) => sum + Number(report.latitude), 0) / members.length;
  const longitude = members.reduce((sum, report) => sum + Number(report.longitude), 0) / members.length;
  return { latitude, longitude };
}

export function computeClusters(reports, {
  now = new Date(),
  windowDays = CLUSTER_WINDOW_DAYS,
  minReports = CLUSTER_MIN_REPORTS,
} = {}) {
  const nowMs = new Date(now).getTime();
  const cutoff = nowMs - windowDays * DAY_MS;

  const eligible = reports.filter((report) => {
    const created = new Date(report.createdAt ?? 0).getTime();
    return (
      Number.isFinite(Number(report.latitude)) &&
      Number.isFinite(Number(report.longitude)) &&
      Number.isFinite(created) &&
      created >= cutoff &&
      !['rejected', 'duplicate'].includes(report.status)
    );
  });

  const groups = new Map();
  for (const report of eligible) {
    const key = cellKey(report.latitude, report.longitude);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(report);
  }

  const clusters = [];
  for (const [key, members] of groups) {
    if (members.length < minReports) continue;

    const center = centroid(members);
    const radiusMeters = Math.max(
      30,
      ...members.map((report) => haversineMeters(center, report)),
    );

    const categories = {};
    let prioritySum = 0;
    for (const report of members) {
      categories[report.category] = (categories[report.category] || 0) + 1;
      prioritySum += report.priorityScore ?? report.ai?.priority?.score ?? 0;
    }
    const distinctCategories = Object.keys(categories).length;
    const avgPriority = Math.round(prioritySum / members.length);

    const last7 = members.filter((r) => nowMs - new Date(r.createdAt).getTime() <= 7 * DAY_MS).length;
    const prev7 = members.filter((r) => {
      const age = nowMs - new Date(r.createdAt).getTime();
      return age > 7 * DAY_MS && age <= 14 * DAY_MS;
    }).length;
    const trend = last7 > prev7 ? 'rising' : last7 < prev7 ? 'falling' : 'steady';

    const hotspotScore = Math.round(
      40 * Math.min(members.length / 6, 1) +
      20 * Math.min(distinctCategories / 3, 1) +
      40 * (avgPriority / 100),
    );

    const labelCounts = {};
    for (const report of members) {
      if (report.locationLabel) labelCounts[report.locationLabel] = (labelCounts[report.locationLabel] || 0) + 1;
    }
    const label = Object.entries(labelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? `Grid ${key}`;

    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'other';

    clusters.push({
      id: `cluster-${key.replace(':', '-')}`,
      key,
      label,
      latitude: center.latitude,
      longitude: center.longitude,
      count: members.length,
      categories,
      distinctCategories,
      topCategory,
      topCategoryLabel: CATEGORY_MAP[topCategory]?.label ?? topCategory,
      avgPriority,
      hotspotScore,
      radiusMeters: Math.round(radiusMeters),
      trend,
      firstSeen: members.map((r) => r.createdAt).sort()[0],
      lastSeen: members.map((r) => r.createdAt).sort().at(-1),
      members: [...members].sort((a, b) =>
        (b.priorityScore ?? 0) - (a.priorityScore ?? 0)),
    });
  }

  return clusters.sort((a, b) => b.hotspotScore - a.hotspotScore);
}

export function findClusterForReport(report, clusters) {
  return clusters.find((cluster) => cluster.members.some((member) => member.id === report.id)) ?? null;
}
```

**Grid geometry**

- `0.003°` latitude ≈ 333 m; at 12.97° latitude, `0.003°` longitude ≈ 325 m.
- Cells are aligned to the equator, so the same coordinate always lands in the same cell.
- A cell is a square, not a radius; `radiusMeters` reports the actual spread of members.
- **Known artefact:** two reports 20 m apart can fall into different cells. The dashboard shows a note: *"Hotspots use ~330 m grid cells; boundary splits are possible."* A production system would use PostGIS `ST_ClusterDBSCAN`.

**Hotspot score**

```text
40 × min(count / 6, 1) + 20 × min(distinctCategories / 3, 1) + 40 × (avgPriority / 100)
```

This rewards volume, diversity (a drain + road + water pattern is more meaningful than five identical bins) and severity.

### 10.9 Action brief (`src/services/ai/brief.js`)

```js
import { CATEGORY_MAP } from '@/lib/constants';

const OWNER_BY_CATEGORY = {
  water: 'Drainage Cell',
  roads: 'Public Works',
  waste: 'Sanitation',
  electricity: 'Electrical',
  sanitation: 'Public Health',
  public_safety: 'Public Safety',
  other: 'Ward Office',
};

export function buildActionBrief(cluster) {
  if (!cluster) return null;

  const categorySummary = Object.entries(cluster.categories)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => `${CATEGORY_MAP[key]?.label ?? key} (${count})`)
    .join(', ');

  const topReports = cluster.members.slice(0, 3);
  const urgent = cluster.members.filter((r) => ['P0', 'P1'].includes(r.priorityBand)).length;
  const owner = OWNER_BY_CATEGORY[cluster.topCategory] ?? 'Ward Office';

  return {
    title: `Action brief — ${cluster.label}`,
    location: `${cluster.label} (${cluster.latitude.toFixed(4)}, ${cluster.longitude.toFixed(4)})`,
    pattern: `${cluster.count} reports in the last 30 days within ~${cluster.radiusMeters} m, spanning ${categorySummary}.`,
    risk: `${urgent} high-priority report(s); average priority ${cluster.avgPriority}/100; trend ${cluster.trend}.`,
    owner,
    action: `Inspect ${cluster.topCategoryLabel.toLowerCase()} infrastructure at ${cluster.label} within 24 hours, clear the immediate hazard, and confirm whether the reports share one root cause.`,
    evidence: topReports.map((r) => `${r.referenceCode} — ${r.title || r.description.slice(0, 60)}`),
    confidence: cluster.count >= 5 ? 'Medium-high (grid cluster, synthetic data)' : 'Medium (small cluster)',
    mocked: 'No work order has been dispatched. This brief is a recommendation only.',
  };
}
```

The brief is **template-generated from real cluster fields**. It cannot invent a location, count or owner outside the data. A future LLM adapter may rewrite the prose, but the structured facts stay authoritative.

### 10.10 Orchestration (`src/services/ai/pipeline.js`)

```js
import { AI_VERSION } from '@/lib/constants';
import { classifyReport } from './classify';
import { summarizeReport } from './summarize';
import { findDuplicateCandidates } from './duplicates';
import { computeClusters, findClusterForReport } from './clusters';
import { computePriority } from './priority';

/**
 * @param {import('@/types').Report} report
 * @param {import('@/types').Report[]} corpus  reports excluding `report`
 */
export function analyzeReport(report, corpus = [], { now = new Date() } = {}) {
  const started = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const classification = classifyReport(report);
  const summary = summarizeReport({
    title: report.title ?? '',
    description: report.description ?? '',
    category: classification.category,
  });

  const duplicates = findDuplicateCandidates(report, corpus, { now });

  const allReports = [...corpus.filter((item) => item.id !== report.id), report];
  const clusters = computeClusters(allReports, { now });
  const cluster = findClusterForReport(report, clusters);

  const confirmedDuplicates = corpus.filter(
    (item) => item.duplicateOf === report.id && item.duplicateConfirmed,
  ).length;

  const priority = computePriority({
    category: classification.category,
    title: report.title ?? '',
    description: report.description ?? '',
    clusterCount: cluster?.count ?? 1,
    confirmedDuplicates,
    createdAt: report.createdAt,
    now,
  });

  const ended = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    version: AI_VERSION,
    category: classification.category,
    confidence: classification.confidence,
    lowConfidence: classification.lowConfidence,
    alternatives: classification.alternatives,
    matchedTerms: classification.matches,
    summary,
    duplicates,
    priority,
    cluster: cluster
      ? {
          key: cluster.key,
          id: cluster.id,
          label: cluster.label,
          count: cluster.count,
          categories: cluster.categories,
          avgPriority: cluster.avgPriority,
          hotspotScore: cluster.hotspotScore,
          radiusMeters: cluster.radiusMeters,
          trend: cluster.trend,
        }
      : null,
    processingMs: Math.max(1, Math.round(ended - started)),
    processedAt: new Date(now).toISOString(),
    deterministic: true,
  };
}
```

**Category used for scoring:** the AI's classification, not the citizen's dropdown. The citizen's choice is preserved as `report.category`; the AI's choice is `report.ai.category`. If they differ, the analysis page shows both and the operator can override. This prevents a user from downgrading a live-wire report by picking "Other".

### 10.11 Explainability payload example

```json
{
  "version": "rules-v1",
  "category": "water",
  "confidence": 0.98,
  "lowConfidence": false,
  "alternatives": [
    { "category": "water", "score": 10, "confidence": 0.98 },
    { "category": "roads", "score": 0, "confidence": 0 },
    { "category": "waste", "score": 0, "confidence": 0 }
  ],
  "summary": "The storm drain outside Sunrise School has been overflowing since last night. Water is knee deep on the footpath and children are walking through it.",
  "duplicates": [
    {
      "reportId": "…",
      "referenceCode": "CP-4Q8M2A",
      "score": 0.791,
      "level": "review",
      "components": { "text": 0.71, "category": 1, "geo": 0.733, "time": 0.905 },
      "distanceMeters": 80,
      "ageDays": 2,
      "reasons": ["Shared wording (71% text similarity)", "Same category", "Only 80 m apart", "Reported 2 day(s) apart"]
    }
  ],
  "priority": {
    "score": 79,
    "band": "P1",
    "factors": [
      { "code": "severity", "label": "Category severity", "points": 30, "detail": "Water & Drainage has an inherent risk weight of 30/40." },
      { "code": "urgency", "label": "Urgency language", "points": 13, "detail": "Matched: school, severe, overflowing, since last night." },
      { "code": "cluster", "label": "Cluster impact", "points": 16, "detail": "5 related reports within ~330 m in the last 30 days." },
      { "code": "corroboration", "label": "Duplicate corroboration", "points": 10, "detail": "2 confirmed duplicate(s) increase confidence." },
      { "code": "recency", "label": "Recency", "points": 10, "detail": "Newer unresolved reports rank higher than older ones." }
    ],
    "verdict": "Priority P1 (79/100). Main drivers: category severity (+30), cluster impact (+16), urgency language (+13)."
  },
  "cluster": {
    "key": "4323:25865",
    "label": "4th Cross, Sector 12",
    "count": 5,
    "categories": { "water": 3, "roads": 2 },
    "avgPriority": 71,
    "hotspotScore": 78,
    "radiusMeters": 168,
    "trend": "rising"
  },
  "processingMs": 14,
  "processedAt": "2026-10-30T09:12:00.000Z",
  "deterministic": true
}
```

### 10.12 Performance and determinism

| Concern | Approach |
| --- | --- |
| Corpus size | Rebuild TF-IDF on every analysis; O(n × tokens). 42 reports ≈ 2–15 ms; 500 reports < 150 ms |
| Cluster recomputation | O(n) per analysis; dashboard O(n) once per load |
| Determinism | Injected `now`; stable sorts with explicit tie-breakers; no randomness except reference code (not part of AI) |
| Memory | All in-memory; no large matrices |
| Repeated analysis | Not cached in MVP; 15 ms is cheaper than cache invalidation |
| Clock | `now` passed from the caller; tests freeze it |

**Benchmark target:** 500 reports, 100-token descriptions, 100 analyses < 2 s total on a 2020 laptop. If exceeded, precompute the IDF index once per repository load and pass it into `findDuplicateCandidates`.

### 10.13 Failure modes

| Failure | Behaviour |
| --- | --- |
| Empty description | Validation blocks submission; pipeline never sees it |
| Description with no lexicon hits | Category `other` (0.25), low-confidence badge |
| No coordinates | Validation blocks; pipeline requires lat/lng |
| Corpus empty | No duplicates, no cluster; priority still computed |
| Invalid date | Recency 0; report still analysed |
| Unicode/emoji only | Normalises to empty tokens; `other` + low confidence |
| Very long description | Validation caps at 1,000 chars; summariser truncates |
| Duplicate candidate self-match | Filtered by `id !== report.id` |
| Circular duplicate links | Prevented by directional merge + `duplicate` status exclusion + DB check |

### 10.14 Optional LLM adapter (off by default)

Interface:

```js
// src/services/ai/llmAdapter.js
export async function enhanceWithLlm(analysis, { signal } = {}) {
  if (!LLM_ENABLED || !AI_PROXY_URL) return analysis; // no-op
  const response = await fetch(AI_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task: 'rewrite_summary',
      summary: analysis.summary,
      category: analysis.category,
      constraints: 'Do not add facts, locations, causes or numbers.',
    }),
    signal,
  });
  if (!response.ok) return analysis; // fail open to deterministic output
  const data = await response.json();
  return { ...analysis, summary: data.summary || analysis.summary, llmAssisted: true };
}
```

Guardrails:

- Never send names, phone numbers or precise addresses; only the description and category.
- Timeout 4 s; on any failure keep the deterministic summary.
- UI labels LLM output `LLM-assisted` and still shows the extractive summary in a details block.
- No provider key in the browser. The proxy is a Supabase Edge Function.
- Default `VITE_AI_LLM_ENABLED=false`, so the demo does not depend on it.

---

## 11. Frontend architecture

### 11.1 Layers

```text
app/            Router, providers, error boundary
pages/          Route-level composition; data fetching via hooks
components/     Presentational + composite UI
hooks/          Data + UI state, repository calls
services/       Adapters and AI pipeline
lib/            Constants, formatting, geo, validation, env
data/           Synthetic seed
types/          JSDoc typedefs only (no runtime code)
```

Add `src/types/index.js` containing the JSDoc typedefs from §9.1 and `export {};` so editors resolve `import('@/types')`.

### 11.2 Providers (`src/app/providers.jsx`)

```jsx
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DATA_MODE, IS_LOCAL_MODE } from '@/lib/env';

const ToastContext = createContext(null);
const DataModeContext = createContext({ mode: DATA_MODE, isLocal: IS_LOCAL_MODE });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, tone: 'info', ...toast }]);
    window.setTimeout(() => dismiss(id), toast.duration ?? 4000);
  }, [dismiss]);

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

export function useDataMode() {
  return useContext(DataModeContext);
}
```

`useToast` lives in `src/hooks/useToast.js` and re-exports the context hook to keep imports consistent:

```js
export { useToast } from '@/app/providers';
```

### 11.3 Data hooks

`src/hooks/useReports.js`:

```js
import { useCallback, useEffect, useRef, useState } from 'react';
import { reportsRepository } from '@/services';

export function useReports(filters = {}) {
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const key = JSON.stringify(filters);

  const [state, setState] = useState({ data: [], loading: true, error: null });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await reportsRepository.listReports(filtersRef.current);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: [], loading: false, error });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, key]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener('civicpulse:data-changed', handler);
    return () => window.removeEventListener('civicpulse:data-changed', handler);
  }, [load]);

  return { ...state, reload: load };
}
```

`useReport(id)` fetches one report + public events; `useClusters()` calls `reportsRepository.listClusters()` and exposes `{clusters, loading, error, reload}`.

**Rules**

- Hooks never render UI.
- Pages own loading/empty/error rendering.
- A mutation calls `reload()` from the relevant hook after success.
- No hook writes to localStorage directly; only the repository does.

### 11.4 Layout composition

```jsx
// AppLayout
<div className="min-h-dvh bg-mist">
  <Header />
  <main id="main" className="pb-16">
    <Outlet />
  </main>
  <Footer />
  <ToastViewport />
</div>
```

- `Header`: sticky top, white/95 backdrop blur, border-b; logo + desktop nav + CTA; mobile hamburger opens `MobileNav` drawer.
- `Footer`: navy-950, 4 columns on desktop, stacked on mobile; contains data-mode badge, reset-demo button (local only), honesty link.
- `AdminLayout`: navy sidebar on `lg`, top bar on mobile with menu; `<Outlet />` in the content area; "Back to site" link.
- `Container`: `container-page` wrapper.
- `PageHeader`: eyebrow, title, description, actions slot.

**Skip link:** first focusable element is `<a href="#main" className="sr-only focus:not-sr-only ...">Skip to content</a>`.

### 11.5 Component inventory and responsibilities

| Component | Props (essential) | Responsibility |
| --- | --- | --- |
| `Button` | `variant`, `size`, `loading`, `icon`, `as` | Styling + loading spinner; `as={Link}` support |
| `Card` | `as`, `className`, `children` | Surface only |
| `Badge` | `tone`, `children` | Generic pill |
| `PriorityBadge` | `band`, `score?`, `size` | "P1 · High" with dot/icon |
| `StatusBadge` | `status`, `citizen?` | Status label + dot |
| `StatCard` | `label`, `value`, `hint`, `icon`, `loading` | KPI tile |
| `EmptyState` | `icon`, `title`, `description`, `action` | No-data state |
| `Skeleton` | `className` | Loading block |
| `Modal` | `open`, `onClose`, `title`, `children`, `footer` | Accessible dialog (focus trap, ESC) |
| `Toast` | `toast`, `onDismiss` | Tone + message + close |
| `Field` | `label`, `error`, `hint`, `required`, `children` | Label/error wiring |
| `Tabs` | `tabs`, `value`, `onChange` | ARIA tablist |
| `Timeline` | `events`, `citizen?` | Vertical event history |
| `HonestyNote` | `children`, `tone` | Info/warning panel |
| `MapView` | `reports`, `clusters`, `height`, `onSelect` | Markers + circles + legend |
| `LocationPicker` | `value`, `onChange` | Click/drag pin |
| `ChartCard` | `title`, `subtitle`, `children` | Chart frame + empty state |
| `ReportCard` | `report`, `href` | Mobile queue card |
| `ReportTable` | `reports`, `onSelect` | Desktop table |
| `PriorityFactors` | `factors`, `score`, `band` | Factor table + verdict |
| `DuplicateList` | `candidates`, `onOpen` | Score bars + reasons |
| `HotspotCard` | `cluster`, `onBrief` | Cluster summary |

### 11.6 Loading, empty and error states

| View | Loading | Empty | Error |
| --- | --- | --- | --- |
| Home stats | 4 skeleton cards | Em dash + "Sample data unavailable" | Retry link, rest of page renders |
| Report submit | Button spinner + disabled | n/a | Inline banner; form values preserved |
| Analysis detail | Skeleton header + cards | "Report not found" + code lookup | Retry + back to dashboard |
| Dashboard | Skeleton KPIs/map/charts | "No reports match these filters" + clear filters | Error card with retry |
| Admin queue | Table skeleton rows | "Queue is clear" | Error card + retry |
| Track | Timeline skeleton | "No updates yet — report received" | Retry |
| Unknown code | n/a | "We couldn't find that code" + report link | n/a |

### 11.7 Forms and validation (`src/lib/validation.js`)

```js
export const REPORT_LIMITS = {
  descriptionMin: 20,
  descriptionMax: 1000,
  titleMax: 80,
  imageBytes: 5 * 1024 * 1024,
};

export function validateReport(input) {
  const errors = {};

  const description = (input.description || '').trim();
  if (description.length < REPORT_LIMITS.descriptionMin) {
    errors.description = `Please add at least ${REPORT_LIMITS.descriptionMin} characters.`;
  } else if (description.length > REPORT_LIMITS.descriptionMax) {
    errors.description = `Please keep it under ${REPORT_LIMITS.descriptionMax} characters.`;
  }

  if (!input.category) errors.category = 'Choose a category or use auto-detect.';

  const lat = Number(input.latitude);
  const lng = Number(input.longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    errors.latitude = 'Pick a location on the map.';
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    errors.longitude = 'Pick a location on the map.';
  }

  if (input.imageFile && input.imageFile.size > REPORT_LIMITS.imageBytes) {
    errors.image = 'Image must be 5 MB or smaller.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
```

**Form behaviour**

- Validate on submit and on blur of touched fields; never block typing.
- Focus the first invalid field on failed submit.
- `aria-invalid` and `aria-describedby` on every field with an error.
- Submit button disabled only while submitting, not while invalid (so users can discover errors).

### 11.8 Status transition guard

```js
import { ALLOWED_TRANSITIONS } from '@/lib/constants';

export function canTransition(from, to) {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

export function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    throw new Error(`Cannot move a report from ${from} to ${to}.`);
  }
}
```

The admin UI disables invalid options and the page calls `assertTransition` before `updateReport`. The database does not enforce transitions (documented trade-off); the service layer is the guard.

### 11.9 Page-to-service map

| Page | Reads | Writes |
| --- | --- | --- |
| Home | `listReports`, `listClusters` | — |
| Report Issue | `listReports` (duplicate pre-check), AI classify | `createReport` |
| Analysis overview | `listReports` | — |
| Analysis detail | `getReportById`, `listEvents` | re-analyse (admin) |
| Dashboard | `listReports`, `listClusters` | — |
| Admin | `listReports`, `listDuplicatePairs`, `listClusters` | `updateReport`, `reviewDuplicate` |
| Track lookup | `getReportByCode` | — |
| Track detail | `getReportByCode`, `listEvents({publicOnly:true})` | — |

---

## 12. Map, charts and forms

### 12.1 Leaflet setup rules

1. Import `leaflet/dist/leaflet.css` **once** in `main.jsx`.
2. Never use the default marker image; it breaks under Vite's asset hashing. Use `L.divIcon` with a CSS class.
3. Every `MapContainer` needs an explicit height (`h-[320px]`, `h-[480px]`).
4. Wrap in a container with `relative z-0` so Leaflet's panes do not cover the sticky header.
5. Tiles: OpenStreetMap standard tiles with attribution. This is a real public service, not a fake API; low-volume demo use only. If offline, the map still renders markers over a grey background.
6. Always provide a list alternative for keyboard/screen-reader users.

### 12.2 `MapView.jsx` reference

```jsx
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { DEMO_CENTER } from '@/lib/env';
import { CATEGORY_MAP } from '@/lib/constants';

const iconCache = new Map();

function pinIcon(band = 'P3') {
  if (!iconCache.has(band)) {
    iconCache.set(band, L.divIcon({
      className: '',
      html: `<span class="cp-map-pin cp-map-pin--${band}"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -10],
    }));
  }
  return iconCache.get(band);
}

export default function MapView({ reports = [], clusters = [], height = 420, center, zoom = 14 }) {
  return (
    <div className="relative z-0 overflow-hidden rounded-2xl border border-slate-200" style={{ height }}>
      <MapContainer
        center={center ?? [DEMO_CENTER.lat, DEMO_CENTER.lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {clusters.map((cluster) => (
          <Circle
            key={cluster.id}
            center={[cluster.latitude, cluster.longitude]}
            radius={Math.max(cluster.radiusMeters, 60)}
            pathOptions={{ color: '#0FB5A6', weight: 2, fillColor: '#0FB5A6', fillOpacity: 0.12 }}
          >
            <Popup>
              <strong>{cluster.label}</strong>
              <br />
              {cluster.count} reports · hotspot {cluster.hotspotScore}/100
              <br />
              <Link to={`/dashboard?cluster=${cluster.key}`}>View brief</Link>
            </Popup>
          </Circle>
        ))}

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[Number(report.latitude), Number(report.longitude)]}
            icon={pinIcon(report.priorityBand)}
          >
            <Popup>
              <strong>{report.referenceCode}</strong>
              <br />
              {CATEGORY_MAP[report.category]?.label ?? report.category}
              <br />
              {report.priorityBand ?? 'Unscored'} · {report.status}
              <br />
              <Link to={`/analysis/${report.id}`}>Open analysis</Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
```

### 12.3 Location picker

```jsx
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { DEMO_CENTER } from '@/lib/env';

const pin = L.divIcon({
  className: '',
  html: '<span class="cp-map-pin cp-map-pin--P1"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function ClickToPick({ onPick }) {
  useMapEvents({
    click(event) {
      onPick({ lat: Number(event.latlng.lat.toFixed(6)), lng: Number(event.latlng.lng.toFixed(6)) });
    },
  });
  return null;
}

export default function LocationPicker({ value, onChange, height = 280 }) {
  const center = value ? [value.lat, value.lng] : [DEMO_CENTER.lat, DEMO_CENTER.lng];
  return (
    <div className="relative z-0 overflow-hidden rounded-xl border border-slate-300" style={{ height }}>
      <MapContainer center={center} zoom={15} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPick onPick={onChange} />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={pin}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const { lat, lng } = event.target.getLatLng();
                onChange({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
              },
            }}
          />
        )}
      </MapContainer>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-navy-900/80 px-3 py-1.5 text-[11px] text-white">
        Tap the map to place the pin · drag to adjust
      </div>
    </div>
  );
}
```

### 12.4 Charts (Recharts)

```jsx
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function CategoryBarChart({ data }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={56} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#CBD5E1', fontSize: 12 }} />
          <Bar dataKey="count" fill="#0FB5A6" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Rules**

- Always wrap in `ResponsiveContainer` with a fixed-height parent.
- No animation in the demo (`isAnimationActive={false}`) to avoid screenshot timing issues.
- Provide a text summary above the chart (`aria-label` + visually hidden table) for accessibility.
- Empty data: render `EmptyState`, never a chart with zero bars.

### 12.5 Report form state machine

```text
idle → editing → suggesting (optional) → validating → submitting → success
                                                    └──► error (form preserved)
```

- `suggesting` disables only the "Suggest category" button.
- `submitting` disables the submit button and shows "Analysing…".
- On success, navigate to `/analysis/:id` with `state: { justSubmitted: true }`.
- On error, keep every field and the map pin.

---

## 13. Security and privacy

### 13.1 Trust boundaries

| Boundary | Trust |
| --- | --- |
| Browser | Untrusted. All `VITE_*` values are public. |
| Supabase anon key | Public but constrained by RLS. |
| Supabase service role key | Never in the browser, never in the repo. |
| AI output in `reports.ai` | Client-generated in this prototype; not a security boundary. |
| Image bucket | Public read in the prototype; documented. |

### 13.2 Controls

| Risk | Control |
| --- | --- |
| Privilege escalation | RLS + `is_staff()` checks role from `profiles`; client-side route guards are UX only |
| PII exposure | PII only in `report_contacts`; reports table is public but contains no name/phone |
| XSS | React escapes by default; no `dangerouslySetInnerHTML`; user text rendered as text |
| Malicious upload | MIME allowlist, 5 MB cap, reject SVG, downscale before upload |
| CSV injection | Prefix cells starting with `= + - @` with `'` in export |
| Tracking code enumeration | 6 chars from 32-symbol alphabet ≈ 1.07 billion combinations; acceptable for demo, rate limiting noted as future work |
| Brute-force writes | Supabase rate limits + optional CAPTCHA post-hackathon; not implemented |
| Secret leakage | `.env.local` ignored; no provider keys in client |
| Open redirect | No redirect parameters are followed |

### 13.3 Auth strategy

- **Local mode:** no auth. A demo operator identity is shown as "Demo Operator" with a `DEMO` badge.
- **Supabase mode:** anonymous sign-in for citizens (`supabase.auth.signInAnonymously()`), magic link for operators. Role lives in `profiles.role`.
- Admin route guard:

```jsx
const { data } = await supabase.auth.getUser();
const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
if (!['operator', 'admin'].includes(profile?.role)) return <Navigate to="/" replace />;
```

If anonymous sign-in is disabled in the Supabase project, the app falls back to local mode with a visible notice. It does not silently fail.

### 13.4 Privacy statement (shown in the app)

> This is a prototype using synthetic data. Do not submit real personal information. Reports are stored in your browser in demo mode, or in the configured Supabase project in connected mode. Photos are stored as evidence and are not analysed.

---

## 14. Performance

### 14.1 Budgets

| Metric | Budget | Measurement |
| --- | --- | --- |
| Initial JS (gzip) | ≤ 350 KB | `npm run build` output |
| Route interaction | ≤ 200 ms | Manual |
| AI analysis (42 reports) | ≤ 50 ms | `ai.processingMs` |
| AI analysis (500 reports) | ≤ 300 ms | Synthetic benchmark |
| Dashboard first render | ≤ 1.5 s after data | Performance panel |
| Layout shift | CLS < 0.1 | Lighthouse |
| Map tiles | Lazy visual load; markers render without tiles | Offline test |

### 14.2 Tactics

- Direct imports for the six pages in the MVP; if the bundle exceeds 350 KB, switch `Dashboard`, `Admin`, `AnalysisDetail` to `React.lazy` with a skeleton fallback.
- Leaflet and Recharts are the heaviest dependencies; keep them out of the Home/Report critical path if code splitting is added.
- Memoise expensive derived arrays (`useMemo`) in dashboard components.
- Do not recompute clusters per marker; compute once per data load.
- Avoid loading all events for the dashboard; only the detail and tracking pages need events.
- Images: lazy `loading="lazy"`, fixed aspect ratio to prevent CLS.

### 14.3 Offline behaviour

- Local mode works fully offline after the bundle is cached, except OSM tiles and Google Fonts (both degrade gracefully).
- No service worker in the MVP; document that a refresh requires the dev server or hosted page.

---

## 15. Testing

### 15.1 Unit tests for AI (`src/services/ai/__tests__/ai.test.js`)

```js
import { describe, it, expect } from 'vitest';
import { analyzeReport } from '@/services/ai/pipeline';
import { bandForScore, computePriority } from '@/services/ai/priority';
import { computeClusters } from '@/services/ai/clusters';
import { classifyReport } from '@/services/ai/classify';
import { summarizeReport } from '@/services/ai/summarize';

const NOW = new Date('2026-10-30T09:00:00.000Z');

function report(overrides = {}) {
  return {
    id: 'r1',
    referenceCode: 'CP-TEST01',
    title: 'Drain overflowing near school',
    description:
      'The storm drain outside Sunrise School has been overflowing since last night. Water is knee deep and children walk through it.',
    category: 'water',
    latitude: 12.9716,
    longitude: 77.5946,
    status: 'submitted',
    priorityScore: null,
    priorityBand: null,
    createdAt: '2026-10-30T03:00:00.000Z',
    ...overrides,
  };
}

describe('classification', () => {
  it('detects water and drainage', () => {
    const result = classifyReport(report());
    expect(result.category).toBe('water');
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it('falls back to other with low confidence', () => {
    const result = classifyReport({ title: '', description: 'zxqv blorf' });
    expect(result.category).toBe('other');
    expect(result.lowConfidence).toBe(true);
  });
});

describe('priority', () => {
  it('uses the documented band boundaries', () => {
    expect(bandForScore(100)).toBe('P0');
    expect(bandForScore(80)).toBe('P0');
    expect(bandForScore(79)).toBe('P1');
    expect(bandForScore(60)).toBe('P1');
    expect(bandForScore(59)).toBe('P2');
    expect(bandForScore(40)).toBe('P2');
    expect(bandForScore(39)).toBe('P3');
  });

  it('factor points sum to the score', () => {
    const result = computePriority({
      category: 'public_safety',
      title: 'Live wire',
      description: 'Live wire hanging near the school bus stop, sparking at night.',
      clusterCount: 4,
      confirmedDuplicates: 1,
      createdAt: '2026-10-30T08:00:00.000Z',
      now: NOW,
    });
    const sum = result.factors.reduce((total, factor) => total + factor.points, 0);
    expect(sum).toBe(result.score);
    expect(result.band).toBe('P0');
  });
});

describe('duplicates', () => {
  it('scores an identical nearby report as strong', () => {
    const target = report();
    const candidate = report({
      id: 'r2',
      referenceCode: 'CP-TEST02',
      createdAt: '2026-10-30T05:00:00.000Z',
    });
    const result = analyzeReport(target, [candidate], { now: NOW });
    expect(result.duplicates[0].level).toBe('strong');
    expect(result.duplicates[0].components.text).toBeGreaterThan(0.9);
  });

  it('does not match a distant report', () => {
    const target = report();
    const candidate = report({
      id: 'r3',
      referenceCode: 'CP-TEST03',
      latitude: 13.05,
      longitude: 77.7,
      createdAt: '2026-10-29T05:00:00.000Z',
    });
    const result = analyzeReport(target, [candidate], { now: NOW });
    expect(result.duplicates).toHaveLength(0);
  });
});

describe('clusters', () => {
  it('finds three reports in one grid cell', () => {
    const reports = [
      report({ id: 'a', createdAt: '2026-10-29T08:00:00.000Z' }),
      report({ id: 'b', latitude: 12.9717, longitude: 77.5947, createdAt: '2026-10-28T08:00:00.000Z' }),
      report({ id: 'c', latitude: 12.9718, longitude: 77.5948, createdAt: '2026-10-27T08:00:00.000Z' }),
    ];
    const clusters = computeClusters(reports, { now: NOW });
    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(3);
    expect(clusters[0].hotspotScore).toBeGreaterThan(0);
  });
});

describe('summary and determinism', () => {
  it('keeps summaries under 220 characters', () => {
    const summary = summarizeReport({ ...report(), category: 'water' });
    expect(summary.length).toBeLessThanOrEqual(220);
  });

  it('returns identical output for identical input', () => {
    const a = analyzeReport(report(), [], { now: NOW });
    const b = analyzeReport(report(), [], { now: NOW });
    expect({ ...a, processingMs: 0 }).toEqual({ ...b, processingMs: 0 });
  });
});
```

### 15.2 Seed evaluation (manual + scripted)

A small script (`scripts/evaluate-seed.mjs`) imports the seed, runs `analyzeReport` over each report, and prints:

- duplicate groups recovered / 8,
- P0 reports in the top 5 by score,
- clusters found (expect 2),
- low-confidence count.

Acceptance: ≥6/8 duplicate groups surfaced, 3/3 P0 in top 5, 2 clusters.

### 15.3 Manual QA matrix

| Area | Checks |
| --- | --- |
| Navigation | All six routes reachable desktop + mobile; active state; 404; browser back |
| Report form | Empty submit errors; 20-char boundary; map tap; drag; image >5 MB rejected; success navigation; refresh draft |
| AI detail | Unknown id; low confidence; no cluster; duplicate bars; factor sum; copy summary |
| Dashboard | Filters compose; empty result; map legend; cluster popup; brief opens; charts resize |
| Admin | Sort; filter; assign; valid/invalid transitions; confirm duplicate; reject duplicate; resolve requires note |
| Track | Case-insensitive code; invalid code; public-only events; internal note hidden |
| Responsive | 360, 390, 768, 1024, 1366; no horizontal scroll; tables become cards |
| A11y | Keyboard-only citizen flow; focus visible; ESC closes modal; screen-reader labels |
| Honesty | Demo banner; photo disclaimer; brief "MOCKED" note; README matches UI |
| Console | No errors on any route; no 404 for assets |

### 15.4 What is not tested

No E2E framework (Playwright/Cypress) in the 8-hour scope. No load testing. No penetration testing. These are named in the limitations note.

---

## 16. Build, deployment and operations

### 16.1 Build

```bash
npm run build
```

Output: `dist/`. Verify locally:

```bash
npm run preview
```

### 16.2 Vercel

1. Import the repository.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add environment variables from `.env.example`.
6. Deploy.

SPA fallback is automatic on Vercel for Vite. If a deep link 404s, add `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 16.3 Netlify

`netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 16.4 Supabase setup checklist

1. Create a project; copy URL + anon key into `.env.local`.
2. Run `supabase/schema.sql` in the SQL editor.
3. Enable **Anonymous sign-ins** (Authentication → Providers) for the demo citizen flow.
4. Create an operator user (email magic link) and set `profiles.role = 'operator'` manually.
5. Confirm the `report-images` bucket exists and is public.
6. Seed data: either run the app once in local mode and use the JSON export, or run `scripts/seed-supabase.mjs` with a **service role key in a local, non-`VITE_` variable**.
7. Set `VITE_DATA_MODE=supabase` and restart Vite (env changes require a restart).

### 16.5 Observability

- Dev-only logger (`src/lib/logger.js`) prints AI version, latency and errors.
- No analytics, no Sentry, no PII logging.
- The UI shows `processingMs` and `ai.version` so the demo can speak to performance honestly.
- Errors surface as user-friendly toasts plus a console error in dev.

### 16.6 Rollback

Local mode is the fallback: set `VITE_DATA_MODE=local`, restart, demo continues with seeded data. This is rehearsed before the demo.

---

## 17. Coding standards

| Rule | Detail |
| --- | --- |
| Modules | ESM, named exports except page components (default) |
| Imports | Absolute `@/…`; no `../../../` chains |
| Components | Function components, props destructured, no class components |
| State | Local first; context only for toasts and mode; no global store |
| Side effects | Only in hooks/services; components stay render-pure |
| Naming | `PascalCase` components, `camelCase` functions/vars, `SCREAMING_SNAKE` constants |
| Files | One component per file; filename matches default export |
| Async | `async/await`, try/catch at hook/page boundary, no floating promises |
| Dates | ISO strings in data; format at the edge with `Intl.DateTimeFormat` |
| Numbers | Round only at display; keep full precision in AI components until the final object |
| Comments | Explain *why*, not *what*; tag heuristics with the PRD section |
| Accessibility | Every icon-only control has `aria-label`; every input has a label |
| Honesty | Any mocked behaviour gets a `MOCKED` label and a README entry |
| Forbidden | `dangerouslySetInnerHTML`, service role key, `fetch` to invented endpoints, `alert()` |

### 17.1 Formatting helpers (`src/lib/format.js`)

```js
export const nowIso = () => new Date().toISOString();

export const clone = (value) =>
  typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));

export function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

export function timeAgo(value) {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} d ago`;
}

export function formatCoord(lat, lng) {
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
}
```

### 17.2 Geo helper (`src/lib/geo.js`)

```js
const EARTH_RADIUS_M = 6_371_000;
const toRadians = (degrees) => (degrees * Math.PI) / 180;

export function haversineMeters(a, b) {
  const lat1 = toRadians(Number(a.latitude ?? a.lat));
  const lat2 = toRadians(Number(b.latitude ?? b.lat));
  const dLat = lat2 - lat1;
  const dLng = toRadians(Number(b.longitude ?? b.lng) - Number(a.longitude ?? a.lng));
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isWithinBounds(lat, lng, bounds) {
  return lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng;
}
```

---

## 18. Definition of done

### 18.1 Build and quality gates

- [ ] `npm install` completes without errors.
- [ ] `npm run dev` starts on port 5173 with zero console errors.
- [ ] `npm run build` succeeds; `npm run preview` serves the app.
- [ ] `npm run test` passes all AI tests.
- [ ] `npm run lint` passes (warnings acceptable only for fast-refresh exports).
- [ ] No unused dependencies; no `console.log` outside `lib/logger.js`.

### 18.2 Product gates

- [ ] All six routes render and navigate.
- [ ] Report submission persists and returns `CP-XXXXXX`.
- [ ] AI detail shows category, confidence, summary, duplicates, priority factors, cluster.
- [ ] Dashboard shows KPIs, map, charts, two seeded hotspots, action brief.
- [ ] Admin can assign, change status, confirm duplicate, resolve with note.
- [ ] Tracking page reflects the full public timeline.
- [ ] Mobile layout verified at 360 px.
- [ ] Demo mode / Supabase mode banner is accurate.
- [ ] Honesty labels present: demo data, photo not analysed, mocked dispatch.
- [ ] README contains setup, architecture, AI approach, limitations.
- [ ] Demo runs in under 5 minutes with no network.

### 18.3 Final 20-minute checklist

1. Reset demo data; reload.
2. Run the exact demo script once with a timer.
3. Check the browser console after every route.
4. Test the tracking code from the run.
5. Switch to airplane mode and repeat the core flow (tiles may be grey).
6. Confirm `npm run build` still passes.
7. Commit and tag `v0.1.0-hackathon`.

---

## 19. Known limitations

1. **Classification is keyword-based.** It misses sarcasm, code-mixed language and novel issue types. Confidence is a ratio of lexicon scores, not a calibrated probability.
2. **Duplicate detection uses lexical overlap.** Paraphrases with no shared words ("road is flooded" vs "water on carriageway") can be missed. Thresholds are tuned on 42 synthetic reports.
3. **Priority weights are expert guesses.** They are not learned from resolution outcomes and can be swayed by dramatic wording. Operators can override with a reason.
4. **Grid clustering is approximate.** Cell-boundary splits and dense-area over-merging are possible. No DBSCAN/PostGIS.
5. **AI runs in the browser.** A determined user can tamper with the stored `ai` JSON. The prototype is not a trusted audit system.
6. **No image analysis.** Photos are evidence only.
7. **No real notifications.** SMS/email/WhatsApp and department dispatch are mocked and labelled.
8. **Public report reads.** The prototype exposes report rows for the demo dashboard; PII is isolated but this is not production-safe.
9. **No E2E tests, load tests or penetration tests.** Manual QA only.
10. **No offline tile cache.** The map degrades to a grey canvas without network; markers and lists still work.
11. **Single city, single language, single timezone assumption** in the demo copy.
12. **Supabase AI trust boundary.** AI is computed client-side before insert; a production system should move it to an Edge Function with server-side validation.

These limitations are mirrored in `README.md` and in the in-app honesty note. Do not claim otherwise in the demo.

---

*End of TRD. See [`architecture.md`](./architecture.md) for system context, data flows, deployment topology and decision records.*




