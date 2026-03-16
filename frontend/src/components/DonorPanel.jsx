"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import Footer from "./Footer";
import { BOROUGH_COLORS } from "@/lib/constants";

// ── Borough display names and colors (for charts) ─────────────────────────────
const BOROUGH_KEY_TO_DISPLAY = {
  Manhattan: "Manhattan",
  Brooklyn: "Brooklyn",
  Queens: "Queens",
  Bronx: "Bronx",
  StatenIsland: "Staten Island",
};
// Borough colors — imported from @/lib/constants as BOROUGH_COLORS
const BOROUGH_BG_COLOR = BOROUGH_COLORS;

/**
 * Derive all donor-facing metrics from govData (Supabase resources + zip_demographics).
 * Used by DonorPanel and by dashboard for ReportBuilder donorData prop.
 */
export function buildDonorMetrics(govData) {
  if (!govData) {
    return {
      boroughBubbles: [],
      boroughImpact: [],
      topImpactResources: [],
      backgroundResources: [],
      network: { householdsBelowAlice: 0, publishedResources: 0, highDemandLowRated: 0, avgRating: 0, avgImpactScore: 0 },
      methodologyText: "Connect to the API to see donor impact metrics derived from government data.",
    };
  }
  const { boroughStats = {}, aliceSummary = {}, systemStats = {}, underservedZips = [], reliability = {} } = govData;
  const boroughList = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
  const allPublished = boroughList.map((displayName) => {
    const key = displayName === "Staten Island" ? "StatenIsland" : displayName;
    return (boroughStats[key] || {}).published ?? 0;
  });
  const maxPublished = Math.max(1, ...allPublished);
  const boroughBubbles = boroughList.map((displayName) => {
    const key = displayName === "Staten Island" ? "StatenIsland" : displayName;
    const stats = boroughStats[key] || { total: 0, published: 0, unavailable: 0 };
    const aliceBorough = (aliceSummary.boroughs || []).find((b) => b.borough === displayName);
    const published = stats.published ?? 0;
    const total = stats.total || 1;
    const impactScorePct = total ? Math.round((published / total) * 1000) / 10 : 0;
    const avgAlicePct = aliceBorough?.avgAlicePct ?? 0;
    const avgRating = systemStats.avgRating ?? 2.29;
    const belowAliceHH = aliceBorough?.belowAliceHH ?? 0;
    const demandPerPantry = aliceBorough ? Math.round(belowAliceHH / Math.max(1, published)) : 0;
    // Y = Demand per pantry (overburdened resources).
    const publishedNormalized = (published / maxPublished) * 5;
    return {
      borough: displayName,
      x: avgAlicePct + publishedNormalized,
      y: demandPerPantry,
      z: published,
      impactScore: impactScorePct,
      resourceCount: published,
      demandPerPantry,
      color: BOROUGH_BG_COLOR[displayName] ?? "#9CA3AF",
      // Aliases for Report Builder / VisualizationBuilder
      avgPoverty: avgAlicePct,
      avgRating,
      subscribersAtRisk: belowAliceHH,
      avgImpact: impactScorePct / 100,
    };
  }).filter((b) => b.z > 0);

  const sortedZips = [...underservedZips].sort((a, b) => (b.needScore ?? 0) - (a.needScore ?? 0));
  const topImpactResources = sortedZips.map((z) => {
    const needScore = z.needScore ?? 0;
    const povertyRate = z.alicePct != null ? z.alicePct : z.poverty;
    // Check if another ZIP in sortedZips shares the same neighborhood name
    const neighborhoodCount = sortedZips.filter(
      (other) => (other.neighborhood || `ZIP ${other.zip}`) === (z.neighborhood || `ZIP ${z.zip}`)
    ).length;
    const name = neighborhoodCount > 1
      ? `${z.neighborhood || `ZIP ${z.zip}`} (${z.zip})`
      : (z.neighborhood || `ZIP ${z.zip}`);
    return {
      name,
      zip: z.zip,
      borough: z.borough || "Unknown",
      povertyRate,
      needScore: z.needScore ?? 0,
      impactScore: Math.round(needScore * 10) / 100,
      subscriptions: z.aliceHouseholds ?? 0,
      rating: systemStats.avgRating ?? null,
      // Compatibility for VisualizationBuilder scatter
      poverty: povertyRate,
      rating: (systemStats.avgRating ?? needScore / 20),
    };
  });

  const backgroundResources = underservedZips.map((z) => {
    const x = z.alicePct ?? z.poverty ?? 0;
    const y = z.needScore ?? 0;
    return {
      x,
      y,
      borough: z.borough || "Unknown",
      subs: z.aliceHouseholds ?? 0,
      // Compatibility for VisualizationBuilder scatter (poverty = ALICE %, rating = needScore/20 as 0–5 scale)
      poverty: x,
      rating: y / 20,
    };
  });

  const avgImpactScore = sortedZips.length
    ? sortedZips.reduce((s, z) => s + (z.needScore ?? 0) / 100, 0) / sortedZips.length
    : 0;
  const network = {
    householdsBelowAlice: aliceSummary.householdsBelowAlice ?? 0,
    publishedResources: systemStats.publishedResources ?? 0,
    highDemandLowRated: reliability.publishedInUnderservedZips ?? sortedZips.length,
    avgRating: systemStats.avgRating ?? 0,
    avgImpactScore: Math.round(avgImpactScore * 100) / 100,
  };

  const totalHH = aliceSummary.totalHouseholds ?? 0;
  const pctAlice = aliceSummary.pctBelowAlice ?? 0;
  const totalRes = systemStats.totalResources ?? 0;
  const methodologyText = `Impact metrics are derived from NYC ZIP demographics (ACS 2024) and ALICE data: ${totalHH.toLocaleString()} total households, ${pctAlice}% below ALICE threshold. Need score combines poverty, coverage gap, and demand per pantry across ${totalRes.toLocaleString()} LemonTree resources.`;

  return {
    boroughBubbles,
    boroughImpact: boroughBubbles, // alias for Report Builder / VisualizationBuilder
    topImpactResources,
    backgroundResources,
    network,
    methodologyText,
  };
}

