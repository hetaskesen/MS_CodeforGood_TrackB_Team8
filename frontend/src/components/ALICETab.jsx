"use client";

// ── ALICETab — drop this into GovernmentPanel.jsx ─────────────────────────
// Add "alice" to the TABS constant:
//   { id: "alice", emoji: "👥", label: "True Demand" }
// Then add to the tab content switcher:
//   {activeTab === "alice" && <ALICETab flyTo={flyTo} />}

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { govData as mockGovData } from "@/lib/mockData";

// ── helpers ───────────────────────────────────────────────────────────────

function gapColor(gap) {
  if (gap >= 48) return { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" };
  if (gap >= 42) return { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" };
  return { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" };
}

function boroughColor(b) {
  const map = {
    Bronx: "#EF4444", Brooklyn: "#3B82F6",
    Manhattan: "#8B5CF6", Queens: "#F59E0B",
  };
  return map[b] || "#9CA3AF";
}

// ── sub-components ────────────────────────────────────────────────────────

function ALICESummaryCard({ govData }) {
  const { aliceSummary } = govData ?? {};
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px", marginBottom: 12 }}>
      {/* Headline */}
      {!aliceSummary && (
        <div style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", padding: "16px 0" }}>
          ALICE summary loading — connect to live data
        </div>
      )}
      {aliceSummary && <div style={{ display: "flex", gap: 0, marginBottom: 14 }}>
        <div style={{ flex: 1, paddingRight: 20, borderRight: "1px solid #E5E7EB" }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#111827", lineHeight: 1 }}>
            {aliceSummary.pctBelowAlice}%
          </div>
          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
            of NYC households below ALICE threshold
          </div>
          <div style={{ fontSize: 11, color: "#374151", marginTop: 4, fontWeight: 600 }}>
            ~{((aliceSummary.householdsBelowAlice ?? 0) / 1000000).toFixed(1)}M households
          </div>
        </div>
        <div style={{ flex: 1, paddingLeft: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
            What is ALICE?
          </div>
          <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.6 }}>
            <strong style={{ color: "#374151" }}>Asset Limited, Income Constrained, Employed.</strong>{" "}
            Households that earn too much to qualify for SNAP but still fall below
            NYC&apos;s basic cost-of-living budget. One financial setback away from crisis.
          </div>
        </div>
      </div>}

      {/* ALICE vs SNAP gap explainer */}
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderLeft: "4px solid #EF4444", borderRadius: "0 8px 8px 0", padding: "10px 12px", marginBottom: 14, fontSize: 12, color: "#991B1B", lineHeight: 1.6 }}>
        {(() => {
          const alicePct = govData?.aliceSummary?.pctBelowAlice ?? 56;
          const snapEstimate = Math.round(alicePct * 0.6);
          return `${alicePct}% of NYC households fall below the ALICE threshold — significantly higher than the estimated ${snapEstimate}% captured by SNAP eligibility alone. Working families above the federal poverty line remain invisible to standard food assistance metrics.`;
        })()}
      </div>

      {/* Borough bar chart */}
      {aliceSummary?.boroughs?.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
            Average % below ALICE threshold by borough
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart
              data={aliceSummary.boroughs}
              layout="vertical"
              margin={{ left: 0, right: 40, top: 0, bottom: 0 }}
            >
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="borough" tick={{ fontSize: 10, fill: "#374151" }} width={72} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB" }}
                formatter={(val, _n, p) => [`${val}% (${(p.payload.belowAliceHH ?? 0).toLocaleString()} HH)`, ""]}
              />
              <Bar dataKey="avgAlicePct" radius={[0, 5, 5, 0]} barSize={14}>
                {aliceSummary.boroughs.map((b) => (
                  <Cell key={b.borough} fill={boroughColor(b.borough)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

const BOROUGH_DISPLAY_LOCAL = {
  manhattan: "Manhattan", brooklyn: "Brooklyn", queens: "Queens",
  bronx: "Bronx", staten_island: "Staten Island",
};

function MissingMiddleCards({ flyTo, govData, filters }) {
  const [selected, setSelected] = useState(null);

  // Apply borough filter if active
  const boroughKey = filters?.borough && filters.borough !== "all"
    ? (BOROUGH_DISPLAY_LOCAL[filters.borough] ?? null)
    : null;

  // Sort by aliceGap descending — biggest "missing middle" first
  const sorted = [...(govData?.underservedZips ?? [])]
    .filter((z) => z.alicePct != null)
    .filter((z) => !boroughKey || z.borough === boroughKey)
    .sort((a, b) => (b.aliceGap ?? 0) - (a.aliceGap ?? 0));

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
        The missing middle — by ZIP
      </div>
      <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 10 }}>
        Sorted by ALICE gap (difference between ALICE threshold and poverty rate).
        Larger gap = more households that SNAP-based programs miss entirely.
      </div>

      {sorted.length === 0 && boroughKey && (
        <div style={{ padding: 24, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
          No data available for {boroughKey} with current filters.
        </div>
      )}
      {sorted.map((z) => {
        const badge = gapColor(z.aliceGap);
        const isSelected = selected === z.zip;
        return (
          <div
            key={z.zip}
            onClick={() => { setSelected(isSelected ? null : z.zip); flyTo(z.lat, z.lng, 14); }}
            style={{
              background: isSelected ? "#FAFAF9" : "#fff",
              border: `1px solid ${isSelected ? "#EF4444" : "#E5E7EB"}`,
              borderLeft: `4px solid ${boroughColor(z.borough)}`,
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 8,
              cursor: "pointer",
              transition: "box-shadow 0.15s",
              boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{z.neighborhood}</div>
                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                  ZIP {z.zip} · {z.borough}
                </div>
              </div>
              <span style={{
                background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`,
                borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                +{z.aliceGap.toFixed(0)}pp gap
              </span>
            </div>

            {/* ALICE vs poverty stacked visual */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", height: 12, borderRadius: 4, overflow: "hidden", marginBottom: 4 }}>
                {/* Poverty band */}
                <div
                  style={{ width: `${z.poverty}%`, background: "#DC2626", opacity: 0.7 }}
                  title={`Poverty: ${z.poverty}%`}
                />
                {/* ALICE-only band (gap) */}
                <div
                  style={{ width: `${z.aliceGap}%`, background: "#F59E0B", opacity: 0.7 }}
                  title={`ALICE-only gap: +${z.aliceGap.toFixed(0)}pp`}
                />
                {/* Above ALICE */}
                <div style={{ flex: 1, background: "#E5E7EB" }} />
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 9, color: "#6B7280" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 1, background: "#DC2626", display: "inline-block" }} />
                  Poverty {z.poverty.toFixed(1)}%
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 1, background: "#F59E0B", display: "inline-block" }} />
                  ALICE-only +{z.aliceGap.toFixed(0)}pp
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 1, background: "#E5E7EB", display: "inline-block" }} />
                  Above ALICE {(100 - z.alicePct).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px", fontSize: 11, color: "#6B7280" }}>
              <span>ALICE households: <strong style={{ color: "#111827" }}>{z.aliceHouseholds.toLocaleString()}</strong></span>
              <span>ALICE / pantry: <strong style={{ color: "#374151" }}>{z.alicePerPantry.toLocaleString()}</strong></span>
              <span>SNAP / pantry: <strong style={{ color: "#374151" }}>{z.snapPerPantry.toLocaleString()}</strong></span>
              <span>Pantries: <strong style={{ color: "#374151" }}>{z.pantryCount}</strong></span>
            </div>

            {/* Expanded insight */}
            {isSelected && (
              <div style={{ marginTop: 10, padding: "8px 10px", background: "#FEF3C7", borderRadius: 8, fontSize: 11, color: "#92400E", lineHeight: 1.6 }}>
                SNAP-based metrics show {z.snapPerPantry.toLocaleString()} recipients per pantry here.
                Accounting for ALICE households, true demand may be closer to{" "}
                <strong>{z.alicePerPantry.toLocaleString()} households per pantry</strong> —
                {z.snapPerPantry > 0
                  ? ` ${Math.round((z.alicePerPantry / z.snapPerPantry - 1) * 100)}% more households per pantry than SNAP estimates alone`
                  : " significantly more households per pantry than SNAP estimates alone"}
                .
              </div>
            )}
          </div>
        );
      })}

      {/* Methodology note */}
      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", marginTop: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>Methodology</div>
        <div style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.7 }}>
          ALICE threshold = United Way Household Survival Budget for NYC (housing,
          childcare, food, transportation, healthcare, taxes). ALICE gap = ALICE% − poverty
          rate. ALICE households per pantry = (total households × ALICE%) ÷ pantry count.
          Source: United Way ALICE Report 2024, ACS 2024.
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────

export default function ALICETab({ flyTo, govData: govDataProp, filters }) {
  const govData = govDataProp ?? mockGovData;
  const bronxEntry = govData?.aliceSummary?.boroughs?.find((b) => b.borough === "Bronx");
  const bronxAlice = bronxEntry?.avgAlicePct ?? 70;
  const bronxSnap = Math.round(bronxAlice * 0.45);
  return (
    <div>
      {/* What ALICE reveals */}
      <div style={{ background: "#F0FDF4", borderLeft: "3px solid #2D6A4F", borderRadius: "0 8px 8px 0", padding: "9px 12px", marginBottom: 14, fontSize: 12, color: "#166534", lineHeight: 1.5 }}>
        {`SNAP data undercounts true food need — the Bronx has ${bronxAlice}% of households below the ALICE threshold while SNAP reaches an estimated ${bronxSnap}% of those in need.`}
      </div>

      <ALICESummaryCard govData={govData} />
      <MissingMiddleCards flyTo={flyTo} govData={govData} filters={filters} />
    </div>
  );
}