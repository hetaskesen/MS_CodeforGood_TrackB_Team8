"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import html2canvas from "html2canvas";
import VisualizationBuilder from "./VisualizationBuilder";
import FundingSimulator from "./FundingSimulator";

const DOT_GRID = {
  backgroundColor: "#FAFAF8",
  backgroundImage: "radial-gradient(circle, #C8C8C0 1px, transparent 1px)",
  backgroundSize: "24px 24px",
};

const TABS = [
  { id: "viz", label: "📈 Visualization Builder" },
  { id: "sim", label: "💡 Funding Simulator" },
];

const STUB_BTN_STYLE = {
  padding: "8px 16px",
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 8,
  border: "1.5px solid #E5E7EB",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontFamily: "DM Sans, system-ui, sans-serif",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

export default function ReportBuilder() {
  const [activeTab, setActiveTab] = useState("viz");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const contentRef = useRef(null);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  }, []);

  const handleExportPNG = useCallback(() => {
    if (!contentRef.current) return;
    html2canvas(contentRef.current, { useCORS: true, scale: 2 }).then((canvas) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "lemontree-report.png";
        a.click();
        URL.revokeObjectURL(url);
      });
    });
  }, []);

  return (
    <div
      style={{
        ...DOT_GRID,
        minHeight: "100vh",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Back link */}
      <div style={{ padding: "12px 28px 0" }}>
        <Link
          href="/dashboard"
          style={{
            fontSize: 12,
            color: "#9CA3AF",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          ← Back to dashboard
        </Link>
      </div>

      {/* Page header */}
      <div
        style={{
          padding: "14px 28px 0",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#111827",
              margin: "0 0 5px",
              letterSpacing: "-0.3px",
            }}
          >
            📊 Report Builder
          </h1>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
            Build custom visualizations and simulate funding impact using live
            LemonTree data
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 2 }}>
          <button style={STUB_BTN_STYLE} onClick={handleCopyLink}>
            {copyFeedback ? "✓ Copied!" : "📋 Copy shareable link"}
          </button>
          <button style={STUB_BTN_STYLE} onClick={handleExportPNG}>⬇ Export as PNG</button>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ padding: "18px 28px 0", display: "flex", gap: 6 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 10,
              border: `1.5px solid ${activeTab === t.id ? "#2D6A4F" : "#E5E7EB"}`,
              background: activeTab === t.id ? "#2D6A4F" : "#fff",
              color: activeTab === t.id ? "#fff" : "#6B7280",
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              boxShadow:
                activeTab === t.id
                  ? "0 2px 8px rgba(45,106,79,0.25)"
                  : "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div ref={contentRef} style={{ padding: "20px 28px 48px" }}>
        {activeTab === "viz" && <VisualizationBuilder />}
        {activeTab === "sim" && <FundingSimulator />}
      </div>
    </div>
  );
}
