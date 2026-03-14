export const CENSUS_LAYERS = {
  poverty: {
    label: "Poverty rate",
    field: "povertyRate",
    format: (v) => `${Math.round(v * 100)}%`,
    legend: [
      { label: "High  >35%",  color: "#E24B4A", opacity: 0.55 },
      { label: "Med  20–35%", color: "#EF9F27", opacity: 0.45 },
      { label: "Low  <20%",   color: "#EF9F27", opacity: 0.18 },
    ],
    getStyle: (tract) => {
      const r = tract.povertyRate;
      const color = r > 0.35 ? "#E24B4A" : "#EF9F27";
      const opacity = r > 0.35 ? 0.55 : r > 0.20 ? 0.45 : 0.18;
      return { color, opacity };
    },
  },
  income: {
    label: "Median income",
    field: "medianIncome",
    format: (v) => `$${v.toLocaleString()}`,
    legend: [
      { label: "High  >$70k", color: "#1D9E75", opacity: 0.55 },
      { label: "Med  $40–70k", color: "#EF9F27", opacity: 0.40 },
      { label: "Low  <$40k",  color: "#E24B4A", opacity: 0.50 },
    ],
    getStyle: (tract) => {
      const inc = tract.medianIncome;
      if (inc > 70000) return { color: "#1D9E75", opacity: 0.55 };
      if (inc > 40000) return { color: "#EF9F27", opacity: 0.40 };
      return { color: "#E24B4A", opacity: 0.50 };
    },
  },
  population: {
    label: "Population density",
    field: "population",
    format: (v) => v.toLocaleString(),
    legend: [
      { label: "High  >15k", color: "#185FA5", opacity: 0.55 },
      { label: "Med  5–15k", color: "#378ADD", opacity: 0.40 },
      { label: "Low  <5k",   color: "#B5D4F4", opacity: 0.35 },
    ],
    getStyle: (tract) => {
      const pop = tract.population;
      if (pop > 15000) return { color: "#185FA5", opacity: 0.55 };
      if (pop > 5000)  return { color: "#378ADD", opacity: 0.40 };
      return { color: "#B5D4F4", opacity: 0.35 };
    },
  },
  foodDesert: {
    label: "Food desert",
    field: "lowAccess1mi",
    format: () => "Low access zone",
    legend: [
      { label: "Food desert", color: "#7F77DD", opacity: 0.45 },
    ],
    getStyle: (tract) => ({
      color: tract.lowAccess1mi ? "#7F77DD" : "transparent",
      opacity: tract.lowAccess1mi ? 0.45 : 0,
    }),
  },
};

// ============================================================
// MOCK DATA — Replace with real API calls in production
// ============================================================

