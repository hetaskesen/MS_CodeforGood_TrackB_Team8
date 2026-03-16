const { getSupabaseClient } = require("../lib/supabase");
const { getZipGeo } = require("../data/zipGeo");

const PAGE_SIZE = 1000;

// Tag names we count as restrictive (ID, registration, etc.)
const RESTRICTIVE_TAGS = [
  "id required",
  "registration required",
  "appointment only",
  "proof of address required",
  "call in advance",
];

function normalizeTagName(t) {
  if (typeof t === "string") return t.toLowerCase().trim();
  if (t && typeof t.name === "string") return t.name.toLowerCase().trim();
  return "";
}

/**
 * Build access barriers array from list of resources (with raw.tags).
 */
function buildAccessBarriers(resources) {
  const countByTag = new Map();
  resources.forEach((r) => {
    const raw = r.raw || r;
    const tags = r.tags || r.tag_ids || raw.tags || raw.tag_ids || [];
    const list = Array.isArray(tags) ? tags : [];
    list.forEach((t) => {
      const name = normalizeTagName(t);
      if (!name) return;
      const key = name.replace(/\b\w/g, (c) => c.toUpperCase());
      countByTag.set(key, (countByTag.get(key) || 0) + 1);
    });
  });
  const total = resources.length;
  const barriers = [];
  const preferOrder = [
    "ID required",
    "First come, first serve",
    "Registration required",
    "Appointment only",
    "Proof of address required",
    "Fresh produce available",
  ];
  preferOrder.forEach((tag) => {
    const c = countByTag.get(tag) || 0;
    if (c > 0) {
      barriers.push({
        tag,
        count: c,
        pct: Math.round((c / total) * 100),
        restrictive: RESTRICTIVE_TAGS.some((x) => tag.toLowerCase().includes(x)),
      });
    }
  });
  // Add any other tags not in preferOrder
  countByTag.forEach((count, tag) => {
    if (!preferOrder.includes(tag)) {
      barriers.push({
        tag,
        count,
        pct: Math.round((count / total) * 100),
        restrictive: RESTRICTIVE_TAGS.some((x) => tag.toLowerCase().includes(x)),
      });
    }
  });
  return barriers.sort((a, b) => b.count - a.count);
}

/**
 * Normalize resource type for grouping (resource_type_name or raw.resourceType).
 */
function getResourceTypeName(r) {
  const raw = r.raw || r;
  const name = r.resource_type_name || raw.resource_type_name || raw.resourceType?.name || raw.resourceType?.id;
  return (name || "").toUpperCase().replace(/\s+/g, "_");
}

