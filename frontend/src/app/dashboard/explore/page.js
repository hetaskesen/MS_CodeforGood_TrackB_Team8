"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getBorough } from "@/lib/zipToBorough";
import { useAppData } from "@/lib/dataCache";
import Footer from "@/components/Footer";
import {
  Search, MapPin, Calendar, Users, DoorOpen, ArrowLeft, X,
  Star, Clock, ArrowUpDown, ChevronLeft, ChevronRight,
  Phone, Globe, Tag, Info, Eye, ImageIcon, Hash,
} from "lucide-react";

const PAGE_SIZE = 25;

/* ── Helpers ─────────────────────────────────────────────────────────── */

function isOpenSoon(resource, withinDays = 7) {
  const now = Date.now();
  const cutoff = now + withinDays * 86400000;
  const upcoming = (resource.occurrences || [])
    .filter((o) => !o.skippedAt && o.startTime)
    .map((o) => new Date(o.startTime).getTime())
    .filter((t) => t >= now)
    .sort((a, b) => a - b);
  return upcoming[0] != null && upcoming[0] <= cutoff;
}

function getNextOccurrence(resource) {
  const now = Date.now();
  return (resource.occurrences || [])
    .filter(
      (o) =>
        !o.skippedAt &&
        o.startTime &&
        new Date(o.startTime).getTime() >= now
    )
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0] || null;
}

