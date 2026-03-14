import { CENSUS_LAYERS } from "@/lib/constants";

const ICONS = {
  poverty: "◈",
  income: "◉",
  population: "⊕",
  foodDesert: "◬",
};

export default function CensusLayerControls({ active, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-sand-400 mb-1">
        Census overlay
      </p>
      {Object.keys(CENSUS_LAYERS).map((key) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(isActive ? null : key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              isActive
                ? "bg-lemon-500 text-black font-medium"
                : "text-sand-600 hover:bg-sand-100"
            }`}
          >
            <span className="text-base">{ICONS[key]}</span>
            {CENSUS_LAYERS[key].label}
          </button>
        );
      })}
    </div>
  );
}
