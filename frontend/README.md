# Lemontree Community Impact Hub

Multi-persona analytics dashboard for Lemontree food access partners — built for Morgan Stanley Code for Good 2026, Track B, Team 8.

## Repository structure

```
MS_CodeforGood_TrackB_Team8/
├── backend/          Express API server (Supabase, routes, CORS)
├── frontend/         Next.js dashboard (React, Leaflet, Recharts, Tailwind)
└── docs/             Implementation guides
```

## Quick start

### 1. Backend

```bash
cd backend
npm install
# Create .env with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PORT=4000
npm run dev
```

Backend runs on [http://localhost:4000](http://localhost:4000).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on [http://localhost:3000](http://localhost:3000). It reads `NEXT_PUBLIC_API_URL` from `.env.local` (defaults to `http://localhost:4000`).

---

## App structure

```
/ (localhost:3000)                    → Login page (persona selector)
/dashboard (localhost:3000/dashboard) → Map + analytics dashboard
/dashboard/explore                    → Filterable resource explorer
```

## Three dashboard modes

**Pantry Operator** — Radar chart comparing your pantry to Manhattan averages, neighborhood comparison table, mini-map, listing completeness analysis.

**Donor / Funder** — Families reached, satisfaction/wait-time deltas, funded locations, before/after comparison, and impact report export.

**Government** — Poverty choropleth overlay on the map. Coverage gap analysis, critical zone cards, demand estimates, and CSV export.

---

## API endpoints (backend)

| Endpoint | Description |
|---|---|
| `GET /api/resources` | All published resources from Supabase |
| `GET /api/resources/meta` | Aggregated filter metadata (types, zips, boroughs, tags) |
| `GET /api/operator/pantries` | Four demo pantries with percentile data (Supabase or static fallback) |
| `GET /health` | Health check |

---

## Tech stack

| Layer | Tool |
|---|---|
| Backend | Express, @supabase/supabase-js, cors, dotenv |
| Frontend | Next.js 14 + React 18 |
| Maps | Leaflet.js |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Icons | lucide-react |

---

## Frontend file overview

```
frontend/src/
├── app/
│   ├── page.js                  ← Login / landing page
│   ├── dashboard/
│   │   ├── page.js              ← Main map + panel dashboard
│   │   └── explore/page.js      ← Filterable resource explorer
│   ├── layout.js
│   └── globals.css
├── components/
│   ├── Navbar.jsx               ← Top header with mode toggle
│   ├── MapView.jsx              ← Leaflet map (mode-aware)
│   ├── MiniMap.jsx              ← Small Leaflet map for operator panel
│   ├── OperatorPanel.jsx        ← Operator analytics panel
│   ├── DonorPanel.jsx           ← Donor impact panel
│   ├── GovernmentPanel.jsx      ← Government coverage panel
│   ├── CensusLayerControls.jsx  ← Census overlay filter buttons
│   ├── StatCard.jsx             ← Reusable metric card
│   ├── FeedbackBars.jsx         ← Horizontal bar chart
│   └── Footer.jsx               ← Lemontree-branded footer
└── lib/
    ├── constants.js             ← CENSUS_LAYERS config
    ├── helpers.js               ← ratingColor, povertyOpacity
    ├── mockData.js              ← Client-side mock data for dashboard panels
    └── zipToBorough.js          ← NYC zip → borough mapping
```

## Backend file overview

```
backend/src/
├── index.js                     ← Express entry point
├── lib/
│   ├── supabase.js              ← Supabase client (service role key)
│   └── zipToBorough.js          ← NYC zip → borough mapping
├── routes/
│   ├── resources.js             ← GET /api/resources
│   ├── resourcesMeta.js         ← GET /api/resources/meta
│   └── operatorPantries.js      ← GET /api/operator/pantries
├── data/
│   └── mockData.js              ← Static fallback pantry data
└── middleware/
    └── cors.js                  ← CORS whitelist for frontend origins
```

---

## Deploy

```bash
# Frontend
cd frontend && npm run build && vercel deploy

# Backend
cd backend && npm start
```