async function getGovData(req, res) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(503).json({
      error: "Supabase not configured",
      hint: "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env",
    });
  }

  try {
    // ── 1) Fetch all resources (published + unavailable) for counts and tags ──
    const resourceRows = [];
    let from = 0;
    let hasMore = true;
    const resourceQuery = supabase
      .from("resources")
      .select("id, status, zip_code, borough, resource_type_name, rating_average, raw")
      .or("merged_to_resource_id.is.null,merged_to_resource_id.eq.")
      .order("id", { ascending: true });

    while (hasMore) {
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await resourceQuery.range(from, to);
      if (error) throw error;
      const page = data || [];
      resourceRows.push(...page);
      hasMore = page.length === PAGE_SIZE;
      from += PAGE_SIZE;
    }

    const totalResources = resourceRows.length;
    const published = resourceRows.filter((r) => (r.status || "").toUpperCase() === "PUBLISHED");
    const publishedCount = published.length;
    const unavailableCount = totalResources - publishedCount;
    const unavailableRate = totalResources ? Math.round((unavailableCount / totalResources) * 100) : 0;

    const withRating = published.filter((r) => r.rating_average != null && !Number.isNaN(Number(r.rating_average)));
    const totalRated = withRating.length;
    const avgRating = totalRated
      ? Math.round(withRating.reduce((s, r) => s + Number(r.rating_average), 0) / totalRated * 100) / 100
      : 0;

    const typeCounts = {};
    published.forEach((r) => {
      const t = getResourceTypeName(r) || "OTHER";
      const key = t === "FOOD_PANTRY" ? "foodPantry" : t === "SOUP_KITCHEN" ? "soupKitchen" : t === "COMMUNITY_FRIDGE" ? "communityFridge" : t === "MEAL_DELIVERY" ? "mealDelivery" : "other";
      typeCounts[key] = (typeCounts[key] || 0) + 1;
    });
    if (!typeCounts.other) typeCounts.other = 0;

    const boroughCounts = {};
    resourceRows.forEach((r) => {
      const b = (r.borough || "Unknown").trim();
      if (!b) return;
      const key = b === "Staten Island" ? "StatenIsland" : b;
      if (!boroughCounts[key]) boroughCounts[key] = { total: 0, published: 0, unavailable: 0 };
      boroughCounts[key].total += 1;
      if ((r.status || "").toUpperCase() === "PUBLISHED") boroughCounts[key].published += 1;
      else boroughCounts[key].unavailable += 1;
    });

    // ── 2) Fetch zip_demographics ──
    const { data: zipRows, error: zipError } = await supabase
      .from("zip_demographics")
      .select([
        "zip_code, borough, population, median_income, poverty_rate_pct, demand_proxy",
        "pantry_count, total_resources, pantries_per_10k, demand_proxy_per_pantry",
        "pct_below_alice, alice_households, total_households",
        "fresh_produce_count, halal_kosher_count, no_id_required_count, multilingual_count",
        "pct_limited_english, pct_foreign_born",
        "pct_seniors_65_plus, pct_children_under_5",
        "no_vehicle_rate, housing_burden_rate",
        "resources_within_half_mile, resources_within_1_mile, nearest_resource_miles",
        "appt_only_count, appt_only_share, walk_in_count",
        "confirmed_open_rate, avg_skip_range_count",
      ].join(", "));

    if (zipError) throw zipError;
    const zips = zipRows || [];

    // Underserved: high poverty and/or high demand per pantry (low coverage)
    const needScore = (row) => {
      const poverty = Number(row.poverty_rate_pct) || 0;
      const perPantry = Number(row.demand_proxy_per_pantry) || 0;
      const per10k = Number(row.pantries_per_10k) || 0;
      return poverty * 0.5 + Math.min(perPantry / 400, 40) + (per10k < 1 ? 15 : per10k < 2 ? 5 : 0);
    };

    const underservedFromZips = zips
      .filter((z) => {
        const pop = Number(z.population) || 0;
        const pantryCount = Number(z.pantry_count) || 0;
        const poverty = Number(z.poverty_rate_pct) || 0;
        return pop > 0 && (poverty >= 18 || (pantryCount > 0 && needScore(z) >= 45));
      })
      .sort((a, b) => needScore(b) - needScore(a))
      .slice(0, 30);

    const underservedZips = underservedFromZips.map((z) => {
      const geo = getZipGeo(z.zip_code);
      const poverty = Number(z.poverty_rate_pct) || 0;
      const population = Number(z.population) || 0;
      const pantryCount = Number(z.pantry_count) || 0;
      const demandProxy = Number(z.demand_proxy) || 0;
      const snapPerPantry = pantryCount > 0 ? Math.round((z.demand_proxy_per_pantry || 0)) : 0;
      const alicePct = Number(z.pct_below_alice) || null;
      const aliceHouseholds = Number(z.alice_households) || 0;
      const alicePerPantry = pantryCount > 0 && aliceHouseholds ? Math.round(aliceHouseholds / pantryCount) : 0;
      const aliceGap = alicePct != null ? Math.round((alicePct - poverty) * 10) / 10 : null;
      return {
        zip: String(z.zip_code),
        neighborhood: geo.neighborhood,
        borough: z.borough || "Unknown",
        poverty: Math.round(poverty * 100) / 100,
        foodInsecurity: demandProxy,
        population,
        pantryCount,
        snapPerPantry,
        needScore: Math.round(needScore(z) * 10) / 10,
        medianIncome: Number(z.median_income) || null,
        lat: geo.lat,
        lng: geo.lng,
        bounds: geo.bounds,
        // ALICE fields
        alicePct,
        aliceHouseholds,
        alicePerPantry,
        aliceGap,
        pantriesPer10k: Number(z.pantries_per_10k) || 0,
        // Demographic access fields
        freshProduceCount: Number(z.fresh_produce_count) || 0,
        halalKosherCount: Number(z.halal_kosher_count) || 0,
        noIdRequiredCount: Number(z.no_id_required_count) || 0,
        multilingualCount: Number(z.multilingual_count) || 0,
        pctLimitedEnglish: Number(z.pct_limited_english) || 0,
        pctForeignBorn: Number(z.pct_foreign_born) || 0,
        pctSeniors: Number(z.pct_seniors_65_plus) || 0,
        noVehicleRate: Number(z.no_vehicle_rate) || 0,
        resourcesWithinHalfMile: Number(z.resources_within_half_mile) || 0,
        apptOnlyShare: Number(z.appt_only_share) || 0,
        confirmedOpenRate: Number(z.confirmed_open_rate) || 0,
        avgSkipRangeCount: Number(z.avg_skip_range_count) || 0,
      };
    });

    const zeroPantryZips = zips
      .filter((z) => (Number(z.pantry_count) || 0) === 0 && (Number(z.population) || 0) > 0)
      .sort((a, b) => (Number(b.population) || 0) - (Number(a.population) || 0))
      .slice(0, 20)
      .map((z) => {
        const geo = getZipGeo(z.zip_code);
        const poverty = Number(z.poverty_rate_pct) || 0;
        const demandProxy = Number(z.demand_proxy) || 0;
        return {
          zip: String(z.zip_code),
          neighborhood: geo.neighborhood,
          borough: z.borough || "Unknown",
          poverty: Math.round(poverty * 100) / 100,
          foodInsecurity: demandProxy,
          population: Number(z.population) || 0,
          pantryCount: 0,
          needScore: Math.round(needScore(z) * 10) / 10,
          medianIncome: Number(z.median_income) || null,
          lat: geo.lat,
          lng: geo.lng,
          bounds: geo.bounds,
        };
      });

    const underservedZipCodes = new Set(underservedZips.map((z) => z.zip));
    const inUnderserved = resourceRows.filter((r) => underservedZipCodes.has(String(r.zip_code || "").trim()));
    const publishedInUnderserved = inUnderserved.filter((r) => (r.status || "").toUpperCase() === "PUBLISHED").length;
    const unavailableInUnderserved = inUnderserved.length - publishedInUnderserved;
    const pctOfflineInUnderserved = inUnderserved.length
      ? Math.round((unavailableInUnderserved / inUnderserved.length) * 100)
      : 0;

    const barriers = buildAccessBarriers(published);
    const totalPublished = published.length;

    const communityFridgeType = /COMMUNITY_FRIDGE|FRIDGE/i;
    const fridgeResources = published.filter((r) => communityFridgeType.test(getResourceTypeName(r)));
    const fridgeZips = new Map();
    fridgeResources.forEach((r) => {
      const zip = String(r.zip_code || "").trim();
      if (!zip) return;
      fridgeZips.set(zip, (fridgeZips.get(zip) || 0) + 1);
    });
    const totalFridges = fridgeResources.length;
    const inUnderservedZips = fridgeResources.filter((r) => underservedZipCodes.has(String(r.zip_code || "").trim())).length;
    const pctMisaligned = totalFridges ? Math.round(((totalFridges - inUnderservedZips) / totalFridges) * 100) : 0;
    const topZips = Array.from(fridgeZips.entries())
      .map(([zip, count]) => ({ zip, count, underserved: underservedZipCodes.has(zip) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const boroughStats = {};
    ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"].forEach((b) => {
      const key = b === "Staten Island" ? "StatenIsland" : b;
      const stats = boroughCounts[key] || { total: 0, published: 0, unavailable: 0 };
      boroughStats[key] = stats;
    });

    // ── 3) ALICE city-wide summary ──
    const aliceBoroughMap = {};
    let totalHH = 0;
    let totalBelowAlice = 0;
    zips.forEach((z) => {
      const hh = Number(z.total_households) || 0;
      const alicePct = Number(z.pct_below_alice) || 0;
      const belowAlice = Math.round(hh * alicePct / 100);
      totalHH += hh;
      totalBelowAlice += belowAlice;
      const b = (z.borough || "Unknown").trim();
      if (!aliceBoroughMap[b]) aliceBoroughMap[b] = { totalHH: 0, belowAliceHH: 0, alicePctSum: 0, count: 0 };
      aliceBoroughMap[b].totalHH += hh;
      aliceBoroughMap[b].belowAliceHH += belowAlice;
      aliceBoroughMap[b].alicePctSum += alicePct;
      aliceBoroughMap[b].count += 1;
    });
    const aliceSummary = {
      totalHouseholds: totalHH,
      householdsBelowAlice: totalBelowAlice,
      pctBelowAlice: totalHH > 0 ? Math.round((totalBelowAlice / totalHH) * 1000) / 10 : 0,
      boroughs: Object.entries(aliceBoroughMap)
        .filter(([b]) => b !== "Unknown")
        .map(([borough, d]) => ({
          borough,
          avgAlicePct: d.count > 0 ? Math.round((d.alicePctSum / d.count) * 10) / 10 : 0,
          totalHH: d.totalHH,
          belowAliceHH: d.belowAliceHH,
        }))
        .sort((a, b) => b.avgAlicePct - a.avgAlicePct),
    };

    // ── 4) Language access gaps (>15% limited English, 0 multilingual resources) ──
    const languageGaps = zips
      .filter((z) => (Number(z.pct_limited_english) || 0) > 0.15 && (Number(z.multilingual_count) || 0) === 0)
      .sort((a, b) => (Number(b.pct_limited_english) || 0) - (Number(a.pct_limited_english) || 0))
      .slice(0, 10)
      .map((z) => {
        const geo = getZipGeo(z.zip_code);
        return {
          zip: String(z.zip_code),
          borough: z.borough || "Unknown",
          neighborhood: geo.neighborhood,
          pctLimitedEnglish: Math.round((Number(z.pct_limited_english) || 0) * 1000) / 10,
          pctForeignBorn: Math.round((Number(z.pct_foreign_born) || 0) * 1000) / 10,
          pantryCount: Number(z.pantry_count) || 0,
          population: Number(z.population) || 0,
        };
      });

    // ── 5) Transit/proximity gaps (high no-vehicle rate + low walkable resources) ──
    const transitGaps = zips
      .filter((z) => (Number(z.no_vehicle_rate) || 0) > 0.25 && (Number(z.resources_within_half_mile) || 0) < 2)
      .sort((a, b) => (Number(b.no_vehicle_rate) || 0) - (Number(a.no_vehicle_rate) || 0))
      .slice(0, 10)
      .map((z) => {
        const geo = getZipGeo(z.zip_code);
        return {
          zip: String(z.zip_code),
          borough: z.borough || "Unknown",
          neighborhood: geo.neighborhood,
          noVehicleRate: Math.round((Number(z.no_vehicle_rate) || 0) * 1000) / 10,
          resourcesWithinHalfMile: Number(z.resources_within_half_mile) || 0,
          nearestResourceMiles: Math.round((Number(z.nearest_resource_miles) || 0) * 10) / 10,
          population: Number(z.population) || 0,
          pantryCount: Number(z.pantry_count) || 0,
          poverty: Math.round((Number(z.poverty_rate_pct) || 0) * 100) / 100,
        };
      });

    // ── 6) Dietary access gaps (pantries exist but none serve halal/kosher) ──
    const dietaryGaps = zips
      .filter((z) => (Number(z.pantry_count) || 0) > 0 && (Number(z.halal_kosher_count) || 0) === 0)
      .sort((a, b) => (Number(b.demand_proxy) || 0) - (Number(a.demand_proxy) || 0))
      .slice(0, 10)
      .map((z) => {
        const geo = getZipGeo(z.zip_code);
        return {
          zip: String(z.zip_code),
          borough: z.borough || "Unknown",
          neighborhood: geo.neighborhood,
          pantryCount: Number(z.pantry_count) || 0,
          halalKosherCount: 0,
          population: Number(z.population) || 0,
          poverty: Math.round((Number(z.poverty_rate_pct) || 0) * 100) / 100,
        };
      });

    // ── 7) Service reliability gaps (high closure frequency in high-poverty ZIPs) ──
    const reliabilityGaps = zips
      .filter((z) => (Number(z.avg_skip_range_count) || 0) > 2 && (Number(z.poverty_rate_pct) || 0) > 20)
      .sort((a, b) => (Number(b.avg_skip_range_count) || 0) - (Number(a.avg_skip_range_count) || 0))
      .slice(0, 10)
      .map((z) => {
        const geo = getZipGeo(z.zip_code);
        return {
          zip: String(z.zip_code),
          borough: z.borough || "Unknown",
          neighborhood: geo.neighborhood,
          avgSkipRangeCount: Math.round((Number(z.avg_skip_range_count) || 0) * 10) / 10,
          confirmedOpenRate: Math.round((Number(z.confirmed_open_rate) || 0) * 1000) / 10,
          pantryCount: Number(z.pantry_count) || 0,
          poverty: Math.round((Number(z.poverty_rate_pct) || 0) * 100) / 100,
        };
      });

    // ── 8) Senior access barriers (high senior pop + most resources appointment-only) ──
    const seniorAccessGaps = zips
      .filter((z) => (Number(z.pct_seniors_65_plus) || 0) > 0.15 && (Number(z.appt_only_share) || 0) > 0.5)
      .sort((a, b) => (Number(b.pct_seniors_65_plus) || 0) - (Number(a.pct_seniors_65_plus) || 0))
      .slice(0, 10)
      .map((z) => {
        const geo = getZipGeo(z.zip_code);
        return {
          zip: String(z.zip_code),
          borough: z.borough || "Unknown",
          neighborhood: geo.neighborhood,
          pctSeniors: Math.round((Number(z.pct_seniors_65_plus) || 0) * 1000) / 10,
          apptOnlyShare: Math.round((Number(z.appt_only_share) || 0) * 1000) / 10,
          walkInCount: Number(z.walk_in_count) || 0,
          pantryCount: Number(z.pantry_count) || 0,
          population: Number(z.population) || 0,
        };
      });

    // ── 9) Borough-level reliability summary (for VisualizationBuilder) ──
    const boroughReliability = {};
    zips.forEach((z) => {
      const b = (z.borough || "Unknown").trim();
      if (b === "Unknown") return;
      if (!boroughReliability[b]) boroughReliability[b] = { confirmedOpenRateSum: 0, avgSkipSum: 0, count: 0 };
      boroughReliability[b].confirmedOpenRateSum += Number(z.confirmed_open_rate) || 0;
      boroughReliability[b].avgSkipSum += Number(z.avg_skip_range_count) || 0;
      boroughReliability[b].count += 1;
    });
    const boroughReliabilityStats = Object.entries(boroughReliability).map(([borough, d]) => ({
      borough,
      avgConfirmedOpenRate: d.count > 0 ? Math.round((d.confirmedOpenRateSum / d.count) * 1000) / 10 : 0,
      avgSkipRangeCount: d.count > 0 ? Math.round((d.avgSkipSum / d.count) * 10) / 10 : 0,
    }));

    const zipDemographics = zips.map(z => ({
      zip:                String(z.zip_code),
      borough:            z.borough || "Unknown",
      population:         Number(z.population) || 0,
      medianIncome:       Number(z.median_income) || 0,
      povertyRatePct:     Number(z.poverty_rate_pct) || 0,
      alicePct:           Number(z.pct_below_alice) || 0,
      pantryCount:        Number(z.pantry_count) || 0,
      pantriesPer10k:     Number(z.pantries_per_10k) || 0,
      confirmedOpenRate:  Math.round((Number(z.confirmed_open_rate) || 0) * 100),
      avgSkipRangeCount:  Number(z.avg_skip_range_count) || 0,
      noVehicleRate:      Math.round((Number(z.no_vehicle_rate) || 0) * 100),
      apptOnlyShare:      Math.round((Number(z.appt_only_share) || 0) * 100),
      pctLimitedEnglish:  Math.round((Number(z.pct_limited_english) || 0) * 100),
      multilingualCount:  Number(z.multilingual_count) || 0,
      noIdRequiredCount:  Number(z.no_id_required_count) || 0,
      freshProduceCount:  Number(z.fresh_produce_count) || 0,
      halalKosherCount:   Number(z.halal_kosher_count) || 0,
      pctSeniors:         Math.round((Number(z.pct_seniors_65_plus) || 0) * 100),
      pctChildren:        Math.round((Number(z.pct_children_under_5) || 0) * 100),
      pctForeignBorn:     Math.round((Number(z.pct_foreign_born) || 0) * 100),
      housingBurdenRate:  Math.round((Number(z.housing_burden_rate) || 0) * 100),
      needScore:          Number(z.demand_proxy) || 0,
      raceMajority:       z.race_majority || "Unknown",
    }));

    res.json({
      zipDemographics,
      systemStats: {
        totalResources,
        publishedResources: publishedCount,
        unavailableResources: unavailableCount,
        unavailableRate,
        totalRated,
        avgRating,
        resourceTypes: {
          foodPantry: typeCounts.foodPantry || 0,
          soupKitchen: typeCounts.soupKitchen || 0,
          communityFridge: typeCounts.communityFridge || 0,
          mealDelivery: typeCounts.mealDelivery || 0,
          snapEbt: typeCounts.snapEbt || 0,
        },
      },
      underservedZips,
      zeroPantryZips,
      reliability: {
        unavailableInUnderservedZips: unavailableInUnderserved,
        publishedInUnderservedZips: publishedInUnderserved,
        pctOfflineInUnderserved,
      },
      accessBarriers: { totalPublished, barriers },
      communityFridges: {
        total: totalFridges,
        inUnderservedZips,
        pctMisaligned,
        topZips,
      },
      boroughStats,
      aliceSummary,
      languageGaps,
      transitGaps,
      dietaryGaps,
      reliabilityGaps,
      seniorAccessGaps,
      boroughReliabilityStats,
    });
  } catch (err) {
    console.error("[gov/data] error:", err.message || err);
    res.status(502).json({ error: err.message || "Failed to load government data" });
  }
}

module.exports = { getGovData };
