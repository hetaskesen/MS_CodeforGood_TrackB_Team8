"use client";

import { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { govData as defaultGovData } from "@/lib/mockData";
import Footer from "./Footer";
import ALICETab from "./ALICETab";
import { BOROUGH_DISPLAY } from "./gov/shared";
import OverviewTab from "./gov/OverviewTab";
import UnderservedTab from "./gov/UnderservedTab";
import AccessBarriersTab from "./gov/AccessBarriersTab";
import ResourceGapsTab from "./gov/ResourceGapsTab";
import TransitAccessTab from "./gov/TransitAccessTab";
import ReliabilityTab from "./gov/ReliabilityTab";
import VulnerablePopTab from "./gov/VulnerablePopTab";

const TABS = [
  { id: "overview",    label: "Overview" },
  { id: "underserved", label: "Underserved Areas" },
  { id: "barriers",   label: "Access Barriers" },
  { id: "gaps",       label: "Resource Gaps" },
  { id: "alice",      label: "True Demand" },
  { id: "transit",    label: "Transit Access" },
  { id: "reliability", label: "Reliability" },
  { id: "vulnerable", label: "Vulnerable Pop." },
];

const TAB_ICONS = {
  overview: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
  underserved: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  ),
  barriers: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
    </svg>
  ),
  gaps: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  ),
  alice: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  transit: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  reliability: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  vulnerable: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  ),
};

const FILTER_DEFS = [
  {
    key: "borough", options: [
      ["all", "All boroughs"], ["manhattan", "Manhattan"], ["brooklyn", "Brooklyn"],
      ["queens", "Queens"], ["bronx", "Bronx"], ["staten_island", "Staten Island"],
    ],
  },
  {
    key: "poverty", options: [
      ["all", "All poverty levels"], ["high", "High (>30%)"],
      ["medium", "Medium (15–30%)"], ["low", "Low (<15%)"],
    ],
  },
];

