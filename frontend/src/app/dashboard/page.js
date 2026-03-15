"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import CensusLayerControls from "@/components/CensusLayerControls.jsx";
import PersonaDropdown from "@/components/PersonaDropdown";
import WorkspaceTabBar from "@/components/WorkspaceTabBar";
import TabPicker from "@/components/TabPicker";
import { resources, donorPortfolio, govData as mockGovData } from "@/lib/mockData";
import { ratingColor } from "@/lib/helpers";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const PanelPlaceholder = () => (
  <div className="flex flex-1 items-center justify-center text-sand-500 text-sm" aria-hidden>
    Loading…
  </div>
);
const OperatorPanel = dynamic(() => import("@/components/OperatorPanel"), {
  ssr: false,
  loading: () => <PanelPlaceholder />,
});
const DonorPanel = dynamic(() => import("@/components/DonorPanel"), {
  ssr: false,
  loading: () => <PanelPlaceholder />,
});
const GovernmentPanel = dynamic(() => import("@/components/GovernmentPanel"), {
  ssr: false,
  loading: () => <PanelPlaceholder />,
});
const ReportBuilder = dynamic(() => import("@/components/ReportBuilder"), {
  ssr: false,
  loading: () => <PanelPlaceholder />,
});
const FundingSimulator = dynamic(() => import("@/components/FundingSimulator"), {
  ssr: false,
  loading: () => <PanelPlaceholder />,
});
const AdminPanel = dynamic(() => import("@/components/AdminPanel"), {
  ssr: false,
  loading: () => <PanelPlaceholder />,
});

const DEFAULT_RESOURCE = resources.find((r) => r.id === "res_002");
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const NAV_HEIGHT = 62;
const TAB_BAR_HEIGHT = 44;

