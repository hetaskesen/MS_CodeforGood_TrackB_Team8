import requests
import json

API_KEY = "147318795a25995db4065877fbedfdaa3246f6d9"

BASE = "https://api.census.gov/data/2024/acs/acs5"

VARIABLES = [
"NAME",
"B01003_001E",
"B17001_001E",
"B17001_002E",
"B19013_001E",
"B03002_003E",
"B03002_004E",
"B03002_012E",
"B03002_006E"
]

ZIP_CODES = [
"10001","10002","10003","10004","10005","10006","10007","10009","10010","10011",
"10012","10013","10016","10017","10018","10019","10020","10021","10022","10023",
"10024","10025","10026","10027","10029","10030","10031","10032","10033","10034",
"10035","10036","10037","10038","10039","10040","10044","10065","10075","10119",
"10128","10301","10302","10303","10304","10305","10306","10307","10308","10309",
"10310","10312","10314","10451","10452","10453","10454","10455","10456","10457",
"10458","10459","10460","10461","10462","10463","10464","10466","10467","10468",
"10469","10470","10471","10472","10473","10474","10475","11101","11102","11103",
"11104","11105","11106","11201","11203","11204","11205","11206","11207","11208",
"11209","11210","11211","11212","11213","11214","11215","11216","11217","11218",
"11219","11220","11221","11222","11223","11224","11225","11226","11229","11230",
"11231","11232","11233","11234","11235","11236","11237","11238","11239","11249",
"11354","11355","11356","11357","11358","11361","11362","11363","11365","11366",
"11367","11368","11369","11370","11372","11373","11374","11375","11377","11378",
"11379","11385","11411","11412","11413","11414","11416","11417","11418","11419",
"11420","11421","11422","11423","11424","11426","11427","11428","11429","11432",
"11433","11434","11435","11436","11580","11691","11692","11693","11694"
]

def food_insecurity(pop, poverty_rate):
    return int(pop * poverty_rate * 1.4)

def fetch_zip(zipcode):

    vars_string = ",".join(VARIABLES)

    url = f"{BASE}?get={vars_string}&for=zip%20code%20tabulation%20area:{zipcode}&key={API_KEY}"

    r = requests.get(url)

    data = r.json()

    header = data[0]
    row = data[1]

    record = dict(zip(header,row))

    population = int(record["B01003_001E"] or 0)

    poverty_total = int(record["B17001_001E"] or 0)
    poverty_count = int(record["B17001_002E"] or 0)

    poverty_rate = poverty_count / poverty_total if poverty_total else 0

    white = int(record["B03002_003E"] or 0)
    black = int(record["B03002_004E"] or 0)
    hispanic = int(record["B03002_012E"] or 0)
    asian = int(record["B03002_006E"] or 0)

    race = {
        "white_non_hispanic": white,
        "black": black,
        "hispanic": hispanic,
        "asian": asian
    }

    race_majority = max(race, key=race.get)

    labels = {
        "white_non_hispanic":"White (non-Hispanic)",
        "black":"Black",
        "hispanic":"Hispanic",
        "asian":"Asian"
    }

    return {
        "zip": zipcode,
        "total_population": population,
        "poverty_rate_pct": round(poverty_rate*100,2),
        "median_household_income": int(record["B19013_001E"] or 0),
        "food_insecurity_est": food_insecurity(population, poverty_rate),
        "race": race,
        "race_majority": labels[race_majority]
    }

def main():

    dataset = []

    for z in ZIP_CODES:

        try:
            dataset.append(fetch_zip(z))
            print("Fetched", z)

        except:
            print("Skipped", z)

    with open("nyc_zip_demographics.json","w") as f:
        json.dump(dataset,f,indent=2)

if __name__ == "__main__":
    main()