export default function GovernmentPanel({ govData = defaultGovData, dataSource = "static" }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({ borough: "all", poverty: "all" });
  const [exporting, setExporting] = useState(false);
  const dashboardRef = useRef(null);

  // NOTE: html2canvas has known limitations with Recharts SVG charts —
  // some charts may render as blank or incomplete in the exported PDF.
  // This is a known html2canvas/SVG limitation. The export works best
  // for list-based tabs (Underserved, Transit, Reliability, Vulnerable).
  // For chart-heavy tabs (Overview, ALICE), consider screenshotting manually.
  const handleExportPDF = async () => {
    const element = dashboardRef.current;
    if (!element) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#F8F9FA",
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      const date = new Date().toISOString().split("T")[0];
      const tabName = activeTab ?? "overview";
      pdf.save(`lemontree-${tabName}-${date}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const flyTo = (lat, lng, zoom = 14) => {
    window.dispatchEvent(new CustomEvent("gov:flyto", { detail: { lat, lng, zoom } }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.dispatchEvent(new CustomEvent("gov:tabchange", { detail: { tab } }));
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== "all").length;

  const boroughDisplayKey = filters.borough !== "all" ? (BOROUGH_DISPLAY[filters.borough] ?? null) : null;

  const filteredZipCount = (() => {
    if (activeTab === "underserved" || activeTab === "overview") {
      return govData.underservedZips.filter((z) => {
        if (boroughDisplayKey && z.borough !== boroughDisplayKey) return false;
    if (filters.poverty === "high"   && z.poverty <  30) return false;
    if (filters.poverty === "medium" && (z.poverty < 15 || z.poverty >= 30)) return false;
    if (filters.poverty === "low"    && z.poverty >= 15) return false;
    return true;
  }).length;
    }
    if (activeTab === "transit")     return (govData.transitGaps     ?? []).filter(g => !boroughDisplayKey || g.borough === boroughDisplayKey).length;
    if (activeTab === "reliability") return (govData.reliabilityGaps  ?? []).filter(g => !boroughDisplayKey || g.borough === boroughDisplayKey).length;
    if (activeTab === "barriers")    return (govData.languageGaps     ?? []).filter(g => !boroughDisplayKey || g.borough === boroughDisplayKey).length;
    if (activeTab === "vulnerable")  return (
      (govData.seniorAccessGaps ?? []).filter(g => !boroughDisplayKey || g.borough === boroughDisplayKey).length +
      (govData.dietaryGaps ?? []).filter(g => !boroughDisplayKey || g.borough === boroughDisplayKey).length
    );
    if (activeTab === "gaps") return govData?.communityFridges?.total ?? 0;
    return govData?.underservedZips?.length ?? 0;
  })();

  return (
    <div
      ref={dashboardRef}
      id="government-dashboard-content"
      style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "'DM Sans', system-ui, sans-serif", overflow: "hidden" }}
    >
      {/* ── Always-visible header ── */}
      <div style={{ padding: "12px 18px 10px", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: 0 }}>
            Coverage gap analysis
            {dataSource === "supabase" && (
              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, color: "#166534", background: "#DCFCE7", padding: "2px 6px", borderRadius: 6 }}>
                ● Live data
              </span>
            )}
          </h3>
          <div style={{ fontSize: 11, whiteSpace: "nowrap" }}>
            <span style={{ color: "#6B7280" }}>{govData.systemStats?.totalResources?.toLocaleString() ?? "—"} total</span>
            <span style={{ margin: "0 4px", color: "#D1D5DB" }}>·</span>
            <span style={{ color: "#166534" }}>{govData.systemStats?.publishedResources?.toLocaleString() ?? "—"} live</span>
            <span style={{ margin: "0 4px", color: "#D1D5DB" }}>·</span>
            <span style={{ color: "#DC2626", fontWeight: 700 }}>{govData.systemStats?.unavailableResources?.toLocaleString() ?? "—"} offline ({govData.systemStats?.unavailableRate ?? "—"}%) ⚠</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
          NYC food resource network · ACS 2024
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ padding: "8px 18px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", flexShrink: 0, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {FILTER_DEFS.map(({ key, options }) => (
          <select
            key={key}
            value={filters[key]}
            onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
            style={{
              fontSize: 11,
              color: "#374151",
              background: "#fff",
              border: `1px solid ${filters[key] !== "all" ? "#2D6A4F" : "#D1D5DB"}`,
              borderRadius: 7,
              padding: "4px 8px",
              cursor: "pointer",
              outline: "none",
              fontWeight: filters[key] !== "all" ? 600 : 400,
            }}
          >
            {options.map(([val, txt]) => <option key={val} value={val}>{txt}</option>)}
          </select>
        ))}
        {activeFilterCount > 0 && (
          <button
            onClick={() => setFilters({ borough: "all", poverty: "all" })}
            style={{ fontSize: 11, color: "#DC2626", background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontWeight: 600 }}
          >
            Clear ({activeFilterCount})
          </button>
        )}
        {activeFilterCount > 0 && (
          <span style={{ fontSize: 11, color: "#6B7280", marginLeft: 2 }}>
            {filteredZipCount} of {govData.underservedZips.length} ZIPs
          </span>
        )}
      </div>

      {/* ── Tab bar ── */}
      <style>{`#gov-tab-bar::-webkit-scrollbar { display: none; }`}</style>
      <div
        id="gov-tab-bar"
        style={{
          padding: "8px 18px 0",
          borderBottom: "1px solid #E5E7EB",
          flexShrink: 0,
          display: "flex",
          gap: 3,
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {TABS.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              style={{
                padding: "7px 11px",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: "8px 8px 0 0",
                border: `1px solid ${isActive ? "#2D6A4F" : "#E5E7EB"}`,
                borderBottom: isActive ? "1px solid #fff" : "1px solid #E5E7EB",
                background: isActive ? "#2D6A4F" : "#fff",
                color: isActive ? "#fff" : "#6B7280",
                cursor: "pointer",
                marginBottom: isActive ? -1 : 0,
                whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s",
                display: "flex",
                alignItems: "center",
              }}
            >
              {TAB_ICONS[t.id]}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab content (independently scrollable) ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 8px" }}>
        {activeTab === "overview"    && <OverviewTab filters={filters} govData={govData} onExportPDF={handleExportPDF} exporting={exporting} />}
        {activeTab === "underserved" && <UnderservedTab filters={filters} flyTo={flyTo} govData={govData} />}
        {activeTab === "barriers"    && <AccessBarriersTab govData={govData} filters={filters} />}
        {activeTab === "gaps"        && <ResourceGapsTab govData={govData} filters={filters} />}
        {activeTab === "alice"       && <ALICETab flyTo={flyTo} govData={govData} filters={filters} />}
        {activeTab === "transit"     && <TransitAccessTab govData={govData} filters={filters} />}
        {activeTab === "reliability" && <ReliabilityTab govData={govData} filters={filters} />}
        {activeTab === "vulnerable"  && <VulnerablePopTab govData={govData} filters={filters} />}
        <div style={{ height: 12 }} />
        <Footer />
      </div>
    </div>
  );
}
