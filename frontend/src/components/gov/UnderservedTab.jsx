"use client";

import { useState } from "react";
import { BOROUGH_DISPLAY, needBadge, povertyColor } from "./shared";

export default function UnderservedTab({ filters, flyTo, govData }) {
  const [selectedZip, setSelectedZip] = useState(null);

  const filteredZips = (govData?.underservedZips ?? [])
    .filter((z) => {
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
      {(() => {
        const boroughKey2 = filters.borough !== "all" ? (BOROUGH_DISPLAY[filters.borough] ?? null) : null;
        const displayCount = filteredZips.length;
        const totalCount = govData?.underservedZips?.length ?? 0;
        return (
          <div style={{ background: "#F0FDF4", borderLeft: "3px solid #2D6A4F", borderRadius: "0 8px 8px 0", padding: "9px 12px", marginBottom: 14, fontSize: 12, color: "#166534", lineHeight: 1.5 }}>
            {boroughKey2
              ? `${displayCount} ZIP code${displayCount !== 1 ? "s" : ""} in ${boroughKey2} identified as underserved.`
              : `Top ${totalCount} underserved ZIP codes citywide — sorted by need score.`}
          </div>
        );
      })()}

      {filteredZips.length === 0 ? (
        <div style={{ fontSize: 13, color: "#6B7280", textAlign: "center", padding: "28px 0", background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB" }}>
          No underserved areas found for this filter.
          {filters.borough !== "all" && (
            <div style={{ fontSize: 11, marginTop: 6, color: "#9CA3AF" }}>
              {`No underserved ZIP codes found in ${BOROUGH_DISPLAY[filters.borough] ?? filters.borough} with current data.`}
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

      {filteredZips.length > 0 && (
        <div style={{ padding: "10px 12px", background: "#F0FDF4", borderLeft: "3px solid #2D6A4F", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#166534", lineHeight: 1.5, marginBottom: 18 }}>
          ZIP {filteredZips[0].zip} ({filteredZips[0].neighborhood}) has the highest need score ({filteredZips[0].needScore}) with {filteredZips[0].snapPerPantry.toLocaleString()} SNAP recipients per pantry.
        </div>
      )}

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
