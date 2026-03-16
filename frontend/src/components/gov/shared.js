// Shared constants and helpers used by multiple Government Panel tab components

// Maps filter select values → govData.boroughStats keys (no spaces, matches backend)
export const BOROUGH_KEY_MAP = {
  manhattan:     "Manhattan",
  brooklyn:      "Brooklyn",
  queens:        "Queens",
  bronx:         "Bronx",
  staten_island: "StatenIsland",
};

// Maps filter select values → display names (with spaces, for UI)
export const BOROUGH_DISPLAY = {
  manhattan:     "Manhattan",
  brooklyn:      "Brooklyn",
  queens:        "Queens",
  bronx:         "Bronx",
  staten_island: "Staten Island",
};

export function needBadge(score) {
  if (score >= 70) return { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" };
  return { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" };
}

export function povertyColor(pct) {
  if (pct >= 30) return "#DC2626";
  if (pct >= 20) return "#D97706";
  return "#374151";
}
