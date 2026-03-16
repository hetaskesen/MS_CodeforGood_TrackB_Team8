"use client";

import { BOROUGH_DISPLAY } from "./shared";

export default function ReliabilityTab({ govData, filters }) {
  const boroughKey = filters?.borough && filters.borough !== "all" ? (BOROUGH_DISPLAY[filters.borough] ?? null) : null;
  const reliabilityGaps = boroughKey
    ? (govData?.reliabilityGaps ?? []).filter((g) => g.borough === boroughKey)
    : (govData?.reliabilityGaps ?? []);
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

      {boroughStats.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Confirmed open rate by borough</div>
          {boroughKey && (
            <div style={{ fontSize: 11, color: "#6B7280", fontStyle: "italic", marginBottom: 8, padding: "4px 8px", background: "#F9FAFB", borderRadius: 4, display: "inline-block" }}>
              Showing city-wide comparison for context — ZIP list below is filtered to {boroughKey}
            </div>
          )}
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
