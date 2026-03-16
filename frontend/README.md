# Frontend — LemonTree Community Impact Hub

Next.js 14 multi-persona analytics dashboard.

## Setup

```bash
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000 (or your deployed backend URL)
npm install
npm run dev
```

Runs at **http://localhost:3000**

---

## Routes

| Path | Description |
|---|---|
| `/` | Landing page — persona selector (Operator, Donor, Government, Admin) |
| `/dashboard` | Main dashboard — map + role-specific analytics panel |
| `/dashboard/explore` | Filterable, paginated resource explorer with URL-sync filters |
| `/report-builder` | Standalone custom chart builder |

---

## File overview

```
frontend/src/
├── app/
│   ├── page.js                      ← Landing / persona selector
│   ├── layout.js
│   ├── globals.css
│   ├── dashboard/
│   │   ├── page.js                  ← Main dashboard (map + panel, filter state)
│   │   └── explore/
│   │       └── page.js              ← Resource explorer (filters, pagination, URL sync)
│   └── report-builder/
│       └── page.js                  ← Standalone report builder route
│
├── components/
│   ├── MapView.jsx                  ← Leaflet map (clustering, ZIP labels, mode-aware)
│   ├── MiniMap.jsx                  ← Small operator map
│   ├── OperatorPanel.jsx            ← Operator analytics panel
│   ├── DonorPanel.jsx               ← Donor impact panel (ALICE-derived metrics)
│   ├── GovernmentPanel.jsx          ← Government dashboard shell (8 tabs, PDF export)
│   ├── ALICETab.jsx                 ← ALICE true-demand tab (used by GovernmentPanel)
│   ├── AdminPanel.jsx               ← Admin feedback analytics (7 tabs, AI insights)
│   ├── ReportBuilder.jsx            ← Self-contained report builder (charts, sidebar, export)
│   ├── VisualizationBuilder.jsx     ← Re-export of ReportBuilder (backward compat)
│   ├── FundingSimulator.jsx         ← Funding allocation simulator
│   ├── CensusLayerControls.jsx      ← Census overlay controls (pending real API)
│   ├── Footer.jsx                   ← Branded footer
│   └── Icons.jsx                    ← SVG icon library (Heroicons-style)
│
├── components/gov/                  ← Government panel tab components
│   ├── shared.js                    ← Shared constants and helpers (BOROUGH_DISPLAY, etc.)
│   ├── OverviewTab.jsx              ← Coverage gap bubble chart + stat cards
│   ├── UnderservedTab.jsx           ← Underserved ZIP list
│   ├── AccessBarriersTab.jsx        ← Reliability, ID, language barrier charts
│   ├── ResourceGapsTab.jsx          ← Community fridge distribution
│   ├── TransitAccessTab.jsx         ← Transit food deserts
│   ├── ReliabilityTab.jsx           ← Service reliability by borough
│   └── VulnerablePopTab.jsx         ← Seniors and dietary-specific access gaps
│
├── hooks/
│   └── useOnceEffect.js             ← Singleton-safe fetch hook (prevents StrictMode double-fire)
│
└── lib/
    ├── constants.js                 ← BOROUGH_COLORS, BOROUGH_DISPLAY_NAMES, BOROUGH_KEY_MAP
    ├── dataCache.js                 ← DataProvider context — fetches govData + resources once
    ├── helpers.js                   ← ratingColor, povertyOpacity utilities
    ├── mockData.js                  ← Static fallback data (used only when API is unavailable)
    └── zipToBorough.js              ← NYC ZIP → borough lookup
```

---

## Key data flow

```
Supabase
  └─► GET /api/gov/data  (Express backend)
        └─► DataProvider (dataCache.js)
              ├─► GovernmentPanel  → gov/ tab components
              ├─► DonorPanel       → borough bubbles, scatter, ALICE metrics
              ├─► OperatorPanel    → pantry comparison
              └─► ReportBuilder    → zipDemographics → 8 chart types
```

---

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (default: `http://localhost:4000`) |

---

## Build

```bash
npm run build   # production build
npm run lint    # ESLint check
```
