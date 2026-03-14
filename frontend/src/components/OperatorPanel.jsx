"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  feedbackThemes,
  ratingColor,
  demoPantries,
  manhattanBenchmarks,
} from "@/lib/data";

const MiniMap = dynamic(() => import("./MiniMap"), { ssr: false });

const TOOLTIP_STYLE = {
  fontSize: 12,
  background: "#fff",
  border: "1px solid #e8e4d8",
  borderRadius: 10,
  boxShadow: "0 2px 8px rgba(0,0,0,.06)",
};

const BM = manhattanBenchmarks;

// ── Treemap cell renderer (module-level to avoid re-creation on render) ──
function ThemeTreeContent({ x, y, width, height, name, pct, sentiment }) {
  if (!width || !height || width < 2 || height < 2) return null;

  const intensity = Math.min((pct || 0) / 80, 1);
  const isPos     = sentiment === "positive";
  const bgFill    = isPos
    ? `rgba(45,106,79,${(0.18 + intensity * 0.55).toFixed(2)})`
    : `rgba(220,38,38,${(0.18 + intensity * 0.55).toFixed(2)})`;
  const textFill  = isPos ? "#14532d" : "#7f1d1d";
  const fz        = Math.max(10, Math.min(14, Math.sqrt(width * height) / 8));
  const showText  = width > 55 && height > 36;

  return (
    <g>
      <rect
        x={x + 2}
        y={y + 2}
        width={Math.max(0, width - 4)}
        height={Math.max(0, height - 4)}
        rx={6}
        ry={6}
        fill={bgFill}
        stroke="#fff"
        strokeWidth={3}
      />
      {showText && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 7}
            textAnchor="middle"
            fill={textFill}
            fontSize={fz}
            fontWeight={600}
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 9}
            textAnchor="middle"
            fill={textFill}
            fontSize={Math.max(9, fz - 2)}
            opacity={0.85}
          >
            {pct}%
          </text>
        </>
      )}
    </g>
  );
}

