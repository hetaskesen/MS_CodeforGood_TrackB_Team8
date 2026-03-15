"use client";

import { useState, useMemo, useEffect } from "react";

// ── Constants ──────────────────────────────────────────────────────────────────

const MONO = { fontFamily: "'Courier New', monospace" };

const CARD = {
  background: "#fff",
  borderRadius: 14,
  padding: "22px 24px",
  border: "1px solid #E5E5E0",
  boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
};

const PRESETS = [5000, 10000, 25000, 50000, 100000];

const PRIORITIES = [
  {
    id: "balanced",
    icon: "⚖",
    label: "Balanced portfolio",
    sub: "Mix of reach and need",
  },
  {
    id: "need",
    icon: "⚡",
    label: "Highest need first",
    sub: "Focus on highest poverty areas",
  },
  {
    id: "reach",
    icon: "🎯",
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
  const [preset, setPreset]         = useState(25000);
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
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      {/* ── Left panel: controls ── */}
      <div
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
            See where your funding has the greatest impact on food access
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
            I_WANT_TO_FUND
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
                placeholder="e.g. 75000"
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
            FOCUS_AREA
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
            OPTIMIZE_FOR
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
                  <span>{p.icon}</span>
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
          {running ? "Running simulation…" : "▶ Run simulation"}
        </button>
      </div>

      {/* ── Right panel: results ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!results && !running && (
          <div
            style={{
              ...CARD,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 400,
              border: "2px dashed #D1D5DB",
              background: "#FAFAF8",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 40 }}>💡</span>
            <p
              style={{
                fontSize: 13,
                color: "#9CA3AF",
                textAlign: "center",
                maxWidth: 320,
                lineHeight: 1.6,
                margin: 0,
                ...MONO,
              }}
            >
              Configure simulation parameters and click
              <br />
              &lsquo;Run simulation&rsquo; to see results
            </p>
          </div>
        )}

        {running && (
          <div
            style={{
              ...CARD,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 400,
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

        {results && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Results header */}
            <div style={{ ...CARD }}>
              <div
                style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 4 }}
              >
                Simulation results
              </div>
              <div style={{ fontSize: 12, color: "#9CA3AF", ...MONO }}>
                ${totalFunding.toLocaleString()} ·{" "}
                {focus === "all"
                  ? "All of NYC"
                  : focus === "borough"
                  ? focusBorough
                  : `ZIP ${focusZip}`}{" "}
                · {PRIORITIES.find((p) => p.id === priority)?.label}
              </div>
            </div>

            {/* Recommended allocation */}
            <div style={{ ...CARD }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 14,
                }}
              >
                Recommended portfolio
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {results.allocated.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 10,
                      border: "1px solid #E5E7EB",
                      background: i === 0 ? "#F0FDF4" : "#FAFAFA",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                        marginBottom: 6,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#111827",
                            marginBottom: 2,
                          }}
                        >
                          {r.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#6B7280", ...MONO }}>
                          {r.borough}, {r.zip}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: "#2D6A4F",
                            ...MONO,
                          }}
                        >
                          ${r.dollars.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: "#9CA3AF", ...MONO }}>
                          {r.allocationPct}%
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div
                      style={{
                        height: 6,
                        background: "#E5E7EB",
                        borderRadius: 3,
                        overflow: "hidden",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${r.allocationPct}%`,
                          background: "#2D6A4F",
                          borderRadius: 3,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", ...MONO }}>
                      {r.subscriptions} subscribers · Poverty {r.povertyRate}% ·
                      Rating {r.rating}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 6,
                        background:
                          r.impactScore >= 0.7 ? "#FEE2E2" : "#FEF3C7",
                        color:
                          r.impactScore >= 0.7 ? "#991B1B" : "#92400E",
                        fontSize: 10,
                        fontWeight: 700,
                        ...MONO,
                      }}
                    >
                      {r.impactScore >= 0.7
                        ? "Critical need"
                        : r.impactScore >= 0.6
                        ? "High need"
                        : "Elevated need"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estimated reach */}
            <div style={{ ...CARD }}>
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
                    <div
                      style={{
                        fontSize: 12,
                        color: "#374151",
                        fontWeight: 600,
                        marginTop: 5,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#9CA3AF",
                        marginTop: 2,
                        ...MONO,
                      }}
                    >
                      {sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ZIP coverage */}
            <div style={{ ...CARD }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 10,
                }}
              >
                ZIP codes covered by this allocation
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {results.allocated.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "#F9FAFB",
                      fontSize: 12,
                      ...MONO,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 800,
                        color: "#2D6A4F",
                        minWidth: 48,
                      }}
                    >
                      {r.zip}
                    </span>
                    <span style={{ color: "#374151" }}>
                      {r.borough}
                    </span>
                    <span style={{ color: "#9CA3AF", marginLeft: "auto" }}>
                      poverty {r.povertyRate}%
                    </span>
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
        )}
      </div>
    </div>
  );
}