function bronxLabel(govData) {
  if (!govData?.aliceSummary?.boroughs) return "Bronx: —";
  const bronx = govData.aliceSummary.boroughs.find((b) => b.borough === "Bronx");
  const below = bronx?.belowAliceHH ?? 0;
  return `Bronx: ${below.toLocaleString()} below ALICE`;
}

function bronxCaveatText(govData) {
  if (!govData?.aliceSummary?.boroughs) {
    return "The Bronx has the highest concentration of households below the ALICE threshold — the highest-impact zone for donor funding.";
  }
  const bronx = govData.aliceSummary.boroughs.find((b) => b.borough === "Bronx");
  const below = bronx?.belowAliceHH ?? 0;
  return `The Bronx has the highest ALICE concentration — ${below.toLocaleString()} households below threshold — making it the highest-impact zone for donor funding.`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function impactBadge(score) {
  if (score >= 0.7) return { label: "Critical need", bg: "#FEE2E2", text: "#991B1B" };
  if (score >= 0.6) return { label: "High need",     bg: "#FEF3C7", text: "#92400E" };
  if (score >= 0.5) return { label: "Elevated need", bg: "#FEF9C3", text: "#854D0E" };
  return { label: "Moderate", bg: "#F3F4F6", text: "#6B7280" };
}

function ratingColor(r) {
  if (r == null) return "#9CA3AF";
  if (r < 2.5) return "#DC2626";
  if (r < 3.0) return "#D97706";
  return "#166534";
}

function povertyColor(p) {
  if (p >= 35) return "#DC2626";
  if (p >= 25) return "#D97706";
  return "#374151";
}

// Group topImpactResources by ZIP, sorted by highest impact in group
function groupByZip(resources) {
  const byZip = new Map();
  resources.forEach((r) => {
    if (!byZip.has(r.zip)) byZip.set(r.zip, { zip: r.zip, borough: r.borough, povertyRate: r.povertyRate ?? 0, rows: [] });
    byZip.get(r.zip).rows.push(r);
  });
  const groups = Array.from(byZip.values());
  groups.forEach((g) => {
    if (g.rows.length) g.povertyRate = g.rows[0].povertyRate ?? 0;
    g.rows.sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0));
  });
  groups.sort((a, b) => Math.max(...(b.rows || []).map((r) => r.impactScore ?? 0)) - Math.max(...(a.rows || []).map((r) => r.impactScore ?? 0)));
  return groups;
}