export default function OperatorPanel() {
  const [selectedIdx, setSelectedIdx]       = useState(0);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const pantry = demoPantries[selectedIdx];

  function handlePantryChange(idx) {
    setSelectedIdx(idx);
    setAlertDismissed(false);
  }

  const themes = feedbackThemes[pantry.id] || feedbackThemes["res_002"];
  const color   = ratingColor(pantry.rating);

  // ── Line chart data ────────────────────────────────────────────────────
  const ratingData = useMemo(
    () =>
      pantry.monthLabels.map((m, i) => ({
        month: m,
        rating: pantry.ratingTrend[i],
      })),
    [pantry]
  );

  const waitData = useMemo(
    () =>
      pantry.monthLabels.map((m, i) => ({
        month: m,
        wait: pantry.waitTrend[i],
      })),
    [pantry]
  );

  const ratingDelta = +(
    pantry.ratingTrend[pantry.ratingTrend.length - 1] - pantry.ratingTrend[0]
  ).toFixed(1);
  const waitDelta =
    pantry.waitTrend[pantry.waitTrend.length - 1] - pantry.waitTrend[0];

  // ── Radar: all 5 axes normalised to 0-100 ─────────────────────────────
  const radarData = useMemo(
    () => [
      {
        axis: "Rating",
        you: Math.round((pantry.rating / 5) * 100),
        avg: Math.round((BM.avgRating / 5) * 100),
      },
      {
        axis: "Reviews",
        you: Math.round((Math.min(pantry.reviews, 50) / 50) * 100),
        avg: Math.round((Math.min(BM.avgReviewCount, 50) / 50) * 100),
      },
      {
        axis: "Subscribers",
        you: Math.round((Math.min(pantry.subscriptionCount, 50) / 50) * 100),
        avg: Math.round((Math.min(BM.avgSubscriptions, 50) / 50) * 100),
      },
      {
        axis: "Accuracy",
        you: Math.round(pantry.infoAccuracy * 100),
        avg: 72,
      },
      {
        axis: "Got Help",
        you: Math.round(pantry.gotHelpRate * 100),
        avg: 68,
      },
    ],
    [pantry]
  );

  const aboveAvgCount = radarData.filter((d) => d.you > d.avg).length;
  const ratingBelow   = radarData[0].you <= radarData[0].avg;
  const helpBelow     = radarData[4].you <= radarData[4].avg;

  const radarInsight =
    aboveAvgCount >= 3
      ? "You're outperforming most Manhattan pantries — keep it up."
      : ratingBelow || helpBelow
      ? "Your service quality metrics need attention compared to similar pantries."
      : "You're performing close to the Manhattan average.";

  // ── Treemap data ───────────────────────────────────────────────────────
  const treemapThemes = useMemo(
    () =>
      themes.map((t) => ({
        name: t.theme,
        size: t.pct,
        pct: t.pct,
        sentiment: t.sentiment,
      })),
    [themes]
  );

  // ── Listing completeness (gauge) ───────────────────────────────────────
  const completeness = Math.round(pantry.confidence * 100);
  const cColor =
    completeness >= 80 ? "#1D9E75" : completeness >= 60 ? "#EF9F27" : "#E24B4A";

  const gaugeData = [
    { value: completeness },
    { value: 100 - completeness },
  ];

  const missingHints = [
    !pantry.website && "a website",
    !pantry.tags?.length && "service tags",
    !pantry.phone && "a phone number",
  ]
    .filter(Boolean)
    .slice(0, 2);

  const missingSubtext =
    missingHints.length === 2
      ? `Add ${missingHints[0]} and ${missingHints[1]} to reach 100%`
      : missingHints.length === 1
      ? `Add ${missingHints[0]} to reach 100%`
      : "Your listing is fully complete!";

  // ── Single smart alert ─────────────────────────────────────────────────
  const smartAlert = (() => {
    if (pantry.status === "UNAVAILABLE")
      return {
        type: "error",
        title: "Your pantry is hidden from search",
        body: "Your listing is not showing in search results. Contact LemonTree to restore your listing.",
      };
    if (pantry.infoAccuracy < 0.7)
      return {
        type: "warning",
        title: "Update your listing hours",
        body: `Your accuracy score is ${Math.round(pantry.infoAccuracy * 100)}%. Visitors have reported mismatches with your posted hours or address. Review and update your listing.`,
      };
    if (pantry.confidence < 0.8)
      return {
        type: "warning",
        title: "Complete your listing",
        body: "A more complete listing helps more families find your pantry. Add missing details to improve your discoverability score.",
      };
    if (pantry.rating < 3.0)
      return {
        type: "warning",
        title: "Your rating needs attention",
        body: `Your current rating is ${pantry.rating}. Review recent visitor feedback below to identify the most impactful areas to improve.`,
      };
    return null;
  })();

  return (
    <div className="p-8">

      {/* ── §1 Pantry selector ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide shrink-0">
          Viewing:
        </span>
        <select
          value={selectedIdx}
          onChange={(e) => handlePantryChange(Number(e.target.value))}
          className="text-sm font-semibold text-sand-800 bg-white border border-sand-200 rounded-xl px-3 py-2 cursor-pointer outline-none hover:border-leaf-300 focus:border-leaf-400 transition-colors"
        >
          {demoPantries.map((p, i) => (
            <option key={p.id} value={i}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── §2 Visibility status banner ────────────────────────────────── */}
      {pantry.status === "PUBLISHED" ? (
        <div className="flex items-center gap-2.5 bg-leaf-50 border border-leaf-100 rounded-xl px-4 py-2.5 mb-5 text-sm text-leaf-700">
          <span className="w-2 h-2 rounded-full bg-leaf-500 shrink-0" />
          Your pantry is live on LemonTree — visible to people searching for
          food resources in your area.
        </div>
      ) : (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-5 text-sm text-red-700">
          <span className="shrink-0 font-bold">⚠</span>
          Your pantry is currently hidden from search results. Contact
          LemonTree to restore your listing.
        </div>
      )}

      {/* ── §3 Four stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <BigStatCard
          label="Overall Rating"
          value={pantry.rating.toFixed(1)}
          delta={`${ratingDelta > 0 ? "+" : ""}${ratingDelta} vs 6mo ago`}
          valueColor={color}
          deltaColor={ratingDelta >= 0 ? "#1D9E75" : "#E24B4A"}
        />
        <BigStatCard
          label="Avg Wait Time"
          value={`${pantry.waitTime} min`}
          delta={`${waitDelta > 0 ? "+" : ""}${waitDelta} min vs 6mo ago`}
          valueColor={waitDelta > 0 ? "#E24B4A" : "#1D9E75"}
          deltaColor={waitDelta > 0 ? "#E24B4A" : "#1D9E75"}
        />
        <BigStatCard
          label="Got Help Rate"
          value={`${Math.round(pantry.gotHelpRate * 100)}%`}
          delta="of visitors got help"
          deltaColor="#9c9588"
        />
        <BigStatCard
          label="Info Accuracy"
          value={`${Math.round(pantry.infoAccuracy * 100)}%`}
          delta={pantry.infoAccuracy < 0.7 ? "needs update" : "on track"}
          valueColor={pantry.infoAccuracy < 0.7 ? "#E24B4A" : undefined}
          deltaColor={pantry.infoAccuracy < 0.7 ? "#E24B4A" : "#1D9E75"}
        />
      </div>

      {/* ── §4 Mini-map + Radar benchmark ──────────────────────────────── */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "2fr 3fr" }}>
        {/* Mini-map */}
        <div
          key={pantry.id}
          className="relative rounded-2xl overflow-hidden border border-sand-100 bg-white"
          style={{ minHeight: 280 }}
        >
          <MiniMap
            lat={pantry.lat}
            lng={pantry.lng}
            name={pantry.name}
            rating={pantry.rating}
            address={pantry.address}
          />
        </div>

        {/* ── Radar comparison card ── */}
        <div className="bg-white rounded-2xl p-5 border border-sand-100 flex flex-col">
          <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide mb-1">
            How you compare to Manhattan pantries
          </div>

          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={radarData} margin={{ top: 16, right: 24, bottom: 0, left: 24 }}>
              <PolarGrid stroke="#e8e4d8" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fontSize: 11, fill: "#9c9588" }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              {/* Manhattan avg — behind, dashed */}
              <Radar
                name="Manhattan avg"
                dataKey="avg"
                stroke="#b8b3a8"
                fill="#b8b3a8"
                fillOpacity={0.15}
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />
              {/* You — in front, solid green */}
              <Radar
                name="You"
                dataKey="you"
                stroke="#2D6A4F"
                fill="#2D6A4F"
                fillOpacity={0.28}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>

          {/* Manual legend */}
          <div className="flex items-center justify-center gap-6 mb-3">
            <span className="flex items-center gap-1.5 text-xs text-sand-600">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: "#2D6A4F", opacity: 0.7 }}
              />
              You
            </span>
            <span className="flex items-center gap-1.5 text-xs text-sand-400">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm border border-dashed border-sand-400"
                style={{ backgroundColor: "#b8b3a8", opacity: 0.35 }}
              />
              Manhattan avg
            </span>
          </div>

          {/* Plain-English insight */}
          <div className="mt-auto text-center px-4 py-2.5 bg-sand-50 rounded-xl border border-sand-100">
            <span className="text-xs text-sand-600 leading-relaxed">
              {radarInsight}
            </span>
          </div>
        </div>
      </div>

      {/* ── §5 Rating + Wait trend charts ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl p-5 border border-sand-100">
          <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide mb-4">
            Rating trend (6 months)
          </div>
          <ResponsiveContainer width="100%" height={130}>
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
                width={26}
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke={color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: color }}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-sand-100">
          <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide mb-4">
            Wait time trend (6 months)
          </div>
          <ResponsiveContainer width="100%" height={130}>
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
                width={26}
              />
              <Line
                type="monotone"
                dataKey="wait"
                stroke="#E24B4A"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#E24B4A" }}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── §6 Feedback themes — Treemap ───────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 mb-4 border border-sand-100">
        <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide mb-4">
          What visitors are saying ({pantry.reviews} reviews)
        </div>
        <div style={{ width: "100%", height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapThemes}
              dataKey="size"
              content={ThemeTreeContent}
              isAnimationActive={false}
            />
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── §7 Listing visibility — circular gauge ──────────────────────── */}
      <div className="bg-white rounded-2xl p-6 mb-4 border border-sand-100">
        <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide mb-4">
          Your listing visibility
        </div>

        <div className="flex items-center gap-8">
          {/* Status badge */}
          <div className="shrink-0">
            {pantry.status === "PUBLISHED" ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-leaf-700 bg-leaf-50 px-3 py-1.5 rounded-full border border-leaf-100">
                <span className="w-1.5 h-1.5 rounded-full bg-leaf-500" />
                Live on LemonTree
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                ⚠ Hidden
              </span>
            )}
          </div>

          {/* Half-circle gauge */}
          <div className="flex flex-col items-center">
            {/* PieChart gauge container — cy at bottom crops lower half cleanly */}
            <div
              style={{ position: "relative", width: 200, height: 108, overflow: "hidden" }}
            >
              <PieChart width={200} height={200}>
                <Pie
                  data={gaugeData}
                  cx={100}
                  cy={100}
                  startAngle={180}
                  endAngle={0}
                  innerRadius={68}
                  outerRadius={92}
                  paddingAngle={
                    completeness > 0 && completeness < 100 ? 2 : 0
                  }
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={cColor} />
                  <Cell fill="#e8e4d8" />
                </Pie>
              </PieChart>

              {/* Percentage text centred in the hollow */}
              <div
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: cColor,
                    lineHeight: 1,
                  }}
                >
                  {completeness}%
                </div>
                <div style={{ fontSize: 10, color: "#9c9588", marginTop: 2 }}>
                  Listing completeness
                </div>
              </div>
            </div>

            {/* Hint text */}
            <div className="text-[11px] text-sand-400 text-center mt-2 max-w-[180px] leading-relaxed">
              {missingSubtext}
            </div>
          </div>
        </div>
      </div>

      {/* ── §8 Tags & Access requirements ──────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 mb-4 border border-sand-100">
        <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide mb-4">
          How visitors find you
        </div>
        <div className="grid grid-cols-2 gap-8">
          {/* Tags */}
          <div>
            <div className="text-xs font-semibold text-sand-600 mb-2.5">
              Current tags
            </div>
            {pantry.tags?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pantry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 bg-leaf-50 text-leaf-700 rounded-full border border-leaf-100 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-sand-400 italic leading-relaxed">
                No tags set — add requirements so visitors know what to bring.
              </p>
            )}
          </div>

          {/* Access info */}
          <div>
            <div className="text-xs font-semibold text-sand-600 mb-2.5">
              Access info
            </div>
            <div className="space-y-2">
              <AccessRow
                icon="🚶"
                label={
                  pantry.appointmentRequired
                    ? "Appointment required"
                    : "Walk-in welcome"
                }
              />
              <AccessRow
                icon="📅"
                label={
                  pantry.openByAppointment
                    ? "Open by appointment"
                    : "Drop-in hours"
                }
              />
              <AccessRow
                icon="📦"
                label={
                  pantry.usageLimitCount
                    ? `Limit: ${pantry.usageLimitCount} per ${
                        pantry.usageLimitInterval || "visit"
                      }`
                    : "No capacity limit set"
                }
              />
              {pantry.phone && (
                <AccessRow icon="📞" label={pantry.phone} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── §9 One smart action alert ──────────────────────────────────── */}
      {smartAlert && !alertDismissed && (
        <SmartAlert
          type={smartAlert.type}
          title={smartAlert.title}
          body={smartAlert.body}
          onDismiss={() => setAlertDismissed(true)}
        />
      )}

      <div className="h-8" />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function BigStatCard({ label, value, delta, valueColor, deltaColor }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-sand-100">
      <div className="text-[11px] font-semibold text-sand-400 uppercase tracking-wide mb-2.5">
        {label}
      </div>
      <div
        className="text-4xl font-bold leading-none mb-2"
        style={valueColor ? { color: valueColor } : { color: "#2d2a24" }}
      >
        {value}
      </div>
      <div
        className="text-xs font-medium"
        style={{ color: deltaColor || "#9c9588" }}
      >
        {delta}
      </div>
    </div>
  );
}

function SmartAlert({ type, title, body, onDismiss }) {
  const isError = type === "error";
  return (
    <div
      className={`rounded-2xl p-4 border flex items-start gap-3 mb-4 ${
        isError ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
      }`}
    >
      <span
        className={`text-base shrink-0 mt-0.5 ${
          isError ? "text-red-500" : "text-amber-500"
        }`}
      >
        ⚠
      </span>
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-semibold ${
            isError ? "text-red-800" : "text-amber-800"
          }`}
        >
          {title}
        </div>
        <div
          className={`text-xs mt-0.5 leading-relaxed ${
            isError ? "text-red-700" : "text-amber-700"
          }`}
        >
          {body}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full cursor-pointer border-none text-sm transition-colors ${
          isError
            ? "text-red-400 hover:bg-red-100 hover:text-red-700"
            : "text-amber-400 hover:bg-amber-100 hover:text-amber-700"
        }`}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

function AccessRow({ icon, label }) {
  return (
    <div className="flex items-center gap-2 text-xs text-sand-700">
      <span className="text-sm shrink-0">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
