"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { resources as defaultResources, censusTracts, donorPortfolio, govData as defaultGovData } from "@/lib/mockData";
import { ratingColor, povertyOpacity } from "@/lib/helpers";
import { CENSUS_LAYERS } from "@/lib/constants";

/** Normalize API resource (raw from Supabase) to map pin shape. */
function normalizeResourceForMap(r) {
  if (!r) return null;
  const raw = r.raw || r;
  const lat = raw.latitude ?? raw.lat ?? r.latitude ?? r.lat;
  const lng = raw.longitude ?? raw.lng ?? r.longitude ?? r.lng;
  if (lat == null || lng == null) return null;
  const name = raw.name ?? r.name ?? "";
  const rating = raw.rating_average ?? raw.ratingAverage ?? raw.rating ?? r.rating_average ?? r.rating;
  const reviews = raw.review_count ?? raw.reviewCount ?? raw.reviews ?? r.review_count ?? r.reviews;
  const type = raw.resource_type_name ?? raw.resourceType?.name ?? raw.resourceType?.id ?? r.resource_type_name ?? r.type ?? "FOOD_PANTRY";
  let tags = raw.tags ?? r.tags ?? raw.tag_ids ?? r.tag_ids ?? [];
  if (!Array.isArray(tags)) tags = [];
  const tagNames = tags.map((t) => (typeof t === "string" ? t : t?.name ?? "")).filter(Boolean);
  return { lat: Number(lat), lng: Number(lng), name, rating: rating != null ? Number(rating) : null, reviews: reviews != null ? Number(reviews) : null, type, tags: tagNames };
}

const viewConfigs = {
  operator: { center: [40.708, -74.005], zoom: 16, resource: "res_002" },
  donor: { center: [40.714, -73.998], zoom: 14 },
  // Center on Central Harlem cluster so all 5 underserved ZIPs are visible
  government: { center: [40.8116, -73.9465], zoom: 12 },
};

// Camera position per government tab
const GOV_TAB_CAMERA = {
  overview:    { center: [40.7128, -74.006],  zoom: 10 },
  underserved: { center: [40.8116, -73.9465], zoom: 12 },
  barriers:    { center: [40.8116, -73.9465], zoom: 11 },
  gaps:        { center: [40.8116, -73.9465], zoom: 11 },
};

// 3-tier poverty color: blue (low) -> orange (mid) -> red (high)
function povertyColor(rate) {
  if (rate > 0.3) return "#E24B4A";
  if (rate > 0.18) return "#EF9F27";
  return "#378ADD";
}

// 3-tier government resource color: green -> orange -> red
function ratingColorGov(rating) {
  if (!rating) return "#888780";
  if (rating >= 2.5) return "#1D9E75";
  if (rating >= 2.0) return "#EF9F27";
  return "#E24B4A";
}