// --- Resources (pantries & soup kitchens) ---
export const resources = [
  {
    id: "res_001",
    name: "Highland Park Food Bank",
    type: "FOOD_PANTRY",
    lat: 40.718,
    lng: -73.992,
    rating: 4.5,
    waitTime: 12,
    reviews: 78,
    confidence: 0.92,
    address: "142 Highland Ave, New York, NY 10002",
    zipCode: "10002",
    tags: ["Fresh produce", "Canned goods", "Baby items"],
    ratingTrend: [4.1, 4.2, 4.3, 4.4, 4.5, 4.5],
    waitTrend: [15, 14, 13, 12, 12, 12],
    gotHelpRate: 0.94,
    infoAccuracy: 0.91,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  },
  {
    id: "res_002",
    name: "Bayview Family Pantry",
    type: "FOOD_PANTRY",
    lat: 40.708,
    lng: -74.005,
    rating: 3.3,
    waitTime: 38,
    reviews: 41,
    confidence: 0.88,         // listing completeness score (source: lemontree_nyc.csv)
    address: "205 Canal Street, New York, NY 10013",
    zipCode: "10013",
    tags: ["ID required"],
    ratingTrend: [3.5, 3.4, 3.4, 3.3, 3.3, 3.3],
    waitTrend: [30, 33, 35, 37, 38, 38],
    gotHelpRate: 0.74,
    infoAccuracy: 0.61,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],

    // ── Real CSV fields (source: lemontree_nyc.csv) ──────────────────
    status: "PUBLISHED",
    subscriptionCount: 30,
    hasShifts: true,
    hasOccurrences: true,
    website: "",
    phone: "(347) 856-8500",
    openByAppointment: false,
    appointmentRequired: false,
    usageLimitCount: null,
    usageLimitInterval: "",
    regionsServed: [],
    listingFields: {
      hasPhone: true,
      hasWebsite: false,
      hasTags: true,
      hasUsageLimit: false,
      hasShifts: true,
      hasOccurrences: true,
      hasRegions: false,
    },
    subscriptionTrend: [
      { month: "Oct", count: 18 },
      { month: "Nov", count: 21 },
      { month: "Dec", count: 24 },
      { month: "Jan", count: 26 },
      { month: "Feb", count: 28 },
      { month: "Mar", count: 30 },
    ],
  },
  {
    id: "res_003",
    name: "Mission Street Pantry",
    type: "FOOD_PANTRY",
    lat: 40.713,
    lng: -73.998,
    rating: 3.4,
    waitTime: 35,
    reviews: 52,
    confidence: 0.81,
    address: "88 Mission St, New York, NY 10004",
    zipCode: "10004",
    tags: ["Fresh produce", "Dairy"],
    ratingTrend: [3.6, 3.5, 3.5, 3.4, 3.4, 3.4],
    waitTrend: [28, 30, 32, 34, 35, 35],
    gotHelpRate: 0.79,
    infoAccuracy: 0.72,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  },
  {
    id: "res_004",
    name: "Riverside Kitchen",
    type: "SOUP_KITCHEN",
    lat: 40.722,
    lng: -73.985,
    rating: 4.1,
    waitTime: 20,
    reviews: 61,
    confidence: 0.88,
    address: "310 Riverside Dr, New York, NY 10025",
    zipCode: "10025",
    tags: ["Hot meals", "Vegetarian options"],
    ratingTrend: [3.9, 3.9, 4.0, 4.0, 4.1, 4.1],
    waitTrend: [24, 22, 21, 20, 20, 20],
    gotHelpRate: 0.91,
    infoAccuracy: 0.88,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  },
  {
    id: "res_005",
    name: "South Ave Meals",
    type: "SOUP_KITCHEN",
    lat: 40.703,
    lng: -74.012,
    rating: 2.5,
    waitTime: 48,
    reviews: 32,
    confidence: 0.65,
    address: "45 South Ave, New York, NY 10006",
    zipCode: "10006",
    tags: ["Hot meals"],
    ratingTrend: [2.9, 2.8, 2.7, 2.6, 2.5, 2.5],
    waitTrend: [40, 42, 44, 46, 48, 48],
    gotHelpRate: 0.58,
    infoAccuracy: 0.45,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  },
  {
    id: "res_006",
    name: "Northgate Community Pantry",
    type: "FOOD_PANTRY",
    lat: 40.725,
    lng: -74.001,
    rating: 4.2,
    waitTime: 18,
    reviews: 45,
    confidence: 0.89,
    address: "15 Northgate Blvd, New York, NY 10014",
    zipCode: "10014",
    tags: ["Fresh produce", "Canned goods", "Hygiene products"],
    ratingTrend: [3.8, 3.9, 4.0, 4.1, 4.2, 4.2],
    waitTrend: [22, 20, 19, 18, 18, 18],
    gotHelpRate: 0.92,
    infoAccuracy: 0.95,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  },
  {
    id: "res_007",
    name: "Westside Food Share",
    type: "FOOD_PANTRY",
    lat: 40.711,
    lng: -74.015,
    rating: 3.9,
    waitTime: 22,
    reviews: 33,
    confidence: 0.83,
    address: "220 West Side Hwy, New York, NY 10013",
    zipCode: "10013",
    tags: ["Canned goods", "Bread", "Fresh produce"],
    ratingTrend: [3.7, 3.7, 3.8, 3.8, 3.9, 3.9],
    waitTrend: [25, 24, 23, 22, 22, 22],
    gotHelpRate: 0.86,
    infoAccuracy: 0.82,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  },
  {
    id: "res_008",
    name: "Civic District Meals",
    type: "SOUP_KITCHEN",
    lat: 40.706,
    lng: -73.997,
    rating: 2.8,
    waitTime: 42,
    reviews: 67,
    confidence: 0.72,
    address: "55 Civic Center Dr, New York, NY 10007",
    zipCode: "10007",
    tags: ["Hot meals", "Coffee"],
    ratingTrend: [3.1, 3.0, 2.9, 2.9, 2.8, 2.8],
    waitTrend: [35, 37, 39, 40, 42, 42],
    gotHelpRate: 0.66,
    infoAccuracy: 0.54,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  },
];

