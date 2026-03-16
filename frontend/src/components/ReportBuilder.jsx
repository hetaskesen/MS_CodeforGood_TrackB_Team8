"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import html2canvas from "html2canvas";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
  PieChart, Pie, ScatterChart, Scatter, Legend,
} from "recharts";
import { govData as defaultGovData } from "@/lib/mockData";
import { BOROUGH_COLORS, BOROUGH_DISPLAY_NAMES } from "@/lib/constants";
import {
  IconBarChart, IconSparkles, IconLink, IconDownload, IconFile, IconTrash,
} from "./Icons";

// ── Constants ─────────────────────────────────────────────────────────────────

const BOROUGHS = BOROUGH_DISPLAY_NAMES;

const VARIABLES = [
  { key: "alicePct",          label: "ALICE % below threshold",    unit: "%", group: "Need",         description: "Households above poverty line but below survival budget" },
  { key: "povertyRatePct",    label: "Poverty rate",               unit: "%", group: "Need",         description: "% of residents below federal poverty line" },
  { key: "needScore",         label: "Food insecurity estimate",   unit: "",  group: "Need",         description: "Estimated food-insecure population per ZIP" },
  { key: "pantryCount",       label: "Pantry count",               unit: "",  group: "Supply",       description: "Number of published food pantries" },
  { key: "pantriesPer10k",    label: "Pantries per 10k residents", unit: "",  group: "Supply",       description: "Coverage normalized by population" },
  { key: "confirmedOpenRate", label: "Confirmed open rate",        unit: "%", group: "Supply",       description: "% of upcoming occurrences confirmed by pantry" },
  { key: "avgSkipRangeCount", label: "Avg closures per pantry",    unit: "",  group: "Supply",       description: "Average number of closure events per pantry" },
  { key: "freshProduceCount", label: "Fresh produce pantries",     unit: "",  group: "Supply",       description: "Pantries tagged with fresh produce availability" },
  { key: "halalKosherCount",  label: "Halal / Kosher pantries",    unit: "",  group: "Supply",       description: "Dietary-specific resource availability" },
  { key: "noVehicleRate",     label: "No vehicle rate",            unit: "%", group: "Access",       description: "Households without a car — transit dependency" },
  { key: "apptOnlyShare",     label: "Appointment-only share",     unit: "%", group: "Access",       description: "% of pantries requiring appointments" },
  { key: "pctLimitedEnglish", label: "Limited English speakers",   unit: "%", group: "Access",       description: "Language barrier to food access" },
  { key: "multilingualCount", label: "Multilingual resources",     unit: "",  group: "Access",       description: "Resources with multilingual support" },
  { key: "noIdRequiredCount", label: "No-ID-required pantries",    unit: "",  group: "Access",       description: "Barrier-free access count" },
  { key: "population",        label: "Population",                 unit: "",  group: "Demographics", description: "Total ZIP population" },
  { key: "medianIncome",      label: "Median income",              unit: "$", group: "Demographics", description: "Median household income" },
  { key: "pctSeniors",        label: "Seniors 65+",                unit: "%", group: "Demographics", description: "Senior population share" },
  { key: "pctChildren",       label: "Children under 5",           unit: "%", group: "Demographics", description: "Young children population share" },
  { key: "pctForeignBorn",    label: "Foreign-born residents",     unit: "%", group: "Demographics", description: "Immigrant community size" },
  { key: "housingBurdenRate", label: "Housing burden rate",        unit: "%", group: "Demographics", description: "Households spending >30% on housing" },
];

const VARIABLE_MAP = Object.fromEntries(VARIABLES.map(v => [v.key, v]));

const CHART_TYPES_1VAR = [
  { key: "bar-borough", label: "By borough",      desc: "Average per borough, ranked" },
  { key: "bar-zip",     label: "By ZIP (top 20)", desc: "Top 20 ZIPs ranked by value" },
  { key: "histogram",   label: "Distribution",    desc: "How values spread across ZIPs" },
  { key: "donut",       label: "Donut",           desc: "Borough share of total" },
  { key: "ranked",      label: "Top & bottom 5",  desc: "Best and worst 5 ZIPs" },
];

