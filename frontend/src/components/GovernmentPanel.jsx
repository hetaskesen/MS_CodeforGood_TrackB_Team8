"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis, ReferenceArea,
} from "recharts";
import { govData as defaultGovData } from "@/lib/mockData";
import Footer from "./Footer";
import ALICETab from "./ALICETab";

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",    emoji: "📊", label: "Overview" },
  { id: "underserved", emoji: "🗺",  label: "Underserved Areas" },
  { id: "barriers",   emoji: "🚧", label: "Access Barriers" },
  { id: "gaps",       emoji: "🧊", label: "Resource Gaps" },
  { id: "alice",      emoji: "👥", label: "True Demand" },
  { id: "transit",    emoji: "🚌", label: "Transit Access" },
  { id: "reliability",emoji: "📅", label: "Reliability" },
  { id: "vulnerable", emoji: "🛡",  label: "Vulnerable Pop." },
];

// Borough color palette for dynamic visualizations
const BOROUGH_COLOR = {
  Manhattan:     "#EF4444",
  Brooklyn:      "#3B82F6",
  Queens:        "#10B981",
  Bronx:         "#F59E0B",
  "Staten Island": "#8B5CF6",
  Unknown:       "#9CA3AF",
};

// Maps filter select values → govData.boroughStats keys
const BOROUGH_KEY_MAP = {
  manhattan:    "Manhattan",
  brooklyn:     "Brooklyn",
  queens:       "Queens",
  bronx:        "Bronx",
  staten_island: "StatenIsland",
};

