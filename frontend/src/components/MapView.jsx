"use client";

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  resources,
  censusTracts,
  donorPortfolio,
  ratingColor,
  povertyOpacity,
} from "@/lib/data";

const viewConfigs = {
  operator:   { center: [40.708, -74.005], zoom: 16, resource: "res_002" },
  donor:      { center: [40.714, -73.998], zoom: 14 },
  government: { center: [40.712, -73.998], zoom: 13.5 },
};

export default function MapView({ mode, onResourceSelect, onInvalidateRef }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const overlaysRef  = useRef([]);

  const clear = useCallback(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    overlaysRef.current.forEach((o) => o.remove());
    overlaysRef.current = [];
  }, []);

  // ── Initialize map once ──
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [40.714, -73.998],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // CartoDB Positron — light, muted, greyscale-leaning base style
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19, opacity: 0.9 }
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
      map.remove();
      mapRef.current = null;
    };
  }, [onInvalidateRef]);

  // ── Update when mode changes ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    clear();

    const config = viewConfigs[mode];
    map.flyTo(config.center, config.zoom, { duration: 1.2, easeLinearity: 0.25 });

    const timer = setTimeout(() => {
      if (mode === "operator") renderOperator(map, config.resource);
      else if (mode === "donor") renderDonor(map);
      else renderGovernment(map);
    }, 600);

    return () => clearTimeout(timer);
  }, [mode, clear]);

  // ── OPERATOR markers ──
  function renderOperator(map, activeId) {
    resources.forEach((r) => {
      const isActive = r.id === activeId;
      const color    = ratingColor(r.rating);
      const isSoup   = r.type === "SOUP_KITCHEN";
      const size     = isActive ? 22 : 12;

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:${size}px;height:${size}px;
          background:${color};
          border:${isActive ? 3 : 2}px solid #fff;
          border-radius:${isSoup ? "3px" : "50%"};
          box-shadow:${isActive
            ? `0 0 0 5px ${color}30, 0 2px 8px rgba(0,0,0,.2)`
            : "0 1px 3px rgba(0,0,0,.15)"};
          opacity:${isActive ? 1 : 0.35};
          transition:all .3s;
        "></div>`,
        iconSize:   [size, size],
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

  // ── DONOR markers ──
  function renderDonor(map) {
    const fundedIds = donorPortfolio.fundedResourceIds;

    resources.forEach((r) => {
      const isFunded = fundedIds.includes(r.id);
      const color    = ratingColor(r.rating);
      const isSoup   = r.type === "SOUP_KITCHEN";

      let html, size;
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
        iconSize:   [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([r.lat, r.lng], { icon }).addTo(map);

      if (isFunded) {
        marker.bindPopup(
          `<div style="font-family:DM Sans,sans-serif;font-size:13px;line-height:1.5">
            <strong>${r.name}</strong><br/>
            <span style="color:${color}">★ ${r.rating}</span> &middot; ${r.waitTime} min wait &middot; ${r.reviews} reviews
          </div>`,
          { closeButton: false, offset: [0, -4] }
        );
      }
      markersRef.current.push(marker);
    });
  }

  // ── GOVERNMENT overlays + markers ──
  function renderGovernment(map) {
    censusTracts.forEach((tract) => {
      const op    = povertyOpacity(tract.povertyRate);
      const color = tract.povertyRate > 0.35 ? "#E24B4A" : "#EF9F27";

      const rect = L.rectangle(tract.bounds, {
        color,
        weight:      0.5,
        fillColor:   color,
        fillOpacity: op,
        opacity:     0.3,
      }).addTo(map);

      rect.bindPopup(
        `<div style="font-family:DM Sans,sans-serif;font-size:12px;line-height:1.6">
          <strong>${tract.name}</strong><br/>
          Poverty: ${Math.round(tract.povertyRate * 100)}%<br/>
          Population: ${tract.population.toLocaleString()}<br/>
          Median income: $${tract.medianIncome.toLocaleString()}
          ${tract.isGapZone ? '<br/><span style="color:#E24B4A;font-weight:600">⚠ Gap zone — no resources</span>' : ""}
        </div>`,
        { closeButton: false }
      );
      overlaysRef.current.push(rect);
    });

    resources.forEach((r) => {
      const color  = ratingColor(r.rating);
      const isSoup = r.type === "SOUP_KITCHEN";

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:14px;height:14px;
          background:${color};
          border:2px solid #fff;
          border-radius:${isSoup ? "3px" : "50%"};
          box-shadow:0 1px 4px rgba(0,0,0,.2);
        "></div>`,
        iconSize:   [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([r.lat, r.lng], { icon }).addTo(map);
      marker.bindPopup(
        `<div style="font-family:DM Sans,sans-serif;font-size:12px;line-height:1.5">
          <strong>${r.name}</strong><br/>
          <span style="color:${color}">★ ${r.rating}</span> &middot; ${r.waitTime} min &middot; ${r.reviews} reviews
        </div>`,
        { closeButton: false }
      );
      markersRef.current.push(marker);
    });

    censusTracts
      .filter((t) => t.isGapZone)
      .forEach((t) => {
        const center = [
          (t.bounds[0][0] + t.bounds[1][0]) / 2,
          (t.bounds[0][1] + t.bounds[1][1]) / 2,
        ];
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            padding:3px 10px;
            background:#E24B4A18;
            border:1.5px dashed #E24B4A;
            border-radius:6px;
            font-size:10px;color:#E24B4A;font-weight:600;
            font-family:DM Sans,sans-serif;
            white-space:nowrap;
          ">Gap zone</div>`,
          iconSize:   [80, 24],
          iconAnchor: [40, 12],
        });
        const marker = L.marker(center, { icon }).addTo(map);
        overlaysRef.current.push(marker);
      });
  }

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0" style={{ background: "#f0ede7" }} />

      {/* Heatmap legend — government view only */}
      {mode === "government" && (
        <div
          className="absolute bottom-5 left-4 z-[800] bg-white/95 backdrop-blur-sm rounded-xl p-3.5 border border-sand-200"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
        >
          <div className="text-[9px] font-semibold text-sand-400 uppercase tracking-widest mb-2">
            Poverty intensity
          </div>
          <div className="space-y-1.5">
            {[
              { label: "High  >35%",  color: "#E24B4A", opacity: 0.55 },
              { label: "Med  20–35%", color: "#EF9F27", opacity: 0.55 },
              { label: "Low  <20%",  color: "#EF9F27", opacity: 0.25 },
            ].map(({ label, color, opacity }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-5 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: color, opacity }}
                />
                <span className="text-[10px] text-sand-500">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1.5 mt-0.5 border-t border-sand-100">
              <div
                className="w-5 h-3 rounded-sm shrink-0 border-2 border-dashed"
                style={{ borderColor: "#E24B4A" }}
              />
              <span className="text-[10px] text-sand-500">Gap zone</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
