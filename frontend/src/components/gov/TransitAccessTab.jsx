"use client";

import { BOROUGH_DISPLAY } from "./shared";

export default function TransitAccessTab({ govData, filters }) {
  const boroughKey = filters?.borough && filters.borough !== "all" ? (BOROUGH_DISPLAY[filters.borough] ?? null) : null;
  const transitGaps = boroughKey
    ? (govData?.transitGaps ?? []).filter((g) => g.borough === boroughKey)
    : (govData?.transitGaps ?? []);

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
        <div style={{ padding: "20px 0", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>
            No transit deserts found{boroughKey ? ` in ${boroughKey}` : ""}.
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.7, maxWidth: 360, margin: "0 auto" }}>
            This view identifies ZIP codes where over 25% of households have no vehicle
            AND fewer than 2 food resources are within half a mile.
            {boroughKey
              ? ` No ZIP codes in ${boroughKey} currently meet both criteria.`
              : " No ZIP codes currently match both criteria."}
          </div>
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
