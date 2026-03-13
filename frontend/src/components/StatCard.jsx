"use client";

export default function StatCard({ label, value, delta, deltaLabel, color, large }) {
  const isPositive = delta > 0;
  const deltaColor =
    color === "inverse"
      ? isPositive ? "text-coral-400" : "text-leaf-600"
      : isPositive ? "text-leaf-600"  : "text-coral-400";

  return (
    <div className="bg-sand-50 rounded-xl p-4 border border-sand-100">
      <div className="text-[10px] text-sand-400 font-semibold uppercase tracking-wide leading-none mb-1.5">
        {label}
      </div>
      <div
        className={`${large ? "text-3xl" : "text-2xl"} font-bold leading-tight`}
        style={color && color !== "inverse" ? { color } : undefined}
      >
        {value}
      </div>
      {delta !== undefined && (
        <div className={`text-[11px] mt-1 font-medium ${deltaColor}`}>
          {isPositive ? "+" : ""}
          {delta}
          {deltaLabel ? ` ${deltaLabel}` : ""}
        </div>
      )}
    </div>
  );
}