function getDefaultTabs(persona) {
  const base = { scrollPosition: 0, pinned: true };
  switch (persona) {
    case "pantry-operator":
      return [{ ...base, id: "dashboard-pantry", type: "dashboard-pantry", label: "Dashboard", icon: "🏪" }];
    case "donor":
      return [{ ...base, id: "dashboard-donor", type: "dashboard-donor", label: "Dashboard", icon: "💚" }];
    case "government":
      return [{ ...base, id: "dashboard-government", type: "dashboard-government", label: "Dashboard", icon: "🏛" }];
    case "admin":
      return [
        { ...base, id: "dashboard-pantry", type: "dashboard-pantry", label: "Resource Dashboard", icon: "🏪" },
        { ...base, id: "dashboard-donor", type: "dashboard-donor", label: "Donor Dashboard", icon: "💚" },
        { ...base, id: "dashboard-government", type: "dashboard-government", label: "Gov Dashboard", icon: "🏛" },
      ];
    default:
      return getDefaultTabs("pantry-operator");
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [activePersona, setActivePersona] = useState("pantry-operator");
  const [tabs, setTabs] = useState(() => getDefaultTabs("pantry-operator"));
  const [activeTabId, setActiveTabId] = useState("dashboard-pantry");
  const [tabPickerOpen, setTabPickerOpen] = useState(false);

  const [censusLayer, setCensusLayer] = useState(null);
  const [showCensusFilters, setShowCensusFilters] = useState(false);
  const [selectedResource, setSelectedResource] = useState(DEFAULT_RESOURCE);
  const [panelKey, setPanelKey] = useState(0);
  const mapInvalidateRef = useRef(null);
  const [govData, setGovData] = useState(null);
  const [govResources, setGovResources] = useState(null);

  const activeTabRef = useRef(null);
  const addButtonRef = useRef(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const contentMode =
    activeTab?.type === "dashboard-government"
      ? "government"
      : activeTab?.type === "dashboard-donor"
        ? "donor"
        : "operator";

  useEffect(() => {
    if (contentMode !== "government" || !apiUrl) return;
    let cancelled = false;
    Promise.all([
      fetch(`${apiUrl}/api/gov/data`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${apiUrl}/api/resources`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([data, resourcesList]) => {
        if (cancelled) return;
        setGovData(data && data.underservedZips ? data : null);
        setGovResources(Array.isArray(resourcesList) ? resourcesList : null);
      })
      .catch(() => {
        if (!cancelled) setGovData(null), setGovResources(null);
      });
    return () => { cancelled = true; };
  }, [contentMode]);

  const handlePersonaChange = useCallback((persona) => {
    setActivePersona(persona);
    const defaultTabs = getDefaultTabs(persona);
    setTabs(defaultTabs);
    setActiveTabId(defaultTabs[0].id);
  }, []);

  const openTab = useCallback((type) => {
    const existing = tabs.find((t) => t.type === type);
    if (existing) {
      setActiveTabId(existing.id);
      setTabPickerOpen(false);
      return;
    }
    const configs = {
      explore: { label: "Explore Resources", icon: "🔍" },
      "report-builder": { label: "Report Builder", icon: "📊" },
      "funding-simulator": { label: "Funding Simulator", icon: "💡" },
      "reviews-intelligence": { label: "Reviews Intelligence", icon: "🛡️" },
    };
    const cfg = configs[type];
    if (!cfg) return;
    const newTab = {
      id: `${type}-${Date.now()}`,
      type,
      label: cfg.label,
      icon: cfg.icon,
      pinned: false,
      scrollPosition: 0,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setTabPickerOpen(false);
  }, [tabs]);

  const closeTab = useCallback((tabId) => {
    const idx = tabs.findIndex((t) => t.id === tabId);
    const newTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[Math.max(0, idx - 1)]?.id ?? null);
    }
  }, [tabs, activeTabId]);

  const handleTabPickerSelect = useCallback(
    (value) => {
      const TAB_TYPES = ["explore", "report-builder", "funding-simulator", "reviews-intelligence"];
      if (TAB_TYPES.includes(value)) {
        openTab(value);
      } else {
        setActiveTabId(value);
      }
      setTabPickerOpen(false);
    },
    [openTab]
  );

  useEffect(() => {
    sessionStorage.setItem(
      "lemon-workspace",
      JSON.stringify({ persona: activePersona, tabs, activeTabId })
    );
  }, [activePersona, tabs, activeTabId]);

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "t") {
        e.preventDefault();
        setTabPickerOpen((open) => !open);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "w") {
        e.preventDefault();
        const active = tabs.find((t) => t.id === activeTabId);
        if (active && !active.pinned) closeTab(activeTabId);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "6") {
        e.preventDefault();
        const idx = parseInt(e.key, 10) - 1;
        if (tabs[idx]) setActiveTabId(tabs[idx].id);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tabs, activeTabId, closeTab]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("lemon-workspace");
      if (saved) {
        const { persona, tabs: savedTabs, activeTabId: savedActiveId } = JSON.parse(saved);
        const validPersonas = ["pantry-operator", "donor", "government", "admin"];
        if (validPersonas.includes(persona) && Array.isArray(savedTabs) && savedTabs.length > 0) {
          const firstId = savedTabs[0]?.id;
          const validId = savedActiveId && savedTabs.some((t) => t.id === savedActiveId);
          setActivePersona(persona);
          setTabs(savedTabs);
          setActiveTabId(validId ? savedActiveId : firstId);
        }
      }
    } catch (_) {}
  }, []);

  const handleResourceSelect = useCallback((resource) => {
    setSelectedResource(resource);
    setPanelKey((k) => k + 1);
  }, []);

  const handleMapInvalidateRef = useCallback((fn) => {
    mapInvalidateRef.current = fn;
  }, []);

  const entityName =
    contentMode === "operator"
      ? selectedResource?.name ?? "Select a pantry"
      : donorPortfolio.donorName;

  const entityBadge =
    contentMode === "operator" && selectedResource
      ? {
          label: `${
            selectedResource.rating >= 3.8 ? "Good" : selectedResource.rating >= 3.0 ? "Fair" : "Needs attention"
          } · ${selectedResource.rating}`,
          color: ratingColor(selectedResource.rating),
        }
      : contentMode === "donor"
        ? { label: "Active funder", color: "#1D9E75" }
        : null;

  function renderTabContent() {
    if (!activeTab) return null;
    switch (activeTab.type) {
      case "dashboard-pantry":
        return (
          <div className="flex flex-col h-full w-full">
            <div className="flex-1 overflow-y-auto" key={panelKey}>
              <OperatorPanel resource={selectedResource} />
            </div>
          </div>
        );
      case "dashboard-donor":
        return (
          <div className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between px-8 py-4 border-b border-sand-100 bg-white shrink-0">
              <h1 className="text-xl font-semibold text-sand-800">{entityName}</h1>
              {entityBadge && (
                <span
                  className="text-sm font-semibold px-4 py-1.5 rounded-full"
                  style={{ backgroundColor: entityBadge.color + "15", color: entityBadge.color }}
                >
                  {entityBadge.label}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto" key={panelKey}>
              <DonorPanel />
            </div>
          </div>
        );
      case "dashboard-government":
        return (
          <div className="flex h-full w-full">
            <div className="flex flex-col h-full overflow-hidden" style={{ width: "40%" }}>
              <div className="flex-1 overflow-y-auto" key={panelKey}>
                <GovernmentPanel
                  govData={govData ?? mockGovData}
                  dataSource={govData ? "supabase" : "static"}
                />
              </div>
            </div>
            <div className="w-px bg-sand-200 shrink-0" />
            <div className="relative flex-1 h-full">
              <MapView
                mode="government"
                censusLayer={censusLayer}
                onResourceSelect={handleResourceSelect}
                onInvalidateRef={handleMapInvalidateRef}
                govData={govData ?? mockGovData}
                resources={govResources ?? resources}
              />
              <div className="absolute top-4 right-4 z-[900] flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCensusFilters((open) => !open)}
                  className="h-11 w-11 rounded-xl bg-white/95 border border-sand-200 shadow-sm hover:bg-white transition-colors flex items-center justify-center"
                  aria-label="Toggle census overlay filters"
                  title="Census filters"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 6H20L14 13V19L10 17V13L4 6Z"
                      stroke="#6B645A"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {showCensusFilters && (
                  <div className="w-56 rounded-xl border border-sand-200 bg-white/95 backdrop-blur-sm p-3 shadow-md">
                    <CensusLayerControls active={censusLayer} onChange={setCensusLayer} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case "explore":
        return (
          <div className="h-full w-full overflow-hidden flex flex-col">
            <iframe
              src="/dashboard/explore?embedded=1"
              title="Explore Resources"
              className="w-full flex-1 border-0 min-h-0"
            />
          </div>
        );
      case "report-builder":
        return (
          <div className="h-full overflow-auto bg-[#FAFAF8]">
            <ReportBuilder />
          </div>
        );
      case "funding-simulator":
        return (
          <div className="h-full overflow-auto bg-[#FAFAF8]">
            <FundingSimulator />
          </div>
        );
      case "reviews-intelligence":
        return (
          <div className="h-full overflow-auto">
            <AdminPanel />
          </div>
        );
      default:
        return null;
    }
  }

  const initials = "Sarah M."
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#f5f3ef]" style={{ minWidth: 1440 }}>
      {/* ── Top nav ── */}
      <nav
        style={{
          background: "var(--theme-navbar-bg, #FDE97A)",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "0 24px",
          height: NAV_HEIGHT,
          flexShrink: 0,
          zIndex: 1000,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <img
            src="https://www.foodhelpline.org/_next/static/media/logo.b8e851d7.svg"
            alt="Lemontree logo"
            style={{ height: "34px" }}
          />
          <img
            src="https://www.foodhelpline.org/_next/static/media/wordmark.483cff36.svg"
            alt="Lemontree"
            style={{ height: "20px", marginLeft: "-6px" }}
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>

        <PersonaDropdown activePersona={activePersona} onPersonaChange={handlePersonaChange} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--theme-navbar-text, #3D2200)", whiteSpace: "nowrap" }}>
            Sarah M.
          </span>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--theme-surface-panel, #fff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--theme-navbar-avatar-text, #a07800)",
              border: "2px solid rgb(var(--theme-shadow-rgb) / 0.08)",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <button
            onClick={() => router.push("/")}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "7px 16px",
              borderRadius: 8,
              cursor: "pointer",
              whiteSpace: "nowrap",
              border: "1.5px solid rgb(var(--theme-shadow-rgb) / 0.2)",
              background: "var(--theme-navbar-signout-bg, rgba(255,255,255,0.5))",
              color: "var(--theme-navbar-text, #3D2200)",
              fontFamily: "DM Sans, system-ui, sans-serif",
            }}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Tab bar ── */}
      <WorkspaceTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={setActiveTabId}
        onTabClose={closeTab}
        onAddClick={() => setTabPickerOpen(true)}
        activeTabRef={activeTabRef}
        addButtonRef={addButtonRef}
      />

      {/* Tab picker dropdown ── */}
      <TabPicker
        open={tabPickerOpen}
        onClose={() => setTabPickerOpen(false)}
        onSelect={handleTabPickerSelect}
        tabs={tabs}
        activeTabId={activeTabId}
        anchorRef={addButtonRef}
        activePersona={activePersona}
      />

      {/* ── Content area ── */}
      <div
        className="min-w-0 flex-1 overflow-hidden bg-white border-t border-[#E5E5E0]"
        style={{ height: `calc(100vh - ${NAV_HEIGHT}px - ${TAB_BAR_HEIGHT}px)` }}
      >
        <div key={activeTabId} className="workspace-tab-content h-full">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
