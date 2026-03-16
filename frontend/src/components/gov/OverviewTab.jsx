"use client";

import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip,
  ResponsiveContainer, ReferenceArea, ReferenceLine,
} from "recharts";
import { BOROUGH_COLORS } from "@/lib/constants";
import { BOROUGH_KEY_MAP, BOROUGH_DISPLAY } from "./shared";

function StatCard({ value, label, valueColor = "#111827", bg = "#F9FAFB", border = "#E5E7EB" }) {
  return (
    <div style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 21, fontWeight: 800, color: valueColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function CoverageBubbleDot({ cx, cy, payload }) {
  if (cx == null || cy == null) return null;
  const households = payload.aliceHouseholds || 0;
  const isUnderserved = payload.isUnderserved !== false;
  const r = isUnderserved
    ? Math.max(Math.sqrt(households / 160), 4)
    : Math.max(Math.sqrt(households / 220), 3);
  const color = BOROUGH_COLORS[payload.borough] ?? "#9CA3AF";
  const noFreshProduce = (payload.freshProduceCount ?? 0) === 0;

  if (!isUnderserved) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={1} strokeOpacity={0.35} />
      </g>
    );
  }

  return (
    <g>
      {payload.alicePct > 65 && (
        <circle cx={cx} cy={cy} r={r + 4} fill={color} fillOpacity={0.12} stroke="none" />
      )}
      <circle
        cx={cx} cy={cy} r={r}
        fill={color}
        fillOpacity={noFreshProduce ? 0.55 : 0.78}
        stroke={noFreshProduce ? "#DC2626" : "#fff"}
        strokeWidth={1.5}
        strokeDasharray={noFreshProduce ? "3 2" : "none"}
        strokeOpacity={0.9}
      />
    </g>
  );
}

function CoverageBubbleTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const noFreshProduce = (d.freshProduceCount ?? 0) === 0;
  const color = BOROUGH_COLORS[d.borough] ?? "#9CA3AF";
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontSize: 11, lineHeight: 1.8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxWidth: 220 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
        <strong style={{ fontSize: 12, color: "#111827" }}>ZIP {d.zip}</strong>
        <span style={{ color: "#6B7280", fontSize: 11 }}>· {d.neighborhood}</span>
      </div>
      <div style={{ color: "#6B7280", fontSize: 10, marginBottom: 6 }}>{d.borough}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", fontSize: 11 }}>
        <span style={{ color: "#6B7280" }}>ALICE</span>
        <strong style={{ color: "#DC2626" }}>{d.alicePct != null ? `${d.alicePct.toFixed(1)}%` : "N/A"}</strong>
        <span style={{ color: "#6B7280" }}>Pantries/10k</span>
        <strong style={{ color: "#374151" }}>{d.pantriesPer10k?.toFixed(2) ?? 0}</strong>
        <span style={{ color: "#6B7280" }}>ALICE HH</span>
        <strong style={{ color: "#374151" }}>{(d.aliceHouseholds || 0).toLocaleString()}</strong>
        <span style={{ color: "#6B7280" }}>Need score</span>
        <strong style={{ color: "#374151" }}>{d.needScore ?? "—"}</strong>
      </div>
      {noFreshProduce && (
        <div style={{ marginTop: 6, fontSize: 10, color: "#DC2626", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: 12, height: 12 }}>
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          No fresh produce available
        </div>
      )}
    </div>
  );
}

