"use client";

import { useState, useRef, useEffect } from "react";
import { getPersonaIcon } from "./Icons";

const PERSONAS = [
  { id: "pantry-operator", label: "Resource Operator" },
  { id: "donor", label: "Donor / Funder" },
  { id: "government", label: "Government" },
  { id: "admin", label: "Admin" },
];

export default function PersonaDropdown({ activePersona, onPersonaChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = PERSONAS.find((p) => p.id === activePersona) ?? PERSONAS[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          minWidth: 180,
          padding: "8px 14px 8px 16px",
          borderRadius: 9999,
          border: "2px solid #2D6A4F",
          background: open ? "#F0FDF4" : "#fff",
          color: "#2D6A4F",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => !open && (e.currentTarget.style.background = "#F0FDF4")}
        onMouseLeave={(e) => !open && (e.currentTarget.style.background = "#fff")}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "flex" }}>{getPersonaIcon(current.id, 15)}</span>
          {current.label}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2D6A4F"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 6,
            minWidth: "100%",
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
            padding: 6,
            zIndex: 1000,
          }}
        >
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              role="option"
              type="button"
              aria-selected={activePersona === p.id}
              onClick={() => {
                onPersonaChange(p.id);
                setOpen(false);
              }}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                background: activePersona === p.id ? "#F0FDF4" : "transparent",
                color: "#374151",
                fontSize: 13,
                fontWeight: activePersona === p.id ? 600 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "left",
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
              onMouseEnter={(e) => {
                if (activePersona !== p.id) e.currentTarget.style.background = "#F9FAFB";
              }}
              onMouseLeave={(e) => {
                if (activePersona !== p.id) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ display: "flex", color: activePersona === p.id ? "#2D6A4F" : "#6B7280" }}>{getPersonaIcon(p.id, 15)}</span>
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
