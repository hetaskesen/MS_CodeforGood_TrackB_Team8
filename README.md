App Demo: https://ms-codefor-good-track-b-team8.vercel.app/ 

App Demo Video: [YouTube Link](https://www.youtube.com/watch?v=F1wInckuaYM)

# LemonTree Grove

**Morgan Stanley Code for Good 2026 — Track B, Team 8**

A multi-persona analytics dashboard for LemonTree food access partners across New York City. Built for food pantry operators, government analysts, donors, and platform admins — powered by live Supabase data and Google Gemini AI insights.

---

## What it does

| Persona | What they see |
|---|---|
| **Pantry Operator** | Radar chart vs borough averages, completeness score, mini-map, peer comparison, nearby resources |
| **Donor / Funder** | Borough impact bubbles, funding landscape scatter, top underserved ZIPs, funding simulator |
| **Government Analyst** | 8-tab dashboard — overview, underserved areas, access barriers, resource gaps, ALICE true demand, transit access, reliability, vulnerable populations |
| **Admin** | Feedback analytics, AI-generated theme summaries, raffle management, resource quality flags |
| **Report Builder** | Custom chart builder with 8 chart types across 20 NYC demographic variables, persona-aware AI insights, PNG export |

---

## Key features

### Multi-persona login
- Partner login with three role tabs (Resource Operator, Donor / Funder, Government)
- Employee / Admin login that opens the full admin workspace
- Login routes directly into the correct dashboard persona

### Workspace tab system
- Browser-style tab bar — open multiple tools side by side
- Available tabs: Dashboard, Explore Resources, Report Builder, Funding Simulator, Feedback Analytics (admin only)
- Tabs persist filter state (e.g. Explore Resources remembers your active filters when you switch away)

### Explore Resources
- Full-text search across 1,976+ NYC food resources
- Filter by type, borough, ZIP, region, tags, rating, wait time
- Quick-access pills: "Visit this week", "Accepting new clients", "Walk-in (no appt.)"
- Interactive Leaflet map with marker clustering

### Report Builder
- Drag-and-drop chart canvas with 20 demographic variables
- **Single-variable charts:** By borough, by ZIP (top 20), distribution histogram, donut, top & bottom 5
- **Two-variable charts:** Scatter plot, grouped bar, bar + color encoding
- 8 quick-start presets for common analysis questions
- **AI insights** (Google Gemini 2.5 Flash) — 2-sentence, persona-aware data interpretation per chart, with in-memory caching to minimise API cost
- AI toggle button to enable/disable insights
- Export as PNG (canvas only, sidebar excluded)
- Copy shareable link

### Funding Simulator
- Allocate $500–$5,000 across NYC food pantries
- Ranked allocation by need score, poverty rate, and service quality
- Printable results (config panel hidden in print view)

### Government dashboard
- 8 dedicated tab components under `src/components/gov/`
- ALICE threshold analysis, borough-filtered missing-middle cards
- Transit access gaps, resource reliability scores, vulnerable population overlays
- PDF export of government reports

### Feedback Analytics (Admin)
- Review aggregation by resource
- AI-generated theme summaries (Anthropic Claude) from recent submissions
- Flag management and raffle admin tools

---

## Repository structure

```
MS_CodeforGood_TrackB_Team8/
├── backend/                    Express API — Supabase queries, AI summary, review routes
│   └── src/routes/             govData, resources, reviews, nearbyResources, operatorPantries
├── frontend/                   Next.js 14 dashboard
│   └── src/
│       ├── app/
│       │   ├── api/insight/    Server-side Gemini AI route with in-memory cache
│       │   └── dashboard/      Main dashboard + Explore Resources page
│       ├── components/
│       │   ├── gov/            8 government tab components + shared utilities
│       │   └── Icons.jsx       Centralised SVG icon library
│       ├── hooks/              useOnceEffect
│       └── lib/                dataCache, constants, mockData, helpers
└── feedbackform/               Standalone Next.js feedback submission form
```

---

## Prerequisites

- Node.js 18+
- A Supabase project with `resources`, `zip_demographics`, and `reviews` tables
- A Google AI API key (for Report Builder AI insights — optional, gracefully degrades to fallback text)
- An Anthropic API key (for Admin feedback summaries — optional, gracefully degrades)

---

## Quick start

### 1 — Backend

```bash
cd backend
cp .env.example .env
# Edit .env and fill in:
#   SUPABASE_URL
#   SUPABASE_SERVICE_ROLE_KEY
#   ANTHROPIC_API_KEY   (optional — AI feedback summaries in Admin panel)
#   PORT                (default: 4000)
npm install
npm run dev
```

Backend runs at **http://localhost:4000**

### 2 — Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:4000
#   GOOGLE_AI_API_KEY=your-key-here   (optional — Report Builder AI insights)
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

### 3 — Feedback form (optional)

```bash
cd feedbackform
cp .env.example .env.local
# Edit .env.local:
#   BACKEND_URL=http://localhost:4000
npm install
npm run dev
```

Feedback form runs at **http://localhost:3001**

---

## Environment variables reference

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server-only, never expose to client) |
| `ANTHROPIC_API_KEY` | No | Enables AI feedback summaries in Admin panel |
| `PORT` | No | API port (default: 4000) |

