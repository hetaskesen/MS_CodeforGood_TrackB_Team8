# NYC Food Resources by Borough

This folder contains food assistance resources organized by NYC borough.

## 📁 Folder Structure

```
boroughs/
├── Bronx/
│   ├── Bronx.json          (363 resources)
│   └── Bronx.csv
├── Brooklyn/
│   ├── Brooklyn.json       (640 resources)
│   └── Brooklyn.csv
├── Manhattan/
│   ├── Manhattan.json      (388 resources)
│   └── Manhattan.csv
├── Queens/
│   ├── Queens.json         (419 resources)
│   └── Queens.csv
├── Staten Island/
│   ├── Staten Island.json  (156 resources)
│   └── Staten Island.csv
├── Other/
│   ├── Other.json          (10 resources - non-NYC zips)
│   └── Other.csv
└── summary.json            (Statistics)
```

## 📊 Borough Breakdown

| Borough | Resources | Percentage |
|---------|-----------|------------|
| **Brooklyn** | 640 | 32.4% |
| **Queens** | 419 | 21.2% |
| **Manhattan** | 388 | 19.6% |
| **Bronx** | 363 | 18.4% |
| **Staten Island** | 156 | 7.9% |
| Other (non-NYC) | 10 | 0.5% |
| **TOTAL** | **1,976** | **100%** |

## 🔍 Key Facts

- ✅ **No duplicates** - Each resource appears in only one borough
- ✅ **Sorted alphabetically** by resource name within each borough
- ✅ **Dual format** - Both JSON (full data) and CSV (flattened) available
- ✅ **Complete data** - All fields from original dataset preserved

## 📍 Zip Code Ranges by Borough

### Manhattan
- 10001-10282 (Midtown, Downtown, Upper Manhattan)

### Bronx
- 10451-10475 (South Bronx, Central Bronx, North Bronx)

### Brooklyn
- 11201-11256 (Downtown, Brownsville, Bushwick, etc.)

### Queens
- 11004-11109 (Western Queens)
- 11351-11697 (Eastern Queens, Far Rockaway)

### Staten Island
- 10301-10314 (North Shore, Mid-Island, South Shore)

## 🎯 How to Use

### Excel/Google Sheets
Open any `.csv` file directly in your spreadsheet application:
```bash
open "Brooklyn/Brooklyn.csv"
```

### Python Analysis
```python
import json

# Load Brooklyn resources
with open('boroughs/Brooklyn/Brooklyn.json') as f:
    brooklyn_resources = json.load(f)

print(f"Brooklyn has {len(brooklyn_resources)} food resources")

# Find food pantries in Brooklyn
pantries = [r for r in brooklyn_resources 
            if r['resourceType']['id'] == 'FOOD_PANTRY']
print(f"{len(pantries)} are food pantries")
```

### JavaScript/Node
```javascript
const brooklyn = require('./boroughs/Brooklyn/Brooklyn.json');
console.log(`Brooklyn has ${brooklyn.length} resources`);
```

## 📈 Top Neighborhoods by Resource Count

### Brooklyn (640 resources)
- Bushwick (11221): 40 resources
- Ocean Hill (11233): 38 resources
- Brownsville (11212): 37 resources
- Bedford-Stuyvesant (11216): 37 resources

### Queens (419 resources)
- Jamaica (11432): 29 resources
- Jamaica (11433): 27 resources
- Jamaica (11434): 20 resources

### Manhattan (388 resources)
- Lower East Side (10002): 31 resources
- Harlem (10027): 25 resources
- East Harlem (10029, 10035): 40 resources combined

### Bronx (363 resources)
- Mott Haven (10455): 30 resources
- Highbridge (10452): 25 resources
- Morrisania (10456): 25 resources

### Staten Island (156 resources)
- Stapleton (10304): 35 resources
- Port Richmond (10301): 28 resources

## 🗺️ Geographic Distribution

Brooklyn has the highest concentration of food resources (**32.4%**), followed by Queens and Manhattan. This reflects both population density and need.

## 📝 Data Quality

- All resources verified as unique (no duplicates)
- Resources sorted alphabetically for easy browsing
- CSV format compatible with all major spreadsheet applications
- JSON format preserves full nested structure

## 🔄 Updating

To regenerate borough files from the main dataset:
```bash
python organize_by_borough.py
```

## 📚 Additional Resources

- **../all_resources.json** - Complete dataset (all boroughs)
- **../all_resources.csv** - Complete CSV export
- **../by_zip/** - Individual zip code files
- **../meta.json** - Overall statistics

## ⚠️ Note on "Other" Folder

The "Other" folder contains 10 resources with zip codes outside the standard NYC ranges. These may be:
- Regional offices serving NYC
- Mobile resources operating across multiple areas
- Data entry variations

## 📞 Questions?

Refer to the main project documentation:
- **README.md** - Full project overview
- **DATA_DICTIONARY.md** - Field definitions
- **QUICK_START.md** - Usage examples