// --- Feedback theme breakdown per resource ---
export const feedbackThemes = {
  res_001: [
    { theme: "Staff kindness", pct: 85, sentiment: "positive" },
    { theme: "Fresh produce", pct: 72, sentiment: "positive" },
    { theme: "Short wait", pct: 68, sentiment: "positive" },
    { theme: "Limited hours", pct: 22, sentiment: "negative" },
  ],
  res_002: [
    { theme: "Long wait", pct: 62, sentiment: "negative" },
    { theme: "Limited variety", pct: 45, sentiment: "negative" },
    { theme: "Wrong hours", pct: 38, sentiment: "negative" },
    { theme: "Staff kindness", pct: 71, sentiment: "positive" },
  ],
  res_005: [
    { theme: "Long wait", pct: 78, sentiment: "negative" },
    { theme: "Wrong hours", pct: 56, sentiment: "negative" },
    { theme: "Food quality", pct: 44, sentiment: "negative" },
    { theme: "Accessible location", pct: 52, sentiment: "positive" },
  ],
  res_008: [
    { theme: "Long wait", pct: 65, sentiment: "negative" },
    { theme: "Food quality", pct: 48, sentiment: "negative" },
    { theme: "Wrong hours", pct: 35, sentiment: "negative" },
    { theme: "Hot meals available", pct: 60, sentiment: "positive" },
  ],
  // ── Demo pantry themes (Operator dashboard) ──────────────────────────
  demo_001: [
    { theme: "Long wait", pct: 62, sentiment: "negative" },
    { theme: "Limited variety", pct: 45, sentiment: "negative" },
    { theme: "Wrong hours posted", pct: 38, sentiment: "negative" },
    { theme: "Staff kindness", pct: 71, sentiment: "positive" },
  ],
  demo_002: [
    { theme: "Staff kindness", pct: 88, sentiment: "positive" },
    { theme: "Good variety", pct: 81, sentiment: "positive" },
    { theme: "Short wait", pct: 74, sentiment: "positive" },
    { theme: "Early closing time", pct: 18, sentiment: "negative" },
  ],
  demo_003: [
    { theme: "Welcoming staff", pct: 86, sentiment: "positive" },
    { theme: "Fresh produce", pct: 79, sentiment: "positive" },
    { theme: "Registration process", pct: 28, sentiment: "negative" },
    { theme: "Limited hours", pct: 22, sentiment: "negative" },
  ],
  demo_004: [
    { theme: "Long wait", pct: 81, sentiment: "negative" },
    { theme: "Wrong hours posted", pct: 72, sentiment: "negative" },
    { theme: "Limited variety", pct: 64, sentiment: "negative" },
    { theme: "Convenient location", pct: 44, sentiment: "positive" },
  ],
};

// --- Census tract data for government overlay ---
export const censusTracts = [
  { id: "t1", name: "Northgate", bounds: [[40.723, -74.008], [40.728, -73.995]], povertyRate: 0.18, population: 6200, medianIncome: 42000 },
  { id: "t2", name: "Highland Park", bounds: [[40.716, -73.995], [40.723, -73.982]], povertyRate: 0.12, population: 8100, medianIncome: 55000 },
  { id: "t3", name: "Mission", bounds: [[40.710, -74.003], [40.716, -73.993]], povertyRate: 0.28, population: 9400, medianIncome: 31000 },
  { id: "t4", name: "Westside", bounds: [[40.708, -74.018], [40.714, -74.003]], povertyRate: 0.35, population: 5800, medianIncome: 26000 },
  { id: "t5", name: "Eastside", bounds: [[40.710, -73.993], [40.716, -73.982]], povertyRate: 0.22, population: 7200, medianIncome: 38000 },
  { id: "t6", name: "Riverside", bounds: [[40.719, -73.990], [40.725, -73.980]], povertyRate: 0.08, population: 4500, medianIncome: 68000 },
  { id: "t7", name: "Bayview", bounds: [[40.703, -74.012], [40.710, -74.000]], povertyRate: 0.42, population: 11200, medianIncome: 22000 },
  { id: "t8", name: "Civic District", bounds: [[40.703, -74.000], [40.710, -73.990]], povertyRate: 0.31, population: 8800, medianIncome: 29000 },
  { id: "t9", name: "South West", bounds: [[40.698, -74.018], [40.703, -74.005]], povertyRate: 0.48, population: 12400, medianIncome: 19000, isGapZone: true },
  { id: "t10", name: "Harbor", bounds: [[40.698, -73.995], [40.705, -73.980]], povertyRate: 0.15, population: 5100, medianIncome: 52000 },
];