function formatRegionId(id) {
  return id
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ── Filter Pill ─────────────────────────────────────────────────────── */

function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
        active
          ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
          : "bg-white border-sand-200 text-sand-600 hover:bg-sand-50 hover:border-sand-300"
      }`}
    >
      {children}
    </button>
  );
}

/* ── Filter Bar ──────────────────────────────────────────────────────── */

function ExploreFilters({ meta, filters, setFilters }) {
  const {
    type, borough, zip, query, openOnly, tags,
    acceptingNew, walkIn, region, minRating, maxWait, sort,
  } = filters;

  const tagList    = meta?.tags    || [];
  const regionList = meta?.regions || [];

  const selectCls =
    "appearance-none pl-3 pr-7 py-2 bg-white border border-sand-200 rounded-lg text-sm text-sand-700 shadow-sm cursor-pointer hover:border-sand-300 focus:outline-none focus:ring-2 focus:ring-[#FDE97A]";
  const pillSelectCls =
    "appearance-none pl-3 pr-7 py-1.5 bg-white border border-sand-200 rounded-full text-xs text-sand-600 shadow-sm cursor-pointer hover:border-sand-300 focus:outline-none focus:ring-2 focus:ring-[#FDE97A]";

  return (
    <div className="sticky top-0 z-10 bg-[#f5f3ef]/95 backdrop-blur-sm border-b border-sand-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">

        {/* Row 1: search + dropdowns */}
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sand-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search name, description, or address…"
              value={query}
              onChange={(e) =>
                setFilters((f) => ({ ...f, query: e.target.value }))
              }
              className="w-full pl-9 pr-4 py-2 bg-white border border-sand-200 rounded-lg text-sm placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-[#FDE97A] focus:border-transparent shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={type || ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, type: e.target.value || null }))
              }
              className={selectCls}
            >
              <option value="">All Types</option>
              {(meta?.types || []).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={borough || ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, borough: e.target.value || null }))
              }
              className={selectCls}
            >
              <option value="">All Boroughs</option>
              {(meta?.boroughs || []).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              value={zip || ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, zip: e.target.value || null }))
              }
              className={selectCls}
            >
              <option value="">All Zips</option>
              {(meta?.zips || []).map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>

            {regionList.length > 0 && (
              <select
                value={region || ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, region: e.target.value || null }))
                }
                className={selectCls}
              >
                <option value="">All Neighborhoods</option>
                {regionList.map((r) => (
                  <option key={r} value={r}>{formatRegionId(r)}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Row 2: pill filters + sort */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            active={openOnly}
            onClick={() => setFilters((f) => ({ ...f, openOnly: !f.openOnly }))}
          >
            <Calendar size={12} /> Visit this week
          </FilterPill>

          <FilterPill
            active={acceptingNew}
            onClick={() =>
              setFilters((f) => ({ ...f, acceptingNew: !f.acceptingNew }))
            }
          >
            <Users size={12} /> Accepting new clients
          </FilterPill>

          <FilterPill
            active={walkIn}
            onClick={() => setFilters((f) => ({ ...f, walkIn: !f.walkIn }))}
          >
            <DoorOpen size={12} /> Walk-in (no appt.)
          </FilterPill>

          <div className="h-5 w-px bg-sand-200 mx-1 hidden sm:block" />

          <select
            value={minRating || ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                minRating: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className={pillSelectCls}
          >
            <option value="">Any Rating</option>
            <option value="2">2+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="4">4+ Stars</option>
          </select>

          <select
            value={maxWait || ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                maxWait: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className={pillSelectCls}
          >
            <option value="">Any Wait</option>
            <option value="15">Under 15 min</option>
            <option value="30">Under 30 min</option>
            <option value="60">Under 60 min</option>
          </select>

          <div className="ml-auto flex items-center gap-1.5">
            <ArrowUpDown size={12} className="text-sand-400" />
            <select
              value={sort || "name"}
              onChange={(e) =>
                setFilters((f) => ({ ...f, sort: e.target.value }))
              }
              className={pillSelectCls}
            >
              <option value="name">Sort: Name</option>
              <option value="rating">Sort: Rating</option>
              <option value="wait">Sort: Wait Time</option>
              <option value="reviews">Sort: Reviews</option>
            </select>
          </div>
        </div>

        {/* Row 3: tag pills (scrollable) */}
        {tagList.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-bold text-sand-400 uppercase tracking-widest shrink-0">
              Tags:
            </span>
            {tagList.map((tag) => {
              const isActive = tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => {
                    const nt = isActive
                      ? tags.filter((t) => t !== tag)
                      : [...tags, tag];
                    setFilters((f) => ({ ...f, tags: nt }));
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-sand-800 text-white border-sand-800"
                      : "bg-white text-sand-600 border-sand-200 hover:border-sand-400"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Pagination ──────────────────────────────────────────────────────── */

function Pagination({ page, totalPages, totalCount, onPageChange }) {
  const pages = useMemo(() => {
    const result = [];
    const show = 5;
    let start = Math.max(1, page - Math.floor(show / 2));
    let end   = Math.min(totalPages, start + show - 1);
    if (end - start < show - 1) start = Math.max(1, end - show + 1);
    for (let i = start; i <= end; i++) result.push(i);
    return result;
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  const from = (page - 1) * PAGE_SIZE + 1;
  const to   = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-white border-t border-sand-200 shrink-0">
      <span className="text-xs text-sand-500">
        <strong className="text-sand-800">{from}–{to}</strong> of{" "}
        <strong className="text-sand-800">{totalCount.toLocaleString()}</strong>
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-sand-200 text-sand-500 hover:bg-sand-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {pages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="w-8 h-8 rounded-lg text-xs font-medium text-sand-600 hover:bg-sand-50 transition-colors"
            >
              1
            </button>
            {pages[0] > 2 && (
              <span className="text-sand-400 text-xs px-1">…</span>
            )}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
              p === page
                ? "bg-[#FDE97A] text-[#3D2200] shadow-sm"
                : "text-sand-600 hover:bg-sand-50"
            }`}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="text-sand-400 text-xs px-1">…</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="w-8 h-8 rounded-lg text-xs font-medium text-sand-600 hover:bg-sand-50 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-sand-200 text-sand-500 hover:bg-sand-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── Resource Detail Panel ───────────────────────────────────────────── */

function DetailSection({ icon: Icon, title, children }) {
  return (
    <div className="py-4 border-b border-sand-100 last:border-0">
      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sand-400 mb-3">
        {Icon && <Icon size={14} />} {title}
      </h4>
      {children}
    </div>
  );
}

