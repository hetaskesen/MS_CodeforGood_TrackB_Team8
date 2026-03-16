"use client";

import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// ── Constants ──────────────────────────────────────────────────────────────────

const MONO = { fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 12, color: "#374151" };

const DONUT_COLORS = ["#2D6A4F", "#52B788", "#95D5B2", "#D8F3DC", "#1B4332"];

const CARD = {
  background: "#fff",
  borderRadius: 14,
  padding: "22px 24px",
  border: "1px solid #E5E5E0",
  boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
};

const PRESETS = [500, 1000, 2000, 3500, 5000];

const PRIORITY_ICONS = {
  balanced: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97Z" />
    </svg>
  ),
  need: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  ),
  reach: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  ),
};

const PRIORITIES = [
  {
    id: "balanced",
    label: "Balanced portfolio",
    sub: "Mix of reach and need",
  },
  {
    id: "need",
    label: "Highest need first",
    sub: "Focus on highest poverty areas",
  },
  {
    id: "reach",
    label: "Maximum reach",
    sub: "Spread across most subscribers",
  },
];

const BOROUGHS = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"];

function fmtDollar(n) {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function FundingSimulator({ donorData: donorDataProp }) {
  const [preset, setPreset]         = useState(2000);
  const [customAmt, setCustomAmt]   = useState("");
  const [focus, setFocus]           = useState("all");
  const [focusBorough, setFocusBorough] = useState("Bronx");
  const [focusZip, setFocusZip]     = useState("");
  const [priority, setPriority]     = useState("balanced");
  const [running, setRunning]       = useState(false);
  const [results, setResults]       = useState(null);

  const totalFunding = customAmt ? parseFloat(customAmt) || 0 : preset;

  const topImpactResources = donorDataProp?.topImpactResources ?? [];

  // ── Simulation logic ────────────────────────────────────────────────────────

  function computeResults() {
    let pool = [...topImpactResources];

    if (focus === "borough") {
      pool = pool.filter((r) => r.borough === focusBorough);
    }
    if (focus === "zip" && focusZip.trim()) {
      const filtered = pool.filter((r) => r.zip === focusZip.trim());
      if (filtered.length > 0) pool = filtered;
    }

    // Sort by priority
    if (priority === "reach") {
      pool.sort((a, b) => b.subscriptions - a.subscriptions);
    } else if (priority === "need") {
      pool.sort((a, b) => b.povertyRate - a.povertyRate);
    } else {
      pool.sort((a, b) => b.impactScore - a.impactScore);
    }

    const selected = pool.slice(0, 4);
    if (selected.length === 0) return null;

    const totalImpact = selected.reduce((s, r) => s + r.impactScore, 0);
    const allocated = selected.map((r) => ({
      ...r,
      allocationPct: parseFloat(((r.impactScore / totalImpact) * 100).toFixed(1)),
      dollars: Math.round((r.impactScore / totalImpact) * totalFunding),
    }));

    const totalSubs = selected.reduce((s, r) => s + r.subscriptions, 0);
    const zips = [...new Set(selected.map((r) => r.zip))];
    const avgPoverty = (
      selected.reduce((s, r) => s + r.povertyRate, 0) / selected.length
    ).toFixed(1);

    return { allocated, totalSubs, zips, avgPoverty, count: selected.length };
  }

  function handleRun() {
    setRunning(true);
    setResults(null);
    setTimeout(() => {
      setRunning(false);
      setResults(computeResults());
    }, 800);
  }

  // ── Copy summary ─────────────────────────────────────────────────────────────

  const summaryText = useMemo(() => {
    if (!results) return "";
    const lines = [
      `LemonTree Funding Simulation`,
      `Amount: $${totalFunding.toLocaleString()} · Focus: ${focus === "all" ? "All NYC" : focus === "borough" ? focusBorough : `ZIP ${focusZip}`} · Strategy: ${PRIORITIES.find((p) => p.id === priority)?.label}`,
      ``,
      `Recommended allocation:`,
      ...results.allocated.map(
        (r) =>
          `  ${r.name} (${r.borough}, ${r.zip}) — $${r.dollars.toLocaleString()} (${r.allocationPct}%)`
      ),
      ``,
      `Estimated reach: ${results.totalSubs.toLocaleString()} subscribers`,
      `ZIP codes covered: ${results.zips.join(", ")}`,
      `Avg poverty in selected areas: ${results.avgPoverty}%`,
    ];
    return lines.join("\n");
  }, [results, totalFunding, focus, focusBorough, focusZip, priority]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="funding-simulator-root" style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: 24 }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media print {
          .funding-simulator-root .funding-simulator-config { display: none !important; }
          .funding-simulator-root .funding-simulator-results { flex: none !important; width: 100% !important; max-width: none !important; }
          .funding-simulator-root .funding-simulator-results-inner { box-shadow: none !important; }
        }
      `}</style>
      {/* ── Left panel: controls ── */}
      <div
        className="funding-simulator-config"
        style={{
          ...CARD,
          width: 340,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div>
          <div
            style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 4 }}
          >
            Configure your simulation
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
            See where your contribution — money, food, or volunteer time — would have the greatest impact across NYC
          </div>
        </div>

        {/* Funding amount */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#9CA3AF",
              letterSpacing: "0.08em",
              marginBottom: 10,
              ...MONO,
            }}
          >
            Funding amount
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPreset(p);
                  setCustomAmt("");
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1.5px solid ${preset === p && !customAmt ? "#2D6A4F" : "#E5E7EB"}`,
                  background: preset === p && !customAmt ? "#2D6A4F" : "#fff",
                  color: preset === p && !customAmt ? "#fff" : "#374151",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.12s",
                  ...MONO,
                }}
              >
                {fmtDollar(p)}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 5, ...MONO }}>
              Or enter amount:
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span
                style={{
                  padding: "8px 10px",
                  background: "#F9FAFB",
                  border: "1.5px solid #E5E7EB",
                  borderRight: "none",
                  borderRadius: "8px 0 0 8px",
                  fontSize: 12,
                  color: "#374151",
                  fontWeight: 700,
                  ...MONO,
                }}
              >
                $
              </span>
              <input
                type="number"
                value={customAmt}
                onChange={(e) => setCustomAmt(e.target.value)}
                placeholder="e.g. 3500"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1.5px solid #E5E7EB",
                  borderRadius: "0 8px 8px 0",
                  fontSize: 12,
                  color: "#374151",
                  outline: "none",
                  ...MONO,
                }}
              />
            </div>
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              fontWeight: 700,
              color: "#2D6A4F",
              ...MONO,
            }}
          >
            Total: ${totalFunding.toLocaleString()}
          </div>
        </div>

        {/* Geographic focus */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#9CA3AF",
              letterSpacing: "0.08em",
              marginBottom: 10,
              ...MONO,
            }}
          >
            Focus area
          </div>
          {[
            { value: "all",     label: "All of NYC" },
            { value: "borough", label: "Specific borough" },
            { value: "zip",     label: "Specific ZIP code" },
          ].map((opt) => (
            <label
              key={opt.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
                cursor: "pointer",
                fontSize: 12,
                color: "#374151",
              }}
            >
              <input
                type="radio"
                name="focus"
                value={opt.value}
                checked={focus === opt.value}
                onChange={() => setFocus(opt.value)}
                style={{ accentColor: "#2D6A4F" }}
              />
              {opt.label}
            </label>
          ))}
          {focus === "borough" && (
            <select
              value={focusBorough}
              onChange={(e) => setFocusBorough(e.target.value)}
              style={{
                marginTop: 6,
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #E5E7EB",
                background: "#fff",
                fontSize: 12,
                color: "#374151",
                cursor: "pointer",
                outline: "none",
                ...MONO,
              }}
            >
              {BOROUGHS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}
          {focus === "zip" && (
            <input
              type="text"
              value={focusZip}
              onChange={(e) => setFocusZip(e.target.value)}
              placeholder="e.g. 10472"
              style={{
                marginTop: 6,
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1.5px solid #E5E7EB",
                fontSize: 12,
                color: "#374151",
                outline: "none",
                boxSizing: "border-box",
                ...MONO,
              }}
            />
          )}
        </div>

        {/* Priority */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#9CA3AF",
              letterSpacing: "0.08em",
              marginBottom: 10,
              ...MONO,
            }}
          >
            Optimize for
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {PRIORITIES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPriority(p.id)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `2px solid ${priority === p.id ? "#2D6A4F" : "#E5E7EB"}`,
                  background: priority === p.id ? "#F0FDF4" : "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.12s",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: priority === p.id ? "#2D6A4F" : "#111827",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 2,
                  }}
                >
                  <span style={{ color: priority === p.id ? "#2D6A4F" : "#6B7280" }}>{PRIORITY_ICONS[p.id]}</span>
                  {p.label}
                </div>
                <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.4 }}>
                  {p.sub}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={running || totalFunding <= 0}
          style={{
            width: "100%",
            padding: "13px 0",
            borderRadius: 10,
            border: "none",
            background: running || totalFunding <= 0 ? "#9CA3AF" : "#2D6A4F",
            color: "#fff",
            fontSize: 14,
            fontWeight: 800,
            cursor: running || totalFunding <= 0 ? "not-allowed" : "pointer",
            letterSpacing: "0.02em",
            boxShadow: "0 2px 8px rgba(45,106,79,0.2)",
            transition: "background 0.2s",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            {running ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Running simulation…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }}>
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                </svg>
                Run simulation
              </>
            )}
          </span>
        </button>
      </div>

      {/* ── Right panel: results ── */}
      <div className="funding-simulator-results" style={{ flex: 1, minWidth: 0 }}>
        <div
          className="funding-simulator-results-inner"
          style={{
            ...CARD,
            borderRadius: 14,
            padding: 24,
            minHeight: 400,
          }}
        >
        {!results && !running && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 352,
              border: "1px dashed #E5E7EB",
              borderRadius: 12,
              background: "#FAFAF9",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-hidden
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M18 9l-5 5-4-4-3 3" />
              </svg>
            </div>
            <p
              style={{
                fontSize: 14,
                color: "#6B7280",
                textAlign: "center",
                maxWidth: 320,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Set your amount, focus area, and priority, then click
              <strong style={{ color: "#374151" }}> Run simulation</strong> to see recommended allocations and estimated reach.
            </p>
          </div>
        )}

        {running && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 352,
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "3px solid #E5E7EB",
                borderTop: "3px solid #2D6A4F",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0, ...MONO }}>
              Computing optimal allocation…
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {results && (() => {
          const totalAmount = totalFunding;
          const allocationData = results.allocated.map((r) => {
            const value = r.dollars;
            const pct = Math.round((value / totalAmount) * 1000) / 10;
            const needLevel =
              r.impactScore >= 0.7 ? "critical" : r.impactScore >= 0.6 ? "high" : "medium";
            return {
              name: r.name,
              borough: r.borough,
              zip: r.zip,
              value,
              pct,
              subscribers: r.subscriptions ?? 0,
              povertyRate: r.povertyRate ?? 0,
              rating: r.rating ?? 0,
              needLevel,
            };
          });

          const renderCenterLabel = (props) => {
            if (props?.index !== 0) return null;
            const viewBox = props?.viewBox ?? props;
            const cx = viewBox?.cx ?? props?.cx;
            const cy = viewBox?.cy ?? props?.cy;
            if (cx == null || cy == null) return null;
            return (
              <g>
                <text
                  x={cx}
                  y={cy - 8}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    fill: "var(--color-text-primary, #111827)",
                  }}
                >
                  ${totalAmount.toLocaleString()}
                </text>
                <text
                  x={cx}
                  y={cy + 16}
                  textAnchor="middle"
                  style={{
                    fontSize: "11px",
                    fill: "var(--color-text-secondary, #6B7280)",
                  }}
                >
                  total allocation
                </text>
              </g>
            );
          };

          const CustomTooltip = ({ active, payload }) => {
            if (active && payload?.length) {
              const d = payload[0].payload;
              return (
                <div
                  style={{
                    background: "var(--color-background-primary, #fff)",
                    border: "1px solid var(--color-border-secondary, #E5E7EB)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{d.name}</div>
                  <div style={{ color: "var(--color-text-secondary, #6B7280)" }}>
                    ${d.value.toLocaleString()} · {d.pct}%
                  </div>
                </div>
              );
            }
            return null;
          };

          function NeighborhoodCard({ data, color }) {
            const badgeStyle =
              data.needLevel === "critical"
                ? { background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }
                : data.needLevel === "high"
                ? { background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A" }
                : { background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB" };
            const badgeLabel =
              data.needLevel === "critical" ? "Critical need" : data.needLevel === "high" ? "High need" : "Elevated need";
            return (
              <div
                style={{
                  background: "var(--color-background-primary, #fff)",
                  border: "1px solid var(--color-border-tertiary, #E5E7EB)",
                  borderLeft: `4px solid ${color}`,
                  borderRadius: "0 8px 8px 0",
                  padding: "12px 14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary, #111827)" }}>
                      {data.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary, #6B7280)", marginTop: 2 }}>
                      {data.borough} · {data.zip}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#2D6A4F" }}>
                      ${data.value.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary, #6B7280)" }}>{data.pct}%</div>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "var(--color-text-secondary, #6B7280)",
                  }}
                >
                  {data.subscribers.toLocaleString()} subscribers · Poverty {data.povertyRate}% · Rating{" "}
                  {typeof data.rating === "number" ? data.rating.toFixed(2) : data.rating}
                </div>
                <div style={{ marginTop: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 4,
                      ...badgeStyle,
                    }}
                  >
                    {badgeLabel}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Results header */}
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>
                  Simulation results
                </h2>
                <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, ...MONO }}>
                  ${totalFunding.toLocaleString()} ·{" "}
                  {focus === "all"
                    ? "All of NYC"
                    : focus === "borough"
                    ? focusBorough
                    : `ZIP ${focusZip}`}{" "}
                  · {PRIORITIES.find((p) => p.id === priority)?.label}
                </p>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  marginTop: '4px',
                  fontStyle: 'italic'
                }}>
                  This is a planning tool. Allocations are illustrative — connect with pantries directly or donate through City Harvest to act on these recommendations.
                </p>
                <hr style={{ border: "none", borderTop: "1px solid var(--color-border-tertiary, #E5E7EB)", marginTop: 14 }} />
              </div>

              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>
                Recommended portfolio
              </h3>
              <p style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                marginTop: '2px',
                marginBottom: '16px'
              }}>
                Based on poverty rate, community demand, and current service quality · Real data from 1,976 LemonTree resources
              </p>

              {/* Two columns: donut + legend | neighborhood cards */}
              <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <div style={{ width: 280, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={allocationData}
                        innerRadius={65}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        label={renderCenterLabel}
                        labelLine={false}
                      >
                        {allocationData.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 12 }}>
                    {allocationData.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "3px 0",
                          fontSize: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 2,
                              background: DONUT_COLORS[i % DONUT_COLORS.length],
                            }}
                          />
                          <span style={{ color: "var(--color-text-primary, #111827)" }}>{item.name}</span>
                        </div>
                        <span
                          style={{
                            color: "var(--color-text-secondary, #6B7280)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          ${item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
                  {allocationData.map((item, i) => (
                    <NeighborhoodCard
                      key={i}
                      data={item}
                      color={DONUT_COLORS[i % DONUT_COLORS.length]}
                    />
                  ))}
                </div>
              </div>

              {/* Estimated reach */}
              <div
                style={{
                  borderTop: "1px solid var(--color-border-tertiary, #E5E7EB)",
                  paddingTop: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: 14,
                  }}
                >
                  Estimated reach
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 16,
                  }}
                >
                  {[
                    {
                      value: results.totalSubs.toLocaleString(),
                      label: "families reached",
                      sub: "combined subscribers",
                    },
                    {
                      value: results.count,
                      label: "resources supported",
                      sub: "across top-impact sites",
                    },
                    {
                      value: `${results.avgPoverty}%`,
                      label: "avg poverty rate",
                      sub: "in supported areas",
                    },
                  ].map(({ value, label, sub }) => (
                    <div
                      key={label}
                      style={{
                        padding: "14px 16px",
                        borderRadius: 10,
                        background: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          color: "#2D6A4F",
                          ...MONO,
                          lineHeight: 1,
                        }}
                      >
                        {value}
                      </div>
                      <div style={{ fontSize: 12, color: "#374151", fontWeight: 600, marginTop: 5 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2, ...MONO }}>
                        {sub}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            {/* Export row */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() =>
                  navigator.clipboard?.writeText(summaryText).catch(() => {})
                }
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "1.5px solid #E5E7EB",
                  background: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                📋 Copy summary
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "1.5px solid #E5E7EB",
                  background: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                ⬇ Export as PDF
              </button>
            </div>

            {/* Methodology */}
            <div
              style={{
                padding: "16px 18px",
                borderRadius: 10,
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                fontSize: 11,
                color: "#9CA3AF",
                lineHeight: 1.7,
                ...MONO,
              }}
            >
              <strong style={{ color: "#6B7280" }}>
                How simulation works:
              </strong>{" "}
              Resources are ranked by impact score (poverty rate 40% + quality
              gap 35% + subscriber demand 25%). Allocation is proportional to
              impact score within the selected geography. Dollar amounts are
              illustrative — actual funding needs vary by pantry. Data sourced
              from LemonTree platform + ACS 2024 ZIP demographics.
            </div>
            </div>
          );
        })()}
        </div>
      </div>
    </div>
  );
}