const CHART_TYPES_2VAR = [
  { key: "scatter",     label: "Scatter plot",  desc: "One dot per ZIP — find correlations" },
  { key: "bar-grouped", label: "Grouped bar",   desc: "Two metrics side-by-side per borough" },
  { key: "bar-color",   label: "Bar + color",   desc: "Rank by 1st metric, color by 2nd" },
];

const QUICK_STARTS = [
  { label: "ALICE % vs pantry coverage",  xVar: "alicePct",          yVar: "pantriesPer10k",    chartType: "scatter" },
  { label: "Poverty by borough",          xVar: "povertyRatePct",    yVar: null,                chartType: "bar-borough" },
  { label: "Most underserved ZIPs",       xVar: "alicePct",          yVar: null,                chartType: "ranked" },
  { label: "Income distribution",         xVar: "medianIncome",      yVar: null,                chartType: "histogram" },
  { label: "Language vs multilingual",    xVar: "pctLimitedEnglish", yVar: "multilingualCount", chartType: "scatter" },
  { label: "Fresh produce by borough",    xVar: "freshProduceCount", yVar: null,                chartType: "donut" },
  { label: "Need vs transit barrier",     xVar: "alicePct",          yVar: "noVehicleRate",     chartType: "bar-grouped" },
  { label: "Poverty + income ranked",     xVar: "povertyRatePct",    yVar: "medianIncome",      chartType: "bar-color" },
];

// ── Style constants ───────────────────────────────────────────────────────────

const CARD = {
  background: "#fff",
  borderRadius: 14,
  border: "1px solid #E5E5E0",
  boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
};

const DOT_GRID = {
  backgroundColor: "#FAFAF8",
  backgroundImage: "radial-gradient(circle, #C8C8C0 1px, transparent 1px)",
  backgroundSize: "24px 24px",
};

const BTN = {
  padding: "8px 16px",
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 8,
  border: "1.5px solid #E5E7EB",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontFamily: "'DM Sans', system-ui, sans-serif",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

// ── Utility helpers ───────────────────────────────────────────────────────────

function formatVal(val, unit) {
  if (unit === "$") return `$${Number(val).toLocaleString()}`;
  if (unit === "%") return `${val}%`;
  return Number(val).toLocaleString();
}

function autoTitle(chart) {
  const xLabel = VARIABLE_MAP[chart.xVar]?.label ?? "—";
  const yLabel = VARIABLE_MAP[chart.yVar]?.label;
  const map = {
    "bar-borough": `${xLabel} by borough`,
    "bar-zip":     `Top 20 ZIPs: ${xLabel}`,
    "histogram":   `Distribution of ${xLabel}`,
    "donut":       `${xLabel} — borough share`,
    "ranked":      `Highest & lowest: ${xLabel}`,
    "scatter":     yLabel ? `${xLabel} vs ${yLabel}` : xLabel,
    "bar-grouped": yLabel ? `${xLabel} & ${yLabel} by borough` : xLabel,
    "bar-color":   yLabel ? `${xLabel} (colored by ${yLabel})` : xLabel,
  };
  return map[chart.chartType] ?? xLabel;
}

// ── Chart renderers ───────────────────────────────────────────────────────────

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
      <BarChart data={data} layout="vertical" margin={{ left: 90, right: 20 }}>
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
      name: String(z.zip), value: z[chart.xVar],
      borough: z.borough, color: BOROUGH_COLORS[z.borough] ?? "#D1D5DB",
    }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 48, right: 20 }}>
        <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
          tickFormatter={val => formatVal(val, v.unit)} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip formatter={val => [formatVal(val, v.unit), v.label]}
          labelFormatter={label => { const d = data.find(r => r.name === label); return `${label} — ${d?.borough ?? ""}`; }} />
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
          <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
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

  const Row = ({ z, highlight }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: BOROUGH_COLORS[z.borough] ?? "#D1D5DB", flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: "#111827", minWidth: 40 }}>{z.zip}</span>
      <span style={{ fontSize: 11, color: "#6B7280", flex: 1 }}>{z.borough}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: highlight === "high" ? "#DC2626" : "#059669" }}>
        {formatVal(z[chart.xVar], v.unit)}
      </span>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#DC2626", marginBottom: 6 }}>Highest — top 5</div>
        {top5.map(z => <Row key={z.zip} z={z} highlight="high" />)}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#059669", marginBottom: 6 }}>Lowest — bottom 5</div>
        {bottom5.map(z => <Row key={z.zip} z={z} highlight="low" />)}
      </div>
    </div>
  );
}

