"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { govData } from "@/lib/mockData";
import Footer from "./Footer";

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",    emoji: "📊", label: "Overview" },
  { id: "underserved", emoji: "🗺",  label: "Underserved Areas" },
  { id: "barriers",   emoji: "🚧", label: "Access Barriers" },
  { id: "gaps",       emoji: "🧊", label: "Resource Gaps" },
];

const RESOURCE_TYPES = [
  { label: "Food pantries",  count: 1636, pct: 83, color: "#2D6A4F" },
  { label: "Soup kitchens",  count: 214,  pct: 11, color: "#0D9488" },
  { label: "Comm. fridges",  count: 84,   pct:  4, color: "#3B82F6" },
  { label: "Meal delivery",  count: 14,   pct:  1, color: "#8B5CF6" },
  { label: "Other",          count: 28,   pct:  1, color: "#9CA3AF" },
];

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

function downloadCSV() {
  const rows = [
    ["Type","ZIP","Neighborhood","Poverty %","Food Insecure","Population","Pantries","SNAP/Pantry","Need Score","Median Income"],
    ...govData.underservedZips.map((z) => ["Underserved",z.zip,z.neighborhood,z.poverty,z.foodInsecurity,z.population,z.pantryCount,z.snapPerPantry,z.needScore,z.medianIncome]),
    ...govData.zeroPantryZips.map((z) => ["Zero-pantry",z.zip,z.neighborhood,z.poverty,z.foodInsecurity,z.population,z.pantryCount,"—",z.needScore,z.medianIncome]),
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

// ── Shared sub-component ──────────────────────────────────────────────────────

function StatCard({ value, label, valueColor = "#111827", bg = "#F9FAFB", border = "#E5E7EB" }) {
  return (
    <div style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 21, fontWeight: 800, color: valueColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── TAB 1: Overview ───────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div>
      {/* 3 stat cards */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <StatCard value="1,976"     label="food resources in NYC" />
        <StatCard value="1,343"     label="currently published"   valueColor="#166534" bg="#F0FDF4" border="#BBF7D0" />
        <StatCard value="633 (32%)" label="currently unavailable" valueColor="#991B1B" bg="#FEF2F2" border="#FECACA" />
      </div>

      {/* Avg rating card */}
      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: "#D97706", lineHeight: 1 }}>
          2.29 <span style={{ fontSize: 16, fontWeight: 500, color: "#92400E" }}>/ 5.0</span>
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
          City-wide average rating across 1,097 rated resources
        </div>
        <div style={{ fontSize: 11, color: "#92400E", marginTop: 6, fontWeight: 600 }}>
          Only 77 resources (7%) are rated above 3.0
        </div>
      </div>

      {/* Resource type breakdown */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
          What&apos;s in the network
        </div>
        {/* Stacked bar */}
        <div style={{ display: "flex", height: 20, borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
          {RESOURCE_TYPES.map((t) => (
            <div
              key={t.label}
              style={{ width: `${t.pct}%`, background: t.color }}
              title={`${t.label}: ${t.count}`}
            />
          ))}
        </div>
        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
          {RESOURCE_TYPES.map((t) => (
            <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#374151" }}>
              <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: t.color, flexShrink: 0 }} />
              {t.label} ({t.count})
            </div>
          ))}
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
          onClick={downloadCSV}
          style={{ padding: "9px 0", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, borderRadius: 10, border: "1px solid #D1D5DB", cursor: "pointer" }}
        >
          Download CSV
        </button>
      </div>
    </div>
  );
}

// ── TAB 2: Underserved Areas ──────────────────────────────────────────────────

function UnderservedTab({ filters, flyTo }) {
  const [selectedZip, setSelectedZip] = useState(null);

  const filteredZips = govData.underservedZips
    .filter((z) => {
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
        5 Manhattan ZIP codes are critically underserved — high poverty, insufficient pantry coverage
      </div>

      {/* ZIP cards */}
      {filteredZips.length === 0 && (
        <div style={{ fontSize: 13, color: "#6B7280", textAlign: "center", padding: "24px 0" }}>
          No ZIP codes match the current filters.
        </div>
      )}

      {filteredZips.map((z) => {
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
      })}

      {/* Insight callout */}
      <div style={{ padding: "10px 12px", background: "#F0FDF4", borderLeft: "3px solid #2D6A4F", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#166534", lineHeight: 1.5, marginBottom: 18 }}>
        ZIP 10030 (Central Harlem North) has the highest need score (74.3) with 3,736 SNAP recipients per pantry — the most critically underserved area in Manhattan.
      </div>

      {/* Zero-pantry ZIPs */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
        ZIP codes with zero food resources
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {govData.zeroPantryZips.map((z) => (
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

function AccessBarriersTab() {
  const { barriers, totalPublished } = govData.accessBarriers;
  const rel = govData.reliability;
  const available = rel.publishedInUnderservedZips;
  const unavailable = rel.unavailableInUnderservedZips;
  const total = available + unavailable;
  const availPct = Math.round((available / total) * 100);

  return (
    <div>
      {/* Reliability crisis card */}
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderLeft: "4px solid #EF4444", borderRadius: "0 12px 12px 0", padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 44, fontWeight: 800, color: "#DC2626", lineHeight: 1, marginBottom: 4 }}>42%</div>
        <div style={{ fontSize: 12, color: "#991B1B", fontWeight: 600, marginBottom: 10 }}>
          of resources in underserved ZIP codes are UNAVAILABLE
        </div>
        {/* Stacked bar */}
        <div style={{ display: "flex", height: 16, borderRadius: 4, overflow: "hidden", marginBottom: 7 }}>
          <div style={{ width: `${availPct}%`, background: "#2D6A4F" }} />
          <div style={{ width: `${100 - availPct}%`, background: "#DC2626" }} />
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#166534" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 1, background: "#2D6A4F" }} />
            {available} published ({availPct}%)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#991B1B" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 1, background: "#DC2626" }} />
            {unavailable} unavailable ({100 - availPct}%)
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#991B1B", marginTop: 9, lineHeight: 1.5 }}>
          This exceeds the city-wide offline rate of {govData.systemStats.unavailableRate}% — high-need areas face disproportionately unreliable service.
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

      {/* Policy insight */}
      <div style={{ padding: "10px 12px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991B1B", lineHeight: 1.5 }}>
        31% of published resources require ID — a significant barrier for undocumented residents, who represent a substantial portion of food-insecure populations in Manhattan.
      </div>
    </div>
  );
}

// ── TAB 4: Resource Gaps ──────────────────────────────────────────────────────

function ResourceGapsTab() {
  const f = govData.communityFridges;

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
              <span style={{ fontSize: 15, fontWeight: 600 }}>(14.6%)</span>
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>In underserved ZIP codes</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
          <strong>{f.pctMisaligned}%</strong> of community fridges are NOT in the highest-need ZIP codes. Redirecting placement to 10029, 10030, and 10039 could significantly improve access.
        </div>
      </div>

      {/* Top fridge ZIPs */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Where fridges currently are</div>
        {f.topZips.map((z) => (
          <div key={z.zip} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 12, color: "#374151" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: z.underserved ? "#2D6A4F" : "#D1D5DB", flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>ZIP {z.zip}</span>
            <span style={{ color: "#6B7280" }}>— {z.count} fridges</span>
            <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color: z.underserved ? "#166534" : "#9CA3AF" }}>
              {z.underserved ? "Underserved area" : "Not underserved"}
            </span>
          </div>
        ))}
      </div>

      {/* Methodology */}
      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>How this data was computed</div>
        <div style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.7 }}>
          Need score = composite of poverty rate, SNAP recipients per pantry, and food insecurity estimates. Underserved flag = is_underserved field from ACS 2024 demographic dataset (169 NYC ZIP codes), cross-referenced with 1,976 LemonTree resources. Zero-pantry ZIPs identified by joining demographics dataset ZIP codes with resource ZIP codes.
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GovernmentPanel() {
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
          </h3>
          <div style={{ fontSize: 11, whiteSpace: "nowrap" }}>
            <span style={{ color: "#6B7280" }}>1,976 total</span>
            <span style={{ margin: "0 4px", color: "#D1D5DB" }}>·</span>
            <span style={{ color: "#166534" }}>1,343 live</span>
            <span style={{ margin: "0 4px", color: "#D1D5DB" }}>·</span>
            <span style={{ color: "#DC2626", fontWeight: 700 }}>633 offline (32%) ⚠</span>
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
            {govData.underservedZips.filter((z) => {
              if (filters.poverty === "high"   && z.poverty <  30) return false;
              if (filters.poverty === "medium" && (z.poverty < 15 || z.poverty >= 30)) return false;
              if (filters.poverty === "low"    && z.poverty >= 15) return false;
              return true;
            }).length} of {govData.underservedZips.length} ZIPs
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
        {activeTab === "overview"    && <OverviewTab />}
        {activeTab === "underserved" && <UnderservedTab filters={filters} flyTo={flyTo} />}
        {activeTab === "barriers"    && <AccessBarriersTab />}
        {activeTab === "gaps"        && <ResourceGapsTab />}
        <div style={{ height: 12 }} />
        <Footer />
      </div>
    </div>
  );
}
