"use client";

const items = [
  { id: "operator",   label: "Pantry operator", icon: "🏪" },
  { id: "donor",      label: "Donor / funder",  icon: "💚" },
  { id: "government", label: "Government",       icon: "🏛" },
];

export default function NavRail({ activeMode, onModeChange }) {
  return (
    <div
      className="flex flex-col h-full bg-white border-r border-sand-100 shrink-0"
      style={{ width: 220 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4 border-b border-sand-100">
        <div className="w-8 h-8 rounded-lg bg-leaf-600 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1.5C5.5 4.5 3 6 3 9c0 2.8 2.2 5 5 5s5-2.2 5-5c0-3-2.5-4.5-5-7.5z"
              fill="white"
            />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-leaf-700 leading-tight">Lemontree</div>
          <div className="text-[10px] text-sand-400 leading-tight">Insights</div>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-2">
        <div className="text-[9px] font-bold text-sand-300 uppercase tracking-widest">
          Persona
        </div>
      </div>

      {/* Nav items */}
      <nav className="px-3 space-y-0.5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onModeChange(item.id)}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left
              text-sm transition-all duration-200 cursor-pointer border-none
              ${
                activeMode === item.id
                  ? "bg-leaf-600 text-white shadow-sm"
                  : "bg-transparent text-sand-500 hover:bg-sand-50 hover:text-sand-800"
              }
            `}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="px-5 py-5 border-t border-sand-100">
        <div className="text-[10px] text-sand-300 leading-relaxed">
          Powered by LemonTree
        </div>
        <div className="text-[10px] text-sand-300 mt-0.5">v1.0 · NYC Food Access</div>
      </div>
    </div>
  );
}
