"use client";

const modes = [
  { id: "operator", label: "Pantry operator", icon: "" },
  { id: "donor", label: "Donor / funder", icon: "" },
  { id: "government", label: "Government", icon: "" },
];

export default function Navbar({
  activeMode,
  onModeChange,
  userName = "User",
}) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <nav
      style={{
        background: "var(--theme-navbar-bg, #FDE97A)",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "0 24px",
        height: "62px",
        flexShrink: 0,
        zIndex: 1000,
        position: "relative",
      }}
    >
      {/* LEFT — Logo + Wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <img
          src="https://www.foodhelpline.org/_next/static/media/logo.b8e851d7.svg"
          alt="Lemontree logo"
          style={{ height: "34px" }}
        />
        <img
          src="https://www.foodhelpline.org/_next/static/media/wordmark.483cff36.svg"
          alt="Lemontree"
          style={{ height: "20px", marginLeft: "-6px" }}
          onError={(e) => (e.target.style.display = "none")}
        />
      </div>

      {/* CENTER — Mode Toggles */}
      <div
        style={{
          display: "flex",
          gap: "3px",
          background: "var(--theme-surface-panel, #fff)",
          borderRadius: "10px",
          padding: "3px",
          boxShadow: "0 1px 4px rgb(var(--theme-shadow-rgb) / 0.08)",
        }}
      >
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: activeMode === mode.id ? 700 : 500,
              border: "none",
              cursor: "pointer",
              background:
                activeMode === mode.id
                  ? "var(--theme-navbar-active-pill, #FDE97A)"
                  : "transparent",
              color: "var(--theme-navbar-text, #3D2200)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              boxShadow:
                activeMode === mode.id
                  ? "0 1px 3px rgb(var(--theme-shadow-rgb) / 0.1)"
                  : "none",
              transition: "all 0.2s ease",
              fontFamily: "DM Sans, system-ui, sans-serif",
            }}
          >
            <span style={{ fontSize: "14px" }}>{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>

      {/* RIGHT — Name + Avatar + Sign out */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          justifyContent: "flex-end",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--theme-navbar-text, #3D2200)",
            whiteSpace: "nowrap",
          }}
        >
          {userName}
        </span>

        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "var(--theme-surface-panel, #fff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--theme-navbar-avatar-text, #a07800)",
            border: "2px solid rgb(var(--theme-shadow-rgb) / 0.08)",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>

        <button
          style={{
            fontSize: "12px",
            fontWeight: 600,
            padding: "7px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            border: "1.5px solid rgb(var(--theme-shadow-rgb) / 0.2)",
            background: "var(--theme-navbar-signout-bg, rgba(255,255,255,0.5))",
            color: "var(--theme-navbar-text, #3D2200)",
            fontFamily: "DM Sans, system-ui, sans-serif",
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
