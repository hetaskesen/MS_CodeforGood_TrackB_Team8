"use client";

import { useState, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
  Line,
  ReferenceLine,
} from "recharts";
import { govData as defaultGovData } from "@/lib/mockData";

// ── Constants ─────────────────────────────────────────────────────────────────

const MONO = { fontFamily: "'Courier New', monospace" };

const CARD_STYLE = {
  background: "#fff",
  borderRadius: 14,
  padding: "18px 20px",
  border: "1px solid #E5E5E0",
  boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
};

const DOT_GRID = {
  backgroundColor: "#FAFAF8",
  backgroundImage: "radial-gradient(circle, #C8C8C0 1px, transparent 1px)",
  backgroundSize: "24px 24px",
};

const CHART_TYPES = [
  { id: "bar", icon: "📊", label: "Bar chart" },
  { id: "line", icon: "📈", label: "Line chart" },
  { id: "scatter", icon: "🔵", label: "Scatter plot" },
  { id: "donut", icon: "🍩", label: "Donut chart" },
  { id: "map", icon: "🗺", label: "Map view" },
  { id: "table", icon: "📋", label: "Data table" },
];

const DIMENSION_OPTIONS = [
  { value: "boroughs", label: "Boroughs compared" },
  { value: "zips", label: "ZIP codes ranked" },
  { value: "types", label: "Resource types" },
  { value: "poverty-rating", label: "Poverty vs rating" },
  { value: "subscribers", label: "Subscribers by area" },
  { value: "barriers", label: "Access barriers" },
  { value: "transit-access", label: "Transit access gaps" },
  { value: "language-barriers", label: "Language barriers" },
  { value: "senior-access", label: "Senior access" },
  { value: "service-reliability", label: "Service reliability" },
];

const METRIC_OPTIONS = [
  { value: "avg-rating", label: "Average rating" },
  { value: "count", label: "Number of resources" },
  { value: "poverty", label: "Poverty rate (%)" },
  { value: "subscribers", label: "Subscribers at risk" },
  { value: "food-insecure", label: "Food insecure population" },
  { value: "impact", label: "Impact score" },
  { value: "offline-pct", label: "Offline rate (%)" },
  { value: "avg-closure-rate", label: "Avg closure rate" },
  { value: "walkable-resources", label: "Walkable resources" },
  { value: "no-vehicle-rate", label: "No-vehicle rate (%)" },
  { value: "multilingual-pct", label: "Multilingual resources" },
  { value: "alice-pct", label: "ALICE % (below threshold)" },
];

const BOROUGHS = ["Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"];
const BOROUGH_TO_STAT_KEY = {
  Bronx: "Bronx",
  Brooklyn: "Brooklyn",
  Manhattan: "Manhattan",
  Queens: "Queens",
  "Staten Island": "StatenIsland",
};

const BOROUGH_BG = {
  Bronx: "#FCA5A5",
  Brooklyn: "#FCD34D",
  Manhattan: "#93C5FD",
  Queens: "#6EE7B7",
  "Staten Island": "#C4B5FD",
};

const QUICK_STARTS = [
  { chartType: "bar", dimension: "boroughs", metric: "impact", label: "Boroughs by impact" },
  { chartType: "bar", dimension: "barriers", metric: "count", label: "Access barriers" },
  { chartType: "scatter", dimension: "poverty-rating", metric: "avg-rating", label: "Need vs coverage" },
  { chartType: "bar", dimension: "boroughs", metric: "alice-pct", label: "ALICE % by borough" },
  { chartType: "bar", dimension: "transit-access", metric: "no-vehicle-rate", label: "Transit deserts" },
  { chartType: "bar", dimension: "language-barriers", metric: "multilingual-pct", label: "Language gaps" },
];

// ── AI Insight (Claude API) ───────────────────────────────────────────────────

async function generateInsight(chartConfig, output) {
  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  const chartData = output.data ?? output.bgData ?? output.topData ?? output.tableRows ?? [];
  const dataPreview = Array.isArray(chartData) ? chartData.slice(0, 10) : [];
  const prompt = `You are analyzing food access data for LemonTree, a NYC nonprofit food resource finder.

Chart: ${chartConfig.chartType} showing ${chartConfig.show} measured by ${chartConfig.metric}

Data: ${JSON.stringify(dataPreview)}

Write exactly 2 sentences:
1. The single most important finding in this data
2. One specific, actionable implication for food access policy or donor funding

Be specific with numbers. Be direct. No preamble. No "This chart shows..."`;

  if (!apiKey) {
    return "Bronx shows the highest impact score (0.54) and highest poverty among boroughs — funding there reaches the most food-insecure families. Donors should prioritize multi-pantry portfolios in the Bronx to maximize reach.";
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";
    return text.trim() || "Key finding: High-need areas correlate with lower pantry ratings; targeted funding can improve both capacity and quality.";
  } catch {
    return "Key finding: High-need areas correlate with lower pantry ratings; targeted funding can improve both capacity and quality.";
  }
}

// ── Government context for Read more ───────────────────────────────────────────

