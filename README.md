# LemonTree Community Impact Hub

**Morgan Stanley Code for Good 2026 — Track B, Team 8**

A multi-persona analytics dashboard for LemonTree food access partners across New York City. Built for food pantry operators, government analysts, donors, and platform admins — powered by live Supabase data.

---

## What it does

| Persona | What they see |
|---|---|
| **Pantry Operator** | Radar chart vs borough averages, completeness score, mini-map, peer comparison |
| **Donor / Funder** | Borough impact bubbles, funding landscape scatter, top underserved ZIPs, funding simulator |
| **Government Analyst** | 8-tab dashboard — underserved areas, access barriers, ALICE demand, transit gaps, reliability, vulnerable populations |
| **Admin** | Feedback analytics, AI-generated theme summaries, raffle management, resource quality flags |
| **Report Builder** | Custom chart builder with 8 chart types across 20 NYC demographic variables |

---

## Repository structure

```
MS_CodeforGood_TrackB_Team8/
├── backend/        Express API — Supabase queries, AI summary, review routes
├── frontend/       Next.js 14 dashboard — map, panels, charts
└── feedbackform/   Standalone Next.js feedback submission form
```

---

## Prerequisites

- Node.js 18+
- A Supabase project with `resources` and `zip_demographics` tables
- An Anthropic API key (for AI feedback summaries — optional, gracefully degrades)

---

## Quick start

### 1 — Backend

```bash
cd backend
cp .env.example .env
# Edit .env and fill in:
#   SUPABASE_URL
#   SUPABASE_SERVICE_ROLE_KEY
#   ANTHROPIC_API_KEY   (optional — AI feedback summaries)
#   PORT                (default: 4000)
npm install
npm run dev
```

Backend runs at **http://localhost:4000**

### 2 — Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local — only one variable:
#   NEXT_PUBLIC_API_URL=http://localhost:4000
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

### `feedbackform/.env.local`

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | Yes | Backend URL for submitting reviews |

---

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/resources` | All published resources |
| GET | `/api/resources/meta` | Filter metadata (types, boroughs, tags) |
| GET | `/api/operator/pantries` | Pantry data with percentile analytics |
| GET | `/api/gov/data` | Government dashboard data (demographics, ALICE, gaps) |
| GET | `/api/reviews` | Client feedback reviews |
| GET | `/api/reviews/summary` | Per-resource aggregated feedback |
| GET | `/api/reviews/ai-summary` | AI-generated themes from recent feedback |
| POST | `/api/reviews` | Submit a new feedback review |

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, @supabase/supabase-js, @anthropic-ai/sdk |
| Frontend | Next.js 14, React 18 |
| Maps | Leaflet.js, leaflet.markercluster |
| Charts | Recharts |
| Styling | Tailwind CSS, inline styles |
| AI | Anthropic Claude (feedback summaries) |

---

## Deployment

```bash
# Frontend — Vercel
cd frontend
npm run build
vercel deploy

# Backend — any Node host (Railway, Render, Fly.io)
cd backend
npm start
```

Set the production environment variables in your host's dashboard. Set `NEXT_PUBLIC_API_URL` in Vercel to point to your deployed backend URL.

---

## Project context

This project was built for **Morgan Stanley Code for Good 2026**, Track B — addressing food access equity in NYC. It uses real data from the LemonTree platform to help operators, government analysts, and donors make evidence-based decisions about where food resources are needed most.
