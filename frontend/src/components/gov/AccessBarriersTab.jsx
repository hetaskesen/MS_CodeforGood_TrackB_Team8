"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { BOROUGH_DISPLAY } from "./shared";

export default function AccessBarriersTab({ govData, filters }) {
  const [showAllLangGaps, setShowAllLangGaps] = useState(false);
  const { barriers, totalPublished } = govData?.accessBarriers ?? { barriers: [], totalPublished: 0 };
  const rel = govData?.reliability ?? { unavailableInUnderservedZips: 0, publishedInUnderservedZips: 0, pctOfflineInUnderserved: 0 };
  const available = rel.publishedInUnderservedZips;
  const unavailable = rel.unavailableInUnderservedZips;
  const total = available + unavailable;
  const availPct = total > 0 ? Math.round((available / total) * 100) : 0;
  const unavailPctDynamic = 100 - availPct;

  const idBarrier = barriers.find((b) => b.tag?.toLowerCase().includes("id required"));
  const idPct = idBarrier?.pct ?? 0;

  const boroughKey = filters?.borough && filters.borough !== "all" ? (BOROUGH_DISPLAY[filters.borough] ?? null) : null;
  const languageGaps = boroughKey
    ? (govData?.languageGaps ?? []).filter((g) => g.borough === boroughKey)
    : (govData?.languageGaps ?? []);

  const langByBorough = languageGaps.reduce((acc, g) => {
    if (!acc[g.borough]) acc[g.borough] = { count: 0, maxPct: 0 };
    acc[g.borough].count += 1;
    if (g.pctLimitedEnglish > acc[g.borough].maxPct) acc[g.borough].maxPct = g.pctLimitedEnglish;
    return acc;
  }, {});

  return (
    <div>
      {/* Availability card — three-zone layout */}
      <div style={{
        border: "0.5px solid var(--color-border-tertiary, #E5E7EB)",
        borderRadius: "var(--border-radius-lg, 12px)",
        overflow: "hidden",
        marginBottom: 14,
      }}>
        {/* Zone 1 — Header */}
        <div style={{
          background: "var(--color-background-primary, #fff)",
          padding: "1rem 1.5rem 0.75rem",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--color-text-primary, #111827)",
          lineHeight: 1.4,
        }}>
          of resources in underserved ZIP codes are{" "}
          <span style={{ color: "#A32D2D" }}>UNAVAILABLE</span>
        </div>

        {/* Zone 2 — Split stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {/* Left half — Published */}
          <div style={{ background: "#EAF3DE", padding: "1rem 1.5rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B6D11", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#27500A", fontWeight: 500 }}>published</span>
            </div>
            <div style={{ fontSize: 40, fontWeight: 500, color: "#173404", lineHeight: 1 }}>
              {available}
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, color: "#3B6D11", marginTop: 4 }}>
              {total > 0 ? `${availPct}%` : "—"}
            </div>
          </div>

          {/* Right half — Unavailable */}
          <div style={{ background: "#FCEBEB", padding: "1rem 1.5rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#A32D2D", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#791F1F", fontWeight: 500 }}>unavailable</span>
            </div>
            <div style={{ fontSize: 40, fontWeight: 500, color: "#501313", lineHeight: 1 }}>
              {unavailable}
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, color: "#A32D2D", marginTop: 4 }}>
              {total > 0 ? `${unavailPctDynamic}%` : "—"}
            </div>
          </div>
        </div>

        {/* Zone 3 — Footer */}
        <div style={{
          background: "var(--color-background-primary, #fff)",
          borderTop: "0.5px solid var(--color-border-tertiary, #E5E7EB)",
          padding: "0.75rem 1.5rem",
          fontSize: 12,
          color: "var(--color-text-secondary, #6B7280)",
          lineHeight: 1.5,
        }}>
          This exceeds the city-wide offline rate of {govData?.systemStats?.unavailableRate ?? 0}% — high-need areas face disproportionately unreliable service.
        </div>
      </div>

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

      {idPct > 0 && (
        <div style={{ padding: "10px 12px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991B1B", lineHeight: 1.5, marginBottom: 14 }}>
          {idPct}% of published resources require ID — a significant barrier for undocumented residents, who represent a substantial portion of food-insecure populations.
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Language access gap</div>
        <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>
          ZIP codes where &gt;15% residents have limited English, but zero multilingual resources
        </div>
        {languageGaps.length === 0 ? (
          <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", padding: "16px 0" }}>
            {boroughKey ? `No language gaps detected in ${boroughKey} with current data.` : "No language gaps detected in current data"}
          </div>
        ) : (
          <>
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
            {(showAllLangGaps ? languageGaps : languageGaps.slice(0, 5)).map((g) => (
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
            {languageGaps.length > 5 && (
              <button
                onClick={() => setShowAllLangGaps(s => !s)}
                style={{ fontSize: 11, color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: "6px 0", textDecoration: "underline" }}
              >
                {showAllLangGaps ? "Show less" : `Show ${languageGaps.length - 5} more ZIP codes`}
              </button>
            )}
            <div style={{ padding: "8px 10px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 6px 6px 0", fontSize: 11, color: "#991B1B", lineHeight: 1.5, marginTop: 4 }}>
              These neighborhoods have significant immigrant populations with no multilingual food resources — a compounding barrier.
            </div>
          </>
        )}
      </div>

      <div style={{ padding: "10px 12px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991B1B", lineHeight: 1.5 }}>
        The highest-need neighborhoods face multiple compounding barriers: ID requirements, language barriers, and appointment-only access — for the most vulnerable residents.
      </div>
    </div>
  );
}