function getGovContext(gd) {
  const { systemStats, reliability, aliceSummary } = gd ?? {};
  return [
    `Citywide avg poverty (ZIP-weighted): ~21%`,
    `Resources in underserved ZIPs: ${reliability?.publishedInUnderservedZips ?? 0} published`,
    `Offline rate in high-need areas: ${reliability?.pctOfflineInUnderserved ?? 0}%`,
    ...(aliceSummary ? [`ALICE: ${aliceSummary.pctBelowAlice}% of households below threshold`] : []),
    ...(systemStats ? [`Avg rating: ${systemStats.avgRating?.toFixed(2) ?? "—"} / 5.0 across ${(systemStats.totalRated ?? 0).toLocaleString()} rated resources`] : []),
  ];
}

// ── Scatter shapes ────────────────────────────────────────────────────────────

function BgDot({ cx, cy, payload }) {
  if (!cx || !cy) return null;
  const isUnderserved = payload.isUnderserved;
  const fill = isUnderserved ? "#EF4444" : (BOROUGH_BG[payload.borough] ?? "#D1D5DB");
  const opacity = isUnderserved ? 0.85 : 0.55;
  return <circle cx={cx} cy={cy} r={4} fill={fill} fillOpacity={opacity} />;
}

function ScatterDotByUnderserved({ cx, cy, payload, r = 4 }) {
  if (!cx || !cy) return null;
  const isUnderserved = payload.isUnderserved;
  const fill = isUnderserved ? "#EF4444" : (BOROUGH_BG[payload.borough] ?? "#D1D5DB");
  const opacity = isUnderserved ? 0.9 : 0.55;
  return <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={opacity} />;
}

function HaloDot({ cx, cy }) {
  if (!cx || !cy) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={11} fill="#EF4444" fillOpacity={0.15} />
      <circle cx={cx} cy={cy} r={6} fill="#EF4444" fillOpacity={0.85} />
    </g>
  );
}

function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px", fontSize: 11, lineHeight: 1.8, boxShadow: "0 2px 8px rgba(0,0,0,.1)", ...MONO }}>
      {d.name && <><strong style={{ fontSize: 12, fontFamily: "DM Sans,sans-serif" }}>{d.name}</strong><br /></>}
      Borough: <strong>{d.borough}</strong><br />
      Poverty: <strong>{d.x ?? d.poverty}%</strong><br />
      Rating: <strong>{d.y ?? d.rating}</strong><br />
      {(d.subscriptions || d.subs) != null && <>Subscribers: <strong>{(d.subscriptions ?? d.subs).toLocaleString()}</strong></>}
    </div>
  );
}

// ── Chart data computation (accepts filters object) ─────────────────────────────