// --- Donor portfolio ---
export const donorPortfolio = {
  donorName: "Metro Community Foundation",
  totalInvestment: 125000,
  fundedResourceIds: ["res_001", "res_002", "res_006"],
  periodStart: "2025-09-01",
  periodEnd: "2026-03-01",
  impactStats: {
    familiesReached: 3247,
    satisfactionDelta: 0.18,
    waitTimeDelta: -0.22,
    resourcesAdded: 3,
  },
  beforeMetrics: {
    avgRating: 3.2,
    avgWait: 36,
    gotHelpRate: 0.68,
    resourceCount: 5,
  },
  currentMetrics: {
    avgRating: 3.8,
    avgWait: 28,
    gotHelpRate: 0.82,
    resourceCount: 8,
  },
};

// --- Demand estimation for government view ---
export const demandEstimates = [
  { tract: "South West", population: 12400, povertyRate: 0.48, estimatedNeed: 890, pantryCapacity: 0, gapScore: 1.0 },
  { tract: "Bayview", population: 11200, povertyRate: 0.42, estimatedNeed: 705, pantryCapacity: 280, gapScore: 0.72 },
  { tract: "Mission", population: 9400, povertyRate: 0.28, estimatedNeed: 394, pantryCapacity: 210, gapScore: 0.55 },
  { tract: "Civic District", population: 8800, povertyRate: 0.31, estimatedNeed: 408, pantryCapacity: 180, gapScore: 0.56 },
  { tract: "Westside", population: 5800, povertyRate: 0.35, estimatedNeed: 304, pantryCapacity: 190, gapScore: 0.38 },
  { tract: "Eastside", population: 7200, povertyRate: 0.22, estimatedNeed: 237, pantryCapacity: 200, gapScore: 0.16 },
  { tract: "Highland Park", population: 8100, povertyRate: 0.12, estimatedNeed: 146, pantryCapacity: 350, gapScore: 0.0 },
  { tract: "Northgate", population: 6200, povertyRate: 0.18, estimatedNeed: 167, pantryCapacity: 220, gapScore: 0.0 },
];

// --- Manhattan benchmarks (computed from lemontree_nyc.csv, 388 pantries) ---
export const manhattanBenchmarks = {
  avgRating: 3.1,
  avgReviewCount: 14,
  avgSubscriptions: 22,
  publishedRate: 69,
  hasWebsiteRate: 38,
  hasShiftsRate: 61,
  totalPantries: 388,
  ratedPantries: 201,
};

