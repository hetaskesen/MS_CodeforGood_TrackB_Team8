"""
Lemontree Data Fetcher — NYC 20-mile radius
Fetches all food resources within 20 miles of NYC, cleans and saves to CSV + JSON.

Usage:
    python fetch_lemontree.py

Outputs:
    lemontree_nyc.csv   — flat table, one row per resource
    lemontree_nyc.json  — full cleaned records as a list
"""

import requests
import pandas as pd
import json
from datetime import datetime, timezone

BASE_URL  = "https://platform.foodhelpline.org"
NYC_LAT   = 40.7128
NYC_LNG   = -74.0060
MAX_MILES = 20
METERS_PER_MILE = 1609.34
PAGE_SIZE = 40


# ---------------------------------------------------------------------------
# Fetch
# ---------------------------------------------------------------------------

def fetch_resources(lat: float, lng: float) -> list[dict]:
    """Page through /api/resources sorted by distance, stop at MAX_MILES."""
    cursor = None
    total_fetched = 0
    results = []

    while True:
        params = {
            "lat": lat,
            "lng": lng,
            "sort": "distance",
            "take": PAGE_SIZE,
        }
        if cursor:
            params["cursor"] = cursor

        resp = requests.get(f"{BASE_URL}/api/resources", params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json().get("json", {})

        resources = data.get("resources", [])
        if not resources:
            break

        for r in resources:
            dist_m = (r.get("travelSummary") or {}).get("distance")
            dist_miles = dist_m / METERS_PER_MILE if dist_m is not None else None

            # Stop as soon as we exceed the radius
            if dist_miles is not None and dist_miles > MAX_MILES:
                print(f"  Reached {dist_miles:.1f} miles — stopping.")
                return results

            results.append(r)

        total_fetched += len(resources)
        cursor = data.get("cursor")
        print(f"  Fetched {total_fetched} resources so far...")

        if not cursor:
            break

    return results


# ---------------------------------------------------------------------------
# Clean
# ---------------------------------------------------------------------------

def parse_dt(s):
    if not s:
        return None
    try:
        return datetime.fromisoformat(str(s)).isoformat()
    except Exception:
        return str(s)


def clean_resource(r: dict) -> dict:
    """Flatten a raw resource dict into a clean record."""
    dist_m = (r.get("travelSummary") or {}).get("distance")
    dist_miles = round(dist_m / METERS_PER_MILE, 2) if dist_m is not None else None

    # Usage limit — e.g. "1 per week"
    usage = None
    if r.get("usageLimitCount") and r.get("usageLimitIntervalUnit"):
        usage = f"{r['usageLimitCount']} per {r.get('usageLimitIntervalCount', 1)} {r['usageLimitIntervalUnit']}"

    # Next upcoming non-cancelled occurrence + upcoming list
    next_open = None
    next_confirmed = None
    upcoming = []
    for o in r.get("occurrences", []):
        if o.get("skippedAt"):
            continue
        start = parse_dt(o.get("startTime"))
        end   = parse_dt(o.get("endTime"))
        upcoming.append({"start": start, "end": end, "confirmed": bool(o.get("confirmedAt"))})
        if next_open is None:
            next_open = start
            next_confirmed = bool(o.get("confirmedAt"))

    # Is open right now?
    now = datetime.now(timezone.utc)
    is_open_now = False
    for o in r.get("occurrences", []):
        if o.get("skippedAt"):
            continue
        try:
            start = datetime.fromisoformat(str(o["startTime"]))
            end   = datetime.fromisoformat(str(o["endTime"]))
            start = start if start.tzinfo else start.replace(tzinfo=timezone.utc)
            end   = end   if end.tzinfo   else end.replace(tzinfo=timezone.utc)
            if start <= now <= end:
                is_open_now = True
                break
        except Exception:
            pass

    tags  = ", ".join(t.get("name", "") for t in r.get("tags", []))
    phone = (r.get("contacts") or [{}])[0].get("phone")
    image = ((r.get("images") or [{}])[0]).get("url")

    return {
        # Identity
        "id":                    r.get("id"),
        "name":                  r.get("name"),
        "resource_type":         (r.get("resourceType") or {}).get("id"),
        "status":                (r.get("resourceStatus") or {}).get("id"),
        # Location
        "address_street1":       r.get("addressStreet1"),
        "address_street2":       r.get("addressStreet2"),
        "city":                  r.get("city"),
        "state":                 r.get("state"),
        "zip_code":              r.get("zipCode"),
        "latitude":              r.get("latitude"),
        "longitude":             r.get("longitude"),
        "timezone":              r.get("timezone"),
        "distance_miles":        dist_miles,
        # Contact
        "phone":                 phone,
        "website":               r.get("website"),
        # Schedule
        "open_by_appointment":   r.get("openByAppointment", False),
        "is_open_now":           is_open_now,
        "next_open":             next_open,
        "next_confirmed":        next_confirmed,
        "upcoming_occurrences":  json.dumps(upcoming),
        # Usage limits
        "usage_limit":           usage,
        "usage_calendar_reset":  r.get("usageLimitCalendarReset"),
        # Tags
        "tags":                  tags,
        # Quality signals
        "confidence":            r.get("confidence"),
        "rating_average":        r.get("ratingAverage"),
        "review_count":          (r.get("_count") or {}).get("reviews", 0),
        "subscriber_count":      (r.get("_count") or {}).get("resourceSubscriptions", 0),
        # Media
        "image_url":             image,
        # Description
        "description":           r.get("description"),
        "description_es":        r.get("description_es"),
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print(f"Fetching food resources within {MAX_MILES} miles of NYC...")
    print(f"  Center: {NYC_LAT}, {NYC_LNG}\n")

    raw = fetch_resources(NYC_LAT, NYC_LNG)
    print(f"\nRaw records fetched: {len(raw)}")

    cleaned = [clean_resource(r) for r in raw]

    # Keep only PUBLISHED
    published = [r for r in cleaned if r["status"] == "PUBLISHED"]
    dropped   = len(cleaned) - len(published)
    print(f"Published:           {len(published)}  (dropped {dropped} unpublished/removed)")

    # Build DataFrame + type cleanup
    df = pd.DataFrame(published)
    df["distance_miles"]   = pd.to_numeric(df["distance_miles"],   errors="coerce")
    df["confidence"]       = pd.to_numeric(df["confidence"],       errors="coerce")
    df["rating_average"]   = pd.to_numeric(df["rating_average"],   errors="coerce")
    df["review_count"]     = pd.to_numeric(df["review_count"],     errors="coerce").fillna(0).astype(int)
    df["subscriber_count"] = pd.to_numeric(df["subscriber_count"], errors="coerce").fillna(0).astype(int)
    df["is_open_now"]      = df["is_open_now"].astype(bool)
    df = df.sort_values("distance_miles").reset_index(drop=True)

    # Save outputs
    df.to_csv("lemontree_nyc.csv", index=False)
    with open("lemontree_nyc.json", "w") as f:
        json.dump(published, f, indent=2, default=str)

    print(f"\nSaved to: lemontree_nyc.csv + lemontree_nyc.json")

    # Summary stats
    print("\n--- Summary ---")
    print(f"  Food pantries:  {(df['resource_type'] == 'FOOD_PANTRY').sum()}")
    print(f"  Soup kitchens:  {(df['resource_type'] == 'SOUP_KITCHEN').sum()}")
    print(f"  Open now:       {df['is_open_now'].sum()}")
    print(f"  With phone:     {df['phone'].notna().sum()}")
    print(f"  With website:   {df['website'].notna().sum()}")
    print(f"  Cities covered: {df['city'].nunique()}")
    print(f"\n  Top 10 cities by resource count:")
    print(df["city"].value_counts().head(10).to_string())

    return df


if __name__ == "__main__":
    df = main()