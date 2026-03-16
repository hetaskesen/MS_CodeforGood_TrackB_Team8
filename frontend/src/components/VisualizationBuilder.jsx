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
import { IconTrash, IconSparkles, IconFile } from "./Icons";

// ── Variable catalog — all from real zip_demographics Supabase data ──────────
const VARIABLES = [
  // Need
  { key: "alicePct",          label: "ALICE % below threshold",    unit: "%",  group: "Need",        description: "Households earning above poverty line but below survival budget" },
  { key: "povertyRatePct",    label: "Poverty rate",               unit: "%",  group: "Need",        description: "% of residents below federal poverty line" },
  { key: "needScore",         label: "Food insecurity estimate",   unit: "",   group: "Need",        description: "Estimated food-insecure population per ZIP" },
  // Supply
  { key: "pantryCount",       label: "Pantry count",               unit: "",   group: "Supply",      description: "Number of published food pantries" },
  { key: "pantriesPer10k",    label: "Pantries per 10k residents", unit: "",   group: "Supply",      description: "Coverage normalized by population" },
  { key: "confirmedOpenRate", label: "Confirmed open rate",        unit: "%",  group: "Supply",      description: "% of upcoming occurrences confirmed by pantry" },
  { key: "avgSkipRangeCount", label: "Avg closures per pantry",    unit: "",   group: "Supply",      description: "Average number of closure events per pantry" },
  { key: "freshProduceCount", label: "Fresh produce pantries",     unit: "",   group: "Supply",      description: "Pantries tagged with fresh produce availability" },
  { key: "halalKosherCount",  label: "Halal / Kosher pantries",    unit: "",   group: "Supply",      description: "Dietary-specific resource availability" },
  // Access
  { key: "noVehicleRate",     label: "No vehicle rate",            unit: "%",  group: "Access",      description: "Households without a car — transit dependency" },
  { key: "apptOnlyShare",     label: "Appointment-only share",     unit: "%",  group: "Access",      description: "% of pantries requiring appointments" },
  { key: "pctLimitedEnglish", label: "Limited English speakers",   unit: "%",  group: "Access",      description: "Language barrier to food access" },
  { key: "multilingualCount", label: "Multilingual resources",     unit: "",   group: "Access",      description: "Resources with multilingual support" },
  { key: "noIdRequiredCount", label: "No-ID-required pantries",    unit: "",   group: "Access",      description: "Barrier-free access count" },
  // Demographics
  { key: "population",        label: "Population",                 unit: "",   group: "Demographics", description: "Total ZIP population" },
  { key: "medianIncome",      label: "Median income",              unit: "$",  group: "Demographics", description: "Median household income" },
  { key: "pctSeniors",        label: "Seniors 65+",                unit: "%",  group: "Demographics", description: "Senior population share" },
  { key: "pctChildren",       label: "Children under 5",           unit: "%",  group: "Demographics", description: "Young children population share" },
  { key: "pctForeignBorn",    label: "Foreign-born residents",     unit: "%",  group: "Demographics", description: "Immigrant community size" },
  { key: "housingBurdenRate", label: "Housing burden rate",        unit: "%",  group: "Demographics", description: "Households spending >30% on housing" },
];

const VARIABLE_MAP = Object.fromEntries(VARIABLES.map(v => [v.key, v]));

// Chart types valid for 1 variable (distribution and ranking)
const CHART_TYPES_1VAR = [
  { key: "bar-borough",  label: "Bar by borough",    icon: "▬", desc: "Average per borough, ranked" },
  { key: "bar-zip",      label: "Bar by ZIP (top 20)", icon: "≡", desc: "Top 20 ZIPs ranked" },
  { key: "histogram",    label: "Distribution",      icon: "▨", desc: "How values spread across all ZIPs" },
  { key: "donut",        label: "Donut by borough",  icon: "◎", desc: "Borough share of total" },
  { key: "ranked",       label: "Top & bottom 5",    icon: "↕", desc: "Best and worst ZIPs" },
];

