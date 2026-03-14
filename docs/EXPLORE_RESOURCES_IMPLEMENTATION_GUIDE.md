# Explore Resources — Implementation Guide

A step-by-step reference for adding the **Explore Resources** filtering page
to any other Cursor workspace that shares this codebase.

---

## What the page does

**Route:** `/dashboard/explore`

| Feature | Detail |
|---|---|
| Data fetch | `GET /api/resources` + `GET /api/resources/meta` — once on mount |
| Filtering | All client-side in one `useMemo`: type, borough, zip, neighborhood (region), free-text, "visit this week," accepting new clients, walk-in, min rating, max wait, tags |
| Sorting | Name / Rating / Wait time / Reviews |
| URL sync | Filter state is serialised to query-string so links are shareable and browser back/forward work |
| UI | Sticky filter bar · result count · 25-per-page list · "Clear all filters" · slide-in detail panel on row click |

The page is **self-contained** — no shared layout with the main dashboard.
It has its own top bar (`← Dashboard` back-link) and does not mount
`OperatorPanel`, `DonorPanel`, or `GovernmentPanel`.

---

## Files to copy

Copy all five files verbatim into the other workspace.  Paths are relative to
the repo's `frontend/` folder.

| # | File | Role |
|---|------|------|
| 1 | `src/app/dashboard/explore/page.js` | Full Explore UI: filters, paginated list, detail panel, URL sync, loading/error states (~700 lines) |
| 2 | `src/lib/zipToBorough.js` | NYC zip → borough lookup used by both the client UI and the API |
| 3 | `src/app/api/resources/loadResources.js` | Reads `backend/all_resources.json`, caches in memory, exports `getResources()` and `getMeta()` |
| 4 | `src/app/api/resources/route.js` | Next.js Route Handler for `GET /api/resources` |
| 5 | `src/app/api/resources/meta/route.js` | Next.js Route Handler for `GET /api/resources/meta` |

---

## Hooking into the existing Navbar

In your existing `src/components/Navbar.jsx`, add a single `<Link>` to the
left section (next to the logo):

```jsx
import Link from "next/link";

// Inside the LEFT column of the navbar grid:
<Link href="/dashboard/explore">
  🔍 Explore resources
</Link>
```

Style it however fits your navbar.  The explore page itself provides the
`← Dashboard` back-link, so no other wiring is needed.

---

## API response shapes

### `GET /api/resources`

Returns a JSON array of resource objects.  Each object looks like:

```json
{
  "id": "288",
  "name": "Corona SDA Church",
  "resourceType": { "id": "FOOD_PANTRY", "name": "Food pantry (groceries)" },
  "resourceStatus": { "id": "PUBLISHED" },
  "addressStreet1": "35-30 103rd St",
  "addressStreet2": null,
  "city": "New York",
  "state": "NY",
  "zipCode": "11368",
  "latitude": 40.753872,
  "longitude": -73.864822,
  "ratingAverage": 3.8,
  "waitTimeMinutesAverage": 22,
  "acceptingNewClients": true,
  "appointmentRequired": false,
  "openByAppointment": false,
  "confidence": 0.88,
  "website": "https://...",
  "contacts": [{ "phone": "(718) 651-4534", "public": true }],
  "tags": [{ "id": "abc", "name": "ID required", "tagCategoryId": "REQUIREMENT" }],
  "regions": [{ "id": "CORONA" }],
  "occurrences": [
    { "id": "occ1", "startTime": "2026-03-15T14:00:00Z", "endTime": "2026-03-15T16:00:00Z", "skippedAt": null }
  ],
  "images": [{ "url": "https://..." }],
  "_count": { "reviews": 41, "resourceSubscriptions": 30 },
  "usageLimitCount": null,
  "usageLimitIntervalUnit": null,
  "mergedToResourceId": null
}
```

Only PUBLISHED resources with `mergedToResourceId === null` are returned.

### `GET /api/resources/meta`

```json
{
  "types":       ["FOOD_PANTRY", "SOUP_KITCHEN"],
  "boroughs":    ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"],
  "zips":        ["10001", "10002", ...],
  "tags":        ["ID required", "First come, first serve", ...],
  "regions":     ["CORONA", "HARLEM", ...],
  "totalCount":  1337
}
```

---

## Adapting `loadResources.js` for a different backend

If the other workspace uses a different data source, only
`src/app/api/resources/loadResources.js` needs to change.
The two route files and the explore page require no edits.

The loader must export:

```js
// Returns array of resource objects (see shape above), or null if unavailable
export function getResources() { ... }

// Returns meta object (see shape above), or null if unavailable
export function getMeta() { ... }
```

`getResources()` is called on every `GET /api/resources` request.
The built-in implementation caches the result in a module-level variable so
the file is only read once per server process.

---

## Directory structure after copying

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── resources/
│   │   │       ├── loadResources.js   ← new
│   │   │       ├── route.js           ← new
│   │   │       └── meta/
│   │   │           └── route.js       ← new
│   │   └── dashboard/
│   │       └── explore/
│   │           └── page.js            ← new
│   ├── components/
│   │   └── Navbar.jsx                 ← add one <Link> to left section
│   └── lib/
│       └── zipToBorough.js            ← new
└── ...
```

---

## Copy-paste instructions for the other Cursor

Give Cursor this prompt:

> Please implement an Explore Resources page for this project.
>
> 1. Create `src/lib/zipToBorough.js` — (paste file content)
> 2. Create `src/app/api/resources/loadResources.js` — (paste file content)
> 3. Create `src/app/api/resources/route.js` — (paste file content)
> 4. Create `src/app/api/resources/meta/route.js` — (paste file content)
> 5. Create `src/app/dashboard/explore/page.js` — (paste file content)
> 6. In `src/components/Navbar.jsx`, add a `<Link href="/dashboard/explore">🔍 Explore resources</Link>` 
>    to the left section of the navbar, next to the logo.
> 7. If `backend/all_resources.json` is not at the repo root, update 
>    the `candidates` array in `loadResources.js` to point to the 
>    correct path.

---

## Notes

- **`lucide-react`** must be installed (`npm i lucide-react` if missing).
  It is already installed in this workspace.
- The explore page does NOT use `getServerSideProps` or `generateStaticParams`.
  It is a pure client component that fetches via the Route Handlers on mount.
- `useSearchParams()` requires a `<Suspense>` boundary — the page already
  wraps `ExploreContent` in `<Suspense>` for you.
- The "visit this week" filter checks `resource.occurrences[]` for any
  occurrence starting within the next 7 days.  If your backend omits 
  `occurrences`, this filter will simply never match (safe default).
