"""
Lemontree API — NYC Food Resources Collector

Efficient Strategy:
- Fetch ALL NYC resources once via pagination (using region=NEW_YORK_CITY)
- Partition them locally by their actual zipCode field
- Export to JSON and CSV formats

"""

import csv
import json
import time
from datetime import datetime
from pathlib import Path

import requests
from tqdm import tqdm

BASE_URL = "https://platform.foodhelpline.org/api/resources"
OUTPUT_DIR = Path("data")
BY_ZIP_DIR = OUTPUT_DIR / "by_zip"
BY_ZIP_DIR.mkdir(parents=True, exist_ok=True)

# NYC zip code ranges to filter (based on your requirements)
NYC_ZIP_RANGES = [
    (10001, 10282),  # Manhattan
    (10301, 10314),  # Staten Island (north)
    (10451, 10475),  # Bronx
    (11201, 11256),  # Brooklyn
    (11004, 11109),  # Queens
    (11351, 11697),  # Queens / Staten Island
]

SESSION = requests.Session()
SESSION.headers["Accept"] = "application/json"


def is_nyc_zip(zipcode: str) -> bool:
    """Check if a zip code is in our target NYC ranges."""
    if not zipcode:
        return False
    try:
        n = int(zipcode.strip())
        return any(lo <= n <= hi for lo, hi in NYC_ZIP_RANGES)
    except (ValueError, AttributeError):
        return False


def fetch_all_nyc_resources(take: int = 100) -> list:
    """Fetch all NYC resources in one efficient paginated sweep."""
    print("Fetching all NYC resources (single sweep using region=NEW_YORK_CITY)...\n")
    
    all_resources = []
    seen_ids = set()
    cursor = None
    page = 0
    
    with tqdm(desc="Fetching pages", unit="page") as pbar:
        while True:
            params = {"region": "NEW_YORK_CITY", "take": take}
            if cursor:
                params["cursor"] = cursor
            
            try:
                resp = SESSION.get(BASE_URL, params=params, timeout=30)
                resp.raise_for_status()
                data = resp.json()["json"]
                
                resources = data.get("resources", [])
                if not resources:
                    break
                
                # Deduplicate by ID
                for resource in resources:
                    if resource["id"] not in seen_ids:
                        seen_ids.add(resource["id"])
                        all_resources.append(resource)
                
                page += 1
                pbar.set_postfix(
                    page=page,
                    unique_resources=len(all_resources),
                    page_size=len(resources)
                )
                pbar.update(1)
                
                cursor = data.get("cursor")
                if not cursor:
                    break
                
                time.sleep(0.05)  # be polite to the API
                
            except Exception as e:
                print(f"\n⚠️  Error fetching page {page + 1}: {e}")
                break
    
    print(f"\n✅ Fetched {len(all_resources)} unique resources across {page} pages\n")
    return all_resources


def flatten_resource_for_csv(resource: dict) -> dict:
    """Flatten a resource object into a single-level dict for CSV export."""
    return {
        "id": resource.get("id"),
        "name": resource.get("name"),
        "description": resource.get("description", "")[:500] if resource.get("description") else "",  # truncate long descriptions
        "resource_type": resource.get("resourceType", {}).get("name"),
        "resource_type_id": resource.get("resourceType", {}).get("id"),
        "status": resource.get("resourceStatus", {}).get("id"),
        "address_street1": resource.get("addressStreet1"),
        "address_street2": resource.get("addressStreet2"),
        "city": resource.get("city"),
        "state": resource.get("state"),
        "zipCode": resource.get("zipCode"),
        "latitude": resource.get("latitude"),
        "longitude": resource.get("longitude"),
        "timezone": resource.get("timezone"),
        "website": resource.get("website"),
        "phone": resource.get("contacts", [{}])[0].get("phone") if resource.get("contacts") else None,
        "open_by_appointment": resource.get("openByAppointment"),
        "appointment_required": resource.get("appointmentRequired"),
        "accepting_new_clients": resource.get("acceptingNewClients"),
        "usage_limit_count": resource.get("usageLimitCount"),
        "usage_limit_interval": resource.get("usageLimitIntervalUnit"),
        "confidence": resource.get("confidence"),
        "rating_average": resource.get("ratingAverage"),
        "review_count": resource.get("_count", {}).get("reviews"),
        "subscription_count": resource.get("_count", {}).get("resourceSubscriptions"),
        "regions_served": ",".join([r.get("id", "") for r in resource.get("regionsServed", [])]),
        "tags": ",".join([t.get("name", "") for t in resource.get("tags", [])]),
        "has_shifts": len(resource.get("shifts", [])) > 0,
        "has_occurrences": len(resource.get("occurrences", [])) > 0,
    }


