export const BOROUGH_COLORS = {
  Manhattan:      "#93C5FD",
  Brooklyn:       "#FCD34D",
  Queens:         "#6EE7B7",
  Bronx:          "#FCA5A5",
  "Staten Island": "#C4B5FD",
  Unknown:        "#D1D5DB",
};

export const BOROUGH_DISPLAY_NAMES = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
];

export const BOROUGH_KEY_MAP = {
  manhattan:    "Manhattan",
  brooklyn:     "Brooklyn",
  queens:       "Queens",
  bronx:        "Bronx",
  staten_island: "Staten Island",
};

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