// Label offsets by borough to prevent overlap (payload.borough is display name e.g. "Staten Island")
const BOROUGH_LABEL_OFFSETS = {
  Manhattan: { dx: 0, dy: 18 },
  Brooklyn: { dx: 0, dy: 18 },
  Queens: { dx: 0, dy: 18 },
  "Staten Island": { dx: 0, dy: 18 },
  Bronx: { dx: 0, dy: 18 },
};

// ── Custom borough bubble shape with label ───────────────────────────────────
function BoroughBubble({ cx, cy, payload }) {
  if (!cx || !cy) return null;
  const r = Math.max(Math.sqrt(payload.z / 40), 12);
  const offset = BOROUGH_LABEL_OFFSETS[payload.borough] ?? { dx: 0, dy: 0 };
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={payload.color} fillOpacity={0.65} stroke={payload.color} strokeWidth={1.5} />
      <text
        x={cx + offset.dx}
        y={cy + r + 13 + offset.dy}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill="#374151"
      >
        {payload.borough}
      </text>
    </g>
  );
}

// ── Custom shapes for full-network scatter ───────────────────────────────────
function BgDot({ cx, cy, payload }) {
  if (!cx || !cy) return null;
  return <circle cx={cx} cy={cy} r={8} fill={BOROUGH_BG_COLOR[payload.borough] ?? "#D1D5DB"} fillOpacity={0.8} />;
}

function HaloDot({ cx, cy }) {
  if (!cx || !cy) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={14} fill="#EF4444" fillOpacity={0.15} />
      <circle cx={cx} cy={cy} r={9} fill="#EF4444" fillOpacity={0.85} />
    </g>
  );
}

// Borough tooltip for bubble chart (x = ALICE % + spread, y = Demand/pantry, z = published count)
function BoroughTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px", fontSize: 11, lineHeight: 1.8, boxShadow: "0 2px 8px rgba(0,0,0,.1)" }}>
      <strong style={{ fontSize: 12 }}>{d.borough}</strong><br />
      ALICE % below threshold: <strong>{d.avgPoverty}%</strong><br />
      Households per pantry: <strong>{d.y.toLocaleString()}</strong><br />
      Published resources: <strong>{d.z.toLocaleString()}</strong><br />
      Resources: <strong>{d.resourceCount}</strong>
    </div>
  );
}