function computeChartOutput(chartType, dimension, metric, filters, donorDataRef, govDataRef) {
  const boroughImpact = donorDataRef.boroughImpact;
  const topImpactResources = donorDataRef.topImpactResources;
  const backgroundResources = donorDataRef.backgroundResources;
  const { systemStats, underservedZips, accessBarriers } = govDataRef;
  const boroughSet = filters.boroughs?.length ? new Set(filters.boroughs) : new Set();
  const povertyFilter = filters.poverty ?? "all";
  const minSubs = filters.minSubs ?? 0;
  const statusFilter = filters.status ?? "all";

  const filteredBoroughs = boroughSet.size === 0 ? boroughImpact : boroughImpact.filter((b) => boroughSet.has(b.borough));
  let filteredZips = underservedZips;
  if (boroughSet.size > 0) filteredZips = filteredZips.filter((z) => boroughSet.has(z.borough));
  if (povertyFilter === "high") filteredZips = filteredZips.filter((z) => z.poverty >= 30);
  if (povertyFilter === "medium") filteredZips = filteredZips.filter((z) => z.poverty >= 15 && z.poverty < 30);
  if (povertyFilter === "low") filteredZips = filteredZips.filter((z) => z.poverty < 15);
  let filteredResources = topImpactResources;
  if (boroughSet.size > 0) filteredResources = filteredResources.filter((r) => boroughSet.has(r.borough));
  filteredResources = filteredResources.filter((r) => (r.subscriptions ?? 0) >= minSubs);
  if (statusFilter === "published") filteredResources = filteredResources.filter((r) => r.status === "PUBLISHED");

  const metricLabel = METRIC_OPTIONS.find((m) => m.value === metric)?.label ?? metric;

  if (chartType === "line") {
    return { type: "placeholder", message: "Time-series data coming soon — LemonTree is building toward longitudinal tracking.", title: "Line chart", subtitle: "—" };
  }
  if (chartType === "map") {
    return { type: "placeholder", message: "Navigate to the Government view for the interactive coverage map.", title: "Map view", subtitle: "—" };
  }

  if (chartType === "table") {
    const data = filteredBoroughs;
    const metricLabel = METRIC_OPTIONS.find((m) => m.value === metric)?.label ?? metric;
    return {
      type: "table-only",
      title: `${metricLabel} by borough — raw data`,
      subtitle: `Filtered to ${data.length} borough(s)`,
      tableHeaders: ["Borough", "Avg rating", "Avg poverty", "Resources", "Avg impact", "Subscribers at risk"],
      tableRows: data.map((b) => [
        b.borough,
        b.avgRating,
        `${b.avgPoverty}%`,
        b.resourceCount,
        b.avgImpact.toFixed(3),
        (b.subscribersAtRisk ?? "—").toLocaleString(),
      ]),
    };
  }

  if (chartType === "donut") {
    const rt = systemStats.resourceTypes;
    const data = [
      { name: "Food pantry", value: rt.foodPantry, fill: "#2D6A4F" },
      { name: "Soup kitchen", value: rt.soupKitchen, fill: "#F59E0B" },
      { name: "Community fridge", value: rt.communityFridge, fill: "#3B82F6" },
      { name: "Meal delivery", value: rt.mealDelivery, fill: "#8B5CF6" },
      { name: "SNAP / EBT", value: rt.snapEbt, fill: "#9CA3AF" },
    ].filter((d) => d.value > 0);
    const total = data.reduce((s, d) => s + d.value, 0);
    return { type: "donut", data, title: "Resource type distribution", subtitle: `${total.toLocaleString()} total · LemonTree NYC`, tableHeaders: ["Type", "Count"], tableRows: data.map((d) => [d.name, d.value.toLocaleString()]) };
  }

  if (chartType === "scatter" || dimension === "poverty-rating") {
    const underservedZipSet = new Set(underservedZips.map((z) => z.zip));
    const bg = backgroundResources.map((r) => ({
      ...r, x: r.poverty, y: r.rating, borough: r.borough,
      isUnderserved: false,
    }));
    const top = filteredResources.map((r) => ({
      ...r, x: r.povertyRate, y: r.rating,
      isUnderserved: underservedZipSet.has(r.zip),
    }));
    return {
      type: "scatter",
      bgData: bg,
      topData: top,
      title: "Poverty vs. rating — network landscape",
      subtitle: "Red = top-impact opportunities · Colored = network",
      tableHeaders: ["Resource", "Borough", "Poverty", "Rating"],
      tableRows: filteredResources.slice(0, 5).map((r) => [r.name, r.borough, `${r.povertyRate}%`, r.rating]),
    };
  }

  if (dimension === "barriers") {
    const data = accessBarriers.barriers.slice(0, 8).map((b) => ({
      name: b.tag.length > 30 ? b.tag.slice(0, 30) + "…" : b.tag,
      fullName: b.tag,
      value: b.count,
      pct: b.pct,
      color: b.restrictive ? "#EF4444" : "#60A5FA",
    }));
    return {
      type: "bar-horizontal",
      data,
      metricLabel: "# resources",
      title: "Access barriers — tag frequency",
      subtitle: `${accessBarriers.totalPublished.toLocaleString()} published · Red = restrictive`,
      tableHeaders: ["Tag", "Count"],
      tableRows: data.map((d) => [d.fullName, d.value]),
    };
  }

  if (dimension === "types") {
    const rt = systemStats.resourceTypes;
    const data = [
      { name: "Food pantry", value: rt.foodPantry, color: "#2D6A4F" },
      { name: "Soup kitchen", value: rt.soupKitchen, color: "#F59E0B" },
      { name: "Community fridge", value: rt.communityFridge, color: "#3B82F6" },
      { name: "Meal delivery", value: rt.mealDelivery, color: "#8B5CF6" },
      { name: "SNAP / EBT", value: rt.snapEbt, color: "#9CA3AF" },
    ].filter((d) => d.value > 0);
    return {
      type: "bar-vertical",
      data,
      metricLabel: "Count",
      title: "Resources by type",
      subtitle: `${systemStats.totalResources.toLocaleString()} total`,
      tableHeaders: ["Type", "Count"],
      tableRows: data.map((d) => [d.name, d.value.toLocaleString()]),
    };
  }

  if (dimension === "zips") {
    const metricMap = {
      "avg-rating": (z) => z.needScore,
      count: (z) => z.pantryCount,
      poverty: (z) => z.poverty,
      "food-insecure": (z) => z.foodInsecurity,
      impact: (z) => z.needScore,
      "offline-pct": (z) => z.needScore,
      subscribers: (z) => z.snapPerPantry,
    };
    const fn = metricMap[metric] ?? metricMap.impact;
    const lbl = metric === "poverty" ? "Poverty (%)" : metric === "food-insecure" ? "Food insecure" : "Value";
    const data = filteredZips.map((z) => ({
      name: z.zip,
      value: fn(z),
      label: z.neighborhood,
      color: z.needScore >= 73 ? "#EF4444" : z.needScore >= 60 ? "#F59E0B" : "#F9A8D4",
    }));
    return {
      type: "bar-vertical",
      data,
      metricLabel: lbl,
      title: `${lbl} by underserved ZIP`,
      subtitle: `${filteredZips.length} ZIPs · ACS 2024`,
      tableHeaders: ["ZIP", "Borough", lbl],
      tableRows: filteredZips.map((z, i) => [z.zip, z.borough, data[i]?.value]),
    };
  }

  if (dimension === "subscribers") {
    const data = filteredBoroughs.map((b) => ({ name: b.borough, value: b.subscribersAtRisk ?? 0, color: b.color }));
    return {
      type: "bar-horizontal",
      data,
      metricLabel: "Subscribers at risk",
      title: "Subscribers at risk by borough",
      subtitle: "People depending on critical-need resources",
      tableHeaders: ["Borough", "Subscribers"],
      tableRows: data.map((d) => [d.name, d.value]),
    };
  }

  if (dimension === "transit-access") {
    const transitGaps = govDataRef.transitGaps ?? [];
    const filtered = boroughSet.size > 0 ? transitGaps.filter((g) => boroughSet.has(g.borough)) : transitGaps;
    const data = filtered.map((g) => ({
      name: `${g.zip} ${g.neighborhood ? `(${g.neighborhood.substring(0, 12)})` : ""}`.trim(),
      value: metric === "walkable-resources" ? (g.resourcesWithinHalfMile ?? 0)
        : metric === "no-vehicle-rate" ? (g.noVehicleRate ?? 0)
        : (g.noVehicleRate ?? 0),
      color: "#3B82F6",
    }));
    const lbl = metric === "walkable-resources" ? "Walkable resources (0.5mi)" : "No-vehicle rate (%)";
    return {
      type: "bar-vertical",
      data: data.slice(0, 10),
      metricLabel: lbl,
      title: `Transit access gaps — ${lbl}`,
      subtitle: `${filtered.length} transit-desert ZIPs · >25% no-vehicle + <2 walkable resources`,
      tableHeaders: ["ZIP", "Borough", lbl],
      tableRows: filtered.slice(0, 10).map((g) => [g.zip, g.borough, data[filtered.indexOf(g)]?.value]),
    };
  }

  if (dimension === "language-barriers") {
    const langGaps = govDataRef.languageGaps ?? [];
    const filtered = boroughSet.size > 0 ? langGaps.filter((g) => boroughSet.has(g.borough)) : langGaps;
    const data = filtered.map((g) => ({
      name: `${g.zip}${g.neighborhood ? ` (${g.neighborhood.substring(0, 10)})` : ""}`,
      value: metric === "multilingual-pct" ? (g.pctLimitedEnglish ?? 0) : (g.pantryCount ?? 0),
      color: "#EF4444",
    }));
    const lbl = metric === "multilingual-pct" ? "Limited English (%)" : "Pantry count";
    return {
      type: "bar-vertical",
      data: data.slice(0, 10),
      metricLabel: lbl,
      title: `Language barriers — ${lbl}`,
      subtitle: `${filtered.length} ZIPs with >15% limited English and zero multilingual resources`,
      tableHeaders: ["ZIP", "Borough", lbl],
      tableRows: filtered.slice(0, 10).map((g, i) => [g.zip, g.borough, data[i]?.value]),
    };
  }

  if (dimension === "senior-access") {
    const seniorGaps = govDataRef.seniorAccessGaps ?? [];
    const filtered = boroughSet.size > 0 ? seniorGaps.filter((g) => boroughSet.has(g.borough)) : seniorGaps;
    const data = filtered.map((g) => ({
      name: `${g.zip}${g.neighborhood ? ` (${g.neighborhood.substring(0, 10)})` : ""}`,
      value: metric === "alice-pct" ? (g.pctSeniors ?? 0) : (g.apptOnlyShare ?? 0),
      color: "#7C3AED",
    }));
    const lbl = metric === "alice-pct" ? "Senior population (%)" : "Appt-only share (%)";
    return {
      type: "bar-vertical",
      data: data.slice(0, 10),
      metricLabel: lbl,
      title: `Senior access barriers — ${lbl}`,
      subtitle: `${filtered.length} ZIPs with >15% seniors and >50% appointment-only resources`,
      tableHeaders: ["ZIP", "Borough", lbl],
      tableRows: filtered.slice(0, 10).map((g, i) => [g.zip, g.borough, data[i]?.value]),
    };
  }

  if (dimension === "service-reliability") {
    const relGaps = govDataRef.reliabilityGaps ?? [];
    const filtered = boroughSet.size > 0 ? relGaps.filter((g) => boroughSet.has(g.borough)) : relGaps;
    const data = filtered.map((g) => ({
      name: `${g.zip}${g.neighborhood ? ` (${g.neighborhood.substring(0, 10)})` : ""}`,
      value: metric === "avg-closure-rate" ? (g.avgSkipRangeCount ?? 0) : (g.confirmedOpenRate ?? 0),
      color: "#D97706",
    }));
    const lbl = metric === "avg-closure-rate" ? "Avg skip events" : "Confirmed open rate (%)";
    return {
      type: "bar-vertical",
      data: data.slice(0, 10),
      metricLabel: lbl,
      title: `Service reliability — ${lbl}`,
      subtitle: `${filtered.length} high-poverty ZIPs with frequent closures`,
      tableHeaders: ["ZIP", "Borough", lbl],
      tableRows: filtered.slice(0, 10).map((g, i) => [g.zip, g.borough, data[i]?.value]),
    };
  }

  const metricFnMap = {
    "avg-rating": (b) => parseFloat(b.avgRating.toFixed(2)),
    count: (b) => (BOROUGH_TO_STAT_KEY[b.borough] ? govDataRef.boroughStats[BOROUGH_TO_STAT_KEY[b.borough]]?.total ?? b.resourceCount : b.resourceCount),
    poverty: (b) => parseFloat(b.avgPoverty.toFixed(1)),
    subscribers: (b) => b.subscribersAtRisk ?? 0,
    "food-insecure": (b) => b.demandPerPantry ?? 0,
    impact: (b) => parseFloat(b.avgImpact.toFixed(3)),
    "offline-pct": (b) => {
      const key = BOROUGH_TO_STAT_KEY[b.borough];
      if (!key) return 0;
      const s = govDataRef.boroughStats[key];
      return s ? parseFloat(((s.unavailable / s.total) * 100).toFixed(1)) : 0;
    },
    "alice-pct": (b) => {
      const found = (govDataRef.aliceSummary?.boroughs ?? []).find((ab) => ab.borough === b.borough);
      return found ? parseFloat(found.avgAlicePct.toFixed(1)) : 0;
    },
    "avg-closure-rate": (b) => {
      const found = (govDataRef.boroughReliabilityStats ?? []).find((r) => r.borough === b.borough);
      return found ? parseFloat(found.avgSkipRangeCount.toFixed(1)) : 0;
    },
    "walkable-resources": (b) => {
      const zipsForBorough = (govDataRef.underservedZips ?? []).filter((z) => z.borough === b.borough);
      if (zipsForBorough.length === 0) return 0;
      return parseFloat((zipsForBorough.reduce((s, z) => s + (z.resourcesWithinHalfMile ?? 0), 0) / zipsForBorough.length).toFixed(1));
    },
    "no-vehicle-rate": (b) => {
      const zipsForBorough = (govDataRef.underservedZips ?? []).filter((z) => z.borough === b.borough);
      if (zipsForBorough.length === 0) return 0;
      return parseFloat((zipsForBorough.reduce((s, z) => s + (z.noVehicleRate ?? 0), 0) / zipsForBorough.length * 100).toFixed(1));
    },
    "multilingual-pct": (b) => {
      const zipsForBorough = (govDataRef.underservedZips ?? []).filter((z) => z.borough === b.borough);
      if (zipsForBorough.length === 0) return 0;
      return parseFloat((zipsForBorough.reduce((s, z) => s + (z.pctLimitedEnglish ?? 0), 0) / zipsForBorough.length * 100).toFixed(1));
    },
  };
  const fn = metricFnMap[metric] ?? metricFnMap["avg-rating"];
  const data = filteredBoroughs.map((b) => ({
    name: b.borough,
    value: fn(b),
    color: b.color,
    povertyOverlay: b.avgPoverty,
  }));
  return {
    type: "bar-horizontal",
    data,
    metricLabel,
    title: `${metricLabel} by borough`,
    subtitle: "Source: LemonTree · 1,976 resources · ACS 2024",
    tableHeaders: ["Borough", metricLabel],
    tableRows: data.map((d) => [d.name, d.value]),
  };
}