### `frontend/.env.local`

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | Backend URL (default: http://localhost:4000) |
| `GOOGLE_AI_API_KEY` | No | Google Gemini key for Report Builder AI insights; falls back to static text if not set |

### `feedbackform/.env.local`

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | Yes | Backend URL for submitting reviews |

---

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/resources` | All published resources (paginated Supabase fetch) |
| GET | `/api/resources/meta` | Filter metadata (types, boroughs, tags, regions) |
| GET | `/api/operator/pantries` | Pantry data with percentile analytics |
| GET | `/api/operator/neighborhood` | Nearby resources by lat/lng |
| GET | `/api/gov/data` | Government dashboard data (demographics, ALICE, gaps, top 30 underserved ZIPs) |
| GET | `/api/reviews` | Client feedback reviews |
| GET | `/api/reviews/summary` | Per-resource aggregated feedback |
| GET | `/api/reviews/ai-summary` | AI-generated themes from recent feedback (Anthropic) |
| POST | `/api/reviews` | Submit a new feedback review |
| POST | `/api/insight` *(Next.js)* | Gemini AI chart insight with server-side caching |

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, @supabase/supabase-js, @anthropic-ai/sdk |
| Frontend | Next.js 14, React 18 |
| Maps | Leaflet.js, leaflet.markercluster, CartoCDN tiles (free, no key) |
| Charts | Recharts |
| Styling | Tailwind CSS, inline styles |
| AI (chart insights) | Google Gemini 2.5 Flash via REST API — server-side cached, falls back gracefully |
| AI (feedback summaries) | Anthropic Claude (backend route) |
| PDF export | jsPDF, html2canvas |

---

## AI cost model

The Report Builder calls Gemini 2.5 Flash once per unique chart configuration (xVar × yVar × chartType × persona). Results are cached in memory on the Next.js server — identical chart combos are served free for the lifetime of the server process. At typical usage (< 100 unique chart combos/day) this falls entirely within Gemini's free tier (1,500 requests/day).

If `GOOGLE_AI_API_KEY` is not set, the app shows deterministic fallback text — no errors, no broken UI.

---

## Deployment

```bash
# Frontend — Vercel
cd frontend
npm run build
vercel deploy
# Set NEXT_PUBLIC_API_URL and GOOGLE_AI_API_KEY in Vercel environment settings

# Backend — any Node host (Railway, Render, Fly.io)
cd backend
npm start
# Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY in host dashboard
```

> **Note:** The backend uses a Supabase **service role key** which bypasses Row Level Security. Never expose it to the browser or commit it to a public repository.

---

## Project context

This project was built for **Morgan Stanley Code for Good 2026**, Track B — addressing food access equity in NYC. It uses real data from the LemonTree platform to help operators, government analysts, and donors make evidence-based decisions about where food resources are needed most.

Data sources: LemonTree resource database (1,976+ records), ACS 2024 ZIP-level demographics, ALICE threshold data, NYC Open Data.
