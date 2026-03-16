"use client";

export default function ResourceGapsTab({ govData }) {
  const f = govData?.communityFridges ?? { total: 0, inUnderservedZips: 0, pctMisaligned: 0, topZips: [] };

  const currentClusters = (f.topZips ?? []).filter((z) => !z.underserved).slice(0, 4);
  const recommendedZones = (govData?.underservedZips ?? [])
    .filter((z) => !f.topZips?.find((t) => t.zip === z.zip && t.count > 1))
    .sort((a, b) => b.needScore - a.needScore)
    .slice(0, 3);

  const fridgeInUnderservedPct = f.total > 0 ? Math.round((f.inUnderservedZips / f.total) * 100) : 0;

  return (
    <div>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
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

      <div style={{ padding: "10px 12px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991B1B", lineHeight: 1.5, marginBottom: 12 }}>
        {f.pctMisaligned > 0 ? `${f.pctMisaligned}%` : "The majority"} of community fridges are located outside the highest-need ZIP codes.
      </div>

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
