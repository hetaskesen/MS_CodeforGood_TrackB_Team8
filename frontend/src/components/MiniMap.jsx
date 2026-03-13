"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ratingColor } from "@/lib/data";

export default function MiniMap({ lat, lng, name, rating, address }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl:       false,
      attributionControl: false,
      dragging:          false,
      scrollWheelZoom:   false,
      doubleClickZoom:   false,
      touchZoom:         false,
      keyboard:          false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19, opacity: 0.92 }
    ).addTo(map);

    const color = ratingColor(rating);

    const icon = L.divIcon({
      className: "",
      html: `<div style="
        width: 20px; height: 20px;
        background: ${color};
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 0 5px ${color}35, 0 2px 10px rgba(0,0,0,.25);
      "></div>`,
      iconSize:   [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker([lat, lng], { icon }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, rating]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Address chip overlaid at the bottom */}
      {address && (
        <div className="absolute bottom-3 left-3 right-3 z-[400] pointer-events-none">
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm border border-sand-100">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: ratingColor(rating) }}
            />
            <span className="text-[11px] font-medium text-sand-700 truncate">
              {name}
            </span>
            <span className="text-[10px] text-sand-400 truncate hidden sm:block">
              · {address}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
