"use client";

const modes = [
  { id: "operator", label: "Pantry operator", icon: "🏪" },
  { id: "donor", label: "Donor / funder", icon: "💚" },
  { id: "government", label: "Government", icon: "🏛" },
];

export default function ModeToggle({ activeMode, onModeChange }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex bg-white/95 backdrop-blur-sm rounded-xl border border-sand-200 shadow-sm overflow-hidden">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`
            px-5 py-2.5 text-sm font-medium transition-all duration-300 border-none cursor-pointer
            ${
              activeMode === mode.id
                ? "bg-leaf-600 text-sand-100"
                : "bg-transparent text-sand-500 hover:bg-sand-100 hover:text-sand-800"
            }
          `}
        >
          <span className="mr-1.5 text-xs">{mode.icon}</span>
          {mode.label}
        </button>
      ))}
    </div>
  );
}
