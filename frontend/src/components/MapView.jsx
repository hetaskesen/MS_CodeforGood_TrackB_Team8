"use client";

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { resources, censusTracts, donorPortfolio } from "@/lib/mockData";
import { ratingColor, povertyOpacity } from "@/lib/helpers";
import { CENSUS_LAYERS } from "@/lib/constants";

const viewConfigs = {
  operator: { center: [40.708, -74.005], zoom: 16, resource: "res_002" },
  donor: { center: [40.714, -73.998], zoom: 14 },
  government: { center: [40.712, -73.998], zoom: 13.5 },
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
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const overlaysRef = useRef([]);
  const censusOverlaysRef = useRef([]);

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
        renderGovernment(map);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [mode, clear]);

  function renderOperator(map, activeId) {
    resources.forEach((r) => {
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

    const active = resources.find((r) => r.id === activeId);
    if (active) onResourceSelect(active);
  }

  function renderDonor(map) {
    const fundedIds = donorPortfolio.fundedResourceIds;

    resources.forEach((r) => {
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

  function renderGovernment(map) {
    // 1) Base choropleth layer for poverty.
    censusTracts.forEach((tract) => {
      const color = povertyColor(tract.povertyRate);
      const opacity = povertyOpacity(tract.povertyRate);

      const rect = L.rectangle(tract.bounds, {
        color,
        weight: 0,
        fillColor: color,
        fillOpacity: Math.max(0.2, opacity * 0.65),
        opacity: 0,
      }).addTo(map);

      rect.bindPopup(
        `<div style="font-family:DM Sans,sans-serif;font-size:12px;line-height:1.7">
          <strong style="font-size:13px;">${tract.name}</strong><br/>
          <span style="color:${color};font-weight:600;">Poverty: ${Math.round(tract.povertyRate * 100)}%</span><br/>
          Population: ${tract.population.toLocaleString()}<br/>
          Median income: $${tract.medianIncome.toLocaleString()}
          ${tract.isGapZone ? '<br/><span style="color:#E24B4A;font-weight:700;">Gap zone - no resources nearby</span>' : ""}
        </div>`,
        { closeButton: false },
      );
      overlaysRef.current.push(rect);
    });

    // 2) Purple dashed overlays to highlight gap zones.
    censusTracts
      .filter((t) => t.isGapZone)
      .forEach((t) => {
        const gapRect = L.rectangle(t.bounds, {
          color: "#7C3AED",
          weight: 2,
          dashArray: "6, 4",
          fillColor: "#7C3AED",
          fillOpacity: 0.05,
          opacity: 0.7,
        }).addTo(map);
        overlaysRef.current.push(gapRect);

        const center = [
          (t.bounds[0][0] + t.bounds[1][0]) / 2,
          (t.bounds[0][1] + t.bounds[1][1]) / 2,
        ];
        const labelIcon = L.divIcon({
          className: "",
          html: `<div style="
            padding:3px 10px;
            background:rgba(124,58,237,0.12);
            border:1.5px dashed #7C3AED;
            border-radius:6px;
            font-size:10px;
            color:#7C3AED;
            font-weight:700;
            font-family:DM Sans,sans-serif;
            white-space:nowrap;
            backdrop-filter:blur(2px);
          ">Gap zone</div>`,
          iconSize: [80, 24],
          iconAnchor: [40, 12],
        });
        const labelMarker = L.marker(center, { icon: labelIcon }).addTo(map);
        overlaysRef.current.push(labelMarker);
      });

    // 3) Government resource pins.
    resources.forEach((r) => {
      const color = ratingColorGov(r.rating);
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
      marker.bindPopup(
        `<div style="font-family:DM Sans,sans-serif;font-size:12px;line-height:1.6">
          <strong style="font-size:13px;">${r.name}</strong><br/>
          ${r.rating ? `<span style="color:${color};font-weight:600;">★ ${r.rating}</span> &middot; ` : ""}
          ${r.waitTime ? `${r.waitTime} min wait &middot; ` : ""}
          ${r.reviews ? `${r.reviews} reviews` : "No reviews yet"}
          <br/><span style="color:#9c9588;font-size:11px;">${isSoup ? "Soup kitchen" : "Food pantry"}</span>
        </div>`,
        { closeButton: false },
      );
      markersRef.current.push(marker);
    });
  }

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
    { label: "Good  >=2.5", color: "#1D9E75", round: true },
    { label: "Low  2.0-2.5", color: "#EF9F27", round: true },
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

      {/* Default legend when no census layer is selected */}
      {mode === "government" && !activeLegend && (
        <div
          className="absolute bottom-5 left-4 z-[800] bg-white rounded-xl p-3.5 border border-sand-200"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
        >
          <div className="text-[9px] font-semibold text-sand-400 uppercase tracking-widest mb-2">
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

          <div className="flex items-center gap-2 pt-2 mt-2 border-t border-sand-100">
            <div
              className="w-5 h-3 rounded-sm shrink-0 border-2 border-dashed"
              style={{ borderColor: "#7C3AED" }}
            />
            <span className="text-[10px] text-sand-600">Gap zone</span>
          </div>
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

          <div className="flex items-center gap-2 pt-2 mt-2 border-t border-sand-100">
            <div
              className="w-5 h-3 rounded-sm shrink-0 border-2 border-dashed"
              style={{ borderColor: "#7C3AED" }}
            />
            <span className="text-[10px] text-sand-600">Gap zone</span>
          </div>
        </div>
      )}
    </div>
  );
}