// Chart types valid for 2 variables (relationships)
const CHART_TYPES_2VAR = [
  { key: "scatter",      label: "Scatter plot",      icon: "⬤", desc: "One dot per ZIP, find correlations" },
  { key: "bar-grouped",  label: "Grouped bar",       icon: "▬▬", desc: "Compare two metrics side by side per borough" },
  { key: "bar-color",    label: "Bar + color",       icon: "▬◎", desc: "Rank by first metric, color by second" },
];

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

const QUICK_STARTS = [
  { label: "ALICE % vs pantry coverage",  xVar: "alicePct",         yVar: "pantriesPer10k",    chartType: "scatter" },
  { label: "Poverty by borough",          xVar: "povertyRatePct",   yVar: null,                chartType: "bar-borough" },
  { label: "Most underserved ZIPs",       xVar: "alicePct",         yVar: null,                chartType: "ranked" },
  { label: "Income distribution",         xVar: "medianIncome",     yVar: null,                chartType: "histogram" },
  { label: "Language vs multilingual",    xVar: "pctLimitedEnglish", yVar: "multilingualCount", chartType: "scatter" },
  { label: "Fresh produce by borough",    xVar: "freshProduceCount", yVar: null,               chartType: "donut" },
  { label: "Need vs transit barrier",     xVar: "alicePct",         yVar: "noVehicleRate",     chartType: "bar-grouped" },
  { label: "Poverty + income ranked",     xVar: "povertyRatePct",   yVar: "medianIncome",      chartType: "bar-color" },
];

const BOROUGH_COLORS = {
  Manhattan:     "#93C5FD",
  Brooklyn:      "#FCD34D",
  Queens:        "#6EE7B7",
  Bronx:         "#FCA5A5",
  "Staten Island": "#C4B5FD",
  Unknown:       "#D1D5DB",
};

const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];

function formatVal(val, unit) {
  if (unit === "$") return `$${Number(val).toLocaleString()}`;
  if (unit === "%") return `${val}%`;
  return Number(val).toLocaleString();
}

// ── 1-variable charts ────────────────────────────────────────────────────────