function ResourceDetail({ resource, onClose }) {
  const r       = resource;
  const borough = getBorough(r.zipCode);
  const address = [r.addressStreet1, r.addressStreet2, r.city, r.state, r.zipCode]
    .filter(Boolean)
    .join(", ");
  const phone   = r.contacts?.[0]?.phone;
  const rating  = r.ratingAverage;
  const wait    = r.waitTimeMinutesAverage;
  const reviews = r._count?.reviews || 0;
  const subs    = r._count?.resourceSubscriptions || 0;
  const now     = Date.now();

  const futureOccs = (r.occurrences || [])
    .filter(
      (o) =>
        !o.skippedAt && o.startTime && new Date(o.startTime).getTime() >= now
    )
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const images  = r.images || [];
  const regions = (r.regions || []).map((reg) => formatRegionId(reg.id));
  const usageLimit =
    r.usageLimitCount && r.usageLimitIntervalUnit
      ? `${r.usageLimitCount} visit${r.usageLimitCount > 1 ? "s" : ""} per ${r.usageLimitIntervalUnit.toLowerCase()}`
      : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl"
        style={{ animation: "slideIn 0.25s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-sand-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-sand-900 leading-tight">
                {r.name?.trim() || "Unnamed Resource"}
              </h2>
              {r.resourceType && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-sand-100 text-sand-500 mt-1">
                  {r.resourceType.name || r.resourceType.id}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-sand-50 text-sand-500 transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-6 py-2">
          {/* Stats row */}
          <div className="flex flex-wrap gap-3 py-4 border-b border-sand-100">
            {rating != null && (
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-lg">
                <Star size={16} className="text-amber-500 fill-amber-500" />
                <span className="font-bold text-sand-800">{rating.toFixed(1)}</span>
                <span className="text-xs text-sand-500">
                  ({reviews} review{reviews !== 1 ? "s" : ""})
                </span>
              </div>
            )}
            {wait != null && (
              <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-2 rounded-lg">
                <Clock size={16} className="text-blue-500" />
                <span className="font-bold text-sand-800">{wait}</span>
                <span className="text-xs text-sand-500">min avg wait</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-sand-50 px-3 py-2 rounded-lg">
              <Eye size={16} className="text-sand-400" />
              <span className="font-bold text-sand-800">{subs}</span>
              <span className="text-xs text-sand-500">
                follower{subs !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Quick badges */}
          <div className="flex flex-wrap gap-2 py-4 border-b border-sand-100">
            {r.acceptingNewClients && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                <Users size={12} /> Accepting new clients
              </span>
            )}
            {!r.appointmentRequired && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                <DoorOpen size={12} /> Walk-in welcome
              </span>
            )}
            {r.appointmentRequired && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100">
                <Calendar size={12} /> Appointment required
              </span>
            )}
            {usageLimit && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sand-50 text-sand-600 text-xs font-semibold border border-sand-200">
                <Hash size={12} /> {usageLimit}
              </span>
            )}
            {r.confidence != null && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sand-50 text-sand-600 text-xs font-semibold border border-sand-200">
                <Info size={12} /> {Math.round(r.confidence * 100)}% confidence
              </span>
            )}
          </div>

          {/* Location */}
          <DetailSection icon={MapPin} title="Location">
            <p className="text-sm text-sand-700">{address}</p>
            {borough && (
              <p className="text-xs text-sand-500 mt-1">
                {borough}
                {regions.length > 0 && ` — ${regions.join(", ")}`}
              </p>
            )}
          </DetailSection>

          {/* Contact */}
          {(phone || r.website) && (
            <DetailSection icon={Phone} title="Contact">
              <div className="space-y-2">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center gap-2 text-sm text-blue-700 hover:underline"
                  >
                    <Phone size={14} /> {phone}
                  </a>
                )}
                {r.website && (
                  <a
                    href={r.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-700 hover:underline truncate"
                  >
                    <Globe size={14} /> {r.website}
                  </a>
                )}
              </div>
            </DetailSection>
          )}

          {/* Description */}
          {r.description && (
            <DetailSection icon={Info} title="Description">
              <p className="text-sm text-sand-700 whitespace-pre-wrap">
                {r.description}
              </p>
            </DetailSection>
          )}

          {/* Upcoming schedule */}
          {futureOccs.length > 0 && (
            <DetailSection
              icon={Calendar}
              title={`Upcoming Dates (${futureOccs.length})`}
            >
              <div className="space-y-2">
                {futureOccs.slice(0, 8).map((occ, i) => (
                  <div
                    key={occ.id || i}
                    className="flex items-center justify-between bg-sand-50 rounded-lg px-3 py-2"
                  >
                    <div>
                      <span className="text-sm font-medium text-sand-800">
                        {fmtDate(occ.startTime)}
                      </span>
                      <span className="text-xs text-sand-500 ml-2">
                        {fmtTime(occ.startTime)} — {fmtTime(occ.endTime)}
                      </span>
                    </div>
                    {occ.address && occ.address !== address && (
                      <span className="text-xs text-sand-400 truncate ml-2">
                        {occ.address}
                      </span>
                    )}
                  </div>
                ))}
                {futureOccs.length > 8 && (
                  <p className="text-xs text-sand-400 pl-1">
                    +{futureOccs.length - 8} more dates…
                  </p>
                )}
              </div>
            </DetailSection>
          )}

          {/* Tags */}
          {(r.tags || []).length > 0 && (
            <DetailSection icon={Tag} title="Tags">
              <div className="flex flex-wrap gap-2">
                {r.tags.map((tag) => (
                  <span
                    key={tag.id || tag.name}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      tag.tagCategoryId === "REQUIREMENT"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : tag.tagCategoryId === "OFFERING"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-sand-50 text-sand-600 border-sand-200"
                    }`}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </DetailSection>
          )}

          {/* Images */}
          {images.length > 0 && (
            <DetailSection icon={ImageIcon} title={`Photos (${images.length})`}>
              <div className="grid grid-cols-2 gap-2">
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    alt={`${r.name} photo ${i + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-sand-200"
                    loading="lazy"
                  />
                ))}
              </div>
            </DetailSection>
          )}

          <div className="h-8" />
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ── Resource Row Card ───────────────────────────────────────────────── */

