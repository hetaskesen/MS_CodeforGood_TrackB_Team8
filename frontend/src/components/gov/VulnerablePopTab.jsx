"use client";

import { BOROUGH_DISPLAY } from "./shared";

export default function VulnerablePopTab({ govData, filters }) {
  const boroughKey = filters?.borough && filters.borough !== "all" ? (BOROUGH_DISPLAY[filters.borough] ?? null) : null;
  const seniorGaps = boroughKey
    ? (govData?.seniorAccessGaps ?? []).filter((g) => g.borough === boroughKey)
    : (govData?.seniorAccessGaps ?? []);
  const dietaryGaps = boroughKey
    ? (govData?.dietaryGaps ?? []).filter((g) => g.borough === boroughKey)
    : (govData?.dietaryGaps ?? []);

  return (
    <div>
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