function renderBarBorough(chart, zipDemographics) {
  const v = VARIABLE_MAP[chart.xVar];
  const data = BOROUGHS.map(b => {
    const zips = zipDemographics.filter(z => z.borough === b);
    const avg = zips.length
      ? Math.round((zips.reduce((s, z) => s + (z[chart.xVar] || 0), 0) / zips.length) * 10) / 10
      : 0;
    return { name: b, value: avg, color: BOROUGH_COLORS[b] };
  }).sort((a, b) => b.value - a.value);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20 }}>
        <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
          tickFormatter={val => formatVal(val, v.unit)} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip formatter={val => [formatVal(val, v.unit), v.label]} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map(d => <Cell key={d.name} fill={d.color} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderBarZip(chart, zipDemographics) {
  const v = VARIABLE_MAP[chart.xVar];
  const data = [...zipDemographics]
    .filter(z => z[chart.xVar] != null)
    .sort((a, b) => (b[chart.xVar] || 0) - (a[chart.xVar] || 0))
    .slice(0, 20)
    .map(z => ({
      name: `${z.zip}`,
      value: z[chart.xVar],
      borough: z.borough,
      color: BOROUGH_COLORS[z.borough] ?? "#D1D5DB",
    }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 48, right: 20 }}>
        <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
          tickFormatter={val => formatVal(val, v.unit)} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip formatter={val => [formatVal(val, v.unit), v.label]}
          labelFormatter={label => {
            const d = data.find(r => r.name === label);
            return `${label} — ${d?.borough ?? ""}`;
          }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map(d => <Cell key={d.name} fill={d.color} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderHistogram(chart, zipDemographics) {
  const v = VARIABLE_MAP[chart.xVar];
  const values = zipDemographics.map(z => z[chart.xVar]).filter(val => val != null && !isNaN(val));
  if (!values.length) return <div style={{ color: "#9CA3AF", fontSize: 12, padding: 20 }}>No data</div>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binCount = 10;
  const binWidth = (max - min) / binCount || 1;
  const bins = Array.from({ length: binCount }, (_, i) => {
    const lo = min + i * binWidth;
    const hi = min + (i + 1) * binWidth;
    return {
      range: `${Math.round(lo)}${v.unit}`,
      count: values.filter(val => val >= lo && (i === binCount - 1 ? val <= hi : val < hi)).length,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={bins} margin={{ left: 0, right: 10, bottom: 20 }}>
        <XAxis dataKey="range" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
          label={{ value: "ZIP count", angle: -90, position: "insideLeft", fontSize: 10, fill: "#9CA3AF" }} />
        <Tooltip formatter={val => [val, "ZIP codes"]} />
        <Bar dataKey="count" fill="#93C5FD" fillOpacity={0.85} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderDonut(chart, zipDemographics) {
  const v = VARIABLE_MAP[chart.xVar];
  const data = BOROUGHS.map(b => {
    const zips = zipDemographics.filter(z => z.borough === b);
    const total = zips.reduce((s, z) => s + (z[chart.xVar] || 0), 0);
    return { name: b, value: Math.round(total), color: BOROUGH_COLORS[b] };
  }).filter(d => d.value > 0);
  const grandTotal = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%"
            innerRadius={50} outerRadius={80} paddingAngle={2}>
            {data.map(d => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={val => [formatVal(val, v.unit), ""]} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 11, lineHeight: 2 }}>
        {data.map(d => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, display: "inline-block" }} />
            <span style={{ color: "#374151" }}>{d.name}</span>
            <span style={{ color: "#6B7280", marginLeft: "auto", paddingLeft: 12 }}>
              {formatVal(d.value, v.unit)}
              <span style={{ color: "#9CA3AF", marginLeft: 4 }}>
                ({grandTotal > 0 ? Math.round(d.value / grandTotal * 100) : 0}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderRanked(chart, zipDemographics) {
  const v = VARIABLE_MAP[chart.xVar];
  const sorted = [...zipDemographics]
    .filter(z => z[chart.xVar] != null)
    .sort((a, b) => (b[chart.xVar] || 0) - (a[chart.xVar] || 0));
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();

  const Row = ({ z, rank, highlight }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
      borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%",
        background: BOROUGH_COLORS[z.borough] ?? "#D1D5DB", flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: "#111827", minWidth: 40 }}>{z.zip}</span>
      <span style={{ fontSize: 11, color: "#6B7280", flex: 1 }}>{z.borough}</span>
      <span style={{ fontSize: 12, fontWeight: 700,
        color: highlight === "high" ? "#DC2626" : highlight === "low" ? "#059669" : "#374151" }}>
        {formatVal(z[chart.xVar], v.unit)}
      </span>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#DC2626", marginBottom: 6 }}>
          Highest — top 5
        </div>
        {top5.map((z, i) => <Row key={z.zip} z={z} rank={i + 1} highlight="high" />)}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#059669", marginBottom: 6 }}>
          Lowest — bottom 5
        </div>
        {bottom5.map((z, i) => <Row key={z.zip} z={z} rank={i + 1} highlight="low" />)}
      </div>
    </div>
  );
}

// ── 2-variable charts ────────────────────────────────────────────────────────

function renderScatter(chart, zipDemographics) {
  const xv = VARIABLE_MAP[chart.xVar];
  const yv = VARIABLE_MAP[chart.yVar];
  const data = zipDemographics
    .filter(z => z[chart.xVar] != null && z[chart.yVar] != null)
    .map(z => ({
      x: z[chart.xVar],
      y: z[chart.yVar],
      zip: z.zip,
      borough: z.borough,
      color: BOROUGH_COLORS[z.borough] ?? "#D1D5DB",
    }));

  const CustomDot = ({ cx, cy, payload }) => {
    if (!cx || !cy) return null;
    return <circle cx={cx} cy={cy} r={5}
      fill={payload.color} fillOpacity={0.75} stroke="none" />;
  };

  const ScatterTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8,
        padding: "8px 12px", fontSize: 11, lineHeight: 1.8 }}>
        <strong>{d.zip} — {d.borough}</strong><br />
        {xv.label}: <strong>{formatVal(d.x, xv.unit)}</strong><br />
        {yv.label}: <strong>{formatVal(d.y, yv.unit)}</strong>
      </div>
    );
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
          <XAxis type="number" dataKey="x" name={xv.label}
            tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={val => formatVal(val, xv.unit)}
            label={{ value: xv.label, position: "insideBottom", offset: -16, style: { fontSize: 10, fill: "#9CA3AF" } }} />
          <YAxis type="number" dataKey="y" name={yv.label}
            tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={val => formatVal(val, yv.unit)}
            label={{ value: yv.label, angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#9CA3AF" } }} />
          <Tooltip content={<ScatterTooltip />} />
          <Scatter data={data} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center",
        fontSize: 10, color: "#6B7280", marginTop: 8, marginBottom: 8 }}>
        {Object.entries(BOROUGH_COLORS).filter(([b]) => b !== "Unknown").map(([b, c]) => (
          <span key={b} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}

function renderGroupedBar(chart, zipDemographics) {
  const xv = VARIABLE_MAP[chart.xVar];
  const yv = VARIABLE_MAP[chart.yVar];
  const data = BOROUGHS.map(b => {
    const zips = zipDemographics.filter(z => z.borough === b);
    const avgX = zips.length ? Math.round(zips.reduce((s, z) => s + (z[chart.xVar] || 0), 0) / zips.length * 10) / 10 : 0;
    const avgY = zips.length ? Math.round(zips.reduce((s, z) => s + (z[chart.yVar] || 0), 0) / zips.length * 10) / 10 : 0;
    return { name: b.slice(0, 3), fullName: b, [chart.xVar]: avgX, [chart.yVar]: avgY };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ bottom: 10 }}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(val, name) => {
            const v = VARIABLE_MAP[name];
            return [formatVal(val, v?.unit ?? ""), v?.label ?? name];
          }}
          labelFormatter={label => {
            const d = data.find(r => r.name === label);
            return d?.fullName ?? label;
          }}
        />
        <Legend formatter={name => VARIABLE_MAP[name]?.label ?? name}
          wrapperStyle={{ fontSize: 10 }} />
        <Bar dataKey={chart.xVar} fill="#93C5FD" fillOpacity={0.85} radius={[3, 3, 0, 0]} />
        <Bar dataKey={chart.yVar} fill="#FCA5A5" fillOpacity={0.85} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderBarColor(chart, zipDemographics) {
  const xv = VARIABLE_MAP[chart.xVar];
  const yv = VARIABLE_MAP[chart.yVar];
  const yValues = zipDemographics.map(z => z[chart.yVar] || 0);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const colorScale = (val) => {
    const t = yMax > yMin ? (val - yMin) / (yMax - yMin) : 0;
    const r = Math.round(252 * t + 147 * (1 - t));
    const g = Math.round(165 * (1 - t) + 197 * (1 - t));
    const b = Math.round(165 * t + 253 * (1 - t));
    return `rgb(${r},${Math.round(165*(1-t)+197*t)},${b})`;
  };

  const data = [...zipDemographics]
    .filter(z => z[chart.xVar] != null)
    .sort((a, b) => (b[chart.xVar] || 0) - (a[chart.xVar] || 0))
    .slice(0, 20)
    .map(z => ({
      name: z.zip,
      value: z[chart.xVar],
      colorVal: z[chart.yVar] || 0,
      borough: z.borough,
      color: colorScale(z[chart.yVar] || 0),
    }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 44, right: 20 }}>
          <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={val => formatVal(val, xv.unit)} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(val, name, props) => [
              formatVal(val, xv.unit),
              `${xv.label} · ${yv.label}: ${formatVal(props.payload.colorVal, yv.unit)}`
            ]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map(d => <Cell key={d.name} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 10, color: "#6B7280", textAlign: "center", marginTop: 4 }}>
        Bar length = {xv.label} · Color intensity = {yv.label}
      </div>
    </div>
  );
}

// ── Master render dispatcher ──────────────────────────────────────────────────

function renderChartContent(chart, zipDemographics) {
  if (!zipDemographics?.length) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#9CA3AF", fontSize: 12 }}>
        Loading data...
      </div>
    );
  }
  if (!chart.xVar) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#9CA3AF", fontSize: 12 }}>
        Select a variable to build this chart.
      </div>
    );
  }
  switch (chart.chartType) {
    case "bar-borough":  return renderBarBorough(chart, zipDemographics);
    case "bar-zip":      return renderBarZip(chart, zipDemographics);
    case "histogram":    return renderHistogram(chart, zipDemographics);
    case "donut":        return renderDonut(chart, zipDemographics);
    case "ranked":       return renderRanked(chart, zipDemographics);
    case "scatter":      return renderScatter(chart, zipDemographics);
    case "bar-grouped":  return renderGroupedBar(chart, zipDemographics);
    case "bar-color":    return renderBarColor(chart, zipDemographics);
    default:             return <div style={{ color: "#9CA3AF", fontSize: 12, padding: 20 }}>Unknown chart type.</div>;
  }
}

// ── Auto-generate chart title ────────────────────────────────────────────────

function autoTitle(chart) {
  const xLabel = VARIABLE_MAP[chart.xVar]?.label ?? "—";
  const yLabel = VARIABLE_MAP[chart.yVar]?.label;
  const typeLabels = {
    "bar-borough":  `${xLabel} by borough`,
    "bar-zip":      `Top 20 ZIPs: ${xLabel}`,
    "histogram":    `Distribution of ${xLabel}`,
    "donut":        `${xLabel} — borough share`,
    "ranked":       `Highest & lowest: ${xLabel}`,
    "scatter":      yLabel ? `${xLabel} vs ${yLabel}` : xLabel,
    "bar-grouped":  yLabel ? `${xLabel} & ${yLabel} by borough` : xLabel,
    "bar-color":    yLabel ? `${xLabel} (colored by ${yLabel})` : xLabel,
  };
  return typeLabels[chart.chartType] ?? xLabel;
}

// ── Statistical summary helpers ───────────────────────────────────────────────

function computeSummary(xVar, yVar, zipDemographics) {
  if (yVar) {
    // Two-variable summary
    const rows = zipDemographics.filter(
      (z) => z[xVar] != null && z[yVar] != null
    );
    const count = rows.length;
    if (count === 0) return { type: "two", count: 0, pearsonR: 0, boroughAverages: [], topOutliers: [] };

    const xVals = rows.map((z) => z[xVar]);
    const yVals = rows.map((z) => z[yVar]);
    const meanX = xVals.reduce((a, b) => a + b, 0) / count;
    const meanY = yVals.reduce((a, b) => a + b, 0) / count;
    const num = rows.reduce((s, z) => s + (z[xVar] - meanX) * (z[yVar] - meanY), 0);
    const denX = Math.sqrt(rows.reduce((s, z) => s + (z[xVar] - meanX) ** 2, 0));
    const denY = Math.sqrt(rows.reduce((s, z) => s + (z[yVar] - meanY) ** 2, 0));
    const pearsonR = denX && denY ? Math.round((num / (denX * denY)) * 100) / 100 : 0;

    const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
    const boroughAverages = BOROUGHS.map((b) => {
      const bRows = rows.filter((z) => z.borough === b);
      if (!bRows.length) return null;
      const avgX = Math.round((bRows.reduce((s, z) => s + z[xVar], 0) / bRows.length) * 10) / 10;
      const avgY = Math.round((bRows.reduce((s, z) => s + z[yVar], 0) / bRows.length) * 10) / 10;
      return { borough: b, avgX, avgY };
    }).filter(Boolean);

    // Top 3 outliers: highest x, lowest y (most underserved)
    const topOutliers = [...rows]
      .sort((a, b) => b[xVar] - a[xVar])
      .slice(0, 3)
      .map((z) => ({ zip: z.zip, borough: z.borough, x: z[xVar], y: z[yVar] }));

    return { type: "two", count, pearsonR, boroughAverages, topOutliers };
  }

  // Single-variable summary
  const rows = zipDemographics.filter((z) => z[xVar] != null && !isNaN(z[xVar]));
  const count = rows.length;
  if (count === 0) return { type: "single", count: 0, mean: 0, median: 0, min: 0, max: 0, top3: [], bottom3: [] };

  const vals = rows.map((z) => z[xVar]);
  const sum = vals.reduce((a, b) => a + b, 0);
  const mean = Math.round((sum / count) * 10) / 10;
  const sorted = [...vals].sort((a, b) => a - b);
  const median = Math.round(sorted[Math.floor(count / 2)] * 10) / 10;
  const min = Math.round(sorted[0] * 10) / 10;
  const max = Math.round(sorted[count - 1] * 10) / 10;

  const sortedRows = [...rows].sort((a, b) => b[xVar] - a[xVar]);
  const top3 = sortedRows.slice(0, 3).map((z) => ({ zip: z.zip, borough: z.borough, value: z[xVar] }));
  const bottom3 = sortedRows.slice(-3).reverse().map((z) => ({ zip: z.zip, borough: z.borough, value: z[xVar] }));

  return { type: "single", count, mean, median, min, max, top3, bottom3 };
}

// ── AI Insight — via /api/insight (server-side, cached, Haiku model) ─────────

async function generateInsight(chartConfig, _output, zipDemographics, persona) {
  const { xVar, yVar, chartType } = chartConfig;
  const xMeta = VARIABLE_MAP[xVar];
  const yMeta = yVar ? VARIABLE_MAP[yVar] : null;

  const summary = computeSummary(xVar, yVar ?? null, zipDemographics);

  try {
    const res = await fetch("/api/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        xVar,
        xLabel: xMeta?.label ?? xVar,
        yVar: yVar ?? null,
        yLabel: yMeta?.label ?? null,
        chartType,
        persona: persona ?? "donor",
        summary,
      }),
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data.insight ?? buildClientFallback(persona, xMeta?.label ?? xVar, summary);
  } catch {
    return buildClientFallback(persona, xMeta?.label ?? xVar, summary);
  }
}

function buildClientFallback(persona, xLabel, summary) {
  if (persona === "pantry-operator") {
    return `${xLabel} varies significantly across NYC neighborhoods — understanding where your pantry sits relative to the citywide average helps prioritize outreach. ZIP ${summary?.top3?.[0]?.zip ?? "areas"} in ${summary?.top3?.[0]?.borough ?? "high-need boroughs"} shows the highest values and may benefit most from targeted support.`;
  }
  if (persona === "government") {
    return `ZIPs with the lowest ${xLabel} (e.g. ${summary?.bottom3?.[0]?.zip ?? "underserved areas"}) show a persistent gap compared to the citywide mean of ${summary?.mean ?? "—"}. Targeted policy interventions in these areas would address the most acute service deficits.`;
  }
  return `High-need areas show lower ${xLabel}, with ZIP ${summary?.bottom3?.[0]?.zip ?? "data"} among the most under-resourced in NYC. Prioritizing donations to these neighborhoods would have the greatest measurable impact on food access.`;
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

// ── Chart card component ──────────────────────────────────────────────────────

function ChartCard({ chart, index, total, onMove, onRemove, onDuplicate, onCopyData, onToggleOverlay, onToggleExpanded, govData: govDataProp, zipDemographics, aiEnabled }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const firstSentence = chart.aiInsight
    ? ((chart.aiInsight.match(/^.*?[.!?](?=\s|$)/) ?? [chart.aiInsight])[0] || "").trim()
    : "";
  const shortInsight = firstSentence ? (firstSentence.slice(0, 120) + (firstSentence.length > 120 ? "…" : "")) : "";
  const govContext = getGovContext(govDataProp);

  return (
    <div style={{ ...CARD_STYLE, padding: "16px 20px" }}>
      {/* Header: title + controls */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{chart.title ?? "Chart"}</div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2, ...MONO }}>
             {VARIABLE_MAP[chart.xVar]?.label} {chart.yVar ? ` vs ${VARIABLE_MAP[chart.yVar]?.label}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <button type="button" onClick={() => onMove("up")} disabled={index === 0} aria-label="Move up" style={{ padding: "6px 8px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: index === 0 ? "not-allowed" : "pointer", opacity: index === 0 ? 0.5 : 1 }}>↑</button>
          <button type="button" onClick={() => onMove("down")} disabled={index === total - 1} aria-label="Move down" style={{ padding: "6px 8px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: index === total - 1 ? "not-allowed" : "pointer", opacity: index === total - 1 ? 0.5 : 1 }}>↓</button>
          <button type="button" onClick={() => onRemove()} aria-label="Remove" style={{ padding: "6px 8px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", color: "#6B7280" }}><IconTrash size={13} /></button>
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

      {/* Chart area 320px — extra bottom margin to avoid legend/text overlap */}
      <div style={{ minHeight: 320, marginBottom: 20 }}>
        {renderChartContent(chart, zipDemographics)}
      </div>

      {/* AI insight */}
      {aiEnabled && <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F3F4F6" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><IconSparkles size={12} /> AI insight</div>
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
      </div>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function VisualizationBuilder({ govData: govDataProp, donorData: donorDataProp, exportContentRef, persona, aiEnabled = true }) {
  const govData = govDataProp ?? defaultGovData;
  const zipDemographics = govData?.zipDemographics ?? [];
  const [charts, setCharts] = useState([]);
  
  // New state for 1 or 2 variables
  const [xVar, setXVar] = useState("");
  const [yVar, setYVar] = useState(null); // null means "None" selected
  const [chartType, setChartType] = useState("");
  
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Group variables for select
  const groupedVars = useMemo(() => {
    const groups = {};
    VARIABLES.forEach(v => {
      if (!groups[v.group]) groups[v.group] = [];
      groups[v.group].push(v);
    });
    return groups;
  }, []);

  // Determine available chart types based on whether we have 1 or 2 vars
  const availableChartTypes = useMemo(() => {
    return yVar ? CHART_TYPES_2VAR : CHART_TYPES_1VAR;
  }, [yVar]);

  // Reset chart type if invalid when switching modes
  // (e.g. going from 2 vars to 1 var while "scatter" was selected)
  // This effect runs when yVar changes to ensure chartType is valid
  useMemo(() => {
    const validKeys = availableChartTypes.map(c => c.key);
    if (chartType && !validKeys.includes(chartType)) {
      setChartType(availableChartTypes[0].key);
    }
  }, [yVar, availableChartTypes, chartType]);

  const addChart = useCallback(
    (configOverride) => {
      // Use override or current state
      const finalX = configOverride?.xVar ?? xVar;
      const finalY = configOverride?.yVar !== undefined ? configOverride.yVar : yVar;
      const finalType = configOverride?.chartType ?? chartType;

      if (!finalX || !finalType) return;

      const newChart = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        xVar: finalX,
        yVar: finalY,
        chartType: finalType,
        title: autoTitle({ xVar: finalX, yVar: finalY, chartType: finalType }),
        aiInsight: null,
        aiLoading: aiEnabled,
        overlayVisible: false,
        expanded: false,
      };
      
      setCharts((prev) => [...prev, newChart]);

      if (aiEnabled) {
        generateInsight(newChart, null, zipDemographics, persona).then((insight) => {
          setCharts((prev) =>
            prev.map((c) => (c.id === newChart.id ? { ...c, aiInsight: insight, aiLoading: false } : c))
          );
        });
      }
    },
    [xVar, yVar, chartType, zipDemographics, persona, aiEnabled]
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
    addChart({ xVar: chart.xVar, yVar: chart.yVar, chartType: chart.chartType });
  }, [addChart]);

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
        {/* Row 1: Primary variable */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", marginBottom: 8, ...MONO }}>MEASURE</div>
          <select 
            value={xVar} 
            onChange={(e) => {
              setXVar(e.target.value);
              // Auto-select first available type if none selected
              if (!chartType) setChartType(availableChartTypes[0].key);
            }} 
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 12, color: "#374151", ...MONO }}
          >
            <option value="">Select a variable...</option>
            {Object.entries(groupedVars).map(([group, vars]) => (
              <optgroup key={group} label={group}>
                {vars.map(v => (
                  <option key={v.key} value={v.key}>{v.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Row 2: Secondary variable */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", marginBottom: 8, ...MONO }}>COMPARE WITH (OPTIONAL)</div>
          <select 
            value={yVar ?? ""} 
            onChange={(e) => {
              const val = e.target.value === "" ? null : e.target.value;
              setYVar(val);
              // When switching mode, chartType might become invalid, updated in useMemo above
            }} 
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 12, color: "#374151", ...MONO }}
          >
            <option value="">None — single variable chart</option>
            {Object.entries(groupedVars).map(([group, vars]) => (
              <optgroup key={group} label={group}>
                {vars.map(v => (
                  <option key={v.key} value={v.key}>{v.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Row 3: Chart type */}
        {xVar && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", marginBottom: 8, ...MONO }}>CHART TYPE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {availableChartTypes.map((ct) => (
                <button
                  key={ct.key}
                  onClick={() => setChartType(ct.key)}
                  title={ct.desc}
                  style={{
                    padding: "8px 6px",
                    borderRadius: 8,
                    border: `2px solid ${chartType === ct.key ? "#2D6A4F" : "#E5E7EB"}`,
                    background: chartType === ct.key ? "#F0FDF4" : "#FAFAFA",
                    color: chartType === ct.key ? "#2D6A4F" : "#374151",
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
          </div>
        )}

        {/* Row 4: Add button */}
        <button
          onClick={() => addChart()}
          disabled={!xVar || !chartType}
          style={{ 
            width: "100%", padding: "11px 0", borderRadius: 9, border: "none", 
            background: (!xVar || !chartType) ? "#E5E7EB" : "#2D6A4F", 
            color: (!xVar || !chartType) ? "#9CA3AF" : "#fff", 
            fontSize: 13, fontWeight: 700, 
            cursor: (!xVar || !chartType) ? "not-allowed" : "pointer" 
          }}
        >
          Add chart
        </button>
        
        <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", ...MONO }}>
          {yVar ? "Will compare 2 variables across NYC ZIPs" : "Will show 1 variable across NYC ZIPs"}
        </div>

        <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 8, ...MONO }}>
          Live data · {zipDemographics.length} ZIP codes
        </div>
      </div>

      {/* Right: canvas with dot grid — ref for PNG export (excludes sidebar) */}
      <div ref={exportContentRef} style={{ flex: 1, minWidth: 0, position: "relative", ...DOT_GRID, borderRadius: 14, padding: "20px 24px", paddingBottom: 80 }}>
        {charts.length === 0 ? (
          /* Empty state */
          <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "center", minHeight: 380, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                // Focus sidebar (dummy action, just visual cue)
              }}
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
                cursor: "default",
                color: "#9CA3AF",
                fontSize: 14,
                fontWeight: 600,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 48 }}>+</span>
              Use sidebar to add charts
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", marginBottom: 4 }}>Quick start</div>
              {QUICK_STARTS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => addChart(q)}
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
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
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
                zipDemographics={zipDemographics}
                aiEnabled={aiEnabled}
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
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <IconFile size={15} /> Generate Report ({charts.length} charts)
            </button>
          </div>
        )}
      </div>

      {/* Report modal */}
      {reportModalOpen && (
        <ReportModal charts={charts} onClose={() => setReportModalOpen(false)} govData={govData} zipDemographics={zipDemographics} />
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}

// ── Report modal ──────────────────────────────────────────────────────────────

function ReportModal({ charts, onClose, govData: govDataProp, zipDemographics }) {
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
          <div key={chart.id} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: i < charts.length - 1 ? "1px solid #E5E7EB" : "none" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 8 }}>{chart.title ?? "Chart"}</div>
            <div style={{ minHeight: 240, marginBottom: 16 }}>{renderChartContent(chart, zipDemographics)}</div>
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