export default function OverviewTab({ filters, govData, onExportPDF, exporting }) {
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

  const boroughKey = filters.borough !== "all" ? (BOROUGH_DISPLAY[filters.borough] ?? null) : null;

  const underservedZipSet = new Set((govData?.underservedZips ?? []).map((z) => z.zip));
  const neighborhoodByZip = {};
  (govData?.underservedZips ?? []).forEach((z) => { neighborhoodByZip[z.zip] = z.neighborhood; });

  const usingAllBoroughZips = !!(boroughKey && govData?.zipDemographics?.length > 0);

  const bubbleData = usingAllBoroughZips
    ? (govData.zipDemographics)
        .filter((z) => z.borough === boroughKey && (z.population ?? 0) > 500)
        .map((z) => {
          const aliceHH = Math.round((z.population || 0) * (z.alicePct || 0) / 100);
          return {
            zip: z.zip,
            neighborhood: neighborhoodByZip[z.zip] || `ZIP ${z.zip}`,
            borough: z.borough,
            alicePct: z.alicePct,
            pantriesPer10k: z.pantriesPer10k ?? 0,
            aliceHouseholds: aliceHH,
            freshProduceCount: z.freshProduceCount ?? 0,
            needScore: z.needScore ?? 0,
            isUnderserved: underservedZipSet.has(z.zip),
            x: z.alicePct,
            y: z.pantriesPer10k ?? 0,
            size: aliceHH,
          };
        })
    : (govData?.underservedZips ?? [])
        .filter((z) => z.alicePct != null)
        .filter((z) => !boroughKey || z.borough === boroughKey)
        .map((z) => ({
          ...z,
          isUnderserved: true,
          x: z.alicePct,
          y: z.pantriesPer10k ?? 0,
          size: z.aliceHouseholds ?? 0,
        }));

  const underservedCount = bubbleData.filter((d) => d.isUnderserved).length;
  const boroughsInData = [...new Set(bubbleData.map((d) => d.borough))].filter(Boolean);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <StatCard value={totalVal}     label={bLabel ? `food resources in ${bLabel}` : "food resources in NYC"} />
        <StatCard value={publishedVal} label="currently published"   valueColor="#166534" bg="#F0FDF4" border="#BBF7D0" />
        <StatCard value={unavailVal}   label="currently unavailable" valueColor="#991B1B" bg="#FEF2F2" border="#FECACA" />
      </div>

      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: "#D97706", lineHeight: 1 }}>
          {avgRating > 0 ? avgRating.toFixed(2) : "—"} <span style={{ fontSize: 16, fontWeight: 500, color: "#92400E" }}>/ 5.0</span>
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
          City-wide average rating across {totalRated.toLocaleString()} rated resources
        </div>
        {avgRating > 0 && (
          <div style={{ fontSize: 11, color: "#92400E", marginTop: 6, fontWeight: 600 }}>
            {unavailPct}% of {bLabel ? `${bLabel} resources` : "all resources"} are currently unavailable — a service reliability concern
          </div>
        )}
      </div>

      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 16px 12px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>
              Coverage Gap Bubble Chart
              {boroughKey && (
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: "#2D6A4F", background: "#DCFCE7", padding: "1px 6px", borderRadius: 5 }}>
                  {boroughKey}
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>
              {usingAllBoroughZips
                ? `All ${bubbleData.length} ZIPs in ${boroughKey} · ${underservedCount} underserved highlighted · size ∝ ALICE households`
                : `Top ${bubbleData.length} underserved ZIPs city-wide · size ∝ ALICE households · dashed = no fresh produce`}
            </div>
          </div>
          {!usingAllBoroughZips && boroughsInData.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 180 }}>
              {boroughsInData.map((b) => (
                <span key={b} style={{
                  fontSize: 10, display: "inline-flex", alignItems: "center", gap: 4,
                  background: (BOROUGH_COLORS[b] ?? "#9CA3AF") + "22",
                  color: "#374151", padding: "2px 7px", borderRadius: 999,
                  border: `1px solid ${(BOROUGH_COLORS[b] ?? "#9CA3AF")}55`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: BOROUGH_COLORS[b] ?? "#9CA3AF", display: "inline-block" }} />
                  {b}
                </span>
              ))}
            </div>
          )}
          {usingAllBoroughZips && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4, color: "#374151" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: BOROUGH_COLORS[boroughKey] ?? "#9CA3AF", display: "inline-block" }} />
                Underserved ZIP
              </span>
              <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4, color: "#9CA3AF" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: BOROUGH_COLORS[boroughKey] ?? "#9CA3AF", opacity: 0.3, display: "inline-block" }} />
                Other ZIPs (context)
              </span>
            </div>
          )}
        </div>

        <ResponsiveContainer width="100%" height={275}>
          <ScatterChart margin={{ top: 8, right: 16, bottom: 30, left: 4 }}>
            <ReferenceArea x1={45} x2={100} y1={0} y2={1.4} fill="#FEE2E2" fillOpacity={0.25} />
            <ReferenceArea x1={0} x2={45} y1={1.4} y2={6} fill="#ECFDF5" fillOpacity={0.3} />
            <ReferenceLine x={45} stroke="#E5E7EB" strokeDasharray="4 3" strokeWidth={1} />
            <ReferenceLine y={1.4} stroke="#E5E7EB" strokeDasharray="4 3" strokeWidth={1} />
            <XAxis
              type="number" dataKey="x" name="ALICE %" domain={[0, 100]}
              tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
              label={{ value: "ALICE % (below threshold) →", position: "insideBottom", offset: -16, style: { fontSize: 9, fill: "#9CA3AF" } }}
            />
            <YAxis
              type="number" dataKey="y" name="Pantries / 10k" domain={[0, "auto"]}
              tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
              label={{ value: "Pantries / 10k ↑", angle: -90, position: "insideLeft", offset: 12, style: { fontSize: 9, fill: "#9CA3AF" } }}
            />
            <ZAxis type="number" dataKey="size" range={[30, 300]} />
            <Tooltip content={<CoverageBubbleTooltip />} cursor={false} />
            <Scatter data={bubbleData} shape={<CoverageBubbleDot />} />
          </ScatterChart>
        </ResponsiveContainer>

        {bubbleData.length === 0 && (
          <div style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", padding: "20px 0" }}>
            {boroughKey
              ? `No ZIP codes with ALICE data found in ${boroughKey}.`
              : "ALICE data loading — chart will populate automatically."}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px", marginTop: 2 }}>
          <span style={{ fontSize: 9, color: "#059669", fontWeight: 600 }}>← LOW NEED / WELL SERVED</span>
          <span style={{ fontSize: 9, color: "#DC2626", fontWeight: 600 }}>HIGH NEED / LOW COVERAGE →</span>
        </div>

        {!usingAllBoroughZips && (() => {
          const ALL_BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
          const missing = ALL_BOROUGHS.filter((b) => !boroughsInData.includes(b));
          if (missing.length === 0) return null;
          return (
            <div style={{ marginTop: 8, padding: "6px 10px", background: "#F9FAFB", borderRadius: 7, fontSize: 10, color: "#6B7280", display: "flex", alignItems: "flex-start", gap: 6 }}>
              <span style={{ flexShrink: 0, color: "#9CA3AF" }}>ℹ</span>
              <span>
                <strong style={{ color: "#374151" }}>{missing.join(", ")}</strong>
                {missing.length === 1 ? " has" : " have"} no ZIP codes in the city-wide top-30 underserved list — poverty and food-insecurity levels are lower relative to other boroughs.
                {" "}Use the borough filter above to explore {missing.length === 1 ? "its" : "their"} full ZIP-level data.
              </span>
            </div>
          );
        })()}
      </div>

      <button
        onClick={onExportPDF}
        disabled={exporting}
        style={{ width: "100%", padding: "9px 0", background: "#2D6A4F", color: "#fff", fontSize: 12, fontWeight: 600, borderRadius: 10, border: "none", cursor: exporting ? "wait" : "pointer", opacity: exporting ? 0.7 : 1 }}
      >
        {exporting ? "Exporting..." : "Print / Save as PDF"}
      </button>
    </div>
  );
}
