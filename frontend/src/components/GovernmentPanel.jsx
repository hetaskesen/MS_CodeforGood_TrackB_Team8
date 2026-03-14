"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { demandEstimates, censusTracts } from "@/lib/mockData";
import Footer from "./Footer";

// Simulated 6-months-ago gap zone count for trend indicator
const GAP_ZONES_6MO_AGO = 6;

export default function GovernmentPanel() {
  const totalPop     = censusTracts.reduce((s, t) => s + t.population, 0);
  const avgPoverty   =
    censusTracts.reduce((s, t) => s + t.povertyRate, 0) / censusTracts.length;
  const gapZones     = demandEstimates.filter((d) => d.gapScore > 0.5).length;
  const desertTracts = censusTracts.filter((t) => t.povertyRate > 0.4).length;

  const trendDelta     = gapZones - GAP_ZONES_6MO_AGO;
  const trendImproving = trendDelta < 0;
  const trendNeutral   = trendDelta === 0;

  const barData = demandEstimates.slice(0, 6).map((d) => ({
    name:     d.tract,
    gap:      Math.round(d.gapScore * 100),
    need:     d.estimatedNeed,
    capacity: d.pantryCapacity,
  }));

  function gapColor(score) {
    if (score >= 70) return "#E24B4A";
    if (score >= 40) return "#EF9F27";
    return "#1D9E75";
  }

  return (
    <div className="p-5">
      {/* ── Header + filters ── */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-sand-800">Coverage gap analysis</h3>
        <div className="flex gap-2">
          <select className="text-xs border border-sand-200 rounded-lg px-2.5 py-1.5 bg-white cursor-pointer text-sand-600">
            <option>All regions</option>
            <option>Bayview</option>
            <option>South West</option>
          </select>
          <select className="text-xs border border-sand-200 rounded-lg px-2.5 py-1.5 bg-white cursor-pointer text-sand-600">
            <option>Last 6 months</option>
            <option>Last year</option>
          </select>
        </div>
      </div>

      {/* ── Coverage summary ── */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="bg-sand-50 rounded-xl p-3.5 border border-sand-100">
          <div className="text-[9px] text-sand-400 font-semibold uppercase tracking-wide">Population</div>
          <div className="text-xl font-bold text-sand-800 mt-1">
            {(totalPop / 1000).toFixed(1)}k
          </div>
        </div>
        <div className="bg-sand-50 rounded-xl p-3.5 border border-sand-100">
          <div className="text-[9px] text-sand-400 font-semibold uppercase tracking-wide">Avg poverty</div>
          <div className="text-xl font-bold text-sand-800 mt-1">
            {Math.round(avgPoverty * 100)}%
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-3.5 border border-red-100">
          <div className="text-[9px] text-red-400 font-semibold uppercase tracking-wide">Gap zones</div>
          <div className="text-xl font-bold text-red-500 mt-1">{gapZones}</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-100">
          <div className="text-[9px] text-amber-500 font-semibold uppercase tracking-wide">High poverty</div>
          <div className="text-xl font-bold text-amber-500 mt-1">{desertTracts}</div>
        </div>
      </div>

      {/* ── Trend indicator ── */}
      <div
        className={`rounded-xl p-4 mb-4 flex items-start gap-3 border ${
          trendImproving
            ? "bg-leaf-50 border-leaf-100"
            : trendNeutral
            ? "bg-sand-50 border-sand-100"
            : "bg-red-50 border-red-100"
        }`}
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
            trendImproving ? "bg-leaf-100" : trendNeutral ? "bg-sand-100" : "bg-red-100"
          }`}
        >
          {trendImproving ? "📉" : trendNeutral ? "➡️" : "📈"}
        </div>
        <div>
          <div
            className={`text-xs font-semibold ${
              trendImproving ? "text-leaf-700" : trendNeutral ? "text-sand-700" : "text-red-700"
            }`}
          >
            Gap zones:{" "}
            {trendImproving
              ? `improving (−${Math.abs(trendDelta)} vs 6 months ago)`
              : trendNeutral
              ? "unchanged from 6 months ago"
              : `worsening (+${trendDelta} vs 6 months ago)`}
          </div>
          <div
            className={`text-[11px] mt-0.5 leading-relaxed ${
              trendImproving ? "text-leaf-600" : trendNeutral ? "text-sand-500" : "text-red-600"
            }`}
          >
            {trendImproving
              ? `Down from ${GAP_ZONES_6MO_AGO} critical areas to ${gapZones} today. South West remains highest-priority.`
              : trendNeutral
              ? `${gapZones} critical gap zones unchanged. Continued investment needed.`
              : `Up from ${GAP_ZONES_6MO_AGO} to ${gapZones} critical areas. Urgent intervention required.`}
          </div>
        </div>
      </div>

      {/* ── Demand vs supply bar chart ── */}
      <div className="bg-sand-50 rounded-xl p-4 mb-4 border border-sand-100">
        <div className="text-[11px] font-semibold text-sand-500 mb-3">
          Demand vs supply gap by area
        </div>
        <ResponsiveContainer width="100%" height={175}>
          <BarChart data={barData} layout="vertical">
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#9c9588" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10, fill: "#9c9588" }}
              width={72}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                background: "#fff",
                border: "1px solid #e8e4d8",
                borderRadius: 10,
              }}
              formatter={(val) => [`${val}%`, "Gap score"]}
            />
            <Bar dataKey="gap" radius={[0, 6, 6, 0]} barSize={13}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={gapColor(entry.gap)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Critical gap cards ── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-semibold text-sand-400 uppercase tracking-widest">
            Critical gaps
          </div>
          <button className="text-[10px] font-semibold text-leaf-600 hover:text-leaf-700 cursor-pointer border border-leaf-200 rounded-lg px-2.5 py-1 bg-leaf-50 hover:bg-leaf-100 transition-colors">
            Export report
          </button>
        </div>
        <div className="space-y-2.5">
          {demandEstimates
            .filter((d) => d.gapScore > 0.5)
            .map((d) => (
              <div
                key={d.tract}
                className="bg-red-50 rounded-xl p-4 border border-red-100"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="text-sm font-semibold text-red-800">{d.tract}</div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-red-100 text-red-600">
                    Gap: {Math.round(d.gapScore * 100)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-red-400">Population</span>
                    <span className="font-medium text-red-700">
                      {d.population.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-400">Poverty</span>
                    <span className="font-medium text-red-700">
                      {Math.round(d.povertyRate * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-400">Monthly need</span>
                    <span className="font-medium text-red-700">
                      {d.estimatedNeed} families
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-400">Capacity</span>
                    <span className="font-medium text-red-700">
                      {d.pantryCapacity || "None"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ── Methodology note ── */}
      <div className="bg-sand-50 rounded-xl p-4 mb-5 border border-sand-100">
        <div className="text-[11px] font-semibold text-sand-500 mb-1">
          How demand is estimated
        </div>
        <div className="text-[11px] text-sand-400 leading-relaxed">
          Monthly need = tract population × poverty rate × 15% USDA food
          assistance utilization rate. Gap score = (estimated need − current
          pantry capacity) / estimated need. Scores above 50% indicate critical
          underservice.
        </div>
      </div>

      {/* ── Export buttons ── */}
      <div className="grid grid-cols-2 gap-3">
        <button className="py-2.5 bg-leaf-600 text-white text-xs font-semibold rounded-xl hover:bg-leaf-700 transition-colors cursor-pointer">
          Export policy brief (PDF)
        </button>
        <button className="py-2.5 bg-white text-sand-700 text-xs font-semibold rounded-xl border border-sand-200 hover:bg-sand-50 transition-colors cursor-pointer">
          Download data (CSV)
        </button>
      </div>

      <div className="h-5" />
      <Footer />
    </div>
  );
}
