"use client";

import { useState, useEffect } from "react";
import Footer from "@/components/Footer";

/* ── colour helpers ──────────────────────────────────────────────────────── */
function ratingBg(r) {
  if (r == null) return "#F3F4F6";
  if (r >= 4)   return "#DCFCE7";
  if (r >= 3)   return "#FEF9C3";
  if (r >= 2)   return "#FEF3C7";
  return "#FEE2E2";
}
function ratingText(r) {
  if (r == null) return "#6B7280";
  if (r >= 4)   return "#166534";
  if (r >= 3)   return "#854D0E";
  if (r >= 2)   return "#92400E";
  return "#991B1B";
}
function ratingLabel(r) {
  if (r == null) return "No ratings";
  if (r >= 4)   return "Good";
  if (r >= 3)   return "Fair";
  if (r >= 2)   return "At risk";
  return "Poor";
}

/* ── tiny shared primitives ──────────────────────────────────────────────── */
function Badge({ children, bg, color, border }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "2px 9px", borderRadius: 20,
        fontSize: 11, fontWeight: 700,
        background: bg, color, border: `1px solid ${border ?? bg}`,
      }}
    >
      {children}
    </span>
  );
}

function SectionHeader({ emoji, title, subtitle, count }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: 0 }}>{title}</h2>
        {count != null && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 8px",
            borderRadius: 12, background: "#F3F4F6", color: "#6B7280",
          }}>
            {count}
          </span>
        )}
      </div>
      {subtitle && (
        <p style={{ fontSize: 12, color: "#6B7280", margin: "3px 0 0 26px" }}>{subtitle}</p>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{
      padding: "32px 16px", textAlign: "center",
      color: "#9CA3AF", fontSize: 13, background: "#F9FAFB",
      borderRadius: 12, border: "1px dashed #E5E7EB",
    }}>
      {message}
    </div>
  );
}