export default function MapView({
  mode,
  censusLayer,
  onResourceSelect,
  onInvalidateRef,
  govData: govDataProp,
  resources: resourcesProp,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const overlaysRef = useRef([]);
  const censusOverlaysRef = useRef([]);
  const selectedZipOverlayRef = useRef(null);

  const effectiveGovData = govDataProp ?? defaultGovData;
  const effectiveResources = useMemo(() => {
    const list = resourcesProp ?? defaultResources;
    return list.map(normalizeResourceForMap).filter(Boolean);
  }, [resourcesProp]);

  const govDataRef = useRef(effectiveGovData);
  const resourcesForMapRef = useRef(effectiveResources);
  govDataRef.current = effectiveGovData;
  resourcesForMapRef.current = effectiveResources;

  // Active government tab — tracked via custom events from GovernmentPanel
  const [activeGovTab, setActiveGovTab] = useState("overview");
  const govTabRef = useRef("overview");
  // Stable ref to the latest render function (avoids stale-closure issues)
  const renderGovRef = useRef(null);

  const clear = useCallback(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    overlaysRef.current.forEach((o) => o.remove());
    overlaysRef.current = [];
  }, []);

  const clearCensus = useCallback(() => {
    censusOverlaysRef.current.forEach((o) => o.remove());
    censusOverlaysRef.current = [];
  }, []);

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [40.714, -73.998],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
      },
    ).addTo(map);

    mapRef.current = map;
    if (onInvalidateRef) {
      onInvalidateRef(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize({ animate: true });
        }
      });
    }

    return () => {
      if (onInvalidateRef) onInvalidateRef(() => {}); // clear stale ref before teardown
      map.remove();
      mapRef.current = null;
    };
  }, [onInvalidateRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    clear();

    const config = viewConfigs[mode];
    map.flyTo(config.center, config.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    const timer = setTimeout(() => {
      if (mode === "operator") {
        renderOperator(map, config.resource);
      } else if (mode === "donor") {
        renderDonor(map);
      } else {
        // Reset to overview tab when switching to government mode
        govTabRef.current = "overview";
        setActiveGovTab("overview");
        renderGovRef.current?.(map, "overview");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [mode, clear]);

  // When gov data or resources update in government mode, redraw the map
  useEffect(() => {
    if (mode !== "government") return;
    const map = mapRef.current;
    if (!map) return;
    clear();
    renderGovRef.current(map, govTabRef.current);
  }, [effectiveGovData, effectiveResources, clear]);

  function renderOperator(map, activeId) {
    defaultResources.forEach((r) => {
      const isActive = r.id === activeId;
      const color = ratingColor(r.rating);
      const isSoup = r.type === "SOUP_KITCHEN";
      const size = isActive ? 22 : 12;

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:${size}px;height:${size}px;
          background:${color};
          border:${isActive ? 3 : 2}px solid #fff;
          border-radius:${isSoup ? "3px" : "50%"};
          box-shadow:${
            isActive
              ? `0 0 0 5px ${color}30, 0 2px 8px rgba(0,0,0,.2)`
              : "0 1px 3px rgba(0,0,0,.15)"
          };
          opacity:${isActive ? 1 : 0.35};
          transition:all .3s;
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([r.lat, r.lng], { icon }).addTo(map);
      marker.on("click", () => {
        onResourceSelect(r);
        clear();
        renderOperator(map, r.id);
      });
      markersRef.current.push(marker);
    });

    const active = defaultResources.find((r) => r.id === activeId);
    if (active) onResourceSelect(active);
  }

  function renderDonor(map) {
    const fundedIds = donorPortfolio.fundedResourceIds;

    defaultResources.forEach((r) => {
      const isFunded = fundedIds.includes(r.id);
      const color = ratingColor(r.rating);
      const isSoup = r.type === "SOUP_KITCHEN";

      let html;
      let size;
      if (isFunded) {
        size = 24;
        html = `<div style="
          width:${size}px;height:${size}px;
          background:${color};
          border:3px solid #fff;
          border-radius:50%;
          box-shadow:0 0 0 5px ${color}30, 0 2px 8px rgba(0,0,0,.2);
          animation:pulse-ring 2s ease-out infinite;
        "></div>`;
      } else {
        size = 10;
        html = `<div style="
          width:${size}px;height:${size}px;
          background:${color};
          border:1.5px solid #fff;
          border-radius:${isSoup ? "2px" : "50%"};
          opacity:.2;
        "></div>`;
      }

      const icon = L.divIcon({
        className: "",
        html,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([r.lat, r.lng], { icon }).addTo(map);
      if (isFunded) {
        marker.bindPopup(
          `<div style="font-family:DM Sans,sans-serif;font-size:13px;line-height:1.5">
            <strong>${r.name}</strong><br/>
            <span style="color:${color}">★ ${r.rating}</span> &middot; ${r.waitTime} min wait &middot; ${r.reviews} reviews
          </div>`,
          { closeButton: false, offset: [0, -4] },
        );
      }
      markersRef.current.push(marker);
    });
  }

  // Keep renderGovRef pointing to the latest version of this function
  // so event listeners can call it without stale-closure issues.
  function renderGovernmentForTab(map, tab) {
    const govData = govDataRef.current;
    const resourcesList = resourcesForMapRef.current;
    const dimMarkers = tab === "underserved" || tab === "gaps";

    // ── 1) Underserved ZIP polygons ──
    (govData?.underservedZips ?? []).forEach((z) => {
      const fillColor = z.needScore >= 70 ? "#EF4444" : "#F59E0B";
      // Dim polygons when barriers tab is active (markers take focus there)
      const fillOpacity = tab === "barriers"
        ? 0.10
        : z.needScore >= 70 ? 0.28 : 0.22;
      const strokeOpacity = tab === "barriers" ? 0.25 : 0.6;

      const rect = L.rectangle(z.bounds, {
        color: fillColor,
        weight: 1.5,
        fillColor,
        fillOpacity,
        opacity: strokeOpacity,
      }).addTo(map);

      rect.bindPopup(
        `<div style="font-family:DM Sans,sans-serif;font-size:12px;line-height:1.7">
          <strong style="font-size:13px;">${z.neighborhood}</strong><br/>
          <span style="color:#DC2626;font-weight:600;">ZIP ${z.zip} · Underserved</span><br/>
          Poverty: <strong>${z.poverty.toFixed(1)}%</strong><br/>
          Food insecure: <strong>~${z.foodInsecurity.toLocaleString()}</strong><br/>
          Pantries: <strong>${z.pantryCount}</strong><br/>
          SNAP / pantry: <strong>${(z.snapPerPantry ?? 0).toLocaleString()}</strong><br/>
          Need score: <strong style="color:#DC2626">${z.needScore}</strong>
        </div>`,
        { closeButton: false },
      );
      overlaysRef.current.push(rect);

      // ZIP label in polygon center
      const center = [
        (z.bounds[0][0] + z.bounds[1][0]) / 2,
        (z.bounds[0][1] + z.bounds[1][1]) / 2,
      ];
      const labelIcon = L.divIcon({
        className: "",
        html: `<div style="
          padding:2px 7px;
          background:rgba(239,68,68,0.15);
          border:1.5px solid ${fillColor};
          border-radius:5px;
          font-size:10px;
          color:${fillColor};
          font-weight:700;
          font-family:DM Sans,sans-serif;
          white-space:nowrap;
          backdrop-filter:blur(2px);
        ">${z.zip}</div>`,
        iconSize: [48, 20],
        iconAnchor: [24, 10],
      });
      overlaysRef.current.push(L.marker(center, { icon: labelIcon }).addTo(map));
    });

    // ── 2) Zero-pantry ZIP outlines (shown on overview, underserved, gaps) ──
    if (tab !== "barriers") {
      (govData?.zeroPantryZips ?? []).forEach((z) => {
        const rect = L.rectangle(z.bounds, {
          color: "#DC2626",
          weight: 2,
          dashArray: "7, 5",
          fillOpacity: 0,
          opacity: 0.8,
        }).addTo(map);

        rect.bindPopup(
          `<div style="font-family:DM Sans,sans-serif;font-size:12px;line-height:1.7">
            <strong style="font-size:13px;">${z.neighborhood}</strong><br/>
            <span style="color:#DC2626;font-weight:700;">No pantries — ZIP ${z.zip}</span><br/>
            Population: <strong>${z.population.toLocaleString()}</strong><br/>
            Food insecure: <strong>~${z.foodInsecurity.toLocaleString()}</strong><br/>
            Poverty: <strong>${z.poverty.toFixed(1)}%</strong>
          </div>`,
          { closeButton: false },
        );
        overlaysRef.current.push(rect);

        const center = [
          (z.bounds[0][0] + z.bounds[1][0]) / 2,
          (z.bounds[0][1] + z.bounds[1][1]) / 2,
        ];
        const labelIcon = L.divIcon({
          className: "",
          html: `<div style="
            padding:2px 7px;
            background:rgba(255,255,255,0.9);
            border:1.5px dashed #DC2626;
            border-radius:5px;
            font-size:10px;
            color:#DC2626;
            font-weight:700;
            font-family:DM Sans,sans-serif;
            white-space:nowrap;
          ">No pantries · ${z.zip}</div>`,
          iconSize: [104, 20],
          iconAnchor: [52, 10],
        });
        overlaysRef.current.push(L.marker(center, { icon: labelIcon }).addTo(map));
      });
    }

    // ── 3) Resource pins — color/opacity varies by tab ──
    resourcesList.forEach((r) => {
      let color;
      if (tab === "barriers") {
        // Color by access barrier type
        const tags = (r.tags ?? []).map((t) => String(t).toLowerCase());
        if (tags.some((t) => t.includes("id required")))       color = "#EF4444";
        else if (tags.some((t) => t.includes("registration"))) color = "#F59E0B";
        else                                                     color = "#1D9E75";
      } else {
        color = ratingColorGov(r.rating);
      }

      const isSoup = r.type === "SOUP_KITCHEN";
      const size = 15;

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:${size}px;height:${size}px;
          background:${color};
          border:2.5px solid #fff;
          border-radius:${isSoup ? "3px" : "50%"};
          box-shadow:0 1px 5px rgba(0,0,0,0.28);
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([r.lat, r.lng], { icon }).addTo(map);
      // Dim markers when underserved/gaps tab is active
      if (dimMarkers) marker.setOpacity(0.25);

      marker.bindPopup(
        `<div style="font-family:DM Sans,sans-serif;font-size:12px;line-height:1.6">
          <strong style="font-size:13px;">${r.name}</strong><br/>
          ${r.rating ? `<span style="color:${color};font-weight:600;">★ ${r.rating}</span> &middot; ` : ""}
          ${r.reviews ? `${r.reviews} reviews` : "No reviews yet"}
          <br/><span style="color:#9c9588;font-size:11px;">${isSoup ? "Soup kitchen" : "Food pantry"}</span>
        </div>`,
        { closeButton: false },
      );
      markersRef.current.push(marker);
    });
  }

  // Keep renderGovRef current so the event listener always calls the latest version
  renderGovRef.current = renderGovernmentForTab;

  // ── Event listeners: gov:tabchange and gov:flyto ──
  useEffect(() => {
    const handleTabChange = (e) => {
      if (mode !== "government") return;
      const tab = e.detail?.tab ?? "overview";
      govTabRef.current = tab;
      setActiveGovTab(tab);
      const map = mapRef.current;
      if (!map) return;
      clear();
      renderGovRef.current(map, tab);
      // Fly to the canonical view for each tab
      const cam = GOV_TAB_CAMERA[tab] ?? GOV_TAB_CAMERA.overview;
      map.flyTo(cam.center, cam.zoom, { duration: 0.9, easeLinearity: 0.25 });
    };

    const handleFlyTo = (e) => {
      const { lat, lng, zoom } = e.detail ?? {};
      const map = mapRef.current;
      if (!map || lat == null || lng == null) return;

      map.flyTo([lat, lng], zoom ?? 14, { duration: 0.8, easeLinearity: 0.3 });

      // Clear any previous selected ZIP highlight
      if (selectedZipOverlayRef.current) {
        selectedZipOverlayRef.current.remove();
        selectedZipOverlayRef.current = null;
      }

      // Find nearest underserved or zero-pantry ZIP to the clicked point
      const gd = govDataRef.current ?? {};
      const candidateZips = [
        ...(gd.underservedZips ?? []),
        ...(gd.zeroPantryZips ?? []),
      ];

      const nearest = candidateZips.reduce(
        (best, z) => {
          const d = (z.lat - lat) * (z.lat - lat) + (z.lng - lng) * (z.lng - lng);
          return !best || d < best.d ? { z, d } : best;
        },
        null,
      );

      if (!nearest) return;

      const z = nearest.z;

      // Create a prominent marker at the center of the selected ZIP
      const size = 24;
      const color = z.needScore >= 70 ? "#EF4444" : "#F59E0B";
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:${size}px;height:${size}px;
          background:${color};
          border:3px solid #fff;
          border-radius:50%;
          box-shadow:0 0 0 6px ${color}35, 0 3px 12px rgba(0,0,0,.35);
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([z.lat, z.lng], { icon }).addTo(map);

      marker.bindPopup(
        `<div style="font-family:DM Sans,sans-serif;font-size:12px;line-height:1.7">
          <strong style="font-size:13px;">${z.neighborhood}</strong><br/>
          <span style="color:#DC2626;font-weight:600;">ZIP ${z.zip}</span><br/>
          Poverty: <strong>${z.poverty.toFixed(1)}%</strong><br/>
          Food insecure: <strong>~${z.foodInsecurity.toLocaleString()}</strong><br/>
          Pantries: <strong>${z.pantryCount}</strong><br/>
          SNAP / pantry: <strong>${(z.snapPerPantry ?? 0).toLocaleString()}</strong><br/>
          Need score: <strong style="color:#DC2626">${z.needScore}</strong>
        </div>`,
        { closeButton: false },
      );
      marker.openPopup();

      selectedZipOverlayRef.current = marker;
    };

    window.addEventListener("gov:tabchange", handleTabChange);
    window.addEventListener("gov:flyto", handleFlyTo);
    return () => {
      window.removeEventListener("gov:tabchange", handleTabChange);
      window.removeEventListener("gov:flyto", handleFlyTo);
    };
  }, [mode, clear]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    clearCensus();
    if (mode !== "government" || !censusLayer) return;

    const layerConfig = CENSUS_LAYERS[censusLayer];

    censusTracts.forEach((tract) => {
      const { color, opacity } = layerConfig.getStyle(tract);
      if (opacity === 0) return;

      const rect = L.rectangle(tract.bounds, {
        color,
        weight: 0.5,
        fillColor: color,
        fillOpacity: opacity,
        opacity: 0.3,
      }).addTo(map);

      const fieldValue = tract[layerConfig.field];
      rect.bindPopup(
        `<div style="font-family:DM Sans,sans-serif;font-size:12px;line-height:1.6">
          <strong>${tract.name}</strong><br/>
          ${layerConfig.label}: ${layerConfig.format(fieldValue)}<br/>
          Population: ${tract.population.toLocaleString()}
        </div>`,
        { closeButton: false },
      );
      censusOverlaysRef.current.push(rect);
    });
  }, [mode, censusLayer, clearCensus]);

  const activeLegend =
    mode === "government" && censusLayer
      ? CENSUS_LAYERS[censusLayer].legend
      : null;

  const governmentResourceLegend = [
    { label: "Good  ≥2.5", color: "#1D9E75", round: true },
    { label: "Low  2.0–2.5", color: "#EF9F27", round: true },
    { label: "Critical  <2.0", color: "#E24B4A", round: true },
    { label: "Soup kitchen", color: "#1D9E75", round: false },
  ];

  return (
    <div className="absolute inset-0">
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ background: "#f0ede7" }}
      />

      {/* Default legend when no census layer is selected — always bottom-left */}
      {mode === "government" && !activeLegend && (
        <div
          className="absolute bottom-5 left-4 z-[800] bg-white rounded-xl p-3.5 border border-sand-200"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
        >
          {activeGovTab === "barriers" ? (
            /* ── Barriers tab: colored by access barrier type ── */
            <>
              <div className="text-[9px] font-semibold text-sand-400 uppercase tracking-widest mb-2">
                Colored by access barrier
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "ID required",        color: "#EF4444", round: true },
                  { label: "Registration req.",  color: "#F59E0B", round: true },
                  { label: "No major barrier",   color: "#1D9E75", round: true },
                ].map(({ label, color, round }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-4 h-4 shrink-0 border-2 border-white"
                      style={{ backgroundColor: color, borderRadius: round ? "50%" : "3px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                    <span className="text-[10px] text-sand-600">{label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : activeGovTab === "gaps" ? (
            /* ── Gaps tab: colored by resource type ── */
            <>
              <div className="text-[9px] font-semibold text-sand-400 uppercase tracking-widest mb-2">
                Resource type
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Food pantry",       color: "#1D9E75", round: true },
                  { label: "Community fridge",  color: "#3B82F6", round: true },
                  { label: "Soup kitchen",      color: "#1D9E75", round: false },
                ].map(({ label, color, round }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-4 h-4 shrink-0 border-2 border-white"
                      style={{ backgroundColor: color, borderRadius: round ? "50%" : "3px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                    <span className="text-[10px] text-sand-600">{label}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 mt-2 border-t border-sand-100 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 rounded-sm shrink-0" style={{ background: "#EF4444", opacity: 0.35 }} />
                  <span className="text-[10px] text-sand-600">Underserved ZIP</span>
                </div>
              </div>
            </>
          ) : (
            /* ── Overview / Underserved tabs: poverty rate + resource markers ── */
            <>
              <div className="text-[9px] font-semibold text-sand-400 uppercase tracking-widest mb-2">
                Resources (by rating)
              </div>
              <div className="space-y-1.5">
                {governmentResourceLegend.map(({ label, color, round }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 shrink-0 border-2 border-white"
                      style={{
                        backgroundColor: color,
                        borderRadius: round ? "50%" : "3px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                    <span className="text-[10px] text-sand-600">{label}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 mt-2 border-t border-sand-100 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 rounded-sm shrink-0" style={{ background: "#EF4444", opacity: 0.4 }} />
                  <span className="text-[10px] text-sand-600">Underserved ZIP (need ≥70)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 rounded-sm shrink-0" style={{ background: "#F59E0B", opacity: 0.35 }} />
                  <span className="text-[10px] text-sand-600">Underserved ZIP (need 50–69)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3 rounded-sm shrink-0 border-2 border-dashed" style={{ borderColor: "#DC2626" }} />
                  <span className="text-[10px] text-sand-600">Zero-pantry zone</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Dynamic legend for selected census layer */}
      {activeLegend && (
        <div
          className="absolute bottom-5 left-4 z-[800] bg-white rounded-xl p-3.5 border border-sand-200"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
        >
          <div className="text-[9px] font-semibold text-sand-400 uppercase tracking-widest mb-2">
            {CENSUS_LAYERS[censusLayer].label}
          </div>
          <div className="space-y-1.5">
            {activeLegend.map(({ label, color, opacity }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-5 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: color, opacity }}
                />
                <span className="text-[10px] text-sand-500">{label}</span>
              </div>
            ))}
          </div>

          <div className="text-[9px] font-semibold text-sand-400 uppercase tracking-widest mt-3 mb-2">
            Resources
          </div>
          <div className="space-y-1.5">
            {governmentResourceLegend.map(({ label, color, round }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 shrink-0 border-2 border-white"
                  style={{
                    backgroundColor: color,
                    borderRadius: round ? "50%" : "3px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
                <span className="text-[10px] text-sand-600">{label}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 mt-2 border-t border-sand-100 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-3 rounded-sm shrink-0" style={{ background: "#EF4444", opacity: 0.4 }} />
              <span className="text-[10px] text-sand-600">Underserved ZIP (need ≥70)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-3 rounded-sm shrink-0" style={{ background: "#F59E0B", opacity: 0.35 }} />
              <span className="text-[10px] text-sand-600">Underserved ZIP (need 50–69)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-3 rounded-sm shrink-0 border-2 border-dashed" style={{ borderColor: "#DC2626" }} />
              <span className="text-[10px] text-sand-600">Zero-pantry zone</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
