// Centralised SVG icon library — stroke-based, currentColor, no fill by default.
// All icons use viewBox="0 0 24 24".

const BASE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconSearch({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...BASE} style={style}>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </svg>
  );
}

export function IconBarChart({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...BASE} style={style}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

export function IconTrendingUp({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...BASE} style={style}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

export function IconShield({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...BASE} style={style}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function IconStore({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...BASE} style={style}>
      <path d="M3 3h18l-2 9H5L3 3z" />
      <path d="M3 3l-1-2h-1" />
      <path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
      <line x1="9" y1="12" x2="9" y2="21" />
      <line x1="15" y1="12" x2="15" y2="21" />
    </svg>
  );
}

export function IconHeart({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...BASE} style={style}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function IconLandmark({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...BASE} style={style}>
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  );
}

export function IconSettings({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...BASE} style={style}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function IconSparkles({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...BASE} style={style}>
      <path d="M12 3 10.09 8.26a2 2 0 0 1-1.27 1.27L3 12l5.82 1.91a2 2 0 0 1 1.27 1.27L12 21l1.91-5.82a2 2 0 0 1 1.27-1.27L21 12l-5.82-1.91a2 2 0 0 1-1.27-1.27Z" />
      <path d="M5 3v3" />
      <path d="M3 5h3" />
      <path d="M19 18v3" />
      <path d="M17 20h3" />
    </svg>
  );
}

export function IconTrash({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...BASE} style={style}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

export function IconFile({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...BASE} style={style}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}

export function IconLink({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...BASE} style={style}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function IconDownload({ size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...BASE} style={style}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function IconCheck({ size = 14, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...BASE} style={style}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Lookup helpers ─────────────────────────────────────────────────────────────

export function getTabTypeIcon(type, size = 14) {
  switch (type) {
    case "dashboard-pantry":   return <IconStore size={size} />;
    case "dashboard-donor":    return <IconHeart size={size} />;
    case "dashboard-government": return <IconLandmark size={size} />;
    case "explore":            return <IconSearch size={size} />;
    case "report-builder":     return <IconBarChart size={size} />;
    case "funding-simulator":  return <IconTrendingUp size={size} />;
    case "reviews-intelligence": return <IconShield size={size} />;
    default:                   return <IconBarChart size={size} />;
  }
}

export function getPersonaIcon(id, size = 15) {
  switch (id) {
    case "pantry-operator": return <IconStore size={size} />;
    case "donor":           return <IconHeart size={size} />;
    case "government":      return <IconLandmark size={size} />;
    case "admin":           return <IconSettings size={size} />;
    default:                return <IconStore size={size} />;
  }
}
