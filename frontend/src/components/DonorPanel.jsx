"use client";

import { useMemo } from "react";
import Footer from "./Footer";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { resources, donorPortfolio } from "@/lib/mockData";
import { ratingColor } from "@/lib/helpers";

export default function DonorPanel() {
  const dp = donorPortfolio;

  const fundedResources = useMemo(
    () => resources.filter((r) => dp.fundedResourceIds.includes(r.id)),
    [dp.fundedResourceIds]
  );

  const unfundedHighNeed = useMemo(
    () =>
      resources
        .filter((r) => !dp.fundedResourceIds.includes(r.id))
        .sort((a, b) => a.rating - b.rating)
        .slice(0, 2),
    [dp.fundedResourceIds]
  );

  const trendData = useMemo(() => {
    const months = fundedResources[0]?.monthLabels || [];
    return months.map((m, i) => {
      const avgRating =
        fundedResources.reduce((s, r) => s + r.ratingTrend[i], 0) /
        fundedResources.length;
      return { month: m, rating: +avgRating.toFixed(2) };
    });
  }, [fundedResources]);

  return (
    <div className="p-8">

      {/* ── Row 1 — Hero + 3 impact cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {/* Hero */}
        <div className="bg-white rounded-2xl p-6 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide mb-3">
            Total families reached
          </div>
          <div>
            <div className="text-5xl font-bold text-leaf-600 leading-none">
              {dp.impactStats.familiesReached.toLocaleString()}
            </div>
            <div className="text-sm text-sand-500 mt-2 leading-snug">
              across {fundedResources.length} funded locations
            </div>
            <div className="text-xs text-sand-400 mt-0.5">Sep 2025 – Mar 2026</div>
          </div>
        </div>

        {/* +18% Satisfaction */}
        <div className="bg-leaf-50 rounded-2xl p-6 border border-leaf-100 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-leaf-500 uppercase tracking-wide">
            Satisfaction improvement
          </div>
          <div>
            <div className="text-4xl font-bold text-leaf-600 leading-none mt-3">
              +{Math.round(dp.impactStats.satisfactionDelta * 100)}%
            </div>
            <div className="text-xs text-leaf-500 mt-2">vs 6 months ago</div>
          </div>
        </div>

        {/* -22% Wait */}
        <div className="bg-leaf-50 rounded-2xl p-6 border border-leaf-100 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-leaf-500 uppercase tracking-wide">
            Wait time reduction
          </div>
          <div>
            <div className="text-4xl font-bold text-leaf-600 leading-none mt-3">
              {Math.abs(Math.round(dp.impactStats.waitTimeDelta * 100))}%
            </div>
            <div className="text-xs text-leaf-500 mt-2">shorter average waits</div>
          </div>
        </div>

        {/* +3 Resources */}
        <div className="bg-sand-50 rounded-2xl p-6 border border-sand-100 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide">
            New resources funded
          </div>
          <div>
            <div className="text-4xl font-bold text-sand-800 leading-none mt-3">
              +{dp.impactStats.resourcesAdded}
            </div>
            <div className="text-xs text-sand-400 mt-2">new locations added</div>
          </div>
        </div>
      </div>

      {/* ── Row 2 — Before/After + Satisfaction trend ── */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Before/After */}
        <div className="bg-white rounded-2xl p-6">
          <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide mb-5">
            Before &amp; after comparison
          </div>
          <div className="grid grid-cols-[1fr_28px_1fr] items-start gap-0">
            <div>
              <div className="text-[10px] font-semibold text-sand-300 uppercase tracking-wide mb-3">
                6 months ago
              </div>
              <div className="space-y-3">
                <CompareRow label="Avg rating" value={dp.beforeMetrics.avgRating} />
                <CompareRow label="Avg wait" value={`${dp.beforeMetrics.avgWait} min`} />
                <CompareRow label="Got help" value={`${Math.round(dp.beforeMetrics.gotHelpRate * 100)}%`} />
                <CompareRow label="Locations" value={dp.beforeMetrics.resourceCount} />
              </div>
            </div>
            <div className="text-center text-sand-200 text-lg pt-6">→</div>
            <div>
              <div className="text-[10px] font-semibold text-leaf-400 uppercase tracking-wide mb-3">
                Current
              </div>
              <div className="space-y-3">
                <CompareRow label="Avg rating" value={dp.currentMetrics.avgRating} good />
                <CompareRow label="Avg wait" value={`${dp.currentMetrics.avgWait} min`} good />
                <CompareRow label="Got help" value={`${Math.round(dp.currentMetrics.gotHelpRate * 100)}%`} good />
                <CompareRow label="Locations" value={dp.currentMetrics.resourceCount} good />
              </div>
            </div>
          </div>
        </div>

        {/* Satisfaction trend */}
        <div className="bg-white rounded-2xl p-6">
          <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide mb-5">
            Avg satisfaction — funded locations
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#9c9588" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "#9c9588" }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#1D9E75"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#1D9E75" }}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  background: "#fff",
                  border: "1px solid #e8e4d8",
                  borderRadius: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,.06)",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 3 — Funded locations table ── */}
      <div className="bg-white rounded-2xl overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-sand-50">
          <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide">
            Your funded locations
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-sand-50">
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-sand-300 uppercase tracking-wide">
                Location
              </th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-sand-300 uppercase tracking-wide">
                Address
              </th>
              <th className="px-6 py-3 text-right text-[10px] font-semibold text-sand-300 uppercase tracking-wide">
                Rating
              </th>
              <th className="px-6 py-3 text-right text-[10px] font-semibold text-sand-300 uppercase tracking-wide">
                Wait time
              </th>
              <th className="px-6 py-3 text-right text-[10px] font-semibold text-sand-300 uppercase tracking-wide">
                Got help
              </th>
            </tr>
          </thead>
          <tbody>
            {fundedResources.map((r) => {
              const color = ratingColor(r.rating);
              return (
                <tr
                  key={r.id}
                  className="border-b border-sand-50 last:border-0 hover:bg-sand-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-medium text-sand-800">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-sand-400 max-w-[220px]">
                    <span className="truncate block">{r.address}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold" style={{ color }}>
                      ★ {r.rating}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-sand-600">
                    {r.waitTime} min
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-sand-600">
                    {Math.round(r.gotHelpRate * 100)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Row 4 — Funding opportunity ── */}
      {unfundedHighNeed.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 mb-4">
          <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide mb-4">
            Funding opportunity
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {unfundedHighNeed.map((r) => {
              const color = ratingColor(r.rating);
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-xl p-4 border border-amber-100"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="text-sm font-semibold text-sand-800 truncate">
                      {r.name}
                    </div>
                  </div>
                  <div className="text-xs text-sand-400 mb-2 truncate">{r.address}</div>
                  <div className="flex gap-3 text-xs">
                    <span style={{ color }}>★ {r.rating}</span>
                    <span className="text-sand-400">{r.waitTime} min wait</span>
                    <span className="text-sand-400">
                      {Math.round(r.gotHelpRate * 100)}% got help
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-sm text-amber-700 leading-relaxed">
            These locations serve high-need areas with no current donor support. Your
            contribution could meaningfully improve outcomes for hundreds of families.
          </div>
        </div>
      )}

      {/* ── Row 5 — Testimonial ── */}
      <div className="bg-white rounded-2xl p-6 border-l-4 border-leaf-500">
        <div className="text-base italic text-sand-700 leading-relaxed">
          &ldquo;Amazing variety of fresh food! The volunteers were so kind and helpful.
          Very grateful for this resource.&rdquo;
        </div>
        <div className="text-xs text-sand-400 mt-3">
          — Visitor at Highland Park Food Bank (shared with permission)
        </div>
      </div>

      <div className="h-8" />
      <Footer />
    </div>
  );
}

function CompareRow({ label, value, good }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-sand-400">{label}</span>
      <span
        className={`text-xs font-semibold ${
          good ? "text-leaf-600" : "text-sand-600"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
