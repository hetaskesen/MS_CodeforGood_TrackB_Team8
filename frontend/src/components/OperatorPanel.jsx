"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import Footer from "./Footer";

const MiniMap = dynamic(() => import("./MiniMap"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL;

// Module-level guard — survives OperatorPanel remounts (e.g. tab switch, Strict Mode)
let pantryFetchStarted = false;

// ── Helpers ───────────────────────────────────────────────────────────────────

function ratingBadgeColor(rating) {
  if (rating >= 3.8) return { bg: "#DCFCE7", text: "#166534", label: "Good" };
  if (rating >= 3.0) return { bg: "#FEF9C3", text: "#854D0E", label: "Fair" };
  return { bg: "#FEE2E2", text: "#991B1B", label: "Poor" };
}

function tableRatingColor(rating) {
  if (rating >= 3.0) return "#166534";
  if (rating >= 2.0) return "#92400E";
  return "#991B1B";
}

function tableRatingBg(rating) {
  if (rating >= 3.0) return "#DCFCE7";
  if (rating >= 2.0) return "#FEF3C7";
  return "#FEE2E2";
}

function confidenceColor(c) {
  if (c >= 0.8) return "#166534";
  if (c >= 0.6) return "#92400E";
  return "#991B1B";
}

function topPercentLabel(percentile) {
  const pct = 100 - percentile;
  if (pct <= 0) return "Highest rated in NYC";
  if (pct <= 1) return "Top 1% in NYC";
  return `Top ${pct}% in NYC`;
}

function computeLocalCompleteness(resource) {
  const checks = [
    !!resource.phone,
    !!resource.website,
    !!resource.description,
    resource.hasShifts,
    resource.hasOccurrences,
    resource.tags && resource.tags.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function buildRadarData(resource, benchmarks) {
  const avg = benchmarks?.radarAvg ?? { rating: 46, reviews: 14, subscribers: 14, confidence: 82, schedule: 78 };
  return [
    {
      axis: "Rating",
      you: Math.round((resource.rating / 5) * 100),
      avg: avg.rating,
    },
    {
      axis: "Reviews",
      you: Math.min(Math.round((resource.reviewCount / 50) * 100), 100),
      avg: avg.reviews,
    },
    {
      axis: "Subscribers",
      you: Math.min(Math.round((resource.subscriptionCount / 200) * 100), 100),
      avg: avg.subscribers,
    },
    {
      axis: "Confidence",
      you: Math.round(resource.confidence * 100),
      avg: avg.confidence,
    },
    {
      axis: "Schedule",
      you: (resource.hasShifts ? 50 : 0) + (resource.hasOccurrences ? 50 : 0),
      avg: avg.schedule,
    },
  ];
}

// ── Card 0 – Radar chart ─────────────────────────────────────────────────────

function RadarCard({ resource, benchmarks }) {
  const radarData = buildRadarData(resource, benchmarks);
  const aboveAvg = radarData.filter((d) => d.you > d.avg).length;

  let insight;
  if (aboveAvg >= 4) insight = "You're outperforming most NYC resources across all key dimensions — keep it up.";
  else if (aboveAvg >= 3) insight = "You're performing above the NYC average on most metrics.";
  else if (aboveAvg <= 1) insight = "Several metrics need attention compared to similar NYC resources.";
  else insight = "You're performing close to the NYC average — there's room to grow.";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        padding: "18px 18px 12px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
          How you compare to NYC
        </div>
        <div style={{ fontSize: 11, color: "#6B7280" }}>
          {benchmarks?.ratedCount ?? "—"} rated resources · live data
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height={170}>
          <RadarChart data={radarData} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
            <PolarGrid gridType="polygon" stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 10, fill: "#6B7280" }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="You"
              dataKey="you"
              stroke="#2D6A4F"
              fill="#2D6A4F"
              fillOpacity={0.28}
              strokeWidth={2}
            />
            <Radar
              name="NYC avg"
              dataKey="avg"
              stroke="#9CA3AF"
              fill="#9CA3AF"
              fillOpacity={0.12}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <Tooltip
              formatter={(value, name) => [`${value}`, name]}
              contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #E5E7EB" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#2D6A4F" }}>
          <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#2D6A4F", opacity: 0.7 }} />
          You
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6B7280" }}>
          <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#9CA3AF", opacity: 0.5 }} />
          NYC avg
        </div>
      </div>

      <div
        style={{
          fontSize: 11,
          color: "#374151",
          lineHeight: 1.5,
          padding: "7px 10px",
          background: "#F9FAFB",
          borderRadius: 7,
          borderLeft: "3px solid #2D6A4F",
        }}
      >
        {insight}
      </div>
    </div>
  );
}

// ── Card 1 – Neighborhood comparison ─────────────────────────────────────────

function NeighborhoodCard({ resource, neighbors, loadingNeighbors }) {
  const neighborRows = neighbors.filter((n) => n.name !== resource.name);

  if (loadingNeighbors) {
    return (
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: 24, marginBottom: 20, textAlign: "center", color: "#6B7280", fontSize: 13 }}>
        Loading neighborhood data…
      </div>
    );
  }

  if (neighborRows.length === 0) {
    return (
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>Your standing in the neighborhood</h3>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "8px 0 0" }}>
          No other published resources found in ZIP {resource.zipCode}.
        </p>
      </div>
    );
  }

  const ratedNeighbors = neighborRows.filter((n) => n.rating > 0);
  const maxNeighborRating = ratedNeighbors.length ? Math.max(...ratedNeighbors.map((n) => n.rating)) : 0;
  const avgNeighborRating = ratedNeighbors.length
    ? ratedNeighbors.reduce((s, n) => s + n.rating, 0) / ratedNeighbors.length
    : 0;
  const higherCount = ratedNeighbors.filter((n) => n.rating > resource.rating).length;

  let insight;
  if (resource.rating > maxNeighborRating && ratedNeighbors.length > 0) {
    insight = `You have the highest rating among resources in ZIP ${resource.zipCode} — your ${resource.reviewCount} reviews make you a standout.`;
  } else if (resource.rating < avgNeighborRating) {
    insight = `Your rating is below the neighborhood average. ${higherCount} nearby ${higherCount === 1 ? "resource is" : "resources are"} rated higher.`;
  } else {
    insight = `Your rating is above average for this neighborhood. ${higherCount} nearby ${higherCount === 1 ? "resource is" : "resources are"} rated higher.`;
  }

  const thStyle = {
    fontSize: 11, fontWeight: 600, color: "#6B7280",
    textTransform: "uppercase", letterSpacing: "0.06em",
    padding: "0 8px 8px", borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap",
  };
  const COL = {
    name: { flex: "1 1 180px", minWidth: 140 },
    dist: { flex: "0 0 72px" },
    rating: { flex: "0 0 64px" },
    reviews: { flex: "0 0 68px" },
    subs: { flex: "0 0 88px" },
    conf: { flex: "0 0 96px" },
  };

  function Row({ entry, isYou }) {
    return (
      <div
        style={{
          display: "flex", alignItems: "center",
          background: isYou ? "#F0FDF4" : undefined,
          borderLeft: isYou ? "3px solid #2D6A4F" : "3px solid transparent",
          borderRadius: 6, marginBottom: 2,
        }}
      >
        <div style={{ flex: COL.name.flex, minWidth: COL.name.minWidth, padding: "9px 8px", fontSize: 13, fontWeight: isYou ? 700 : 400, color: isYou ? "#14532D" : "#111827" }}>
          {isYou ? `${entry.name} (You)` : entry.name}
        </div>
        <div style={{ flex: COL.dist.flex, padding: "9px 8px", fontSize: 13, color: "#6B7280", textAlign: "right", whiteSpace: "nowrap" }}>
          {isYou ? "—" : entry.distance > 0 ? `${entry.distance.toFixed(2)} mi` : "—"}
        </div>
        <div style={{ flex: COL.rating.flex, padding: "9px 8px", textAlign: "right" }}>
          {entry.rating > 0 ? (
            <span style={{ background: tableRatingBg(entry.rating), color: tableRatingColor(entry.rating), borderRadius: 4, padding: "2px 7px", fontSize: 12, fontWeight: 600 }}>
              {entry.rating.toFixed(1)}
            </span>
          ) : <span style={{ fontSize: 12, color: "#9CA3AF" }}>—</span>}
        </div>
        <div style={{ flex: COL.reviews.flex, padding: "9px 8px", fontSize: 13, color: "#374151", textAlign: "right" }}>
          {entry.reviewCount}
        </div>
        <div style={{ flex: COL.subs.flex, padding: "9px 8px", fontSize: 13, color: "#374151", textAlign: "right" }}>
          {entry.subscriptionCount}
        </div>
        <div style={{ flex: COL.conf.flex, padding: "9px 8px", fontSize: 13, fontWeight: 600, color: confidenceColor(entry.confidence), textAlign: "right" }}>
          {Math.round(entry.confidence * 100)}%
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: 24, marginBottom: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
          Your standing in the neighborhood
        </h3>
        <p style={{ fontSize: 12, color: "#6B7280", margin: "4px 0 0" }}>
          Compared to {neighborRows.length} resources in ZIP {resource.zipCode} · live data
        </p>
      </div>

      <div style={{ display: "flex", padding: "0 0 0 3px" }}>
        {[
          { label: "Resource", ...COL.name },
          { label: "Distance", ...COL.dist, textAlign: "right" },
          { label: "Rating", ...COL.rating, textAlign: "right" },
          { label: "Reviews", ...COL.reviews, textAlign: "right" },
          { label: "Subscribers", ...COL.subs, textAlign: "right" },
          { label: "Confidence", ...COL.conf, textAlign: "right" },
        ].map((c) => (
          <div key={c.label} style={{ ...thStyle, flex: c.flex, textAlign: c.textAlign, minWidth: c.minWidth }}>
            {c.label}
          </div>
        ))}
      </div>

      <Row entry={{ ...resource, distance: 0 }} isYou />
      {neighborRows.map((np, i) => (
        <div key={np.id ?? np.name} style={{ background: i % 2 === 0 ? "#F9FAFB" : "#fff", borderRadius: 6, marginBottom: 2 }}>
          <Row entry={np} isYou={false} />
        </div>
      ))}

      <div style={{ marginTop: 16, padding: "10px 14px", background: "#F0FDF4", borderRadius: 8, fontSize: 13, color: "#166534", lineHeight: 1.5 }}>
        {insight}
      </div>
    </div>
  );
}