function ResourceRow({ resource, onClick }) {
  const r       = resource;
  const borough = getBorough(r.zipCode);
  const address = [r.addressStreet1, r.city, r.state].filter(Boolean).join(", ");
  const openSoon = isOpenSoon(r);
  const nextOcc  = getNextOccurrence(r);
  const rating   = r.ratingAverage;
  const wait     = r.waitTimeMinutesAverage;
  const reviews  = r._count?.reviews || 0;

  return (
    <button onClick={onClick} className="w-full text-left px-4 py-1.5 block group">
      <div className="bg-white rounded-xl border border-sand-200 shadow-sm hover:shadow-md hover:border-sand-300 transition-all duration-200 px-5 py-3.5 relative overflow-hidden cursor-pointer">
        {/* Left accent bar — green if open this week */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 rounded-r ${
            openSoon ? "bg-emerald-500" : "bg-sand-200"
          }`}
        />

        <div className="flex items-start justify-between gap-4 pl-2">
          <div className="flex-1 min-w-0">
            {/* Name + type chip */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-sand-900 truncate group-hover:text-emerald-800 transition-colors">
                {r.name?.trim() || "Unnamed Resource"}
              </h3>
              {r.resourceType && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-sand-100 text-sand-500 shrink-0">
                  {r.resourceType.name || r.resourceType.id}
                </span>
              )}
            </div>

            {/* Address */}
            <div className="flex items-center gap-1.5 text-sm text-sand-500 mb-2">
              <MapPin size={13} className="shrink-0 text-sand-400" />
              <span className="truncate">{address || "—"}</span>
              {r.zipCode && (
                <span className="hidden sm:inline-flex items-center gap-1 text-sand-400 bg-sand-50 px-1.5 py-0.5 rounded text-xs ml-1 shrink-0">
                  {borough || "NYC"} &middot; {r.zipCode}
                </span>
              )}
            </div>

            {/* Meta pills */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-sand-500">
              {rating != null && (
                <span className="flex items-center gap-1">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-sand-700">
                    {rating.toFixed(1)}
                  </span>
                  {reviews > 0 && (
                    <span className="text-sand-400">({reviews})</span>
                  )}
                </span>
              )}
              {wait != null && (
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-sand-400" /> {wait} min
                </span>
              )}
              {r.acceptingNewClients && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Users size={12} /> Accepting
                </span>
              )}
              {!r.appointmentRequired && (
                <span className="flex items-center gap-1 text-blue-600">
                  <DoorOpen size={12} /> Walk-in
                </span>
              )}
            </div>
          </div>

          {/* Right side: open-soon badge + next date */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {openSoon && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                <Calendar size={12} /> This week
              </span>
            )}
            {nextOcc && (
              <span className="text-[11px] text-sand-400">
                Next: {fmtDate(nextOcc.startTime)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ── Filter state helpers ────────────────────────────────────────────── */

const EMPTY_FILTERS = {
  type: null, borough: null, zip: null, query: "",
  openOnly: false, tags: [], acceptingNew: false, walkIn: false,
  region: null, minRating: null, maxWait: null, sort: "name",
};

function getInitialFilters(sp) {
  return {
    type:         sp.get("type")       || null,
    borough:      sp.get("borough")    || null,
    zip:          sp.get("zip")        || null,
    query:        sp.get("q")          || "",
    openOnly:     sp.get("openOnly")   === "1",
    tags:         (sp.get("tags") || "").split(",").filter(Boolean),
    acceptingNew: sp.get("acceptingNew") === "1",
    walkIn:       sp.get("walkIn")     === "1",
    region:       sp.get("region")     || null,
    minRating:    sp.get("minRating")  ? Number(sp.get("minRating"))  : null,
    maxWait:      sp.get("maxWait")    ? Number(sp.get("maxWait"))    : null,
    sort:         sp.get("sort")       || "name",
  };
}

/* ── Top nav bar (shared between loading/error/main states) ──────────── */

function TopNav() {
  return (
    <nav className="h-14 bg-[#FDE97A] flex items-center px-6 shrink-0 shadow-sm z-20 relative">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-sm font-semibold text-[#3D2200] hover:text-[#3D2200]/80 transition-colors bg-white/50 px-3 py-1.5 rounded-lg hover:bg-white/80"
      >
        <ArrowLeft size={16} /> Dashboard
      </Link>
      <div className="h-5 w-px bg-[#3D2200]/10 mx-3" />
      <span className="text-base font-bold text-[#3D2200]">
        Explore Resources
      </span>
    </nav>
  );
}

/* ── Main content (needs useSearchParams — wrapped in Suspense) ──────── */

function ExploreContent({ embedded = false, persistedFilters = null, onFiltersChange = null }) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const { resources, resourcesMeta: meta, resourcesLoading: loading } = useAppData();
  const [filters,          setFilters]          = useState(() => persistedFilters ?? getInitialFilters(searchParams));
  const [page,             setPage]             = useState(Number(searchParams.get("page")) || 1);
  const [selectedResource, setSelectedResource] = useState(null);

  // Sync filter/page state → URL query string (skip when embedded in dashboard tab)
  useEffect(() => {
    if (embedded) return;
    const params = new URLSearchParams();
    if (filters.type)            params.set("type",         filters.type);
    if (filters.borough)         params.set("borough",      filters.borough);
    if (filters.zip)             params.set("zip",          filters.zip);
    if (filters.query)           params.set("q",            filters.query);
    if (filters.openOnly)        params.set("openOnly",     "1");
    if (filters.tags?.length)    params.set("tags",         filters.tags.join(","));
    if (filters.acceptingNew)    params.set("acceptingNew", "1");
    if (filters.walkIn)          params.set("walkIn",       "1");
    if (filters.region)          params.set("region",       filters.region);
    if (filters.minRating)       params.set("minRating",    String(filters.minRating));
    if (filters.maxWait)         params.set("maxWait",      String(filters.maxWait));
    if (filters.sort && filters.sort !== "name") params.set("sort", filters.sort);
    if (page > 1)                params.set("page",         String(page));
    const q = params.toString();
    router.replace(
      q ? `/dashboard/explore?${q}` : "/dashboard/explore",
      { scroll: false }
    );
  }, [embedded, filters, page, router]);

  // Reset page to 1 whenever a filter changes; notify parent to persist when embedded
  const setFiltersAndReset = useCallback((updater) => {
    setFilters((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (onFiltersChange) onFiltersChange(next);
      return next;
    });
    setPage(1);
  }, [onFiltersChange]);

  // All filtering + sorting in one memoized pass — no extra API calls
  const filtered = useMemo(() => {
    const q = filters.query?.toLowerCase();
    let result = resources
      .filter((r) => !filters.type    || r.resourceType?.id === filters.type)
      .filter((r) => !filters.borough || getBorough(r.zipCode) === filters.borough)
      .filter((r) => !filters.zip     || r.zipCode === filters.zip)
      .filter((r) => {
        if (!q) return true;
        return (
          (r.name           || "").toLowerCase().includes(q) ||
          (r.description    || "").toLowerCase().includes(q) ||
          (r.addressStreet1 || "").toLowerCase().includes(q)
        );
      })
      .filter((r) => !filters.openOnly     || isOpenSoon(r))
      .filter((r) =>
        !filters.tags?.length ||
        filters.tags.every((t) => (r.tags || []).some((tag) => tag.name === t))
      )
      .filter((r) => !filters.acceptingNew || r.acceptingNewClients === true)
      .filter((r) => !filters.walkIn       || r.appointmentRequired === false)
      .filter((r) =>
        !filters.region ||
        (r.regions || []).some((reg) => reg.id === filters.region)
      )
      .filter((r) =>
        !filters.minRating ||
        (r.ratingAverage != null && r.ratingAverage >= filters.minRating)
      )
      .filter((r) =>
        !filters.maxWait ||
        (r.waitTimeMinutesAverage != null &&
          r.waitTimeMinutesAverage <= filters.maxWait)
      );

    const sk = filters.sort || "name";
    result.sort((a, b) => {
      if (sk === "rating")  return (b.ratingAverage           ?? -1)  - (a.ratingAverage           ?? -1);
      if (sk === "wait")    return (a.waitTimeMinutesAverage   ?? 999) - (b.waitTimeMinutesAverage   ?? 999);
      if (sk === "reviews") return (b._count?.reviews          ?? 0)   - (a._count?.reviews          ?? 0);
      return (a.name || "").localeCompare(b.name || "");
    });

    return result;
  }, [resources, filters]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );

  const activeFilterCount = [
    filters.type, filters.borough, filters.zip, filters.region,
    filters.openOnly, filters.acceptingNew, filters.walkIn,
    filters.minRating, filters.maxWait,
    filters.tags?.length > 0,
  ].filter(Boolean).length;

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f3ef]">
        <TopNav />
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-[#FDE97A] border-t-[#3D2200] rounded-full animate-spin mb-4" />
            <p className="text-sand-600">Loading resources…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f3ef]">
      {!embedded && <TopNav />}

      <ExploreFilters
        meta={meta}
        filters={filters}
        setFilters={setFiltersAndReset}
      />

      {/* Result count + clear button */}
      <div className="px-4 py-2 text-xs font-medium text-sand-500 bg-[#f5f3ef] flex justify-between items-center shrink-0">
        <span>
          <strong className="text-sand-800">
            {totalCount.toLocaleString()}
          </strong>{" "}
          resources
          {activeFilterCount > 0 &&
            ` (${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active)`}
          {totalPages > 1 && ` — page ${safePage} of ${totalPages}`}
        </span>
        {activeFilterCount > 0 && (
          <button
            onClick={() => setFiltersAndReset(EMPTY_FILTERS)}
            className="text-xs text-sand-500 hover:text-sand-800 underline transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Search size={48} className="text-sand-300 mb-4" />
            <p className="text-sand-600 font-medium mb-1">
              No resources match your filters
            </p>
            <p className="text-sand-400 text-sm">
              Try broadening your search or removing some filters.
            </p>
          </div>
        ) : (
          <div className="py-1">
            {pageItems.map((r) => (
              <ResourceRow
                key={r.id}
                resource={r}
                onClick={() => setSelectedResource(r)}
              />
            ))}
          </div>
        )}
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
      />

      <Footer />

      {selectedResource && (
        <ResourceDetail
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
}

/* ── Wrapper to read embedded from URL (for iframe tab) ────────────────── */

function ExploreWithParams() {
  const searchParams = useSearchParams();
  const embedded = searchParams.get("embedded") === "1";
  return <ExploreContent embedded={embedded} />;
}

/* ── Page export (Suspense boundary required for useSearchParams) ─────── */

export default function ExplorePage({ embedded: embeddedProp, persistedFilters, onFiltersChange }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-[#f5f3ef]">
          <div className="flex flex-1 items-center justify-center p-8">
            <p className="text-sand-600">Loading…</p>
          </div>
        </div>
      }
    >
      {embeddedProp !== undefined ? (
        <ExploreContent
          embedded={embeddedProp}
          persistedFilters={persistedFilters}
          onFiltersChange={onFiltersChange}
        />
      ) : (
        <ExploreWithParams />
      )}
    </Suspense>
  );
}