// --- Demo pantries for the Operator dashboard switcher ---
export const demoPantries = [
  {
    id: "demo_001",
    name: "Bayview Family Pantry",
    address: "205 Canal Street, New York, NY 10013",
    lat: 40.708, lng: -74.005,
    rating: 3.3,
    waitTime: 38,
    gotHelpRate: 0.74,
    infoAccuracy: 0.61,
    reviews: 41,
    subscriptionCount: 30,
    status: "PUBLISHED",
    confidence: 0.88,
    tags: ["ID required"],
    phone: "(347) 856-8500",
    website: "",
    openByAppointment: false,
    appointmentRequired: false,
    usageLimitCount: null,
    usageLimitInterval: "",
    ratingTrend: [3.5, 3.4, 3.4, 3.3, 3.3, 3.3],
    waitTrend: [30, 33, 35, 37, 38, 38],
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
    subscriptionTrend: [
      { month: "Oct", count: 18 }, { month: "Nov", count: 21 },
      { month: "Dec", count: 24 }, { month: "Jan", count: 26 },
      { month: "Feb", count: 28 }, { month: "Mar", count: 30 },
    ],
    ratingPercentile: 58,
    reviewPercentile: 82,
    subscriptionPercentile: 68,
  },
  {
    id: "demo_002",
    name: "Highland Park Food Bank",
    address: "142 Highland Ave, New York, NY 10002",
    lat: 40.718, lng: -73.992,
    rating: 4.5,
    waitTime: 12,
    gotHelpRate: 0.91,
    infoAccuracy: 0.94,
    reviews: 28,
    subscriptionCount: 45,
    status: "PUBLISHED",
    confidence: 0.97,
    tags: ["First come, first serve"],
    phone: "(212) 555-0100",
    website: "https://highlandparkfoodbank.org",
    openByAppointment: false,
    appointmentRequired: false,
    usageLimitCount: null,
    usageLimitInterval: "",
    ratingTrend: [4.2, 4.3, 4.4, 4.4, 4.5, 4.5],
    waitTrend: [16, 15, 14, 13, 12, 12],
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
    subscriptionTrend: [
      { month: "Oct", count: 30 }, { month: "Nov", count: 35 },
      { month: "Dec", count: 38 }, { month: "Jan", count: 41 },
      { month: "Feb", count: 43 }, { month: "Mar", count: 45 },
    ],
    ratingPercentile: 91,
    reviewPercentile: 74,
    subscriptionPercentile: 88,
  },
  {
    id: "demo_003",
    name: "Northgate Community Pantry",
    address: "15 Northgate Blvd, New York, NY 10014",
    lat: 40.725, lng: -74.001,
    rating: 4.2,
    waitTime: 18,
    gotHelpRate: 0.88,
    infoAccuracy: 0.79,
    reviews: 19,
    subscriptionCount: 31,
    status: "PUBLISHED",
    confidence: 0.91,
    tags: ["Registration required", "ID required"],
    phone: "(718) 555-0200",
    website: "https://northgatecommunity.org",
    openByAppointment: false,
    appointmentRequired: false,
    usageLimitCount: 1,
    usageLimitInterval: "WEEK",
    ratingTrend: [4.1, 4.1, 4.2, 4.2, 4.2, 4.2],
    waitTrend: [16, 17, 18, 18, 18, 18],
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
    subscriptionTrend: [
      { month: "Oct", count: 22 }, { month: "Nov", count: 24 },
      { month: "Dec", count: 26 }, { month: "Jan", count: 28 },
      { month: "Feb", count: 30 }, { month: "Mar", count: 31 },
    ],
    ratingPercentile: 84,
    reviewPercentile: 61,
    subscriptionPercentile: 71,
  },
  {
    id: "demo_004",
    name: "South Ave Meals",
    address: "45 South Ave, New York, NY 10006",
    lat: 40.703, lng: -74.012,
    rating: 2.5,
    waitTime: 48,
    gotHelpRate: 0.58,
    infoAccuracy: 0.44,
    reviews: 9,
    subscriptionCount: 8,
    status: "PUBLISHED",
    confidence: 0.61,
    tags: [],
    phone: "",
    website: "",
    openByAppointment: false,
    appointmentRequired: false,
    usageLimitCount: null,
    usageLimitInterval: "",
    ratingTrend: [2.9, 2.8, 2.7, 2.6, 2.5, 2.5],
    waitTrend: [36, 38, 42, 45, 47, 48],
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
    subscriptionTrend: [
      { month: "Oct", count: 12 }, { month: "Nov", count: 11 },
      { month: "Dec", count: 10 }, { month: "Jan", count: 9 },
      { month: "Feb", count: 9 },  { month: "Mar", count: 8 },
    ],
    ratingPercentile: 21,
    reviewPercentile: 18,
    subscriptionPercentile: 14,
  },
];

// --- Helper: get color from rating ---
export function ratingColor(rating) {
  if (rating >= 3.8) return "#1D9E75";
  if (rating >= 3.0) return "#EF9F27";
  return "#E24B4A";
}

// --- Helper: get poverty color opacity ---
export function povertyOpacity(rate) {
  return Math.min(rate * 0.5, 0.25);
}