// ── Card 2 – Listing health ──────────────────────────────────────────────────

function ListingHealthCard({ resource }) {
  const completeness = computeLocalCompleteness(resource);
  const pctColor = completeness >= 80 ? "#166534" : completeness >= 60 ? "#92400E" : "#991B1B";
  const barColor = completeness >= 80 ? "#2D6A4F" : completeness >= 60 ? "#D97706" : "#DC2626";

  const checks = [
    { label: "Phone number", ok: !!resource.phone },
    { label: "Schedule configured", ok: resource.hasShifts },
    { label: "Recurring hours set", ok: resource.hasOccurrences },
    { label: "Website added", ok: !!resource.website },
    { label: "Tags / requirements listed", ok: resource.tags && resource.tags.length > 0 },
    { label: "Description provided", ok: !!resource.description },
  ];
  const missing = checks.filter((c) => !c.ok).map((c) => c.label.toLowerCase());

  let hintText;
  if (missing.length === 0) hintText = "Your listing is complete";
  else if (missing.length <= 2) hintText = `Add ${missing.join(" and ")} to reach 100%`;
  else hintText = `${missing.length} fields still missing — complete them to improve discoverability`;

  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: 24, marginBottom: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>
        What people see when they find you on LemonTree
      </h3>

      <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 200px" }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: pctColor, lineHeight: 1, marginBottom: 4 }}>
            {completeness}%
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
            Listing completeness
          </div>
          <div style={{ height: 8, background: "#E5E7EB", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", width: `${completeness}%`, background: barColor, borderRadius: 4, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>{hintText}</div>
        </div>

        <div style={{ flex: "1 1 200px" }}>
          {checks.map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, color: "#374151" }}>
              <span style={{ fontSize: 15, color: item.ok ? "#16A34A" : "#DC2626", fontWeight: 700, width: 18, flexShrink: 0 }}>
                {item.ok ? "✓" : "✗"}
              </span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginTop: 20,
          padding: "6px 12px", borderRadius: 20,
          background: resource.status === "PUBLISHED" ? "#DCFCE7" : "#FEE2E2",
          fontSize: 13, fontWeight: 600,
          color: resource.status === "PUBLISHED" ? "#166534" : "#991B1B",
        }}
      >
        <span style={{ fontSize: 8 }}>●</span>
        {resource.status === "PUBLISHED" ? "Live on LemonTree" : "Hidden from search"}
      </div>
    </div>
  );
}

