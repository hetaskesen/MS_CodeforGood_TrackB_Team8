"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import CensusLayerControls from "@/components/CensusLayerControls.jsx";
import Navbar from "@/components/Navbar";
import OperatorPanel from "@/components/OperatorPanel";
import DonorPanel from "@/components/DonorPanel";
import GovernmentPanel from "@/components/GovernmentPanel";
import { resources, donorPortfolio, ratingColor } from "@/lib/data";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const DEFAULT_RESOURCE = resources.find((r) => r.id === "res_002");

export default function Home() {
  const [mode, setMode] = useState("operator");
  const [censusLayer, setCensusLayer] = useState(null);
  const [showCensusFilters, setShowCensusFilters] = useState(false);
  const [selectedResource, setSelectedResource] = useState(DEFAULT_RESOURCE);
  const [panelKey, setPanelKey] = useState(0);
  const mapInvalidateRef = useRef(null);

  const handleModeChange = useCallback((newMode) => {
    setSelectedResource(newMode === "operator" ? DEFAULT_RESOURCE : null);
    if (newMode !== "government") {
      setShowCensusFilters(false);
    }
    setMode(newMode);
    setPanelKey((k) => k + 1);
    setTimeout(() => {
      if (mapInvalidateRef.current) mapInvalidateRef.current();
    }, 100);
  }, []);

  const handleResourceSelect = useCallback((resource) => {
    setSelectedResource(resource);
    setPanelKey((k) => k + 1);
  }, []);

  const handleMapInvalidateRef = useCallback((fn) => {
    mapInvalidateRef.current = fn;
  }, []);

  // Top-header content (dashboard views only)
  const entityName =
    mode === "operator"
      ? (selectedResource?.name ?? "Select a pantry")
      : donorPortfolio.donorName;

  const entityBadge =
    mode === "operator" && selectedResource
      ? {
          label: `${
            selectedResource.rating >= 3.8
              ? "Good"
              : selectedResource.rating >= 3.0
                ? "Fair"
                : "Needs attention"
          } · ${selectedResource.rating}`,
          color: ratingColor(selectedResource.rating),
        }
      : mode === "donor"
        ? { label: "Active funder", color: "#1D9E75" }
        : null;

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#f5f3ef]">
      {/* ── Navbar at the top ── */}
      <Navbar
        activeMode={mode}
        onModeChange={handleModeChange}
        userName="Sarah M."
      />

      {/* ── Main content area (fills remaining height) ── */}
      <div className="flex flex-1 min-w-0 overflow-hidden">
        {mode === "government" ? (
          /* ── Government: 40% panel + 60% map ── */
          <div className="flex h-full w-full">
            <div
              className="flex flex-col h-full overflow-hidden"
              style={{ width: "40%" }}
            >
              <div className="flex-1 overflow-y-auto" key={panelKey}>
                <GovernmentPanel />
              </div>
            </div>

            <div className="w-px bg-sand-200 shrink-0" />

            <div className="relative flex-1 h-full">
              <MapView
                mode={mode}
                censusLayer={censusLayer}
                onResourceSelect={handleResourceSelect}
                onInvalidateRef={handleMapInvalidateRef}
              />

              <div className="absolute top-4 right-4 z-[900] flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCensusFilters((open) => !open)}
                  className="h-11 w-11 rounded-xl bg-white/95 border border-sand-200 shadow-sm hover:bg-white transition-colors flex items-center justify-center"
                  aria-label="Toggle census overlay filters"
                  title="Census filters"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
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
                    <CensusLayerControls
                      active={censusLayer}
                      onChange={setCensusLayer}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── Dashboard: full-screen, no map ── */
          <div className="flex flex-col h-full w-full">
            {/* Top header */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-sand-100 bg-white shrink-0">
              <h1 className="text-xl font-semibold text-sand-800">
                {entityName}
              </h1>
              {entityBadge && (
                <span
                  className="text-sm font-semibold px-4 py-1.5 rounded-full"
                  style={{
                    backgroundColor: entityBadge.color + "15",
                    color: entityBadge.color,
                  }}
                >
                  {entityBadge.label}
                </span>
              )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto" key={panelKey}>
              {mode === "operator" && (
                <OperatorPanel resource={selectedResource} />
              )}
              {mode === "donor" && <DonorPanel />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
