"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import FeedbackBars from "./FeedbackBars";
import { feedbackThemes, ratingColor } from "@/lib/data";

const MiniMap = dynamic(() => import("./MiniMap"), { ssr: false });

export default function OperatorPanel({ resource }) {
  const themes = feedbackThemes[resource?.id] || feedbackThemes["res_002"];

  const ratingData = useMemo(() => {
    if (!resource) return [];
    return resource.monthLabels.map((m, i) => ({
      month: m,
      rating: resource.ratingTrend[i],
    }));
  }, [resource]);

  const waitData = useMemo(() => {
    if (!resource) return [];
    return resource.monthLabels.map((m, i) => ({
      month: m,
      wait: resource.waitTrend[i],
    }));
  }, [resource]);

  if (!resource) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[480px] p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-leaf-50 flex items-center justify-center mb-4">
          <span className="text-3xl">🏪</span>
        </div>
        <div className="text-base font-semibold text-sand-700 mb-1.5">Select a pantry</div>
        <div className="text-sm text-sand-400 leading-relaxed max-w-xs">
          Switch to the Government view and click any pin on the map to view a
          location&apos;s performance insights.
        </div>
      </div>
    );
  }

  const color       = ratingColor(resource.rating);
  const ratingDelta = +(
    resource.ratingTrend[resource.ratingTrend.length - 1] -
    resource.ratingTrend[0]
  ).toFixed(1);
  const waitDelta =
    resource.waitTrend[resource.waitTrend.length - 1] -
    resource.waitTrend[0];

  return (
    <div className="p-8">

      {/* ── Rows 1–2 — 4 stat cards + map spanning full height ── */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {/* Row 1, cols 1–2 */}
        <BigStatCard
          label="Overall Rating"
          value={resource.rating.toFixed(1)}
          delta={`${ratingDelta > 0 ? "+" : ""}${ratingDelta} vs 6mo ago`}
          valueColor={color}
          deltaColor={ratingDelta >= 0 ? "#1D9E75" : "#E24B4A"}
        />
        <BigStatCard
          label="Avg Wait Time"
          value={`${resource.waitTime} min`}
          delta={`${waitDelta > 0 ? "+" : ""}${waitDelta} min vs 6mo ago`}
          valueColor={waitDelta > 0 ? "#E24B4A" : "#1D9E75"}
          deltaColor={waitDelta > 0 ? "#E24B4A" : "#1D9E75"}
        />

        {/* Cols 3–4, spans both rows */}
        <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden border border-sand-100 bg-white">
          <MiniMap
            lat={resource.lat}
            lng={resource.lng}
            name={resource.name}
            rating={resource.rating}
            address={resource.address}
          />
        </div>

        {/* Row 2, cols 1–2 */}
        <BigStatCard
          label="Got Help Rate"
          value={`${Math.round(resource.gotHelpRate * 100)}%`}
          delta="of visitors got help"
          deltaColor="#9c9588"
        />
        <BigStatCard
          label="Info Accuracy"
          value={`${Math.round(resource.infoAccuracy * 100)}%`}
          delta={resource.infoAccuracy < 0.7 ? "needs update" : "on track"}
          valueColor={resource.infoAccuracy < 0.7 ? "#E24B4A" : undefined}
          deltaColor={resource.infoAccuracy < 0.7 ? "#E24B4A" : "#1D9E75"}
        />
      </div>

      {/* ── Row 2 — Two trend charts ── */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl p-5">
          <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide mb-4">
            Rating trend (6 months)
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={ratingData}>
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
                stroke={color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: color }}
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

        <div className="bg-white rounded-2xl p-5">
          <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide mb-4">
            Wait time trend (6 months)
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={waitData}>
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
                dataKey="wait"
                stroke="#E24B4A"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#E24B4A" }}
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

      {/* ── Row 3 — Feedback themes ── */}
      <div className="bg-white rounded-2xl p-6 mb-4">
        <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide mb-4">
          What visitors are saying ({resource.reviews} reviews)
        </div>
        <FeedbackBars themes={themes} />
      </div>

      {/* ── Row 4 — Info accuracy alert (conditional) ── */}
      {resource.infoAccuracy < 0.7 && (
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 flex items-start gap-3.5">
          <span className="text-amber-500 text-xl shrink-0 mt-0.5">⚠</span>
          <div>
            <div className="text-sm font-semibold text-amber-800">
              Update your listing info
            </div>
            <div className="text-sm text-amber-700 mt-1 leading-relaxed">
              Your accuracy score is{" "}
              <strong>{Math.round(resource.infoAccuracy * 100)}%</strong>.
              Visitors have reported mismatches with hours or location details.
              Please review and update your listing.
            </div>
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}

function BigStatCard({ label, value, delta, valueColor, deltaColor }) {
  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide mb-2.5">
        {label}
      </div>
      <div
        className="text-4xl font-bold leading-none mb-2"
        style={valueColor ? { color: valueColor } : { color: "#2d2a24" }}
      >
        {value}
      </div>
      <div className="text-xs font-medium" style={{ color: deltaColor || "#9c9588" }}>
        {delta}
      </div>
    </div>
  );
}
