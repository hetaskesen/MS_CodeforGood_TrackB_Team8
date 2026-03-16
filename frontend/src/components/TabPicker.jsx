"use client";

import { useEffect, useRef } from "react";
import { getTabTypeIcon, IconCheck } from "./Icons";

const BASE_TAB_OPTIONS = [
  { type: "explore", label: "Explore Resources" },
  { type: "report-builder", label: "Report Builder" },
  { type: "funding-simulator", label: "Funding Simulator" },
];

const ADMIN_TAB_OPTIONS = [
  ...BASE_TAB_OPTIONS,
  { type: "reviews-intelligence", label: "Feedback Analytics" },
];

export default function TabPicker({
  open,
  onClose,
  onSelect,
  tabs,
  activeTabId,
  anchorRef,
  activePersona,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const openTabTypes = tabs.map((t) => t.type);
  const NEW_TAB_OPTIONS = activePersona === "admin" ? ADMIN_TAB_OPTIONS : BASE_TAB_OPTIONS;

  const style = {
    position: "fixed",
    zIndex: 1100,
    width: 240,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
    overflow: "hidden",
  };

  if (anchorRef?.current) {
    const rect = anchorRef.current.getBoundingClientRect();
    style.top = rect.bottom + 8;
    style.left = rect.left;
  }

  return (
    <div ref={panelRef} style={style}>
      <div
        style={{
          padding: "12px 14px",
          fontSize: 11,
          fontWeight: 600,
          color: "#6B7280",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        Open a new tab
      </div>

      <div style={{ padding: "6px 0" }}>
        {NEW_TAB_OPTIONS.map((opt) => {
          const alreadyOpen = openTabTypes.includes(opt.type);
          const existingTab = tabs.find((t) => t.type === opt.type);
          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => {
                if (existingTab) {
                  onSelect(existingTab.id);
                } else {
                  onSelect(opt.type);
                }
                onClose();
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                border: "none",
                background: "transparent",
                color: alreadyOpen ? "#9CA3AF" : "#374151",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F0FDF4";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ color: alreadyOpen ? "#9CA3AF" : "#374151", display: "flex" }}>{getTabTypeIcon(opt.type, 15)}</span>
              {opt.label}
              {alreadyOpen && (
                <span style={{ marginLeft: "auto", color: "#2D6A4F", display: "flex" }}><IconCheck size={13} /></span>
              )}
            </button>
          );
        })}
      </div>

      {tabs.length > 0 && (
        <>
          <div
            style={{
              height: 1,
              background: "#E5E7EB",
              margin: "0 14px",
            }}
          />
          <div style={{ padding: "6px 0" }}>
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onSelect(tab.id);
                    onClose();
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 14px",
                    border: "none",
                    background: isActive ? "#F0FDF4" : "transparent",
                    color: isActive ? "#2D6A4F" : "#9CA3AF",
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "#F9FAFB";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ color: isActive ? "#2D6A4F" : "#9CA3AF", display: "flex" }}>{getTabTypeIcon(tab.type, 13)}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tab.label}
                  </span>
                  {isActive && <span style={{ marginLeft: "auto", color: "#2D6A4F", display: "flex" }}><IconCheck size={12} /></span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div
        style={{
          padding: "8px 14px",
          fontSize: 10,
          color: "#9CA3AF",
          borderTop: "1px solid #E5E7EB",
        }}
      >
        ⌘T open · ⌘W close · ⌘1-6 switch
      </div>
    </div>
  );
}