// Maps filter select values → display names
const BOROUGH_DISPLAY = {
  manhattan:    "Manhattan",
  brooklyn:     "Brooklyn",
  queens:       "Queens",
  bronx:        "Bronx",
  staten_island: "Staten Island",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function needBadge(score) {
  if (score >= 70) return { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" };
  return { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" };
}

function povertyColor(pct) {
  if (pct >= 30) return "#DC2626";
  if (pct >= 20) return "#D97706";
  return "#374151";
}

function downloadCSV(govData) {
  const rows = [
    ["Type","ZIP","Neighborhood","Poverty %","Food Insecure","Population","Pantries","SNAP/Pantry","Need Score","Median Income"],
    ...(govData.underservedZips || []).map((z) => ["Underserved",z.zip,z.neighborhood,z.poverty,z.foodInsecurity,z.population,z.pantryCount,z.snapPerPantry,z.needScore,z.medianIncome]),
    ...(govData.zeroPantryZips || []).map((z) => ["Zero-pantry",z.zip,z.neighborhood,z.poverty,z.foodInsecurity,z.population,z.pantryCount,"—",z.needScore,z.medianIncome]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lemontree_coverage_gaps.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function StatCard({ value, label, valueColor = "#111827", bg = "#F9FAFB", border = "#E5E7EB" }) {
  return (
    <div style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 21, fontWeight: 800, color: valueColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>{label}</div>
    </div>
  );
}

// Coverage gap bubble chart dot — color by borough, red ring if no fresh produce
function CoverageBubbleDot({ cx, cy, payload }) {
  if (cx == null || cy == null) return null;
  const households = payload.aliceHouseholds || 0;
  const r = Math.max(Math.sqrt(households / 80), 5);
  const color = BOROUGH_COLOR[payload.borough] ?? "#9CA3AF";
  const noFreshProduce = (payload.freshProduceCount ?? 0) === 0;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.7} stroke={color} strokeWidth={1} />
      {noFreshProduce && (
        <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="#DC2626" strokeWidth={1.5} strokeDasharray="3 2" />
      )}
    </g>
  );
}

// Coverage gap bubble chart tooltip
function CoverageBubbleTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const noFreshProduce = (d.freshProduceCount ?? 0) === 0;
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 11, lineHeight: 1.7, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", maxWidth: 200 }}>
      <strong style={{ fontSize: 12 }}>ZIP {d.zip} — {d.neighborhood}</strong><br />
      <span style={{ color: "#6B7280" }}>{d.borough}</span><br />
      ALICE: <strong>{d.alicePct != null ? `${d.alicePct.toFixed(1)}%` : "N/A"}</strong> below threshold<br />
      Coverage: <strong>{d.pantresPer10k?.toFixed(2) ?? 0} pantries / 10k</strong><br />
      ALICE households: <strong>{(d.aliceHouseholds || 0).toLocaleString()}</strong><br />
      {noFreshProduce && <span style={{ color: "#DC2626", fontWeight: 700 }}>⚠ No fresh produce</span>}
    </div>
  );
}

// ── TAB 1: Overview ───────────────────────────────────────────────────────────

function OverviewTab({ filters, govData }) {
  const bKey       = BOROUGH_KEY_MAP[filters.borough];
  const bStats     = bKey ? govData?.boroughStats?.[bKey] : null;
  const bLabel     = filters.borough !== "all" ? BOROUGH_DISPLAY[filters.borough] : null;
  const sys        = govData?.systemStats ?? {};

  const totalVal     = bStats ? bStats.total.toLocaleString() : (sys.totalResources ?? 0).toLocaleString();
  const publishedVal = bStats ? bStats.published.toLocaleString() : (sys.publishedResources ?? 0).toLocaleString();
  const unavailPct   = bStats
    ? (bStats.total > 0 ? Math.round(bStats.unavailable / bStats.total * 100) : 0)
    : (sys.unavailableRate ?? 0);
  const unavailNum   = bStats ? bStats.unavailable : (sys.unavailableResources ?? 0);
  const unavailVal   = `${unavailNum.toLocaleString()} (${unavailPct}%)`;

  const avgRating  = sys.avgRating ?? 0;
  const totalRated = sys.totalRated ?? 0;

  // Build bubble chart data from underservedZips — filter to those with ALICE data
  const bubbleData = (govData?.underservedZips ?? [])
    .filter((z) => z.alicePct != null)
    .map((z) => ({
      ...z,
      x: z.alicePct,
      y: z.pantresPer10k ?? 0,
      size: z.aliceHouseholds ?? 0,
    }));

  // Add borough legend entries
  const boroughsInData = [...new Set(bubbleData.map((d) => d.borough))].filter(Boolean);

  return (
    <div>
      {/* 3 stat cards — borough-aware when filter active */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <StatCard value={totalVal}     label={bLabel ? `food resources in ${bLabel}` : "food resources in NYC"} />
        <StatCard value={publishedVal} label="currently published"   valueColor="#166534" bg="#F0FDF4" border="#BBF7D0" />
        <StatCard value={unavailVal}   label="currently unavailable" valueColor="#991B1B" bg="#FEF2F2" border="#FECACA" />
      </div>

      {/* Avg rating card */}
      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: "#D97706", lineHeight: 1 }}>
          {avgRating > 0 ? avgRating.toFixed(2) : "—"} <span style={{ fontSize: 16, fontWeight: 500, color: "#92400E" }}>/ 5.0</span>
          </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
          City-wide average rating across {totalRated.toLocaleString()} rated resources
        </div>
        {avgRating > 0 && (
          <div style={{ fontSize: 11, color: "#92400E", marginTop: 6, fontWeight: 600 }}>
            {unavailPct}% of all resources are currently unavailable — a service reliability concern
          </div>
        )}
      </div>

      {/* Coverage gap bubble chart */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 2 }}>
          Coverage gap bubble chart
        </div>
        <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>
          X = ALICE %, Y = pantries per 10k · Bubble size = ALICE households · Dashed red ring = no fresh produce
        </div>
        {/* Borough legend */}
        {boroughsInData.length > 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
            {boroughsInData.map((b) => (
              <span key={b} style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4, color: "#374151" }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: BOROUGH_COLOR[b] ?? "#9CA3AF" }} />
                {b}
              </span>
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 10, right: 16, bottom: 28, left: 4 }}>
            <ReferenceArea x1={30} x2={100} y1={0} y2={1.5} fill="#FEE2E2" fillOpacity={0.35}
              label={{ value: "HIGH NEED / LOW COVERAGE", position: "insideTopLeft", style: { fill: "#DC2626", fontSize: 8, fontWeight: 700 } }} />
            <ReferenceArea x1={0} x2={30} y1={1.5} y2={6} fill="#F0FDF4" fillOpacity={0.35}
              label={{ value: "LOW NEED / WELL SERVED", position: "insideBottomRight", style: { fill: "#166534", fontSize: 8, fontWeight: 600 } }} />
            <XAxis
              type="number" dataKey="x" name="ALICE %" domain={[0, 100]}
              tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
              label={{ value: "ALICE % (below threshold)", position: "insideBottom", offset: -14, style: { fontSize: 9, fill: "#9CA3AF" } }}
            />
            <YAxis
              type="number" dataKey="y" name="Pantries / 10k" domain={[0, "auto"]}
              tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
              label={{ value: "Pantries / 10k", angle: -90, position: "insideLeft", style: { fontSize: 9, fill: "#9CA3AF" } }}
            />
            <ZAxis type="number" dataKey="size" range={[40, 400]} />
            <Tooltip content={<CoverageBubbleTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={bubbleData} shape={<CoverageBubbleDot />} />
          </ScatterChart>
        </ResponsiveContainer>
        {bubbleData.length === 0 && (
          <div style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", paddingBottom: 8 }}>
            ALICE data loading — chart will populate automatically
          </div>
        )}
        <div style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center", marginTop: 2 }}>
          Bubble size = ALICE households · Dashed red border = zero fresh produce options
        </div>
      </div>

      {/* Export buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button
          onClick={() => window.print()}
          style={{ padding: "9px 0", background: "#2D6A4F", color: "#fff", fontSize: 12, fontWeight: 600, borderRadius: 10, border: "none", cursor: "pointer" }}
        >
          Print / Save as PDF
        </button>
        <button
          onClick={() => downloadCSV(govData)}
          style={{ padding: "9px 0", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, borderRadius: 10, border: "1px solid #D1D5DB", cursor: "pointer" }}
        >
          Download CSV
        </button>
      </div>
    </div>
  );
}

// ── TAB 2: Underserved Areas ──────────────────────────────────────────────────

function UnderservedTab({ filters, flyTo, govData }) {
  const [selectedZip, setSelectedZip] = useState(null);

  const filteredZips = (govData?.underservedZips ?? [])
    .filter((z) => {
      // Borough filter — all underserved ZIPs are Manhattan; other boroughs show empty state
      if (filters.borough !== "all") {
        const expectedBorough = BOROUGH_DISPLAY[filters.borough] ?? "";
        if ((z.borough ?? "Manhattan") !== expectedBorough) return false;
      }
      if (filters.poverty === "high"   && z.poverty <  30) return false;
      if (filters.poverty === "medium" && (z.poverty < 15 || z.poverty >= 30)) return false;
      if (filters.poverty === "low"    && z.poverty >= 15) return false;
      return true;
    })
    .sort((a, b) => b.needScore - a.needScore);

  function handleCardClick(z) {
    setSelectedZip(z.zip === selectedZip ? null : z.zip);
    flyTo(z.lat, z.lng, 14);
  }

  return (
    <div>
      {/* Summary strip */}
      <div style={{ background: "#F0FDF4", borderLeft: "3px solid #2D6A4F", borderRadius: "0 8px 8px 0", padding: "9px 12px", marginBottom: 14, fontSize: 12, color: "#166534", lineHeight: 1.5 }}>
      Top {govData?.underservedZips?.length ?? 0} ZIP codes identified as critically underserved.
      </div>

      {/* ZIP cards */}
      {filteredZips.length === 0 ? (
        <div style={{ fontSize: 13, color: "#6B7280", textAlign: "center", padding: "28px 0", background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB" }}>
          No underserved areas found for this filter.
          {filters.borough !== "all" && (
            <div style={{ fontSize: 11, marginTop: 6, color: "#9CA3AF" }}>
              All 5 underserved ZIP codes are in Manhattan.
            </div>
          )}
        </div>
      ) : (
        filteredZips.map((z) => {
          const badge = needBadge(z.needScore);
          const borderColor = z.needScore >= 70 ? "#EF4444" : "#F59E0B";
          const isSelected = selectedZip === z.zip;
          return (
            <div
              key={z.zip}
              onClick={() => handleCardClick(z)}
              style={{
                background: isSelected ? "#FAFAF9" : "#fff",
                border: `1px solid ${isSelected ? borderColor : "#E5E7EB"}`,
                borderLeft: `4px solid ${borderColor}`,
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 10,
                cursor: "pointer",
                boxShadow: isSelected ? `0 2px 8px ${borderColor}28` : "0 1px 3px rgba(0,0,0,0.05)",
                transition: "box-shadow 0.15s, border-color 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{z.neighborhood}</div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>ZIP {z.zip}</div>
                </div>
                <span style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  Need: {z.needScore}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 11, color: "#6B7280" }}>
                <span>Poverty: <strong style={{ color: povertyColor(z.poverty) }}>{z.poverty.toFixed(1)}%</strong></span>
                <span>Food insecure: <strong style={{ color: "#374151" }}>{z.foodInsecurity.toLocaleString()}</strong></span>
                <span>Pantries: <strong style={{ color: "#374151" }}>{z.pantryCount}</strong></span>
                <span>SNAP / pantry: <strong style={{ color: "#374151" }}>{z.snapPerPantry.toLocaleString()}</strong></span>
              </div>
            </div>
          );
        })
      )}

      {/* Insight callout — dynamic from top ZIP */}
      {filteredZips.length > 0 && (
        <div style={{ padding: "10px 12px", background: "#F0FDF4", borderLeft: "3px solid #2D6A4F", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#166534", lineHeight: 1.5, marginBottom: 18 }}>
          ZIP {filteredZips[0].zip} ({filteredZips[0].neighborhood}) has the highest need score ({filteredZips[0].needScore}) with {filteredZips[0].snapPerPantry.toLocaleString()} SNAP recipients per pantry.
        </div>
      )}

      {/* Zero-pantry ZIPs — filtered by borough */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
        ZIP codes with zero food resources
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {(govData?.zeroPantryZips ?? [])
          .filter((z) => {
            if (filters.borough === "all") return true;
            const expectedBorough = BOROUGH_DISPLAY[filters.borough] ?? "";
            return (z.borough ?? "") === expectedBorough;
          })
          .map((z) => (
          <div
            key={z.zip}
            onClick={() => flyTo(z.lat, z.lng, 14)}
            style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#991B1B" }}>ZIP {z.zip}</div>
              <span style={{ fontSize: 9, fontWeight: 700, background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA", borderRadius: 4, padding: "1px 5px" }}>No coverage</span>
            </div>
            <div style={{ fontSize: 11, color: "#991B1B", fontWeight: 500, marginBottom: 5 }}>{z.neighborhood}</div>
            <div style={{ fontSize: 10, color: "#6B7280", lineHeight: 1.7 }}>
              Pop: {z.population.toLocaleString()}<br />
              Poverty: {z.poverty.toFixed(1)}%<br />
              Food insecure: ~{z.foodInsecurity.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TAB 3: Access Barriers ────────────────────────────────────────────────────

function AccessBarriersTab({ govData }) {
  const { barriers, totalPublished } = govData?.accessBarriers ?? { barriers: [], totalPublished: 0 };
  const rel = govData?.reliability ?? { unavailableInUnderservedZips: 0, publishedInUnderservedZips: 0, pctOfflineInUnderserved: 0 };
  const available = rel.publishedInUnderservedZips;
  const unavailable = rel.unavailableInUnderservedZips;
  const total = available + unavailable;
  const availPct = total > 0 ? Math.round((available / total) * 100) : 58;
  const unavailPctDynamic = 100 - availPct;

  // ID barrier stat from real access barriers data
  const idBarrier = barriers.find((b) => b.tag?.toLowerCase().includes("id required"));
  const idPct = idBarrier?.pct ?? 0;

  // Language gaps from backend
  const languageGaps = govData?.languageGaps ?? [];

  // Borough-level language gap summary
  const langByBorough = languageGaps.reduce((acc, g) => {
    if (!acc[g.borough]) acc[g.borough] = { count: 0, maxPct: 0 };
    acc[g.borough].count += 1;
    if (g.pctLimitedEnglish > acc[g.borough].maxPct) acc[g.borough].maxPct = g.pctLimitedEnglish;
    return acc;
  }, {});

  return (
    <div>
      {/* Reliability crisis card */}
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderLeft: "4px solid #EF4444", borderRadius: "0 12px 12px 0", padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 44, fontWeight: 800, color: "#DC2626", lineHeight: 1, marginBottom: 4 }}>
          {unavailPctDynamic}%
        </div>
        <div style={{ fontSize: 12, color: "#991B1B", fontWeight: 600, marginBottom: 10 }}>
          of resources in underserved ZIP codes are UNAVAILABLE
        </div>
        {/* Stacked bar */}
        <div style={{ display: "flex", height: 16, borderRadius: 4, overflow: "hidden", marginBottom: 7 }}>
          <div style={{ width: `${availPct}%`, background: "#2D6A4F" }} />
          <div style={{ width: `${unavailPctDynamic}%`, background: "#DC2626" }} />
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#166534" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 1, background: "#2D6A4F" }} />
            {available} published ({availPct}%)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#991B1B" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 1, background: "#DC2626" }} />
            {unavailable} unavailable ({unavailPctDynamic}%)
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#991B1B", marginTop: 9, lineHeight: 1.5 }}>
          This exceeds the city-wide offline rate of {govData?.systemStats?.unavailableRate ?? 0}% — high-need areas face disproportionately unreliable service.
        </div>
      </div>

      {/* Access barriers chart */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Requirements that limit access</div>
        <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>{totalPublished.toLocaleString()} published resources total</div>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={barriers} layout="vertical" margin={{ left: 0, right: 38, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="tag" tick={{ fontSize: 10, fill: "#374151" }} width={168} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB" }}
              formatter={(val, _n, p) => [`${val} resources (${p.payload.pct}%)`, ""]}
            />
            <Bar dataKey="count" radius={[0, 5, 5, 0]} barSize={15}>
              {barriers.map((b, i) => (
                <Cell
                  key={i}
                  fill={
                    b.tag === "Fresh produce available" ? "#2D6A4F"
                    : b.restrictive ? "#EF4444"
                    : "#F59E0B"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ID barrier policy insight */}
      {idPct > 0 && (
        <div style={{ padding: "10px 12px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991B1B", lineHeight: 1.5, marginBottom: 14 }}>
          {idPct}% of published resources require ID — a significant barrier for undocumented residents, who represent a substantial portion of food-insecure populations.
        </div>
      )}

      {/* Language access gap section */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Language access gap</div>
        <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>
          ZIP codes where &gt;15% residents have limited English, but zero multilingual resources
        </div>
        {languageGaps.length === 0 ? (
          <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", padding: "16px 0" }}>
            No language gaps detected in current data
          </div>
        ) : (
          <>
            {/* Borough summary */}
            {Object.entries(langByBorough).length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {Object.entries(langByBorough).map(([b, d]) => (
                  <div key={b} style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "6px 10px", fontSize: 11 }}>
                    <div style={{ fontWeight: 700, color: "#991B1B" }}>{b}</div>
                    <div style={{ color: "#6B7280" }}>{d.count} ZIP{d.count !== 1 ? "s" : ""} · up to {d.maxPct.toFixed(1)}% limited English</div>
                  </div>
                ))}
              </div>
            )}
            {/* Top language gap ZIPs */}
            {languageGaps.slice(0, 5).map((g) => (
              <div key={g.zip} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}>
                  <span style={{ color: "#374151", fontWeight: 600 }}>
                    ZIP {g.zip} — {g.neighborhood || g.borough}
                  </span>
                  <span style={{ fontWeight: 700, color: "#DC2626" }}>{g.pctLimitedEnglish.toFixed(1)}% limited English</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: "#F3F4F6", overflow: "hidden", marginBottom: 2 }}>
                  <div style={{ height: "100%", width: `${Math.min(g.pctLimitedEnglish, 100)}%`, background: "#EF4444", borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 10, color: "#9CA3AF" }}>
                  {g.pctForeignBorn.toFixed(1)}% foreign-born · {g.pantryCount} pantry{g.pantryCount !== 1 ? "ies" : ""} · pop {(g.population || 0).toLocaleString()}
                </div>
              </div>
            ))}
            <div style={{ padding: "8px 10px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 6px 6px 0", fontSize: 11, color: "#991B1B", lineHeight: 1.5, marginTop: 4 }}>
              These neighborhoods have significant immigrant populations with no multilingual food resources — a compounding barrier.
            </div>
          </>
        )}
      </div>

      {/* Compounding barrier callout */}
      <div style={{ padding: "10px 12px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991B1B", lineHeight: 1.5 }}>
        The highest-need neighborhoods face multiple compounding barriers: ID requirements, language barriers, and appointment-only access — for the most vulnerable residents.
      </div>
    </div>
  );
}

// ── TAB 4: Resource Gaps ──────────────────────────────────────────────────────

function ResourceGapsTab({ govData }) {
  const f = govData?.communityFridges ?? { total: 0, inUnderservedZips: 0, pctMisaligned: 0, topZips: [] };

  // Top current fridge ZIPs (not underserved) from real data
  const currentClusters = (f.topZips ?? []).filter((z) => !z.underserved).slice(0, 4);
  // Recommended zones — underserved ZIPs that have the highest need scores and few fridges
  const recommendedZones = (govData?.underservedZips ?? [])
    .filter((z) => !f.topZips?.find((t) => t.zip === z.zip && t.count > 1))
    .sort((a, b) => b.needScore - a.needScore)
    .slice(0, 3);

  // Fridge pct in underserved computed dynamically
  const fridgeInUnderservedPct = f.total > 0 ? Math.round((f.inUnderservedZips / f.total) * 100) : 0;

  return (
    <div>
      {/* Fridge misalignment numbers */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 0, marginBottom: 14 }}>
          <div style={{ flex: 1, paddingRight: 20, borderRight: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{f.total}</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>Total community fridges in NYC</div>
          </div>
          <div style={{ flex: 1, paddingLeft: 20 }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#DC2626", lineHeight: 1 }}>
              {f.inUnderservedZips}{" "}
              <span style={{ fontSize: 15, fontWeight: 600 }}>({fridgeInUnderservedPct}%)</span>
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>In underserved ZIP codes</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
          <strong>{f.pctMisaligned}%</strong> of community fridges are NOT in the highest-need ZIP codes.
          {recommendedZones.length > 0 && (
            <span> Redirecting placement to {recommendedZones.map((z) => z.zip).join(", ")} could significantly improve access.</span>
          )}
        </div>
      </div>

      {/* Where fridges are vs where they should be */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {/* Left: current clusters */}
        <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>
            Current fridge clusters
          </div>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 10 }}>not in highest-need ZIPs</div>
          {currentClusters.length > 0 ? currentClusters.map((c) => (
            <div key={c.zip} style={{ marginBottom: 9, fontSize: 11, color: "#6B7280" }}>
              <div style={{ fontWeight: 600, color: "#374151" }}>ZIP {c.zip}</div>
              <div><strong>{c.count} fridges</strong> · not underserved</div>
            </div>
          )) : (
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>Data loading…</div>
          )}
        </div>

        {/* Right: recommended zones */}
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", marginBottom: 4 }}>
            Recommended zones
          </div>
          <div style={{ fontSize: 10, color: "#4ADE80", marginBottom: 10 }}>highest need · under-resourced</div>
          {recommendedZones.length > 0 ? recommendedZones.map((r) => (
            <div key={r.zip} style={{ marginBottom: 9, fontSize: 11, color: "#166534" }}>
              <div style={{ fontWeight: 600 }}>{r.neighborhood} ({r.zip})</div>
              <div>Need score: <strong>{r.needScore}</strong> · {r.pantryCount} pantry{r.pantryCount !== 1 ? "ies" : ""}</div>
            </div>
          )) : (
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>Data loading…</div>
          )}
        </div>
      </div>

      {/* Key callout */}
      <div style={{ padding: "10px 12px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991B1B", lineHeight: 1.5, marginBottom: 12 }}>
        {f.pctMisaligned > 0 ? `${f.pctMisaligned}%` : "The majority"} of community fridges are located outside the highest-need ZIP codes.
      </div>

      {/* Methodology */}
      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>How this data was computed</div>
        <div style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.7 }}>
          Need score = composite of poverty rate, SNAP recipients per pantry, and food insecurity estimates from ACS 2024.
          Underserved ZIPs cross-referenced with {(govData?.systemStats?.totalResources ?? 0).toLocaleString()} LemonTree resources.
          Zero-pantry ZIPs identified by joining ACS demographics with resource ZIP codes.
        </div>
      </div>
    </div>
  );
}

// ── TAB 6: Transit Access ─────────────────────────────────────────────────────

function TransitAccessTab({ govData }) {
  const transitGaps = govData?.transitGaps ?? [];

  return (
    <div>
      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderLeft: "4px solid #3B82F6", borderRadius: "0 12px 12px 0", padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#1D4ED8", lineHeight: 1, marginBottom: 4 }}>
          {transitGaps.length} ZIP codes
        </div>
        <div style={{ fontSize: 12, color: "#1E40AF", fontWeight: 600 }}>
          are transit food deserts — high no-vehicle rate with fewer than 2 walkable resources
        </div>
      </div>

      {transitGaps.length === 0 ? (
        <div style={{ fontSize: 13, color: "#6B7280", textAlign: "center", padding: "28px 0", background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB" }}>
          No transit gap data available yet
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
            Highest-risk transit deserts
          </div>
          {transitGaps.map((g) => (
            <div key={g.zip} style={{ background: "#fff", border: "1px solid #E5E7EB", borderLeft: "4px solid #3B82F6", borderRadius: "0 12px 12px 0", padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{g.neighborhood || "—"}</div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>ZIP {g.zip} · {g.borough}</div>
                </div>
                <span style={{ background: "#DBEAFE", color: "#1E40AF", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                  {g.noVehicleRate.toFixed(1)}% no vehicle
                    </span>
                  </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px 12px", fontSize: 11, color: "#6B7280" }}>
                <span>Walkable resources: <strong style={{ color: "#374151" }}>{g.resourcesWithinHalfMile}</strong></span>
                <span>Nearest: <strong style={{ color: "#374151" }}>{g.nearestResourceMiles > 0 ? `${g.nearestResourceMiles} mi` : "—"}</strong></span>
                <span>Pop: <strong style={{ color: "#374151" }}>{(g.population || 0).toLocaleString()}</strong></span>
              </div>
            </div>
          ))}
          <div style={{ padding: "10px 12px", background: "#EFF6FF", borderLeft: "3px solid #3B82F6", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#1E40AF", lineHeight: 1.5, marginTop: 4 }}>
            Residents without vehicles in these ZIPs must travel over a mile to access food — a critical mobility barrier.
          </div>
        </>
      )}
    </div>
  );
}

// ── TAB 7: Service Reliability ────────────────────────────────────────────────

function ReliabilityTab({ govData }) {
  const reliabilityGaps = govData?.reliabilityGaps ?? [];
  const boroughStats = govData?.boroughReliabilityStats ?? [];

  return (
    <div>
      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderLeft: "4px solid #D97706", borderRadius: "0 12px 12px 0", padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#92400E", lineHeight: 1, marginBottom: 4 }}>
          {reliabilityGaps.length} high-poverty ZIPs
        </div>
        <div style={{ fontSize: 12, color: "#92400E", fontWeight: 600 }}>
          have frequent service closures — avg &gt;2 skip events per resource
        </div>
      </div>

      {/* Borough reliability summary */}
      {boroughStats.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Confirmed open rate by borough</div>
          {boroughStats.sort((a, b) => a.avgConfirmedOpenRate - b.avgConfirmedOpenRate).map((b) => (
            <div key={b.borough} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}>
                <span style={{ color: "#374151", fontWeight: 600 }}>{b.borough}</span>
                <span style={{ fontWeight: 700, color: b.avgConfirmedOpenRate < 50 ? "#DC2626" : b.avgConfirmedOpenRate < 70 ? "#D97706" : "#166534" }}>
                  {b.avgConfirmedOpenRate.toFixed(1)}% confirmed open
                    </span>
                  </div>
              <div style={{ height: 7, borderRadius: 4, background: "#F3F4F6", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(b.avgConfirmedOpenRate, 100)}%`,
                  background: b.avgConfirmedOpenRate < 50 ? "#EF4444" : b.avgConfirmedOpenRate < 70 ? "#F59E0B" : "#2D6A4F",
                  borderRadius: 4,
                }} />
              </div>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>Avg {b.avgSkipRangeCount.toFixed(1)} skip events</div>
            </div>
          ))}
        </div>
      )}

      {reliabilityGaps.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Most unreliable high-poverty neighborhoods</div>
          {reliabilityGaps.map((g) => (
            <div key={g.zip} style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderLeft: "4px solid #D97706", borderRadius: "0 12px 12px 0", padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{g.neighborhood || "—"}</div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>ZIP {g.zip} · {g.borough}</div>
                </div>
                <span style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                  {g.avgSkipRangeCount} avg skips
                    </span>
                  </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 11, color: "#6B7280" }}>
                <span>Open rate: <strong style={{ color: "#374151" }}>{g.confirmedOpenRate.toFixed(1)}%</strong></span>
                <span>Poverty: <strong style={{ color: "#374151" }}>{(g.poverty || 0).toFixed(1)}%</strong></span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── TAB 8: Vulnerable Populations ─────────────────────────────────────────────

function VulnerablePopTab({ govData }) {
  const seniorGaps = govData?.seniorAccessGaps ?? [];
  const dietaryGaps = govData?.dietaryGaps ?? [];

  return (
    <div>
      {/* Senior Access Section */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Senior access barriers</div>
      <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderLeft: "4px solid #7C3AED", borderRadius: "0 12px 12px 0", padding: "12px 14px", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#5B21B6", lineHeight: 1.5 }}>
          ZIP codes where seniors (&gt;15% of population) face appointment-only resources — a significant mobility barrier for elderly residents.
        </div>
      </div>
      {seniorGaps.length === 0 ? (
        <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", padding: "12px 0", marginBottom: 12 }}>No senior access gaps found in current data</div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          {seniorGaps.map((g) => (
            <div key={g.zip} style={{ background: "#fff", border: "1px solid #E5E7EB", borderLeft: "4px solid #7C3AED", borderRadius: "0 12px 12px 0", padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{g.neighborhood || "—"}</div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>ZIP {g.zip} · {g.borough}</div>
                </div>
                <span style={{ background: "#EDE9FE", color: "#5B21B6", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                  {g.pctSeniors.toFixed(1)}% seniors
                    </span>
                  </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 11, color: "#6B7280" }}>
                <span>Appt-only share: <strong style={{ color: "#374151" }}>{g.apptOnlyShare.toFixed(1)}%</strong></span>
                <span>Walk-in resources: <strong style={{ color: "#374151" }}>{g.walkInCount}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dietary Access Section */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Dietary access gaps (Halal/Kosher)</div>
      <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderLeft: "4px solid #EA580C", borderRadius: "0 12px 12px 0", padding: "12px 14px", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#9A3412", lineHeight: 1.5 }}>
          ZIP codes with food pantries but zero halal or kosher options — a barrier for Muslim and Jewish communities.
        </div>
      </div>
      {dietaryGaps.length === 0 ? (
        <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", padding: "12px 0" }}>No dietary gap data available</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {dietaryGaps.slice(0, 6).map((g) => (
              <div key={g.zip} style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#9A3412" }}>ZIP {g.zip}</div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>{g.neighborhood || g.borough}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                  {g.pantryCount} pantry{g.pantryCount !== 1 ? "ies" : ""} · 0 halal/kosher
                </div>
              </div>
            ))}
        </div>
          <div style={{ padding: "10px 12px", background: "#FFF7ED", borderLeft: "3px solid #EA580C", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#9A3412", lineHeight: 1.5, marginTop: 10 }}>
            These {dietaryGaps.length} ZIP codes have active food resources but none serving dietary-specific needs — a gap affecting hundreds of thousands of residents.
          </div>
        </>
      )}
      </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GovernmentPanel({ govData = defaultGovData, dataSource = "static" }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({ borough: "all", poverty: "all", status: "all" });

  const flyTo = (lat, lng, zoom = 14) => {
    window.dispatchEvent(new CustomEvent("gov:flyto", { detail: { lat, lng, zoom } }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.dispatchEvent(new CustomEvent("gov:tabchange", { detail: { tab } }));
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== "all").length;

  // Count underserved ZIPs that match current filters (used in filter bar)
  const filteredZipCount = govData.underservedZips.filter((z) => {
    if (filters.borough !== "all") {
      const expectedBorough = BOROUGH_DISPLAY[filters.borough] ?? "";
      if ((z.borough ?? "Manhattan") !== expectedBorough) return false;
    }
    if (filters.poverty === "high"   && z.poverty <  30) return false;
    if (filters.poverty === "medium" && (z.poverty < 15 || z.poverty >= 30)) return false;
    if (filters.poverty === "low"    && z.poverty >= 15) return false;
    return true;
  }).length;

  const FILTER_DEFS = [
    {
      key: "borough", options: [
        ["all", "All boroughs"], ["manhattan", "Manhattan"], ["brooklyn", "Brooklyn"],
        ["queens", "Queens"], ["bronx", "Bronx"], ["staten_island", "Staten Island"],
      ],
    },
    {
      key: "poverty", options: [
        ["all", "All poverty levels"], ["high", "High (>30%)"],
        ["medium", "Medium (15–30%)"], ["low", "Low (<15%)"],
      ],
    },
    {
      key: "status", options: [
        ["all", "All status"], ["published", "Published only"], ["unavailable", "Unavailable only"],
      ],
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "'DM Sans', system-ui, sans-serif", overflow: "hidden" }}>

      {/* ── Always-visible header ── */}
      <div style={{ padding: "12px 18px 10px", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: 0 }}>
            Coverage gap analysis
            {dataSource === "supabase" && (
              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, color: "#166534", background: "#DCFCE7", padding: "2px 6px", borderRadius: 6 }}>
                ● Live data
              </span>
            )}
          </h3>
          <div style={{ fontSize: 11, whiteSpace: "nowrap" }}>
            <span style={{ color: "#6B7280" }}>{govData.systemStats?.totalResources?.toLocaleString() ?? "1,976"} total</span>
            <span style={{ margin: "0 4px", color: "#D1D5DB" }}>·</span>
            <span style={{ color: "#166534" }}>{(govData.systemStats?.publishedResources ?? 1343).toLocaleString()} live</span>
            <span style={{ margin: "0 4px", color: "#D1D5DB" }}>·</span>
            <span style={{ color: "#DC2626", fontWeight: 700 }}>{(govData.systemStats?.unavailableResources ?? 633).toLocaleString()} offline ({govData.systemStats?.unavailableRate ?? 32}%) ⚠</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
          NYC food resource network · ACS 2024
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ padding: "8px 18px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", flexShrink: 0, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {FILTER_DEFS.map(({ key, options }) => (
          <select
            key={key}
            value={filters[key]}
            onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
            style={{
              fontSize: 11,
              color: "#374151",
              background: "#fff",
              border: `1px solid ${filters[key] !== "all" ? "#2D6A4F" : "#D1D5DB"}`,
              borderRadius: 7,
              padding: "4px 8px",
              cursor: "pointer",
              outline: "none",
              fontWeight: filters[key] !== "all" ? 600 : 400,
            }}
          >
            {options.map(([val, txt]) => <option key={val} value={val}>{txt}</option>)}
          </select>
        ))}
        {activeFilterCount > 0 && (
          <button
            onClick={() => setFilters({ borough: "all", poverty: "all", status: "all" })}
            style={{ fontSize: 11, color: "#DC2626", background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontWeight: 600 }}
          >
            Clear ({activeFilterCount})
        </button>
        )}
        {activeFilterCount > 0 && (
          <span style={{ fontSize: 11, color: "#6B7280", marginLeft: 2 }}>
            {filteredZipCount} of {govData.underservedZips.length} ZIPs
          </span>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div style={{ padding: "8px 18px 0", borderBottom: "1px solid #E5E7EB", flexShrink: 0, display: "flex", gap: 3 }}>
        {TABS.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              style={{
                padding: "7px 11px",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: "8px 8px 0 0",
                border: `1px solid ${isActive ? "#2D6A4F" : "#E5E7EB"}`,
                borderBottom: isActive ? "1px solid #fff" : "1px solid #E5E7EB",
                background: isActive ? "#2D6A4F" : "#fff",
                color: isActive ? "#fff" : "#6B7280",
                cursor: "pointer",
                marginBottom: isActive ? -1 : 0,
                whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {t.emoji} {t.label}
        </button>
          );
        })}
      </div>

      {/* ── Tab content (independently scrollable) ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 8px" }}>
        {activeTab === "overview"    && <OverviewTab filters={filters} govData={govData} />}
        {activeTab === "underserved" && <UnderservedTab filters={filters} flyTo={flyTo} govData={govData} />}
        {activeTab === "barriers"    && <AccessBarriersTab govData={govData} />}
        {activeTab === "gaps"        && <ResourceGapsTab govData={govData} />}
        {activeTab === "alice"       && <ALICETab flyTo={flyTo} govData={govData} />}
        {activeTab === "transit"     && <TransitAccessTab govData={govData} />}
        {activeTab === "reliability" && <ReliabilityTab govData={govData} />}
        {activeTab === "vulnerable"  && <VulnerablePopTab govData={govData} />}
        <div style={{ height: 12 }} />
        <Footer />
      </div>
    </div>
  );
}
