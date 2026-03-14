const { getSupabaseClient } = require("../lib/supabase");
const { demoPantries } = require("../data/mockData");

const DEMO_NAMES = [
  "Bayview Family Pantry",
  "Met Council - SNAP Assistance",
  "Trinity Commons Compassion Market",
  "Trinity Church Brown Bag Lunch Ministry",
];

const NEARBY_ZIPS = ["10013", "10006", "10038", "10005", "10007", "10004", "10280", "10282"];

// Pre-computed percentiles from the full Manhattan.csv (201 rated pantries).
const STATIC_PERCENTILES = {
  "Bayview Family Pantry":                   { ratingPercentile: 100, reviewPercentile: 97, subPercentile: 52 },
  "Met Council - SNAP Assistance":           { ratingPercentile: 45,  reviewPercentile: 88, subPercentile: 91 },
  "Trinity Commons Compassion Market":       { ratingPercentile: 62,  reviewPercentile: 52, subPercentile: 61 },
  "Trinity Church Brown Bag Lunch Ministry": { ratingPercentile: 55,  reviewPercentile: 28, subPercentile: 38 },
};

/**
 * Map a raw Supabase JSONB resource to the shape OperatorPanel expects.
 * Handles both camelCase (LemonTree API) and snake_case (CSV import) field names.
 */
function mapRaw(raw, name) {
  const percentiles = STATIC_PERCENTILES[name] ?? { ratingPercentile: 50, reviewPercentile: 50, subPercentile: 50 };

  return {
    name: raw.name ?? name,
    address: raw.address ?? raw.fullAddress ?? raw.full_address ?? "",
    lat: raw.latitude ?? raw.lat ?? null,
    lng: raw.longitude ?? raw.lng ?? null,
    status: raw.status ?? "PUBLISHED",
    rating: raw.rating ?? raw.ratingAverage ?? raw.rating_average ?? null,
    reviewCount: raw.reviewCount ?? raw.review_count ?? 0,
    subscriptionCount: raw.subscriptionCount ?? raw.subscription_count ?? 0,
    confidence: raw.confidence ?? 0,
    hasShifts: raw.hasShifts ?? raw.has_shifts ?? false,
    hasOccurrences: raw.hasOccurrences ?? raw.has_occurrences ?? false,
    website: raw.website ?? "",
    phone: raw.phone ?? raw.phoneNumber ?? raw.phone_number ?? "",
    openByAppointment: raw.openByAppointment ?? raw.open_by_appointment ?? false,
    appointmentRequired: raw.appointmentRequired ?? raw.appointment_required ?? false,
    usageLimitCount: raw.usageLimitCount ?? raw.usage_limit_count ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    ...percentiles,
  };
}

async function getOperatorPantries(req, res) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return res.json({ source: "static", pantries: demoPantries });
  }

  try {
    const { data: rows, error } = await supabase
      .from("resources")
      .select("raw")
      .eq("status", "PUBLISHED")
      .is("merged_to_resource_id", null)
      .in("zip_code", NEARBY_ZIPS);

    if (error) throw error;

    const rawByName = {};
    for (const row of rows ?? []) {
      const raw = row?.raw;
      if (!raw?.name) continue;
      if (DEMO_NAMES.includes(raw.name)) {
        rawByName[raw.name] = raw;
      }
    }

    const pantries = DEMO_NAMES.map((name, idx) => {
      if (rawByName[name]) {
        return mapRaw(rawByName[name], name);
      }
      console.warn(`[operator/pantries] "${name}" not found in Supabase — using static fallback`);
      return demoPantries[idx];
    });

    res.json({ source: "supabase", pantries });
  } catch (err) {
    console.error("[operator/pantries] Supabase error:", err.message ?? err);
    res.json({ source: "static", pantries: demoPantries });
  }
}

module.exports = { getOperatorPantries };
