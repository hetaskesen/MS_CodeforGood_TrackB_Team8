"use client";

import { useState, useEffect } from "react";
import Footer from "@/components/Footer";
import { createOnceEffect } from "@/hooks/useOnceEffect";

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

function SectionHeader({ icon, title, subtitle, count }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon && <span style={{ display: "flex", alignItems: "center", color: "#6B7280" }}>{icon}</span>}
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

function ratingLabel(rating) {
  if (rating < 2.5) return { text: "Critical", bg: "#FEE2E2", color: "#991B1B" };
  if (rating < 3.5) return { text: "Low", bg: "#FEF3C7", color: "#92400E" };
  return { text: "Good", bg: "#DCFCE7", color: "#166534" };
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
              {review.resourceName ?? `Resource ${review.resource_id?.slice(0, 8)}...`}
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {review.rating != null && (() => {
              const lbl = ratingLabel(review.rating);
              return (
                <>
                  <Badge bg={ratingBg(review.rating)} color={ratingText(review.rating)}>
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} {review.rating}/5
                  </Badge>
                  <span style={{ fontSize: 10, fontWeight: 700, background: lbl.bg, color: lbl.color, padding: "2px 6px", borderRadius: 4, marginLeft: 2 }}>
                    {lbl.text}
                  </span>
                </>
              );
            })()}
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
              <Badge bg="#FFF9E6" color="#854D0E" border="#FDE68A">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 11, height: 11, marginRight: 3 }}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" /></svg>
                Raffle
              </Badge>
            )}
            {review.contact_follow_up && (
              <Badge bg="#EFF6FF" color="#1D4ED8" border="#BFDBFE">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 11, height: 11, marginRight: 3 }}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
                Follow-up
              </Badge>
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
        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>}
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
                    {s.resourceName ?? `Resource ${s.resource_id?.slice(0, 8)}...`}
                  </span>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    <Badge bg={ratingBg(s.avg_rating)} color={ratingText(s.avg_rating)}>
                      ★ {s.avg_rating?.toFixed(1)} — {s.avg_rating != null ? ratingLabel(s.avg_rating).text : "No ratings"}
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
        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>}
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
        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>}
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
        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" /></svg>}
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
        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" /></svg>}
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
              {a.raffle && (
                <Badge bg="#FFF9E6" color="#854D0E" border="#FDE68A">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 11, height: 11, marginRight: 3 }}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" /></svg>
                  Eligible
                </Badge>
              )}
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

  const STAT_ICONS = {
    reviews: (color) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} style={{ width: 20, height: 20 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    risk: (color) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} style={{ width: 20, height: 20 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    ),
    flags: (color) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} style={{ width: 20, height: 20 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    followup: (color) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} style={{ width: 20, height: 20 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    raffle: (color) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} style={{ width: 20, height: 20 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
      </svg>
    ),
    share: (color) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color} style={{ width: 20, height: 20 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
      </svg>
    ),
  };

  const cards = [
    { label: "Total reviews",     value: totalReviews,    bg: "#F0FDF4", text: "#166534", iconKey: "reviews" },
    { label: "Resources at risk", value: needsAttention,  bg: "#FEE2E2", text: "#991B1B", iconKey: "risk" },
    { label: "Info flags",        value: inaccurateCount, bg: "#FEF3C7", text: "#92400E", iconKey: "flags" },
    { label: "Follow-up pending", value: followUpCount,   bg: "#EFF6FF", text: "#1D4ED8", iconKey: "followup" },
    { label: "Raffle entrants",   value: raffleCount,     bg: "#FFFBEB", text: "#854D0E", iconKey: "raffle" },
    { label: "Ready to share",    value: shareableCount,  bg: "#F5F3FF", text: "#5B21B6", iconKey: "share" },
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
          {STAT_ICONS[c.iconKey](c.text)}
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
                    {s.resourceName ?? `Resource ${s.resource_id?.slice(0, 8)}...`}
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

/* ── AI Insights Tab ─────────────────────────────────────────────────────── */
function AIInsightsTab({ apiUrl }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetch(`${apiUrl}/api/reviews/ai-summary`).then(r => r.json());
      setSummary(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
        AI Feedback Analysis
      </div>
      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 16 }}>
        Analyzes the most recent community feedback using Claude AI to identify patterns and actionable insights.
      </div>
      {!summary && !loading && (
        <button
          onClick={generateSummary}
          style={{
            background: "#2D6A4F", color: "#fff", border: "none",
            borderRadius: 8, padding: "10px 20px", fontSize: 13,
            fontWeight: 600, cursor: "pointer",
          }}
        >
          Generate AI Summary
        </button>
      )}
      {loading && (
        <div style={{ color: "#6B7280", fontSize: 13, padding: 16 }}>
          Analyzing feedback with Claude AI…
        </div>
      )}
      {error && (
        <div style={{ color: "#DC2626", fontSize: 12, padding: 12, background: "#FEF2F2", borderRadius: 8 }}>
          Error: {error}
        </div>
      )}
      {summary && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#166534", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                Community Sentiment
              </div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{summary.sentiment}</div>
            </div>
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#991B1B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                Top Actionable Issue
              </div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{summary.topIssue}</div>
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
              Recurring Themes
            </div>
            {(summary.themes || []).map((theme, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#EEF2FF", color: "#4F46E5", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{theme}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>
            Based on {summary.reviewCount} reviews · Generated {new Date(summary.generatedAt).toLocaleString()}
            {" · "}
            <button onClick={generateSummary} style={{ fontSize: 11, color: "#6B7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tab definitions ─────────────────────────────────────────────────────── */
const TABS = [
  { id: "overview",  label: "Overview" },
  { id: "quality",   label: "Quality" },
  { id: "support",   label: "Client support" },
  { id: "sharing",   label: "Public sharing" },
  { id: "updates",   label: "Resource updates" },
  { id: "incentive", label: "Incentive / Raffle" },
  { id: "insights",  label: "AI Insights" },
];

const ADMIN_TAB_ICONS = {
  overview: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14, marginRight: 5, flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>,
  quality: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14, marginRight: 5, flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>,
  support: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14, marginRight: 5, flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>,
  sharing: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14, marginRight: 5, flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>,
  updates: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14, marginRight: 5, flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>,
  incentive: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14, marginRight: 5, flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" /></svg>,
  insights: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14, marginRight: 5, flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>,
};

const useAdminFetchOnce = createOnceEffect();

/* ── Main component ──────────────────────────────────────────────────────── */
export default function AdminPanel() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const [tab, setTab] = useState("overview");
  const [summary, setSummary] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useAdminFetchOnce(() => {
    if (!apiUrl) {
      setError("API URL not configured. Set NEXT_PUBLIC_API_URL in your .env.local file.");
      setLoading(false);
      return;
    }
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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20, color: "#2D6A4F", flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
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
                display: "flex", alignItems: "center",
              }}
            >
              {ADMIN_TAB_ICONS[t.id]} {t.label}
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
            {tab === "insights"  && <AIInsightsTab apiUrl={apiUrl} />}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
