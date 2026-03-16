"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
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
  // Open on the Bronx cluster where most underserved ZIPs are concentrated
  government: { center: [40.838, -73.917], zoom: 13 },
};

// Camera position per government tab — all centered on the Bronx/upper-Manhattan
// underserved cluster so the map is useful immediately without panning
const GOV_TAB_CAMERA = {
  overview:    { center: [40.838, -73.917], zoom: 12 },
  underserved: { center: [40.838, -73.917], zoom: 13 },
  barriers:    { center: [40.838, -73.917], zoom: 12 },
  gaps:        { center: [40.838, -73.917], zoom: 12 },
  alice:       { center: [40.838, -73.917], zoom: 12 },
  transit:     { center: [40.838, -73.917], zoom: 12 },
  reliability: { center: [40.838, -73.917], zoom: 12 },
  vulnerable:  { center: [40.838, -73.917], zoom: 12 },
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
  const zipLabelsRef = useRef([]);          // ZIP badge markers tracked separately so they can be toggled
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

  // ZIP label visibility toggle (government mode only)
  const [showZipLabels, setShowZipLabels] = useState(true);
  // Legend collapse state
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const showZipLabelsRef = useRef(true);
  showZipLabelsRef.current = showZipLabels;

  const clear = useCallback(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    overlaysRef.current.forEach((o) => o.remove());
    overlaysRef.current = [];
    zipLabelsRef.current.forEach((m) => m.remove());
    zipLabelsRef.current = [];
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
    effectiveResources.forEach((r) => {
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

    const active = effectiveResources.find((r) => r.id === activeId);
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
    // On underserved/gaps tabs the overlays are the focus — dim pins
    const dimMarkers = tab === "underserved" || tab === "gaps";

    // ── 1) Underserved ZIP polygons ──
    (govData?.underservedZips ?? []).forEach((z) => {
      const fillColor = z.needScore >= 70 ? "#EF4444" : "#F59E0B";
      const fillOpacity = tab === "barriers"
        ? 0.08
        : z.needScore >= 70 ? 0.14 : 0.10;
      const strokeOpacity = tab === "barriers" ? 0.20 : 0.75;

      const rect = L.rectangle(z.bounds, {
        color: fillColor,
        weight: 2,
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

      // ZIP label — two-row badge: coloured header with ZIP, white row with neighbourhood
      const center = [
        (z.bounds[0][0] + z.bounds[1][0]) / 2,
        (z.bounds[0][1] + z.bounds[1][1]) / 2,
      ];
      const labelIcon = L.divIcon({
        className: "",
        // translateX(-50%) centres the variable-width badge on the polygon centre
        html: `<div style="
          transform: translateX(-50%);
          display: inline-block;
          background: white;
          border-radius: 6px;
          border: 1.5px solid ${fillColor};
          box-shadow: 0 2px 8px rgba(0,0,0,0.22);
          overflow: hidden;
          pointer-events: none;
          font-family: 'DM Sans', system-ui, sans-serif;
          min-width: 68px;
        ">
          <div style="
            background: ${fillColor};
            color: white;
            font-size: 12px;
            font-weight: 800;
            padding: 4px 10px;
            letter-spacing: 0.05em;
            text-align: center;
          ">${z.zip}</div>
          <div style="
            color: #374151;
            font-size: 9px;
            font-weight: 500;
            padding: 3px 8px;
            text-align: center;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.3;
          ">${z.neighborhood || ""}</div>
        </div>`,
        iconAnchor: [0, 0],
      });
      const labelMarker = L.marker(center, { icon: labelIcon, zIndexOffset: 1000 });
      if (showZipLabelsRef.current) labelMarker.addTo(map);
      zipLabelsRef.current.push(labelMarker);
    });

    // ── 2) Zero-pantry ZIP outlines ──
    if (tab !== "barriers") {
      (govData?.zeroPantryZips ?? []).forEach((z) => {
        const rect = L.rectangle(z.bounds, {
          color: "#DC2626",
          weight: 2,
          dashArray: "7, 5",
          fillOpacity: 0,
          opacity: 0.75,
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
            transform: translateX(-50%);
            display: inline-block;
            background: white;
            border-radius: 6px;
            border: 1.5px dashed #DC2626;
            box-shadow: 0 2px 8px rgba(0,0,0,0.18);
            overflow: hidden;
            pointer-events: none;
            font-family: 'DM Sans', system-ui, sans-serif;
            min-width: 68px;
          ">
            <div style="
              background: #FEE2E2;
              color: #991B1B;
              font-size: 12px;
              font-weight: 800;
              padding: 4px 10px;
              letter-spacing: 0.05em;
              text-align: center;
              border-bottom: 1px dashed #FECACA;
            ">${z.zip}</div>
            <div style="
              color: #DC2626;
              font-size: 9px;
              font-weight: 600;
              padding: 3px 8px;
              text-align: center;
              white-space: nowrap;
              line-height: 1.3;
            ">No pantries</div>
          </div>`,
          iconAnchor: [0, 0],
        });
        const zeroPantryLabel = L.marker(center, { icon: labelIcon, zIndexOffset: 900 });
        if (showZipLabelsRef.current) zeroPantryLabel.addTo(map);
        zipLabelsRef.current.push(zeroPantryLabel);
      });
    }

    // ── 3) Resource pins — clustered for performance and readability ──
    // Dimmed tabs (underserved, gaps) get transparent direct markers so the
    // zone overlays take visual precedence.  All other tabs use a cluster group
    // so hundreds of nearby pins collapse into a single readable badge.
    const clusterGroup = dimMarkers ? null : L.markerClusterGroup({
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      animate: true,
      disableClusteringAtZoom: 15,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count >= 50 ? 40 : count >= 10 ? 34 : 28;
        const bg   = count >= 50 ? "#DC2626" : count >= 10 ? "#D97706" : "#2D6A4F";
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;
            background:${bg};
            color:#fff;
            border:2.5px solid #fff;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:${count >= 100 ? 10 : 11}px;
            font-weight:700;
            font-family:'DM Sans',system-ui,sans-serif;
            box-shadow:0 2px 8px rgba(0,0,0,0.30);
          ">${count}</div>`,
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    resourcesList.forEach((r) => {
      let color;
      if (tab === "barriers") {
        const tags = (r.tags ?? []).map((t) => String(t).toLowerCase());
        if (tags.some((t) => t.includes("id required")))       color = "#EF4444";
        else if (tags.some((t) => t.includes("registration"))) color = "#F59E0B";
        else                                                     color = "#1D9E75";
      } else {
        color = ratingColorGov(r.rating);
      }

      const isSoup = r.type === "SOUP_KITCHEN";
      const size = 12;

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:${size}px;height:${size}px;
          background:${color};
          border:2px solid #fff;
          border-radius:${isSoup ? "3px" : "50%"};
          box-shadow:0 1px 4px rgba(0,0,0,0.30);
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const popup = `<div style="font-family:DM Sans,sans-serif;font-size:12px;line-height:1.6">
        <strong style="font-size:13px;">${r.name}</strong><br/>
        ${r.rating ? `<span style="color:${color};font-weight:600;">★ ${r.rating}</span> &middot; ` : ""}
        ${r.reviews ? `${r.reviews} reviews` : "No reviews yet"}
        <br/><span style="color:#9c9588;font-size:11px;">${isSoup ? "Soup kitchen" : "Food pantry"}</span>
      </div>`;

      if (dimMarkers) {
        // Place directly on map at low opacity — don't cluster
      const marker = L.marker([r.lat, r.lng], { icon }).addTo(map);
        marker.setOpacity(0.20);
        marker.bindPopup(popup, { closeButton: false });
      markersRef.current.push(marker);
      } else {
        const marker = L.marker([r.lat, r.lng], { icon });
        marker.bindPopup(popup, { closeButton: false });
        clusterGroup.addLayer(marker);
      }
    });

    if (clusterGroup) {
      clusterGroup.addTo(map);
      // Track in overlaysRef so clear() removes it cleanly
      overlaysRef.current.push(clusterGroup);
    }
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

  // Show / hide ZIP badge labels whenever the toggle changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== "government") return;
    zipLabelsRef.current.forEach((m) => {
      if (showZipLabels) {
        m.addTo(map);
      } else {
        m.remove();
      }
    });
  }, [showZipLabels, mode]);

  /* DISABLED: census overlay uses mock data — restore when real census API is available
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
  */

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

      {/* ZIP label toggle — only visible in government mode */}
      {mode === "government" && (
        <button
          onClick={() => setShowZipLabels((v) => !v)}
          title={showZipLabels ? "Hide ZIP labels" : "Show ZIP labels"}
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 900,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: showZipLabels ? "#2D6A4F" : "rgba(255,255,255,0.96)",
            color: showZipLabels ? "#fff" : "#374151",
            border: `1.5px solid ${showZipLabels ? "#2D6A4F" : "#D1D5DB"}`,
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transition: "background 0.15s, color 0.15s, border-color 0.15s",
            userSelect: "none",
          }}
        >
          {/* Tag / label icon */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 14, height: 14, flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
          </svg>
          {showZipLabels ? "Hide ZIP labels" : "Show ZIP labels"}
        </button>
      )}

      {/* Default legend when no census layer is selected — bottom-right, collapsible */}
      {mode === "government" && !activeLegend && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 12,
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.97)",
            borderRadius: 10,
            padding: legendCollapsed ? "9px 14px" : "12px 14px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
            fontSize: 11,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            minWidth: legendCollapsed ? 0 : 160,
            maxWidth: 200,
            backdropFilter: "blur(4px)",
            transition: "padding 0.2s",
          }}
        >
          {/* ── Collapse toggle header ── */}
          <button
            onClick={() => setLegendCollapsed((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              marginBottom: legendCollapsed ? 0 : 8,
              gap: 20,
            }}
          >
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#6B7280",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>
              Legend
            </span>
            {/* Chevron — points up when expanded, down when collapsed */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="#9CA3AF"
              style={{ width: 12, height: 12, flexShrink: 0, transform: legendCollapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* ── Legend body — hidden when collapsed ── */}
          {!legendCollapsed && (
            activeGovTab === "barriers" ? (
              <>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #F3F4F6" }}>
                  Colored by access barrier
                </div>
                <div>
                  {[
                    { label: "ID required",        color: "#EF4444", round: true },
                    { label: "Registration req.",  color: "#F59E0B", round: true },
                    { label: "No major barrier",   color: "#1D9E75", round: true },
                  ].map(({ label, color, round }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 11, color: "#374151" }}>
                      <div style={{ width: 16, height: 16, backgroundColor: color, borderRadius: round ? "50%" : "3px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", flexShrink: 0, border: "2px solid white" }} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : activeGovTab === "gaps" ? (
              <>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #F3F4F6" }}>
                  Resource type
                </div>
                <div>
                  {[
                    { label: "Food pantry",       color: "#1D9E75", round: true },
                    { label: "Community fridge",  color: "#3B82F6", round: true },
                    { label: "Soup kitchen",      color: "#1D9E75", round: false },
                  ].map(({ label, color, round }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 11, color: "#374151" }}>
                      <div style={{ width: 16, height: 16, backgroundColor: color, borderRadius: round ? "50%" : "3px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", flexShrink: 0, border: "2px solid white" }} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: "#F3F4F6", margin: "7px 0" }} />
                <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>Coverage zones</div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 11, color: "#374151" }}>
                  <div style={{ width: 20, height: 12, borderRadius: 2, background: "#EF4444", opacity: 0.35, flexShrink: 0 }} />
                  <span>Underserved ZIP</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #F3F4F6" }}>
                  Resources (by rating)
                </div>
                <div>
                  {governmentResourceLegend.map(({ label, color, round }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 11, color: "#374151" }}>
                      <div style={{ width: 16, height: 16, backgroundColor: color, borderRadius: round ? "50%" : "3px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", flexShrink: 0, border: "2px solid white" }} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: "#F3F4F6", margin: "7px 0" }} />
                <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>Coverage zones</div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 11, color: "#374151" }}>
                  <div style={{ width: 20, height: 12, borderRadius: 2, background: "#EF4444", opacity: 0.4, flexShrink: 0 }} />
                  <span>Underserved ZIP (need ≥70)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 11, color: "#374151" }}>
                  <div style={{ width: 20, height: 12, borderRadius: 2, background: "#F59E0B", opacity: 0.35, flexShrink: 0 }} />
                  <span>Underserved ZIP (need 50–69)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 11, color: "#374151" }}>
                  <div style={{ width: 20, height: 12, borderRadius: 2, border: "2px dashed #DC2626", flexShrink: 0 }} />
                  <span>Zero-pantry zone</span>
                </div>
              </>
            )
          )}
        </div>
      )}

      {/* Dynamic legend for selected census layer */}
      {activeLegend && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 12,
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.97)",
            borderRadius: 10,
            padding: legendCollapsed ? "9px 14px" : "12px 14px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
            fontSize: 11,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            minWidth: legendCollapsed ? 0 : 160,
            maxWidth: 200,
            backdropFilter: "blur(4px)",
            transition: "padding 0.2s",
          }}
        >
          <button
            onClick={() => setLegendCollapsed((v) => !v)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: legendCollapsed ? 0 : 8, gap: 20 }}
          >
            <span style={{ fontSize: 9, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              Legend
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="#9CA3AF"
              style={{ width: 12, height: 12, flexShrink: 0, transform: legendCollapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {!legendCollapsed && (
            <>
              <div>
                {activeLegend.map(({ label, color, opacity }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 11, color: "#374151" }}>
                    <div style={{ width: 20, height: 12, borderRadius: 2, backgroundColor: color, opacity, flexShrink: 0 }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: "#F3F4F6", margin: "7px 0" }} />
              <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>
                Resources
              </div>
              <div>
                {governmentResourceLegend.map(({ label, color, round }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 11, color: "#374151" }}>
                    <div style={{ width: 16, height: 16, backgroundColor: color, borderRadius: round ? "50%" : "3px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", flexShrink: 0, border: "2px solid white" }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: "#F3F4F6", margin: "7px 0" }} />
              <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>
                Coverage zones
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 11, color: "#374151" }}>
                <div style={{ width: 20, height: 12, borderRadius: 2, background: "#EF4444", opacity: 0.25, flexShrink: 0 }} />
                <span>Underserved ZIP (need ≥70)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 11, color: "#374151" }}>
                <div style={{ width: 20, height: 12, borderRadius: 2, background: "#F59E0B", opacity: 0.20, flexShrink: 0 }} />
                <span>Underserved ZIP (need 50–69)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, fontSize: 11, color: "#374151" }}>
                <div style={{ width: 20, height: 12, borderRadius: 2, border: "2px dashed #DC2626", flexShrink: 0 }} />
                <span>Zero-pantry zone</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