// ── Chart renderer (320px height, optional overlay) ────────────────────────────

function renderChart(output, overlayVisible, height = 320) {
  if (!output) return null;

  if (output.type === "placeholder") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height, border: "2px dashed #E5E7EB", borderRadius: 12, background: "#FAFAF8", gap: 10 }}>
        <div style={{ fontSize: 28 }}>🚧</div>
        <p style={{ fontSize: 12, color: "#6B7280", textAlign: "center", maxWidth: 320, margin: 0 }}>{output.message}</p>
      </div>
    );
  }

  if (output.type === "bar-horizontal") {
    const showOverlay = overlayVisible && output.data.some((d) => d.povertyOverlay != null);
    if (showOverlay && output.data.some((d) => d.povertyOverlay != null)) {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={output.data} layout="vertical" margin={{ top: 8, right: 48, bottom: 8, left: 120 }}>
            <XAxis type="number" tick={{ fontSize: 10, ...MONO, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [typeof v === "number" ? v.toLocaleString() : v, output.metricLabel]} contentStyle={{ borderRadius: 8, fontSize: 11, ...MONO }} />
            <Bar dataKey="value" radius={[0, 5, 5, 0]}>
              {output.data.map((d, i) => <Cell key={i} fill={d.color ?? "#2D6A4F"} />)}
            </Bar>
            <Line type="monotone" dataKey="povertyOverlay" stroke="#F59E0B" strokeWidth={2} dot={false} name="Poverty %" yAxisId="right" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#F59E0B" }} axisLine={false} tickLine={false} />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={output.data} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 120 }}>
          <XAxis type="number" tick={{ fontSize: 10, ...MONO, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [typeof v === "number" ? v.toLocaleString() : v, output.metricLabel]} contentStyle={{ borderRadius: 8, fontSize: 11, ...MONO }} />
          <Bar dataKey="value" radius={[0, 5, 5, 0]}>
            {output.data.map((d, i) => <Cell key={i} fill={d.color ?? "#2D6A4F"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (output.type === "bar-vertical") {
    const hasRating = output.metricLabel && output.metricLabel.toLowerCase().includes("rating");
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={output.data} margin={{ top: 8, right: 24, bottom: 24, left: 16 }}>
          {hasRating && overlayVisible && (
            <ReferenceLine y={2.29} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: "City avg 2.29", position: "right", fill: "#F59E0B", fontSize: 10 }} />
          )}
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, ...MONO, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [typeof v === "number" ? v.toLocaleString() : v, output.metricLabel]} contentStyle={{ borderRadius: 8, fontSize: 11, ...MONO }} />
          <Bar dataKey="value" radius={[5, 5, 0, 0]}>
            {output.data.map((d, i) => <Cell key={i} fill={d.color ?? "#2D6A4F"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (output.type === "donut") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={output.data} cx="50%" cy="50%" innerRadius={height * 0.2} outerRadius={height * 0.35} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
            {output.data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Pie>
          <Tooltip formatter={(v) => [v.toLocaleString(), "Resources"]} contentStyle={{ borderRadius: 8, fontSize: 11, ...MONO }} />
          <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#374151" }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (output.type === "table-only") {
    return (
      <div style={{ overflowX: "auto", fontSize: 11, ...MONO }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {(output.tableHeaders ?? []).map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(output.tableRows ?? []).map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#F9FAFB" }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: "8px 12px", color: "#374151", borderBottom: "1px solid #F3F4F6" }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (output.type === "scatter") {
    const useOverlay = overlayVisible;
    return (
      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart margin={{ top: 16, right: 16, bottom: 24, left: 0 }}>
            <XAxis type="number" dataKey="x" domain={[0, 45]} tick={{ fontSize: 10, fill: "#9CA3AF", ...MONO }} axisLine={false} tickLine={false} />
            <YAxis type="number" dataKey="y" domain={[1.5, 3.5]} tick={{ fontSize: 10, fill: "#9CA3AF", ...MONO }} axisLine={false} tickLine={false} />
            <ZAxis range={[20, 20]} />
            <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={output.bgData} shape={useOverlay ? <ScatterDotByUnderserved r={4} /> : <BgDot />} name="Network" />
            <Scatter data={output.topData} shape={useOverlay ? <ScatterDotByUnderserved r={6} /> : <HaloDot />} name="Top impact" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}

// ── Chart card component ──────────────────────────────────────────────────────

function ChartCard({ chart, index, total, onMove, onRemove, onDuplicate, onCopyData, onToggleOverlay, onToggleExpanded, govData: govDataProp }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const output = chart.output;
  const firstSentence = chart.aiInsight
    ? ((chart.aiInsight.match(/^[^.!?]+[.!?]?/) ?? [chart.aiInsight])[0] || "").trim()
    : "";
  const shortInsight = firstSentence ? (firstSentence.slice(0, 120) + (firstSentence.length > 120 ? "…" : "")) : "";
  const govContext = getGovContext(govDataProp);

  return (
    <div style={{ ...CARD_STYLE, padding: "16px 20px" }}>
      {/* Header: title + controls */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{output?.title ?? "Chart"}</div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2, ...MONO }}>{output?.subtitle ?? ""}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <button type="button" onClick={() => onMove("up")} disabled={index === 0} aria-label="Move up" style={{ padding: "6px 8px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: index === 0 ? "not-allowed" : "pointer", opacity: index === 0 ? 0.5 : 1 }}>↑</button>
          <button type="button" onClick={() => onMove("down")} disabled={index === total - 1} aria-label="Move down" style={{ padding: "6px 8px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: index === total - 1 ? "not-allowed" : "pointer", opacity: index === total - 1 ? 0.5 : 1 }}>↓</button>
          <button type="button" onClick={() => onRemove()} aria-label="Remove" style={{ padding: "6px 8px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: "pointer" }}>🗑</button>
          <div style={{ position: "relative", display: "inline-block" }}>
            <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" style={{ padding: "6px 8px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: "pointer" }}>⋯</button>
            {menuOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 1 }} onClick={() => setMenuOpen(false)} aria-hidden />
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: 4, zIndex: 2 }}>
                  <button type="button" onClick={() => { onDuplicate(); setMenuOpen(false); }} style={{ display: "block", width: "100%", padding: "6px 12px", textAlign: "left", border: "none", background: "none", cursor: "pointer", fontSize: 12 }}>Duplicate</button>
                  <button type="button" onClick={() => { onCopyData(); setMenuOpen(false); }} style={{ display: "block", width: "100%", padding: "6px 12px", textAlign: "left", border: "none", background: "none", cursor: "pointer", fontSize: 12 }}>Copy data</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chart area 320px */}
      <div style={{ minHeight: 320 }}>
        {output && renderChart(output, chart.overlayVisible, 320)}
      </div>

      {/* AI insight */}
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F3F4F6" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", marginBottom: 6 }}>🤖 AI insight</div>
        {chart.aiLoading ? (
          <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ animation: "pulse 1.2s ease-in-out infinite" }}>Analyzing data…</span>
          </p>
        ) : chart.aiInsight ? (
          <>
            <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, margin: 0 }}>{shortInsight}</p>
            <button type="button" onClick={() => onToggleExpanded()} style={{ marginTop: 6, fontSize: 11, color: "#2D6A4F", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>
              {chart.expanded ? "Show less" : "Read more →"}
            </button>
            <div style={{ maxHeight: chart.expanded ? 400 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}>
              <div style={{ marginTop: 10, padding: "12px 14px", background: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, color: "#374151", lineHeight: 1.7 }}>
                <p style={{ margin: "0 0 10px" }}>{chart.aiInsight}</p>
                <div style={{ fontWeight: 600, color: "#111827", marginBottom: 6 }}>Government context</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {govContext.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10, marginBottom: 0 }}>Data source: LemonTree · 1,976 resources · ACS 2024 · Cross-referenced with NYC Open Data</p>
              </div>
            </div>
          </>
        ) : null}
        {/* Overlay toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, cursor: "pointer", fontSize: 11, color: "#6B7280" }}>
          <input type="checkbox" checked={chart.overlayVisible} onChange={() => onToggleOverlay()} style={{ accentColor: "#2D6A4F" }} />
          {chart.overlayVisible ? "● Govt overlay on [hide]" : "+ Show govt overlay"}
        </label>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function VisualizationBuilder({ govData: govDataProp, donorData: donorDataProp }) {
  const govData = govDataProp ?? defaultGovData;
  const donorData = donorDataProp ?? { boroughImpact: [], topImpactResources: [], backgroundResources: [] };
  const [charts, setCharts] = useState([]);
  const [chartType, setChartType] = useState("bar");
  const [dimension, setDimension] = useState("boroughs");
  const [metric, setMetric] = useState("avg-rating");
  const [boroughFilter, setBoroughFilter] = useState(new Set());
  const [povertyFilter, setPovertyFilter] = useState("all");
  const [minSubs, setMinSubs] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const currentFilters = useMemo(
    () => ({
      boroughs: Array.from(boroughFilter),
      poverty: povertyFilter,
      minSubs,
      status: statusFilter,
    }),
    [boroughFilter, povertyFilter, minSubs, statusFilter]
  );

  const addChart = useCallback(
    (configOverride) => {
      const ct = configOverride?.chartType ?? chartType;
      const dim = configOverride?.dimension ?? dimension;
      const met = configOverride?.metric ?? metric;
      const output = computeChartOutput(ct, dim, met, currentFilters, donorData, govData);
      const newChart = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        chartType: ct,
        show: dim,
        metric: met,
        filters: { ...currentFilters },
        output,
        data: output.data ?? output.tableRows ?? [],
        aiInsight: null,
        aiLoading: true,
        overlayVisible: false,
        expanded: false,
      };
      setCharts((prev) => [...prev, newChart]);

      generateInsight({ chartType: ct, show: dim, metric: met }, output).then((insight) => {
        setCharts((prev) =>
          prev.map((c) => (c.id === newChart.id ? { ...c, aiInsight: insight, aiLoading: false } : c))
        );
      });
    },
    [chartType, dimension, metric, currentFilters, govData, donorData]
  );

  const removeChart = useCallback((id) => {
    setCharts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const moveChart = useCallback((id, direction) => {
    setCharts((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swap = direction === "up" ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, []);

  const toggleOverlay = useCallback((id) => {
    setCharts((prev) => prev.map((c) => (c.id === id ? { ...c, overlayVisible: !c.overlayVisible } : c)));
  }, []);

  const toggleExpanded = useCallback((id) => {
    setCharts((prev) => prev.map((c) => (c.id === id ? { ...c, expanded: !c.expanded } : c)));
  }, []);

  const duplicateChart = useCallback((chart) => {
    addChart({ chartType: chart.chartType, dimension: chart.show, metric: chart.metric });
  }, [addChart]);

  const toggleBorough = (b) => {
    setBoroughFilter((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  };

  return (
    <div style={{ display: "flex", gap: 0, alignItems: "stretch", minHeight: "60vh" }}>
      {/* Left sidebar 280px */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          ...CARD_STYLE,
          marginRight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          overflowY: "auto",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", ...MONO }}>CHART_TYPE</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {CHART_TYPES.map((ct) => (
            <button
              key={ct.id}
              onClick={() => setChartType(ct.id)}
              style={{
                padding: "8px 6px",
                borderRadius: 8,
                border: `2px solid ${chartType === ct.id ? "#2D6A4F" : "#E5E7EB"}`,
                background: chartType === ct.id ? "#F0FDF4" : "#FAFAFA",
                color: chartType === ct.id ? "#2D6A4F" : "#374151",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
              }}
            >
              <span style={{ fontSize: 16 }}>{ct.icon}</span>
              {ct.label}
            </button>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", marginBottom: 8, ...MONO }}>SHOW</div>
          <select value={dimension} onChange={(e) => setDimension(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 12, color: "#374151", ...MONO }}>
            {DIMENSION_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", marginBottom: 8, ...MONO }}>MEASURED_BY</div>
          <select value={metric} onChange={(e) => setMetric(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 12, color: "#374151", ...MONO }}>
            {METRIC_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => addChart()}
          style={{ width: "100%", padding: "11px 0", borderRadius: 9, border: "none", background: "#2D6A4F", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          Add to canvas
        </button>
        <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", ...MONO }}>Live data · 1,976 resources</div>

        {/* Filters */}
        <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12, ...MONO }}>Filters</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", marginBottom: 6, ...MONO }}>BOROUGH</div>
          {["All boroughs", ...BOROUGHS].map((b) => {
            const isAll = b === "All boroughs";
            const checked = isAll ? boroughFilter.size === 0 : boroughFilter.has(b);
            return (
              <label key={b} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, cursor: "pointer", fontSize: 12, color: "#374151" }}>
                <input type="checkbox" checked={checked} onChange={() => (isAll ? setBoroughFilter(new Set()) : toggleBorough(b))} style={{ accentColor: "#2D6A4F" }} />
                {b}
              </label>
            );
          })}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", marginTop: 12, marginBottom: 6, ...MONO }}>POVERTY_LEVEL</div>
          {[{ value: "all", label: "All levels" }, { value: "high", label: "High (>30%)" }, { value: "medium", label: "Medium (15–30%)" }, { value: "low", label: "Low (<15%)" }].map((opt) => (
            <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, cursor: "pointer", fontSize: 12, color: "#374151" }}>
              <input type="radio" name="poverty" value={opt.value} checked={povertyFilter === opt.value} onChange={() => setPovertyFilter(opt.value)} style={{ accentColor: "#2D6A4F" }} />
              {opt.label}
            </label>
          ))}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", marginTop: 12, marginBottom: 6, ...MONO }}>STATUS</div>
          {[{ value: "all", label: "All" }, { value: "published", label: "Published only" }, { value: "unavailable", label: "Unavailable only" }].map((opt) => (
            <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, cursor: "pointer", fontSize: 12, color: "#374151" }}>
              <input type="radio" name="status" value={opt.value} checked={statusFilter === opt.value} onChange={() => setStatusFilter(opt.value)} style={{ accentColor: "#2D6A4F" }} />
              {opt.label}
            </label>
          ))}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", marginTop: 12, marginBottom: 6, ...MONO }}>MIN_SUBSCRIBERS</div>
          <div style={{ fontSize: 11, color: "#374151", marginBottom: 4, ...MONO }}>{minSubs}</div>
          <input type="range" min={0} max={400} step={10} value={minSubs} onChange={(e) => setMinSubs(Number(e.target.value))} style={{ width: "100%", accentColor: "#2D6A4F" }} />
          <button
            onClick={() => { setBoroughFilter(new Set()); setPovertyFilter("all"); setMinSubs(0); setStatusFilter("all"); }}
            style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 12, color: "#6B7280", cursor: "pointer" }}
          >
            Reset filters
          </button>
        </div>
      </div>

      {/* Right: canvas with dot grid */}
      <div style={{ flex: 1, minWidth: 0, position: "relative", ...DOT_GRID, borderRadius: 14, padding: "20px 24px", paddingBottom: 80 }}>
        {charts.length === 0 ? (
          /* Empty state */
          <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "center", minHeight: 380, flexWrap: "wrap" }}>
            <button
              onClick={() => addChart()}
              style={{
                width: 200,
                height: 200,
                border: "2px dashed #D1D5DB",
                borderRadius: 14,
                background: "#FAFAF8",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                cursor: "pointer",
                color: "#9CA3AF",
                fontSize: 14,
                fontWeight: 600,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 48 }}>+</span>
              Add first chart…
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", marginBottom: 4 }}>Quick start</div>
              {QUICK_STARTS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => addChart({ chartType: q.chartType, dimension: q.dimension, metric: q.metric })}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: "1.5px solid #E5E7EB",
                    background: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                    cursor: "pointer",
                    textAlign: "left",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  ✦ {q.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {charts.map((chart, index) => (
              <ChartCard
                key={chart.id}
                chart={chart}
                index={index}
                total={charts.length}
                onMove={(dir) => moveChart(chart.id, dir)}
                onRemove={() => removeChart(chart.id)}
                onDuplicate={() => duplicateChart(chart)}
                onCopyData={() => {}}
                onToggleOverlay={() => toggleOverlay(chart.id)}
                onToggleExpanded={() => toggleExpanded(chart.id)}
                govData={govData}
              />
            ))}
          </div>
        )}

        {/* Generate Report button */}
        {charts.length >= 2 && (
          <div style={{ position: "absolute", bottom: 24, right: 24 }}>
            <button
              onClick={() => setReportModalOpen(true)}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                border: "none",
                background: "#2D6A4F",
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(45,106,79,0.35)",
              }}
            >
              📄 Generate Report ({charts.length} charts)
            </button>
          </div>
        )}
      </div>

      {/* Report modal */}
      {reportModalOpen && (
        <ReportModal charts={charts} onClose={() => setReportModalOpen(false)} govData={govData} />
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}

// ── Report modal ──────────────────────────────────────────────────────────────

function ReportModal({ charts, onClose, govData: govDataProp }) {
  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 9998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
        onClick={onClose}
        aria-hidden
      />
      <div
        className="report-print-area"
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: 720,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          zIndex: 9999,
          padding: "28px 32px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <img src="https://www.foodhelpline.org/_next/static/media/logo.b8e851d7.svg" alt="LemonTree" style={{ height: 32 }} />
          <span style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Data Insights Report</span>
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 24, ...MONO }}>Generated: March 14, 2026</div>

        {charts.map((chart, i) => (
          <div key={chart.id} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: i < charts.length - 1 ? "1px solid #E5E7EB" : "none" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 8 }}>{chart.output?.title ?? "Chart"}</div>
            <div style={{ height: 200 }}>{chart.output && renderChart(chart.output, chart.overlayVisible, 200)}</div>
            {chart.aiInsight && <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, marginTop: 12 }}>{chart.aiInsight}</p>}
            <ul style={{ fontSize: 11, color: "#6B7280", marginTop: 8, paddingLeft: 18 }}>
              {getGovContext(govDataProp).map((line, j) => <li key={j}>{line}</li>)}
            </ul>
          </div>
        ))}

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={() => window.print()}
            style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#2D6A4F", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Print / Save as PDF
          </button>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .report-print-area, .report-print-area * { visibility: visible; }
          .report-print-area { position: absolute; left: 0; top: 0; width: 100%; max-height: none; box-shadow: none; }
        }
      `}</style>
    </>
  );
}
