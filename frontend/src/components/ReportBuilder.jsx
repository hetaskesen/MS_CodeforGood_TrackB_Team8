"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import html2canvas from "html2canvas";
import VisualizationBuilder from "./VisualizationBuilder";
import { IconBarChart, IconSparkles, IconLink, IconDownload } from "./Icons";

const DOT_GRID = {
  backgroundColor: "#FAFAF8",
  backgroundImage: "radial-gradient(circle, #C8C8C0 1px, transparent 1px)",
  backgroundSize: "24px 24px",
};

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

export default function ReportBuilder({ govData, donorData, persona }) {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
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
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <IconBarChart size={22} />
            Report Builder
          </h1>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
            Build custom visualizations and simulate funding impact using live
            LemonTree data
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 2, alignItems: "center" }}>
          <button
            onClick={() => setAiEnabled((v) => !v)}
            style={{
              ...STUB_BTN_STYLE,
              background: aiEnabled ? "#F0FDF4" : "#fff",
              border: `1.5px solid ${aiEnabled ? "#2D6A4F" : "#E5E7EB"}`,
              color: aiEnabled ? "#2D6A4F" : "#9CA3AF",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            title={aiEnabled ? "AI insights on — click to disable" : "AI insights off — click to enable"}
          >
            <IconSparkles size={14} />
            AI insights {aiEnabled ? "on" : "off"}
          </button>
          <button style={{ ...STUB_BTN_STYLE, display: "flex", alignItems: "center", gap: 6 }} onClick={handleCopyLink}>
            <IconLink size={14} />
            {copyFeedback ? "Copied!" : "Copy shareable link"}
          </button>
          <button style={{ ...STUB_BTN_STYLE, display: "flex", alignItems: "center", gap: 6 }} onClick={handleExportPNG}>
            <IconDownload size={14} />
            Export as PNG
          </button>
        </div>
      </div>

      {/* Main content — ref used for PNG export (canvas only when viz builder provides it) */}
      <VisualizationBuilder
        govData={govData}
        donorData={donorData}
        exportContentRef={contentRef}
        persona={persona}
        aiEnabled={aiEnabled}
      />
    </div>
  );
}
