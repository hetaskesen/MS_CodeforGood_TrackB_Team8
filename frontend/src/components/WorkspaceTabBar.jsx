"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { getTabTypeIcon } from "./Icons";

const MAX_LABEL_LEN = 20;

function truncate(label) {
  if (!label) return "";
  return label.length <= MAX_LABEL_LEN ? label : label.slice(0, MAX_LABEL_LEN - 1) + "…";
}

export default function WorkspaceTabBar({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onAddClick,
  tabBarRef,
  activeTabRef,
  addButtonRef,
}) {
  const scrollRef = useRef(null);
  const [hoveredTabId, setHoveredTabId] = useState(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 0);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    if (activeTabRef?.current && scrollRef.current) {
      activeTabRef.current.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
    const t = setTimeout(updateArrows, 100);
    return () => clearTimeout(t);
  }, [activeTabId, activeTabRef, updateArrows]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows);
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [updateArrows]);

  const scroll = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  return (
    <div
      ref={tabBarRef}
      style={{
        height: 44,
        background: "#F5F5F2",
        borderBottom: "1px solid #E5E5E0",
        padding: "0 16px",
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        overflow: "hidden",
      }}
    >
      {showLeftArrow && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Scroll tabs left"
          style={{
            width: 28,
            alignSelf: "center",
            flexShrink: 0,
            border: "none",
            background: "#E5E5E0",
            borderRadius: 6,
            color: "#2D6A4F",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 4,
          }}
        >
          ‹
        </button>
      )}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 0,
          overflowX: "auto",
          overflowY: "hidden",
          flex: "0 1 auto",
          minWidth: 0,
          maxWidth: "calc(100% - 120px)",
        }}
        className="workspace-tab-scroll"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              style={{
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => onTabSelect(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 44,
                  paddingLeft: 14,
                  paddingRight: tab.pinned ? 14 : 8,
                  border: "none",
                  borderRight: "1px solid transparent",
                  borderRadius: "8px 8px 0 0",
                  background: isActive ? "#fff" : tab.pinned ? "#EDF7ED" : "#F5F5F2",
                  color: isActive ? "#2D6A4F" : "#666",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  borderBottom: isActive ? "none" : "1px solid #E5E5E0",
                  transition: "background 0.15s, color 0.15s",
                  maxWidth: 200,
                }}
                onMouseEnter={(e) => {
                  setHoveredTabId(tab.id);
                  if (!isActive) e.currentTarget.style.background = "#EBEBE7";
                }}
                onMouseLeave={(e) => {
                  setHoveredTabId(null);
                  if (!isActive) e.currentTarget.style.background = tab.pinned ? "#EDF7ED" : "#F5F5F2";
                }}
              >
                <span style={{ display: "flex", flexShrink: 0, color: isActive ? "#2D6A4F" : "#888" }}>{getTabTypeIcon(tab.type, 14)}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {truncate(tab.label)}
                </span>
                {!tab.pinned && hoveredTabId === tab.id && (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTabClose(tab.id);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      fontSize: 14,
                      lineHeight: 1,
                      color: "#9CA3AF",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#E5E7EB";
                      e.currentTarget.style.color = "#374151";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#9CA3AF";
                    }}
                  >
                    ×
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {showRightArrow && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Scroll tabs right"
          style={{
            width: 28,
            alignSelf: "center",
            flexShrink: 0,
            border: "none",
            background: "#E5E5E0",
            borderRadius: 6,
            color: "#2D6A4F",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 4,
          }}
        >
          ›
        </button>
      )}

      <div ref={addButtonRef} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <button
          type="button"
          onClick={onAddClick}
          aria-label="Open new tab"
          style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "2px dashed #2D6A4F",
          background: "transparent",
          color: "#2D6A4F",
          fontSize: 18,
          lineHeight: 1,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 8,
          alignSelf: "center",
          flexShrink: 0,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#F0FDF4";
          e.currentTarget.style.borderStyle = "solid";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderStyle = "dashed";
        }}
        >
          +
        </button>
      </div>
    </div>
  );
}