// Network scatter tooltip (top = neighborhood/ZIP, background = borough context)
function NetworkTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  if (d.name) {
    return (
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px", fontSize: 11, lineHeight: 1.8, boxShadow: "0 2px 8px rgba(0,0,0,.1)" }}>
        <strong style={{ fontSize: 12 }}>{d.name}</strong><br />
        Borough: <strong>{d.borough}</strong><br />
        ALICE %: <strong>{d.povertyRate ?? d.x}%</strong><br />
        Need score: <strong>{(d.impactScore != null ? d.impactScore * 100 : d.y)?.toFixed(1)}</strong><br />
        Households: <strong>{(d.subscriptions ?? d.subs ?? 0).toLocaleString()}</strong>
      </div>
    );
  }
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px", fontSize: 11, lineHeight: 1.8, boxShadow: "0 2px 8px rgba(0,0,0,.1)" }}>
      <strong>{d.borough}</strong><br />
      ALICE %: <strong>{d.x}%</strong><br />
      Need score: <strong>{d.y?.toFixed(1)}</strong><br />
      Households: <strong>{(d.subs ?? 0).toLocaleString()}</strong>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DonorPanel({ govData }) {
  const [showWhy, setShowWhy] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const metrics = useMemo(() => buildDonorMetrics(govData), [govData]);
  const { network, topImpactResources, backgroundResources, methodologyText, boroughBubbles } = metrics;

  const zipGroups = useMemo(() => groupByZip(topImpactResources), [topImpactResources]);

  // Full-network scatter: x = ALICE %, y = need score (0–100); background = all underserved, top = top 15
  const bgScatterData = useMemo(
    () => backgroundResources.map((r) => ({ ...r, subs: r.subs ?? 0 })),
    [backgroundResources]
  );
  const topScatterData = useMemo(
    () => topImpactResources.slice(0, 5).map((r) => ({
      ...r,
      x: r.povertyRate ?? 0,
      y: Math.min(r.needScore ?? (r.impactScore ?? 0) * 100, 100),
    })),
    [topImpactResources]
  );

  // Portfolio builder stats
  const portfolioStats = useMemo(() => {
    if (selected.size === 0) return null;
    const sel = topImpactResources.filter((r) => selected.has(r.name));
    const totalSubs = sel.reduce((s, r) => s + r.subscriptions, 0);
    const zips = [...new Set(sel.map((r) => r.zip))];
    const avgPoverty = sel.reduce((s, r) => s + r.povertyRate, 0) / sel.length;
    return { count: sel.length, totalSubs, zips, avgPoverty: avgPoverty.toFixed(1) };
  }, [selected, topImpactResources]);

  const toggleResource = useCallback((name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  return (
    <div
      style={{
        padding: "28px 32px 32px",
        background: "#F8F9FA",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      {/* ── Fix 6: panel subtitle ── */}
      <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        Impact dashboard · NYC food resource network · ACS 2024
        <span style={{ background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600 }}>
          Active funder
        </span>
      </div>

      {/* ── Fix 3: Impact reach hero stat (from govData) ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderLeft: "4px solid #2D6A4F",
          borderRadius: "0 12px 12px 0",
          padding: "20px 24px",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 42, fontWeight: 800, color: "#2D6A4F", lineHeight: 1 }}>
              {network.householdsBelowAlice?.toLocaleString() ?? "—"}
            </div>
            <div style={{ fontSize: 13, color: "#374151", marginTop: 5, lineHeight: 1.5 }}>
              families below ALICE threshold across NYC
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
              {network.publishedResources?.toLocaleString() ?? "—"} published resources · avg impact score {network.avgImpactScore ?? "—"} · Bronx is the highest-need concentration
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {[
                [`${network.publishedResources ?? 0} resources`, "#F3F4F6", "#374151"],
                [bronxLabel(govData), "#FEE2E2", "#991B1B"],
                [`Avg impact: ${network.avgImpactScore ?? "—"}`, "#FEF3C7", "#92400E"],
              ].map(([lbl, bg, clr]) => (
                <span key={lbl} style={{ fontSize: 11, fontWeight: 600, color: clr, background: bg, padding: "4px 10px", borderRadius: 8 }}>{lbl}</span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200, fontSize: 12, color: "#6B7280", lineHeight: 1.7, paddingTop: 4 }}>
            Across NYC, <strong style={{ color: "#374151" }}>{network.highDemandLowRated} resources</strong> in underserved ZIPs serve high-need communities. Funding these locations reaches households below the ALICE threshold and maximizes impact.
          </div>
        </div>
      </div>

      {/* ── Fix 1: Borough bubble chart ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: "18px 20px",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 3 }}>
          Where is the need most concentrated?
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 14 }}>
          Right = higher ALICE % · Top = higher strain per pantry · Bubble size = published resources
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 4, right: 8, fontSize: 10, fontWeight: 600, color: "#DC2626", zIndex: 10 }}>
            Highest impact zone →
          </div>
          <div style={{ position: "absolute", bottom: 36, left: 60, fontSize: 10, color: "#9CA3AF", zIndex: 10 }}>
            ← Lower priority
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 20, right: 60, bottom: 36, left: 0 }}>
              <ReferenceArea
                x1={55}
                x2={80}
                y1={1500}
                y2={3000}
                fill="#FEE2E2"
                fillOpacity={0.4}
                stroke="#FECACA"
                strokeDasharray="3 3"
              />
              <XAxis
                type="number" dataKey="x"
                domain={[30, 80]}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false} tickLine={false}
                label={{ value: "ALICE % below threshold", position: "insideBottom", offset: -20, style: { fontSize: 10, fill: "#9CA3AF" } }}
              />
              <YAxis
                type="number" dataKey="y"
                domain={[0, 3000]}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false} tickLine={false}
                label={{ value: "Households per pantry (overburdened)", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 10, fill: "#9CA3AF" } }}
              />
              <ReferenceLine
                x={55}
                stroke="#F97316"
                strokeDasharray="4 2"
                strokeWidth={1}
                label={{ value: "ALICE ≥ 55%", position: "insideTopLeft", fontSize: 9, fill: "#EA580C" }}
              />
              <ReferenceLine
                y={1500}
                stroke="#EF4444"
                strokeDasharray="4 2"
                strokeWidth={1}
                label={{ value: "High strain (>1,500/pantry)", position: "insideRight", fontSize: 9, fill: "#B91C1C" }}
              />
              <ZAxis type="number" dataKey="z" range={[80, 700]} />
              <Tooltip content={<BoroughTooltip />} cursor={false} />
              <Scatter data={boroughBubbles} shape={<BoroughBubble />} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8, fontSize: 11, color: "#6B7280" }}>
          <span>→ Higher ALICE %</span>
          <span>↑ Higher strain</span>
          <span>◯ Larger = more published resources</span>
        </div>
        <div style={{ padding: "10px 12px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991B1B", lineHeight: 1.5 }}>
          {bronxCaveatText(govData)}
        </div>
      </div>

      {/* ── Honest caveat card ── */}
      <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "18px 20px", border: "1px solid #F3F4F6", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
          What this data can and cannot tell you
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", fontSize: 12, color: "#6B7280", lineHeight: 1.7 }}>
          <div>
            <div style={{ fontWeight: 600, color: "#374151", marginBottom: 6 }}>Can tell you:</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Which resources serve the highest-need communities</li>
              <li>Which resources have the most room for quality improvement</li>
              <li>How many people currently depend on each resource</li>
              <li>Geographic concentration of need by borough and ZIP</li>
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#374151", marginBottom: 6 }}>Cannot tell you (yet):</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>The specific dollar amount needed per resource</li>
              <li>Confirmed before/after impact of past donations</li>
              <li>What specific improvements donors have funded</li>
              <li>Revenue or operational budget of each pantry</li>
            </ul>
          </div>
        </div>
        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 14, marginBottom: 0, lineHeight: 1.6 }}>
          LemonTree is building toward longitudinal impact tracking. This dashboard represents current-state analysis from ACS 2024 demographic data cross-referenced with 1,976 LemonTree resources.
        </p>
      </div>

      {/* ── Fix 2: Full-network scatter (ALICE % vs need score) ── */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 3 }}>
          The funding landscape
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 14 }}>
          {bgScatterData.length} underserved ZIPs · Red = highest need · Colored = full context
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 6, right: 8, fontSize: 10, fontWeight: 600, color: "#DC2626", zIndex: 10, maxWidth: 180, textAlign: "right" }}>
            High ALICE % + high need score = highest impact
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 28, left: 0 }}>
              <ReferenceArea
                x1={40}
                x2={100}
                y1={50}
                y2={100}
                fill="#FEF2F2"
                fillOpacity={0.5}
                stroke="#FECACA"
                strokeDasharray="3 3"
              />
              <XAxis
                type="number" dataKey="x"
                domain={[0, 80]}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false} tickLine={false}
                label={{ value: "ALICE %", position: "insideBottom", offset: -14, style: { fontSize: 10, fill: "#9CA3AF" } }}
              />
              <YAxis
                type="number" dataKey="y"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false} tickLine={false}
                label={{ value: "Need score (0–100)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#9CA3AF" } }}
              />
              <ZAxis range={[20, 20]} />
              <Tooltip content={<NetworkTooltip />} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={bgScatterData} shape={<BgDot />} name={`Underserved ZIPs (${bgScatterData.length})`} />
              <Scatter data={topScatterData} shape={<HaloDot />} name="Highest need" />
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#6B7280", justifyContent: "center", marginTop: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#D1D5DB" }} />
              All underserved ZIPs ({bgScatterData.length})
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} />
              Highest need
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#6B7280", textAlign: "center", marginTop: 4 }}>
            High-need ZIPs cluster in the top-right (high ALICE %, high need score), especially in the Bronx.
          </div>
        </div>
      </div>

      {/* ── Fix 4 + 5: Portfolio builder ── */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", marginBottom: 4 }}>
            SUGGESTED PORTFOLIO
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
            Build your impact portfolio
          </div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>
            Select resources to see your combined reach · Impact level = poverty + quality gap + subscriber demand
          </div>
        </div>

        {/* ZIP-grouped rows (Fix 5 two-line format + checkboxes) */}
        <div>
          {zipGroups.map((group) => (
            <React.Fragment key={group.zip}>
              {/* ZIP divider */}
              <div style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", borderTop: "1px solid #E5E7EB", padding: "6px 20px", fontSize: 11, color: "#6B7280" }}>
                ZIP {group.zip}, {group.borough} — poverty {group.povertyRate}%
              </div>
              {group.rows.map((r) => {
                const badge = impactBadge(r.impactScore);
                const isChecked = selected.has(r.name);
                return (
                  <div
                    key={r.name}
                    onClick={() => toggleResource(r.name)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 20px",
                      borderBottom: "1px solid #F3F4F6",
                      cursor: "pointer",
                      background: isChecked ? "#F0FDF4" : "transparent",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = "#F9FAFB"; }}
                    onMouseLeave={(e) => { if (!isChecked) e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Checkbox */}
                    <div
                      style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${isChecked ? "#2D6A4F" : "#D1D5DB"}`,
                        background: isChecked ? "#2D6A4F" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {isChecked && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 3 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "#6B7280" }}>
                        <span style={{ color: r.rating != null ? ratingColor(r.rating) : "#9CA3AF", fontWeight: 600 }}>Rating {r.rating ?? "—"}</span>
                        {" · "}
                        <span style={{ color: povertyColor(r.povertyRate) }}>Poverty {r.povertyRate}%</span>
                        {" · "}
                        {r.subscriptions?.toLocaleString() ?? 0} households
                      </div>
                    </div>
                    {/* Badge */}
                    <span style={{ background: badge.bg, color: badge.text, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Live portfolio summary bar */}
        <div
          style={{
            padding: "14px 20px",
            background: portfolioStats ? "#2D6A4F" : "#F9FAFB",
            transition: "background 0.2s",
          }}
        >
          {portfolioStats ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              {[
                { val: portfolioStats.count, label: "resources selected" },
                { val: portfolioStats.totalSubs.toLocaleString(), label: "combined households" },
                { val: portfolioStats.zips.join(", "), label: "ZIP codes covered" },
                { val: `${portfolioStats.avgPoverty}%`, label: "avg poverty rate" },
              ].map(({ val, label }) => (
                <div key={label}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 10, color: "#86EFAC", marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>
              Select resources above to see your combined impact
            </div>
          )}
        </div>

        {/* Insight + methodology */}
        <div style={{ padding: "12px 20px", background: "#F0FDF4", borderTop: "1px solid #BBF7D0", fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
          {zipGroups.length > 0
            ? `These neighborhoods span ${zipGroups.length} ZIP code${zipGroups.length === 1 ? "" : "s"} across ${[...new Set(zipGroups.map((g) => g.borough))].join(", ")} — concentrated high-need areas where coordinated support would have the greatest combined impact.`
            : "Select resources above to see combined impact across ZIPs and boroughs."}
        </div>
        <div style={{ padding: "8px 20px 14px", borderTop: "1px solid #F3F4F6" }}>
          <button
            type="button"
            onClick={() => setShowWhy((s) => !s)}
            style={{ fontSize: 11, color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline", fontWeight: 600 }}
          >
            {showWhy ? "Hide methodology" : "How is impact score calculated?"}
          </button>
          {showWhy && (
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8, lineHeight: 1.6 }}>{methodologyText}</p>
          )}
        </div>
      </div>

      <div style={{ height: 24 }} />
      <Footer />
    </div>
  );
}