// ── Card 3 – Community reach ─────────────────────────────────────────────────

function CommunityReachCard({ resource, benchmarks }) {
  const stats = [
    {
      value: resource.rating > 0 ? resource.rating.toFixed(1) : "—",
      label: "out of 5.0",
      context: topPercentLabel(resource.ratingPercentile ?? 50),
      contextColor: "#166534",
    },
    {
      value: resource.reviewCount,
      label: "visitor reviews",
      context: `NYC median: ${benchmarks?.medianReviews ?? "—"}`,
      contextColor: "#6B7280",
    },
    {
      value: resource.subscriptionCount,
      label: "people subscribed",
      context: `NYC median: ${benchmarks?.medianSubs ?? "—"}`,
      contextColor: "#6B7280",
    },
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: 24, marginBottom: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 20px" }}>
        Community reach
      </h3>
      <div style={{ display: "flex", gap: 0 }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ flex: 1, padding: "0 24px", borderLeft: i > 0 ? "1px solid #E5E7EB" : undefined }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: "#111827", lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.contextColor }}>{s.context}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function OperatorPanel() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [resources, setResources] = useState([]);
  const [benchmarks, setBenchmarks] = useState(null);
  const [neighbors, setNeighbors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);
  const [error, setError] = useState(null);
  const neighborhoodFetchedZipRef = useRef(null);

  useEffect(() => {
    if (pantryFetchStarted) return;
    pantryFetchStarted = true;
    fetch(`${API}/api/operator/pantries`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ resources: live, benchmarks: bm }) => {
        if (Array.isArray(live) && live.length > 0) {
          setResources(live);
          setBenchmarks(bm ?? null);
        } else {
          setError("No resources returned from server");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const fetchNeighborhood = useCallback((resource) => {
    if (!resource?.zipCode) return;
    setLoadingNeighbors(true);
    setNeighbors([]);
    const params = new URLSearchParams({ zip: resource.zipCode });
    if (resource.lat) params.set("lat", resource.lat);
    if (resource.lng) params.set("lng", resource.lng);

    fetch(`${API}/api/operator/neighborhood?${params}`)
      .then((r) => r.json())
      .then(({ neighbors: n }) => setNeighbors(n ?? []))
      .catch(() => setNeighbors([]))
      .finally(() => setLoadingNeighbors(false));
  }, []);

  const resource = resources[selectedIdx];

  useEffect(() => {
    if (!resource?.zipCode) return;
    if (neighborhoodFetchedZipRef.current === resource.zipCode) return;
    neighborhoodFetchedZipRef.current = resource.zipCode;
    fetchNeighborhood(resource);
  }, [resource, fetchNeighborhood]);

  if (loading) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", color: "#6B7280" }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Loading resources…</div>
          <div style={{ fontSize: 13 }}>Fetching live data from Supabase</div>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", color: "#991B1B" }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Unable to load resources</div>
          <div style={{ fontSize: 13, color: "#6B7280" }}>{error ?? "No data available"}</div>
        </div>
      </div>
    );
  }

  const badge = ratingBadgeColor(resource.rating);

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "28px 32px",
        background: "#F8F9FA",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Resource selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>Viewing:</span>
        <select
          value={selectedIdx}
          onChange={(e) => setSelectedIdx(Number(e.target.value))}
          style={{
            fontSize: 14, fontWeight: 600, color: "#111827",
            background: "#fff", border: "1px solid #D1D5DB",
            borderRadius: 8, padding: "6px 12px",
            cursor: "pointer", outline: "none",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          {resources.map((p, i) => (
            <option key={p.id} value={i}>{p.name}</option>
          ))}
        </select>
        <span
          style={{
            fontSize: 11, fontWeight: 600,
            color: "#166534",
            background: "#DCFCE7",
            padding: "3px 8px", borderRadius: 10,
          }}
        >
          ● Live data
        </span>
      </div>

      {/* Header: name + badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>{resource.name}</h2>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "3px 0 0" }}>{resource.address}</p>
        </div>
        <span style={{ background: badge.bg, color: badge.text, borderRadius: 20, padding: "5px 14px", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
          {badge.label} · {resource.rating > 0 ? resource.rating.toFixed(1) : "—"}
        </span>
      </div>

      {/* Visibility status banner */}
      {resource.status === "PUBLISHED" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#166534" }}>
          <span style={{ fontSize: 9 }}>●</span>
          Your resource is live on LemonTree — visible to people searching for food assistance in your area.
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#991B1B" }}>
          <span>⚠</span>
          Your resource is currently hidden from search results. Contact LemonTree to restore your listing.
        </div>
      )}

      {/* Map + Radar chart */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "stretch" }}>
        <div
          key={`map-${resource.name}`}
          style={{
            flex: "0 0 60%",
            position: "relative",
            minHeight: 260,
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
          }}
        >
          <MiniMap
            lat={resource.lat}
            lng={resource.lng}
            name={resource.name}
            rating={resource.rating}
            address={resource.address}
          />
        </div>
        <div style={{ flex: "1 1 35%", minHeight: 260 }}>
          <RadarCard resource={resource} benchmarks={benchmarks} />
        </div>
      </div>

      <NeighborhoodCard resource={resource} neighbors={neighbors} loadingNeighbors={loadingNeighbors} />
      <ListingHealthCard resource={resource} />
      <CommunityReachCard resource={resource} benchmarks={benchmarks} />

      <div style={{ height: 24 }} />
      <Footer />
    </div>
  );
}