function ReviewCard({ review, onAction, actionLabel, actionColor, actionBg, showResource = true }) {
  const [done, setDone] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const timeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (done) return null;

  const hasInaccuracy = review.inaccuracy_types?.length > 0;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderLeft: review.rating <= 2 ? "4px solid #EF4444"
          : review.attended === false ? "4px solid #F59E0B"
          : review.rating >= 4 ? "4px solid #2D6A4F"
          : "4px solid #E5E7EB",
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {showResource && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: "#6B7280",
              background: "#F3F4F6", padding: "2px 7px", borderRadius: 6,
              display: "inline-block", marginBottom: 4, maxWidth: "100%",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              ID: {review.resource_id}
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {review.rating != null && (
              <Badge bg={ratingBg(review.rating)} color={ratingText(review.rating)}>
                {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} {review.rating}/5
              </Badge>
            )}
            {review.attended === false && (
              <Badge bg="#FEF3C7" color="#92400E" border="#FDE68A">
                Didn't attend{review.did_not_attend_reason ? ` — ${review.did_not_attend_reason.replace(/_/g, " ")}` : ""}
              </Badge>
            )}
            {hasInaccuracy && (
              <Badge bg="#FEE2E2" color="#991B1B" border="#FECACA">
                ⚠ Wrong: {review.inaccuracy_types.join(", ")}
              </Badge>
            )}
            {review.enter_raffle && (
              <Badge bg="#FFF9E6" color="#854D0E" border="#FDE68A">🎟 Raffle</Badge>
            )}
            {review.contact_follow_up && (
              <Badge bg="#EFF6FF" color="#1D4ED8" border="#BFDBFE">💬 Follow-up</Badge>
            )}
          </div>
        </div>
        <span style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap", marginLeft: 8, marginTop: 2 }}>
          {timeAgo(review.created_at)}
        </span>
      </div>

      {review.text && (
        <p
          onClick={() => setExpanded((v) => !v)}
          style={{
            fontSize: 13, color: "#374151", lineHeight: 1.6,
            margin: "6px 0", cursor: "pointer",
            display: "-webkit-box", WebkitBoxOrient: "vertical",
            WebkitLineClamp: expanded ? "none" : 2,
            overflow: expanded ? "visible" : "hidden",
          }}
        >
          "{review.text}"
          {!expanded && review.text.length > 120 && (
            <span style={{ color: "#6B7280", fontStyle: "italic" }}> (tap to expand)</span>
          )}
        </p>
      )}

      {expanded && review.inaccuracy_detail && (
        <div style={{
          margin: "6px 0", padding: "8px 10px",
          background: "#FFF7ED", borderRadius: 7,
          fontSize: 12, color: "#92400E", lineHeight: 1.5,
          borderLeft: "3px solid #F59E0B",
        }}>
          <strong>Correction provided:</strong> {review.inaccuracy_detail}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#9CA3AF", flexWrap: "wrap" }}>
          <span>Author: <strong style={{ color: "#6B7280" }}>{review.author_id}</strong></span>
          {review.display_name && <span>As: <strong style={{ color: "#6B7280" }}>{review.display_name}</strong></span>}
          {review.wait_time_minutes != null && <span>Wait: <strong style={{ color: "#6B7280" }}>{review.wait_time_minutes} min</strong></span>}
          {review.reviewed_by_user_id && (
            <span style={{ color: "#7C3AED" }}>✓ Reviewed by {review.reviewed_by_user_id}</span>
          )}
        </div>
        {actionLabel && (
          <button
            onClick={() => { onAction?.(review); setDone(true); }}
            style={{
              fontSize: 11, fontWeight: 600, padding: "4px 12px",
              borderRadius: 8, border: "none", cursor: "pointer",
              background: actionBg ?? "#F3F4F6",
              color: actionColor ?? "#374151",
              transition: "opacity 0.15s",
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── 1. Quality Improvement ──────────────────────────────────────────────── */
function QualitySection({ summary, apiUrl }) {
  const [expanded, setExpanded] = useState(null);
  const [reviews, setReviews] = useState({});

  const loadReviews = (resourceId) => {
    if (reviews[resourceId]) {
      setExpanded(expanded === resourceId ? null : resourceId);
      return;
    }
    fetch(`${apiUrl}/api/reviews?resource_id=${encodeURIComponent(resourceId)}&flag=negative`)
      .then((r) => r.json())
      .then((data) => {
        setReviews((prev) => ({ ...prev, [resourceId]: Array.isArray(data) ? data : [] }));
        setExpanded(resourceId);
      })
      .catch(() => {});
  };

  const atRisk = summary.filter((s) => s.avg_rating != null && s.avg_rating < 3.5);

  return (
    <section style={{ marginBottom: 32 }}>
      <SectionHeader
        emoji="📉"
        title="Quality improvement"
        subtitle="Resources with low avg rating or high inaccuracy flags — click to drill into their reviews."
        count={atRisk.length}
      />
      {atRisk.length === 0
        ? <EmptyState message="No resources below 3.5 stars — great job!" />
        : atRisk.map((s) => (
          <div key={s.resource_id} style={{ marginBottom: 6 }}>
            <button
              onClick={() => loadReviews(s.resource_id)}
              style={{
                width: "100%", textAlign: "left",
                background: "#fff", border: "1px solid #E5E7EB",
                borderLeft: `4px solid ${ratingText(s.avg_rating)}`,
                borderRadius: 10, padding: "12px 16px", cursor: "pointer",
                transition: "box-shadow 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                    ID: {s.resource_id}
                  </span>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    <Badge bg={ratingBg(s.avg_rating)} color={ratingText(s.avg_rating)}>
                      ★ {s.avg_rating?.toFixed(1)} — {ratingLabel(s.avg_rating)}
                    </Badge>
                    <Badge bg="#F3F4F6" color="#374151">{s.total_reviews} reviews</Badge>
                    {s.inaccurate_count > 0 && (
                      <Badge bg="#FEE2E2" color="#991B1B" border="#FECACA">
                        {s.inaccurate_count} inaccuracy flag{s.inaccurate_count > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {s.low_rating_count > 0 && (
                      <Badge bg="#FEF3C7" color="#92400E" border="#FDE68A">
                        {s.low_rating_count} low rating{s.low_rating_count > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                  {expanded === s.resource_id ? "▲ Hide" : "▼ Show reviews"}
                </span>
              </div>
            </button>
            {expanded === s.resource_id && (
              <div style={{ paddingLeft: 4, paddingTop: 4 }}>
                {(reviews[s.resource_id] ?? []).length === 0
                  ? <EmptyState message="No negative reviews for this resource yet." />
                  : (reviews[s.resource_id] ?? []).map((r) => (
                    <ReviewCard
                      key={r.id}
                      review={r}
                      showResource={false}
                      actionLabel="✓ Mark reviewed"
                      actionBg="#DCFCE7"
                      actionColor="#166534"
                    />
                  ))
                }
              </div>
            )}
          </div>
        ))
      }
    </section>
  );
}

/* ── 2. Client Support ───────────────────────────────────────────────────── */
function ClientSupportSection({ reviews }) {
  const flagged = reviews.filter(
    (r) => r.rating <= 2 || r.attended === false || r.contact_follow_up
  );

  return (
    <section style={{ marginBottom: 32 }}>
      <SectionHeader
        emoji="💬"
        title="Client support"
        subtitle="Negative experiences and clients who opted in for follow-up. Reach out to close the loop."
        count={flagged.length}
      />
      {flagged.length === 0
        ? <EmptyState message="No flagged reviews needing follow-up." />
        : flagged.map((r) => (
          <ReviewCard
            key={r.id}
            review={r}
            actionLabel={r.contact_follow_up ? "📧 Send follow-up" : "🚩 Create client flag"}
            actionBg={r.contact_follow_up ? "#EFF6FF" : "#FEF3C7"}
            actionColor={r.contact_follow_up ? "#1D4ED8" : "#92400E"}
          />
        ))
      }
    </section>
  );
}

/* ── 3. Public Sharing ───────────────────────────────────────────────────── */
function PublicSharingSection({ reviews }) {
  const shareable = reviews.filter(
    (r) => r.rating >= 4 && r.share_text_with_resource && r.text
  );

  return (
    <section style={{ marginBottom: 32 }}>
      <SectionHeader
        emoji="📣"
        title="Ready to share publicly"
        subtitle="Positive reviews with sharing consent. Publish these on social feeds or the Lemontree website."
        count={shareable.length}
      />
      {shareable.length === 0
        ? <EmptyState message="No shareable positive reviews yet." />
        : shareable.map((r) => (
          <ReviewCard
            key={r.id}
            review={r}
            actionLabel="🌐 Publish to feed"
            actionBg="#DCFCE7"
            actionColor="#166534"
          />
        ))
      }
    </section>
  );
}

/* ── 4. Resource Updates ─────────────────────────────────────────────────── */
function ResourceUpdatesSection({ reviews }) {
  const byResource = {};
  reviews.forEach((r) => {
    if (r.information_accurate === false) {
      if (!byResource[r.resource_id]) byResource[r.resource_id] = [];
      byResource[r.resource_id].push(r);
    }
  });
  const groups = Object.entries(byResource).sort((a, b) => b[1].length - a[1].length);

  return (
    <section style={{ marginBottom: 32 }}>
      <SectionHeader
        emoji="🔧"
        title="Resource updates needed"
        subtitle="Clients reported inaccurate listing information. Flag these for correction."
        count={groups.length}
      />
      {groups.length === 0
        ? <EmptyState message="No inaccuracy reports." />
        : groups.map(([resourceId, rList]) => {
          const typeTally = {};
          rList.forEach((r) =>
            (r.inaccuracy_types ?? []).forEach((t) => {
              typeTally[t] = (typeTally[t] ?? 0) + 1;
            })
          );
          const corrections = rList.filter((r) => r.inaccuracy_detail).map((r) => r.inaccuracy_detail);

          return (
            <div key={resourceId} style={{
              background: "#fff", border: "1px solid #E5E7EB",
              borderLeft: "4px solid #F59E0B", borderRadius: 10,
              padding: "14px 16px", marginBottom: 8,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                    Resource ID: {resourceId}
                  </span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    <Badge bg="#FEF3C7" color="#92400E" border="#FDE68A">
                      {rList.length} report{rList.length > 1 ? "s" : ""}
                    </Badge>
                    {Object.entries(typeTally).map(([type, n]) => (
                      <Badge key={type} bg="#FEE2E2" color="#991B1B" border="#FECACA">
                        {type} ×{n}
                      </Badge>
                    ))}
                  </div>
                  {corrections.length > 0 && (
                    <div style={{
                      marginTop: 8, padding: "8px 10px",
                      background: "#FFFBEB", borderRadius: 7,
                      fontSize: 12, color: "#78350F", lineHeight: 1.6,
                    }}>
                      <strong>Correction(s) from clients:</strong>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: 16 }}>
                        {[...new Set(corrections)].map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
                <button
                  style={{
                    fontSize: 11, fontWeight: 600, padding: "5px 12px",
                    borderRadius: 8, border: "none", cursor: "pointer",
                    background: "#FEF3C7", color: "#92400E",
                  }}
                >
                  🚩 Create resource flag
                </button>
              </div>
            </div>
          );
        })
      }
    </section>
  );
}

/* ── 5. Incentive / Raffle ───────────────────────────────────────────────── */
function IncentiveSection({ reviews }) {
  const entrants = reviews.filter((r) => r.enter_raffle && r.contact_email);

  const byAuthor = {};
  reviews.forEach((r) => {
    const id = r.author_id || "anonymous";
    if (!byAuthor[id]) byAuthor[id] = { author_id: id, count: 0, raffle: false, email: null };
    byAuthor[id].count++;
    if (r.enter_raffle) byAuthor[id].raffle = true;
    if (r.contact_email) byAuthor[id].email = r.contact_email;
  });
  const leaderboard = Object.values(byAuthor).sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <section style={{ marginBottom: 32 }}>
      <SectionHeader
        emoji="🎟"
        title="Incentive program"
        subtitle="Clients who opted into the raffle and top contributors by review count."
        count={entrants.length}
      />

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Raffle entrants ({entrants.length})
        </div>
        {entrants.length === 0
          ? <EmptyState message="No raffle entrants yet." />
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {entrants.map((r) => (
                <div key={r.id} style={{
                  background: "#FFFBEB", border: "1px solid #FDE68A",
                  borderRadius: 9, padding: "10px 14px",
                  display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8,
                }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#78350F" }}>
                      {r.contact_email}
                    </span>
                    <span style={{ fontSize: 11, color: "#92400E", marginLeft: 8 }}>
                      {r.author_id} · {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {r.rating != null && (
                    <Badge bg={ratingBg(r.rating)} color={ratingText(r.rating)}>
                      ★ {r.rating}/5
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )
        }
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Top contributors
        </div>
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
          {leaderboard.map((a, i) => (
            <div key={a.author_id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 16px",
              borderBottom: i < leaderboard.length - 1 ? "1px solid #F3F4F6" : undefined,
              background: i === 0 ? "#FFFBEB" : undefined,
            }}>
              <span style={{ fontSize: 16, width: 24, textAlign: "center", flexShrink: 0 }}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: "#374151", fontWeight: i < 3 ? 700 : 400 }}>
                {a.author_id}
              </span>
              <span style={{ fontSize: 12, color: "#6B7280" }}>
                {a.count} review{a.count > 1 ? "s" : ""}
              </span>
              {a.raffle && <Badge bg="#FFF9E6" color="#854D0E" border="#FDE68A">🎟 Eligible</Badge>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Stat cards (derived from summary, same source as the table) ─────────── */
function StatCards({ summary }) {
  const totalReviews   = summary.reduce((acc, s) => acc + (s.total_reviews || 0), 0);
  const needsAttention = summary.filter((s) => s.avg_rating != null && s.avg_rating < 3).length;
  const inaccurateCount = summary.reduce((acc, s) => acc + (s.inaccurate_count || 0), 0);
  const followUpCount  = summary.reduce((acc, s) => acc + (s.follow_up_count || 0), 0);
  const raffleCount    = summary.reduce((acc, s) => acc + (s.raffle_count || 0), 0);
  const shareableCount = summary.reduce((acc, s) => acc + (s.shareable_count || 0), 0);

  const cards = [
    { label: "Total reviews",     value: totalReviews,    bg: "#F0FDF4", text: "#166534", icon: "📝" },
    { label: "Resources at risk", value: needsAttention,  bg: "#FEE2E2", text: "#991B1B", icon: "📉" },
    { label: "Info flags",        value: inaccurateCount, bg: "#FEF3C7", text: "#92400E", icon: "🔧" },
    { label: "Follow-up pending", value: followUpCount,   bg: "#EFF6FF", text: "#1D4ED8", icon: "💬" },
    { label: "Raffle entrants",   value: raffleCount,     bg: "#FFFBEB", text: "#854D0E", icon: "🎟" },
    { label: "Ready to share",    value: shareableCount,  bg: "#F5F3FF", text: "#5B21B6", icon: "📣" },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
      gap: 10, marginBottom: 28,
    }}>
      {cards.map((c) => (
        <div key={c.label} style={{
          background: c.bg, borderRadius: 12,
          padding: "14px 16px",
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          <span style={{ fontSize: 20 }}>{c.icon}</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: c.text, lineHeight: 1.1 }}>{c.value}</span>
          <span style={{ fontSize: 11, color: c.text, opacity: 0.8 }}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Overview tab ────────────────────────────────────────────────────────── */
function OverviewTab({ summary, allReviews, apiUrl }) {
  return (
    <div>
      <StatCards summary={summary} />

      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>
            All resources — review summary
          </h3>
          <p style={{ fontSize: 12, color: "#6B7280", margin: "2px 0 0" }}>
            Sorted by avg rating (lowest first).
          </p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Resource ID", "Reviews", "Avg rating", "Low (≤2)", "Inaccurate", "Follow-up", "Raffle", "Ready to share"].map((h) => (
                  <th key={h} style={{
                    padding: "10px 14px", textAlign: h === "Resource ID" ? "left" : "center",
                    fontWeight: 700, color: "#6B7280", whiteSpace: "nowrap",
                    borderBottom: "1px solid #E5E7EB",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.map((s, i) => (
                <tr key={s.resource_id} style={{ background: i % 2 === 0 ? "#fff" : "#F9FAFB" }}>
                  <td style={{ padding: "9px 14px", fontWeight: 600, color: "#374151", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.resource_id}
                  </td>
                  <td style={{ padding: "9px 14px", textAlign: "center", color: "#374151" }}>{s.total_reviews}</td>
                  <td style={{ padding: "9px 14px", textAlign: "center" }}>
                    {s.avg_rating != null
                      ? <span style={{ background: ratingBg(s.avg_rating), color: ratingText(s.avg_rating), padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                          {s.avg_rating.toFixed(1)}
                        </span>
                      : <span style={{ color: "#9CA3AF" }}>—</span>
                    }
                  </td>
                  <td style={{ padding: "9px 14px", textAlign: "center", color: s.low_rating_count > 0 ? "#DC2626" : "#9CA3AF", fontWeight: s.low_rating_count > 0 ? 700 : 400 }}>
                    {s.low_rating_count || "—"}
                  </td>
                  <td style={{ padding: "9px 14px", textAlign: "center", color: s.inaccurate_count > 0 ? "#D97706" : "#9CA3AF", fontWeight: s.inaccurate_count > 0 ? 700 : 400 }}>
                    {s.inaccurate_count || "—"}
                  </td>
                  <td style={{ padding: "9px 14px", textAlign: "center", color: s.follow_up_count > 0 ? "#2563EB" : "#9CA3AF", fontWeight: s.follow_up_count > 0 ? 700 : 400 }}>
                    {s.follow_up_count || "—"}
                  </td>
                  <td style={{ padding: "9px 14px", textAlign: "center", color: s.raffle_count > 0 ? "#92400E" : "#9CA3AF", fontWeight: s.raffle_count > 0 ? 700 : 400 }}>
                    {s.raffle_count || "—"}
                  </td>
                  <td style={{ padding: "9px 14px", textAlign: "center", color: (s.shareable_count || 0) > 0 ? "#5B21B6" : "#9CA3AF", fontWeight: (s.shareable_count || 0) > 0 ? 700 : 400 }}>
                    {s.shareable_count ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#F3F4F6", fontWeight: 700, borderTop: "2px solid #E5E7EB" }}>
                <td style={{ padding: "10px 14px", color: "#374151" }}>Total</td>
                <td style={{ padding: "10px 14px", textAlign: "center", color: "#166534" }}>
                  {summary.reduce((acc, s) => acc + (s.total_reviews || 0), 0)}
                </td>
                <td style={{ padding: "10px 14px", textAlign: "center", color: "#9CA3AF" }}>—</td>
                <td style={{ padding: "10px 14px", textAlign: "center", color: "#374151" }}>
                  {summary.reduce((acc, s) => acc + (s.low_rating_count || 0), 0)}
                </td>
                <td style={{ padding: "10px 14px", textAlign: "center", color: "#374151" }}>
                  {summary.reduce((acc, s) => acc + (s.inaccurate_count || 0), 0)}
                </td>
                <td style={{ padding: "10px 14px", textAlign: "center", color: "#374151" }}>
                  {summary.reduce((acc, s) => acc + (s.follow_up_count || 0), 0)}
                </td>
                <td style={{ padding: "10px 14px", textAlign: "center", color: "#374151" }}>
                  {summary.reduce((acc, s) => acc + (s.raffle_count || 0), 0)}
                </td>
                <td style={{ padding: "10px 14px", textAlign: "center", color: "#374151" }}>
                  {summary.reduce((acc, s) => acc + (s.shareable_count || 0), 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Tab definitions ─────────────────────────────────────────────────────── */
const TABS = [
  { id: "overview",  label: "Overview",          emoji: "📊" },
  { id: "quality",   label: "Quality",            emoji: "📉" },
  { id: "support",   label: "Client support",     emoji: "💬" },
  { id: "sharing",   label: "Public sharing",     emoji: "📣" },
  { id: "updates",   label: "Resource updates",   emoji: "🔧" },
  { id: "incentive", label: "Incentive / Raffle", emoji: "🎟" },
];

// Module-level guard — survives AdminPanel remounts (e.g. tab switch, Strict Mode)
let adminFetchStarted = false;

/* ── Main component ──────────────────────────────────────────────────────── */
export default function AdminPanel() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const [tab, setTab] = useState("overview");
  const [summary, setSummary] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiUrl) {
      setError("API URL not configured. Set NEXT_PUBLIC_API_URL in your .env.local file.");
      setLoading(false);
      return;
    }
    if (adminFetchStarted) return;
    adminFetchStarted = true;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${apiUrl}/api/reviews/summary`).then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      }),
      fetch(`${apiUrl}/api/reviews`).then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      }),
    ])
      .then(([sumData, reviewData]) => {
        setSummary(Array.isArray(sumData) ? sumData : []);
        setAllReviews(Array.isArray(reviewData) ? reviewData : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [apiUrl]);

  return (
    <div style={{
      height: "100%", overflowY: "auto",
      background: "#F8F9FA",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Sticky header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "#fff", borderBottom: "1px solid #E5E7EB",
        padding: "0 32px",
      }}>
        <div style={{ paddingTop: 16, paddingBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>
              Admin — Feedback Analytics
            </h1>
            {!loading && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: "#DCFCE7", color: "#166534",
                padding: "2px 8px", borderRadius: 10,
              }}>
                ● Live data
              </span>
            )}
          </div>
        </div>

        {/* Internal tab bar */}
        <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "10px 16px",
                fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
                border: "none", borderBottom: tab === t.id ? "2.5px solid #2D6A4F" : "2.5px solid transparent",
                background: "transparent",
                color: tab === t.id ? "#2D6A4F" : "#6B7280",
                cursor: "pointer", whiteSpace: "nowrap",
                transition: "color 0.15s",
                fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 32px" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#6B7280", padding: "32px 0" }}>
            <div style={{
              width: 20, height: 20,
              border: "2px solid #FDE97A", borderTop: "2px solid #3D2200",
              borderRadius: "50%",
              animation: "adminSpin 0.8s linear infinite",
            }} />
            Loading reviews…
            <style>{`@keyframes adminSpin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {!loading && error && (
          <div style={{ padding: "16px", background: "#FEE2E2", borderRadius: 10, color: "#991B1B", fontSize: 13 }}>
            Could not load reviews: {error}. Is the backend running?
          </div>
        )}
        {!loading && !error && (
          <>
            {tab === "overview"  && <OverviewTab summary={summary} allReviews={allReviews} apiUrl={apiUrl} />}
            {tab === "quality"   && <QualitySection summary={summary} apiUrl={apiUrl} />}
            {tab === "support"   && <ClientSupportSection reviews={allReviews} />}
            {tab === "sharing"   && <PublicSharingSection reviews={allReviews} />}
            {tab === "updates"   && <ResourceUpdatesSection reviews={allReviews} />}
            {tab === "incentive" && <IncentiveSection reviews={allReviews} />}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