def export_to_csv(resources: list, output_path: Path):
    """Export resources to CSV format."""
    if not resources:
        return
    
    flattened = [flatten_resource_for_csv(r) for r in resources]
    
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=flattened[0].keys())
        writer.writeheader()
        writer.writerows(flattened)


def main():
    start_time = time.time()
    
    print("=" * 70)
    print("Lemontree NYC Food Resources Collector")
    print("=" * 70)
    print(f"Target zip ranges: 10001-10282, 10301-10314, 10451-10475,")
    print(f"                   11201-11256, 11004-11109, 11351-11697")
    print(f"Output directory: {OUTPUT_DIR.resolve()}\n")
    
    # Step 1: Fetch all NYC resources
    all_resources = fetch_all_nyc_resources()
    
    # Step 2: Write full dataset
    print("Step 2: Saving all_resources.json...")
    all_json_path = OUTPUT_DIR / "all_resources.json"
    with open(all_json_path, "w", encoding="utf-8") as f:
        json.dump(all_resources, f, ensure_ascii=False, indent=2, default=str)
    print(f"✅ Saved {len(all_resources)} resources to {all_json_path}\n")
    
    # Step 3: Export full dataset to CSV
    print("Step 3: Exporting all_resources.csv...")
    all_csv_path = OUTPUT_DIR / "all_resources.csv"
    export_to_csv(all_resources, all_csv_path)
    print(f"✅ Exported to {all_csv_path}\n")
    
    # Step 4: Partition by zip code
    print("Step 4: Partitioning by zip code...")
    by_zip = {}
    nyc_zip_count = 0
    no_zip_count = 0
    
    for resource in all_resources:
        zipcode = resource.get("zipCode", "").strip()
        
        if not zipcode:
            no_zip_count += 1
            continue
        
        # Only create files for NYC zip codes in our target ranges
        if is_nyc_zip(zipcode):
            nyc_zip_count += 1
            if zipcode not in by_zip:
                by_zip[zipcode] = []
            by_zip[zipcode].append(resource)
    
    # Write per-zip JSON files
    print(f"Writing {len(by_zip)} zip code files...")
    for zipcode, resources in sorted(by_zip.items()):
        zip_file = BY_ZIP_DIR / f"{zipcode}.json"
        with open(zip_file, "w", encoding="utf-8") as f:
            json.dump(resources, f, ensure_ascii=False, indent=2, default=str)
    
    # Write per-zip CSV files
    print(f"Exporting {len(by_zip)} zip code CSV files...")
    for zipcode, resources in sorted(by_zip.items()):
        csv_file = BY_ZIP_DIR / f"{zipcode}.csv"
        export_to_csv(resources, csv_file)
    
    print(f"✅ Created {len(by_zip)} zip code files (JSON + CSV)\n")
    
    # Step 5: Create metadata summary
    runtime = time.time() - start_time
    meta = {
        "generated_at": datetime.now().isoformat(),
        "total_resources_fetched": len(all_resources),
        "resources_with_nyc_zip": nyc_zip_count,
        "resources_with_no_zip": no_zip_count,
        "zip_codes_with_data": {
            zipcode: len(resources)
            for zipcode, resources in sorted(by_zip.items())
        },
        "runtime_seconds": round(runtime, 1),
    }
    
    meta_path = OUTPUT_DIR / "meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    
    # Final summary
    print("=" * 70)
    print("✅ COMPLETE")
    print("=" * 70)
    print(f"Total resources fetched:     {len(all_resources)}")
    print(f"Resources with NYC zip:      {nyc_zip_count}")
    print(f"Resources missing zip:       {no_zip_count}")
    print(f"Zip codes with data:         {len(by_zip)}")
    print(f"Runtime:                     {runtime:.1f}s")
    print(f"\nFiles created:")
    print(f"  📄 {all_json_path}")
    print(f"  📊 {all_csv_path}")
    print(f"  📁 {BY_ZIP_DIR}/*.json ({len(by_zip)} files)")
    print(f"  📁 {BY_ZIP_DIR}/*.csv ({len(by_zip)} files)")
    print(f"  📋 {meta_path}")
    
    # Top zip codes by resource count
    if by_zip:
        print(f"\n🔝 Top 10 zip codes by resource count:")
        top_zips = sorted(by_zip.items(), key=lambda x: len(x[1]), reverse=True)[:10]
        for zipcode, resources in top_zips:
            print(f"  {zipcode}: {len(resources)} resources")
    
    print("=" * 70)


if __name__ == "__main__":
    main()