function renderScatter(chart, zipDemographics) {
  const xv = VARIABLE_MAP[chart.xVar];
  const yv = VARIABLE_MAP[chart.yVar];
  const data = zipDemographics
    .filter(z => z[chart.xVar] != null && z[chart.yVar] != null)
    .map(z => ({ x: z[chart.xVar], y: z[chart.yVar], zip: z.zip, borough: z.borough, color: BOROUGH_COLORS[z.borough] ?? "#D1D5DB" }));

  const CustomDot = ({ cx, cy, payload }) => {
    if (!cx || !cy) return null;
    return <circle cx={cx} cy={cy} r={5} fill={payload.color} fillOpacity={0.75} stroke="none" />;
  };

  const ScatterTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 11, lineHeight: 1.8 }}>
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
          <XAxis type="number" dataKey="x" name={xv.label} tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={val => formatVal(val, xv.unit)}
            label={{ value: xv.label, position: "insideBottom", offset: -16, style: { fontSize: 10, fill: "#9CA3AF" } }} />
          <YAxis type="number" dataKey="y" name={yv.label} tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={val => formatVal(val, yv.unit)}
            label={{ value: yv.label, angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#9CA3AF" } }} />
          <Tooltip content={<ScatterTooltip />} />
          <Scatter data={data} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", fontSize: 10, color: "#6B7280", marginTop: 4 }}>
        {Object.entries(BOROUGH_COLORS).filter(([b]) => b !== "Unknown").map(([b, c]) => (
          <span key={b} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />{b}
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
          formatter={(val, name) => { const v = VARIABLE_MAP[name]; return [formatVal(val, v?.unit ?? ""), v?.label ?? name]; }}
          labelFormatter={label => { const d = data.find(r => r.name === label); return d?.fullName ?? label; }} />
        <Legend formatter={name => VARIABLE_MAP[name]?.label ?? name} wrapperStyle={{ fontSize: 10 }} />
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
  const colorScale = val => {
    const t = yMax > yMin ? (val - yMin) / (yMax - yMin) : 0;
    return `rgb(${Math.round(252 * t + 147 * (1 - t))},${Math.round(165 * (1 - t) + 197 * t)},${Math.round(165 * t + 253 * (1 - t))})`;
  };
  const data = [...zipDemographics]
    .filter(z => z[chart.xVar] != null)
    .sort((a, b) => (b[chart.xVar] || 0) - (a[chart.xVar] || 0))
    .slice(0, 20)
    .map(z => ({ name: String(z.zip), value: z[chart.xVar], colorVal: z[chart.yVar] || 0, borough: z.borough, color: colorScale(z[chart.yVar] || 0) }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 44, right: 20 }}>
          <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={val => formatVal(val, xv.unit)} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(val, name, props) => [
            formatVal(val, xv.unit),
            `${xv.label} · ${yv.label}: ${formatVal(props.payload.colorVal, yv.unit)}`,
          ]} />
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

function renderChartContent(chart, zipDemographics) {
  if (!zipDemographics?.length) {
    return <div style={{ color: "#9CA3AF", fontSize: 12, padding: 20, textAlign: "center" }}>Loading data…</div>;
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
    default: return <div style={{ color: "#9CA3AF", fontSize: 12, padding: 20 }}>Unknown chart type</div>;
  }
}

// ── AI helpers ────────────────────────────────────────────────────────────────

async function generateInsight(chart, _unused, zipDemographics, persona) {
  try {
    const res = await fetch("/api/reviews/ai-summary");
    if (!res.ok) return null;
    const data = await res.json();
    return data?.summary ?? null;
  } catch {
    return null;
  }
}

function getGovContext(govData) {
  const stats = govData?.systemStats;
  if (!stats) return [];
  return [
    `${stats.publishedResources ?? "—"} published food resources across NYC`,
    `${stats.unavailableRate ?? "—"}% currently unavailable`,
    "Data sourced from LemonTree live database",
  ];
}

// ── ChartCard ─────────────────────────────────────────────────────────────────

function ChartCard({ chart, index, total, onMove, onRemove, onDuplicate, govData, zipDemographics, aiEnabled }) {
  return (
    <div style={{ ...CARD, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{chart.title}</div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
            {VARIABLE_MAP[chart.xVar]?.label}
            {chart.yVar ? ` vs ${VARIABLE_MAP[chart.yVar]?.label}` : ""} · {chart.chartType}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {index > 0 && (
            <button onClick={() => onMove("up")} title="Move up"
              style={{ ...BTN, padding: "4px 8px", fontSize: 11 }}>↑</button>
          )}
          {index < total - 1 && (
            <button onClick={() => onMove("down")} title="Move down"
              style={{ ...BTN, padding: "4px 8px", fontSize: 11 }}>↓</button>
          )}
          <button onClick={onDuplicate} title="Duplicate"
            style={{ ...BTN, padding: "4px 8px", fontSize: 11 }}>⧉</button>
          <button onClick={onRemove} title="Remove"
            style={{ ...BTN, padding: "4px 8px", color: "#DC2626", borderColor: "#FECACA" }}>
            <IconTrash size={12} />
          </button>
        </div>
      </div>

      <div style={{ minHeight: 180 }}>
        {renderChartContent(chart, zipDemographics)}
      </div>

      {aiEnabled && (
        <div style={{ marginTop: 14, padding: "10px 14px", background: "#F0FDF4", borderRadius: 8, border: "1px solid #BBF7D0" }}>
          {chart.aiLoading ? (
            <div style={{ fontSize: 11, color: "#6B7280", animation: "pulse 1.5s ease-in-out infinite" }}>
              Generating AI insight…
            </div>
          ) : chart.aiInsight ? (
            <p style={{ fontSize: 12, color: "#374151", margin: 0, lineHeight: 1.6 }}>{chart.aiInsight}</p>
          ) : (
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>No AI insight available for this chart.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── ReportModal ───────────────────────────────────────────────────────────────

function ReportModal({ charts, onClose, govData, zipDemographics }) {
  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9998 }}
        onClick={onClose} aria-hidden
      />
      <div
        className="report-print-area"
      style={{
          position: "fixed", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%", maxWidth: 720, maxHeight: "90vh",
          overflowY: "auto", background: "#fff",
          borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          zIndex: 9999, padding: "28px 32px",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 6 }}>
          Data Insights Report
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 24 }}>
          Generated: {new Date().toLocaleDateString()}
        </div>

        {charts.map((chart, i) => (
          <div key={chart.id} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: i < charts.length - 1 ? "1px solid #E5E7EB" : "none" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 8 }}>{chart.title}</div>
            <div style={{ minHeight: 240, marginBottom: 16 }}>{renderChartContent(chart, zipDemographics)}</div>
            {chart.aiInsight && (
              <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, marginTop: 12 }}>{chart.aiInsight}</p>
            )}
            <ul style={{ fontSize: 11, color: "#6B7280", marginTop: 8, paddingLeft: 18 }}>
              {getGovContext(govData).map((line, j) => <li key={j}>{line}</li>)}
            </ul>
          </div>
        ))}

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={() => window.print()}
            style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#2D6A4F", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Print / Save as PDF
          </button>
          <button onClick={onClose}
            style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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

// ── Main ReportBuilder ────────────────────────────────────────────────────────

export default function ReportBuilder({ govData: govDataProp, donorData, persona }) {
  const govData = govDataProp ?? defaultGovData;
  const zipDemographics = govData?.zipDemographics ?? [];

  const [copyFeedback, setCopyFeedback] = useState(false);
  const [aiEnabled, setAiEnabled]       = useState(true);
  const [charts, setCharts]             = useState([]);
  const [xVar, setXVar]                 = useState("");
  const [yVar, setYVar]                 = useState(null);
  const [chartType, setChartType]       = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const contentRef = useRef(null);

  const availableChartTypes = yVar ? CHART_TYPES_2VAR : CHART_TYPES_1VAR;

  const groupedVars = useMemo(() => {
    const groups = {};
    VARIABLES.forEach(v => {
      if (!groups[v.group]) groups[v.group] = [];
      groups[v.group].push(v);
    });
    return groups;
  }, []);

  // When yVar changes, reset chartType if it's no longer valid
  useEffect(() => {
    const validKeys = availableChartTypes.map(c => c.key);
    if (chartType && !validKeys.includes(chartType)) {
      setChartType(availableChartTypes[0].key);
    }
  }, [yVar]); // eslint-disable-line react-hooks/exhaustive-deps

  const addChart = useCallback((configOverride) => {
    const finalX    = configOverride?.xVar ?? xVar;
    const finalY    = configOverride?.yVar !== undefined ? configOverride.yVar : yVar;
    const finalType = configOverride?.chartType ?? chartType;
    if (!finalX || !finalType) return;

    const newChart = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      xVar: finalX, yVar: finalY, chartType: finalType,
      title: autoTitle({ xVar: finalX, yVar: finalY, chartType: finalType }),
      aiInsight: null, aiLoading: aiEnabled,
    };

    setCharts(prev => [...prev, newChart]);

    if (aiEnabled) {
      generateInsight(newChart, null, zipDemographics, persona).then(insight => {
        setCharts(prev => prev.map(c => c.id === newChart.id ? { ...c, aiInsight: insight, aiLoading: false } : c));
      });
    }
  }, [xVar, yVar, chartType, zipDemographics, persona, aiEnabled]);

  const removeChart    = useCallback(id => setCharts(prev => prev.filter(c => c.id !== id)), []);
  const duplicateChart = useCallback(chart => addChart({ xVar: chart.xVar, yVar: chart.yVar, chartType: chart.chartType }), [addChart]);

  const moveChart = useCallback((id, dir) => {
    setCharts(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx === -1 || (dir === "up" && idx === 0) || (dir === "down" && idx === prev.length - 1)) return prev;
      const next = [...prev];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, []);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  }, []);

  const handleExportPNG = useCallback(() => {
    if (!contentRef.current) return;
    html2canvas(contentRef.current, { useCORS: true, scale: 2 }).then(canvas => {
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "lemontree-report.png";
        a.click();
        URL.revokeObjectURL(url);
      });
    });
  }, []);

  const canAdd = xVar && chartType;

  return (
    <div style={{ ...DOT_GRID, minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Back link */}
      <div style={{ padding: "12px 28px 0" }}>
        <Link href="/dashboard"
          style={{ fontSize: 12, color: "#9CA3AF", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
          ← Back to dashboard
        </Link>
      </div>

      {/* Page header */}
      <div style={{ padding: "14px 28px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 5px", letterSpacing: "-0.3px", display: "flex", alignItems: "center", gap: 10 }}>
            <IconBarChart size={22} /> Report Builder
          </h1>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
            Build custom visualizations using live LemonTree data
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 2, alignItems: "center" }}>
          <button
            onClick={() => setAiEnabled(v => !v)}
            style={{ ...BTN, background: aiEnabled ? "#F0FDF4" : "#fff", border: `1.5px solid ${aiEnabled ? "#2D6A4F" : "#E5E7EB"}`, color: aiEnabled ? "#2D6A4F" : "#9CA3AF", display: "flex", alignItems: "center", gap: 6 }}>
            <IconSparkles size={14} />
            AI insights {aiEnabled ? "on" : "off"}
          </button>
          <button style={{ ...BTN, display: "flex", alignItems: "center", gap: 6 }} onClick={handleCopyLink}>
            <IconLink size={14} />
            {copyFeedback ? "Copied!" : "Copy shareable link"}
          </button>
          <button style={{ ...BTN, display: "flex", alignItems: "center", gap: 6 }} onClick={handleExportPNG}>
            <IconDownload size={14} />
            Export as PNG
          </button>
        </div>
      </div>

      {/* Sidebar + Canvas */}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", padding: "0 28px 48px" }}>

        {/* ── Left sidebar ── */}
        <div style={{ width: 240, flexShrink: 0, ...CARD, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 2 }}>Add a chart</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.4 }}>Pick a variable and chart type</div>
          </div>

          {/* Measure */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              Measure
            </div>
            <select
              value={xVar}
              onChange={e => {
                const val = e.target.value;
                setXVar(val);
                if (val && !chartType) setChartType(CHART_TYPES_1VAR[0].key);
              }}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: "#FAFAFA", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer" }}
            >
              <option value="">Select a variable…</option>
              {Object.entries(groupedVars).map(([group, vars]) => (
                <optgroup key={group} label={group}>
                  {vars.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
                </optgroup>
              ))}
            </select>
            {xVar && VARIABLE_MAP[xVar] && (
              <div style={{ marginTop: 5, fontSize: 10, color: "#6B7280", lineHeight: 1.4, padding: "5px 8px", background: "#F9FAFB", borderRadius: 6, border: "1px solid #F3F4F6" }}>
                {VARIABLE_MAP[xVar].description}
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid #F3F4F6", marginBottom: 16 }} />

          {/* Compare with */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              Compare with{" "}
              <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span>
            </div>
            <select
              value={yVar ?? ""}
              onChange={e => setYVar(e.target.value === "" ? null : e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: "#FAFAFA", fontSize: 12, color: "#374151", outline: "none", cursor: "pointer" }}
            >
              <option value="">None — 1 variable</option>
              {Object.entries(groupedVars).map(([group, vars]) => (
                <optgroup key={group} label={group}>
                  {vars.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Chart type — only shown after xVar is selected */}
          {xVar && (
            <>
              <div style={{ borderTop: "1px solid #F3F4F6", marginBottom: 16 }} />
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                  Chart type
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {availableChartTypes.map(ct => (
                    <button
                      key={ct.key}
                      onClick={() => setChartType(ct.key)}
                      style={{
                        padding: "8px 10px", borderRadius: 8, textAlign: "left", cursor: "pointer",
                        border: `1.5px solid ${chartType === ct.key ? "#2D6A4F" : "#E5E7EB"}`,
                        background: chartType === ct.key ? "#F0FDF4" : "#fff",
                        color: chartType === ct.key ? "#2D6A4F" : "#374151",
                        fontSize: 12, fontWeight: chartType === ct.key ? 700 : 500,
                        transition: "all 0.1s",
                      }}
                    >
                      <div>{ct.label}</div>
                      <div style={{ fontSize: 10, color: chartType === ct.key ? "#52B788" : "#9CA3AF", marginTop: 1 }}>
                        {ct.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Divider + Add button */}
          <div style={{ borderTop: "1px solid #F3F4F6", marginTop: 8, marginBottom: 14 }} />
          <button
            onClick={() => addChart()}
            disabled={!canAdd}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 9, border: "none",
              background: canAdd ? "#2D6A4F" : "#E5E7EB",
              color: canAdd ? "#fff" : "#9CA3AF",
              fontSize: 13, fontWeight: 700,
              cursor: canAdd ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "background 0.15s",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 13, height: 13 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add chart
          </button>

          <div style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
            {yVar ? "2-variable" : "1-variable"} · {zipDemographics.length} ZIPs
          </div>
        </div>

        {/* ── Right canvas ── */}
        <div ref={contentRef}
          style={{ flex: 1, minWidth: 0, position: "relative", ...DOT_GRID, borderRadius: 14, border: "1px solid #E5E5E0", padding: "20px 24px", paddingBottom: 80 }}>

          {charts.length === 0 ? (
            <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "center", minHeight: 380, flexWrap: "wrap" }}>
              <div style={{ width: 200, height: 200, border: "2px dashed #D1D5DB", borderRadius: 14, background: "#FAFAF8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#9CA3AF", fontSize: 14, fontWeight: 600 }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 40, height: 40 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Use sidebar to add charts
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", marginBottom: 4 }}>Quick start</div>
                {QUICK_STARTS.map(q => (
                  <button key={q.label} onClick={() => addChart(q)}
                    style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", textAlign: "left", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
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
                  onMove={dir => moveChart(chart.id, dir)}
                  onRemove={() => removeChart(chart.id)}
                  onDuplicate={() => duplicateChart(chart)}
                  govData={govData}
                  zipDemographics={zipDemographics}
                  aiEnabled={aiEnabled}
                />
        ))}
      </div>
          )}

          {charts.length >= 2 && (
            <div style={{ position: "absolute", bottom: 24, right: 24 }}>
              <button
                onClick={() => setReportModalOpen(true)}
                style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: "#2D6A4F", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(45,106,79,0.35)", display: "flex", alignItems: "center", gap: 8 }}>
                <IconFile size={15} /> Generate Report ({charts.length} charts)
              </button>
            </div>
          )}
        </div>
      </div>

      {reportModalOpen && (
        <ReportModal charts={charts} onClose={() => setReportModalOpen(false)} govData={govData} zipDemographics={zipDemographics} />
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
