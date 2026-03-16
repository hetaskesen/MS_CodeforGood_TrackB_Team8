const crypto = require("crypto");
const { getSupabaseClient } = require("../lib/supabase");

/**
 * POST /api/reviews
 * Insert a client feedback review into the client_feedback table.
 */
async function createReview(req, res) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(503).json({
      error: "Supabase not configured",
      hint: "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env",
    });
  }

  const body = req.body || {};
  const attended = body.attended ?? null;

  const row = {
    id: crypto.randomUUID(),
    author_id: body.authorId || "anonymous",
    resource_id: body.resourceId || "unspecified",
    occurrence_id: body.occurrenceId ?? null,
    user_id: body.userId ?? null,
    reviewed_by_user_id: body.reviewedByUserId ?? null,

    attended,
    did_not_attend_reason:
      attended === false ? (body.didNotAttendReason ?? null) : null,

    // Supabase smallint columns require integers; coerce decimals (e.g. 1.5 stars)
    rating:
      attended === true && body.rating != null
        ? Math.round(Number(body.rating))
        : null,
    wait_time_minutes:
      attended === true && body.waitTimeMinutes != null
        ? Math.round(Number(body.waitTimeMinutes))
        : null,

    information_accurate: body.informationAccurate ?? null,
    inaccuracy_types: Array.isArray(body.inaccuracyTypes) ? body.inaccuracyTypes : [],
    inaccuracy_detail:
      body.inaccuracyDetail && typeof body.inaccuracyDetail === "string"
        ? body.inaccuracyDetail.trim() || null
        : null,
    text:
      body.text && typeof body.text === "string" && body.text.trim().length > 0
        ? body.text.trim()
        : null,
    share_text_with_resource: body.shareTextWithResource === true,
    display_name:
      body.displayName && typeof body.displayName === "string"
        ? body.displayName.trim() || null
        : null,

    photo_url: body.photoUrl ?? null,
    photo_public: body.photoUrl ? body.photoPublic === true : null,

    contact_email:
      body.contactEmail && typeof body.contactEmail === "string"
        ? body.contactEmail.trim() || null
        : null,
    contact_follow_up: body.contactFollowUp === true,
    enter_raffle: body.enterRaffle === true,
  };

  if (body.createdAt) {
    row.created_at = body.createdAt;
  }

  try {
    const { data, error } = await supabase
      .from("client_feedback")
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error("[POST /api/reviews] Supabase error:", error);
      return res.status(502).json({ error: error.message, code: error.code });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error("[POST /api/reviews] Unexpected error:", err);
    return res.status(500).json({ error: "Failed to save review" });
  }
}

/**
 * GET /api/reviews?resource_id=...&flag=negative|positive|raffle|follow_up|inaccurate
 * Fetch reviews. Optional filters:
 *   ?resource_id=xxx  — filter to a single resource
 *   ?flag=negative    — only reviews with rating ≤ 2 OR attended = false
 *   ?flag=positive    — only reviews with rating ≥ 4 AND share_text_with_resource = true
 *   ?flag=raffle      — only reviews where enter_raffle = true
 *   ?flag=follow_up   — only reviews where contact_follow_up = true
 *   ?flag=inaccurate  — only reviews where information_accurate = false
 */
async function getReviews(req, res) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(503).json({
      error: "Supabase not configured",
      hint: "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env",
    });
  }

  let query = supabase
    .from("client_feedback")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const resourceId = req.query.resource_id;
  if (resourceId) {
    query = query.eq("resource_id", resourceId);
  }

  const flag = req.query.flag;
  if (flag === "negative") {
    query = query.or("rating.lte.2,attended.eq.false");
  } else if (flag === "positive") {
    query = query.gte("rating", 4).eq("share_text_with_resource", true);
  } else if (flag === "raffle") {
    query = query.eq("enter_raffle", true);
  } else if (flag === "follow_up") {
    query = query.eq("contact_follow_up", true);
  } else if (flag === "inaccurate") {
    query = query.eq("information_accurate", false);
  }

  const { data, error } = await query.limit(2000);

  if (error) {
    return res.status(502).json({ error: error.message, code: error.code });
  }

  return res.json(data || []);
}

/**
 * GET /api/reviews/summary
 * Returns per-resource aggregates for the admin panel.
 * Groups client_feedback by resource_id and computes:
 *   total_reviews, avg_rating, low_rating_count, inaccurate_count,
 *   did_not_attend_count, raffle_count, follow_up_count, shareable_count
 * Sorted by avg_rating asc (lowest first).
 */
async function getReviewsSummary(req, res) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured" });
  }

  const { data, error } = await supabase
    .from("client_feedback")
    .select(
      "resource_id, rating, attended, information_accurate, enter_raffle, contact_follow_up, did_not_attend_reason, share_text_with_resource, text"
    )
    .is("deleted_at", null)
    .limit(2000);

  if (error) {
    return res.status(502).json({ error: error.message });
  }

  // Aggregate in JS — avoids needing a Postgres RPC
  const byResource = {};
  for (const row of data || []) {
    const id = row.resource_id || "unspecified";
    if (!byResource[id]) {
      byResource[id] = {
        resource_id: id,
        resourceName: null,
        total_reviews: 0,
        rating_sum: 0,
        rating_count: 0,
        low_rating_count: 0,
        high_rating_count: 0,
        inaccurate_count: 0,
        did_not_attend_count: 0,
        raffle_count: 0,
        follow_up_count: 0,
        shareable_count: 0,
      };
    }
    const r = byResource[id];
    r.total_reviews++;
    if (row.rating != null) {
      r.rating_sum += row.rating;
      r.rating_count++;
      if (row.rating <= 2) r.low_rating_count++;
      if (row.rating >= 4) r.high_rating_count++;
    }
    if (row.information_accurate === false) r.inaccurate_count++;
    if (row.attended === false) r.did_not_attend_count++;
    if (row.enter_raffle) r.raffle_count++;
    if (row.contact_follow_up) r.follow_up_count++;
    if (row.rating >= 4 && row.share_text_with_resource && row.text) r.shareable_count++;
  }

  const summaryMap = byResource;

  // Fetch resource names for all resource_ids in summary
  const resourceIds = Object.keys(summaryMap).filter(id => id !== "unspecified");
  if (resourceIds.length > 0) {
    const { data: resourceNames } = await supabase
      .from("resources")
      .select("id, raw")
      .in("id", resourceIds);

    if (resourceNames) {
      resourceNames.forEach(r => {
        const name = r.raw?.name || r.raw?.attributes?.name || null;
        if (summaryMap[r.id] && name) {
          summaryMap[r.id].resourceName = name;
        }
      });
    }
  }

  const summary = Object.values(summaryMap)
    .map((r) => ({
      ...r,
      avg_rating: r.rating_count > 0 ? +(r.rating_sum / r.rating_count).toFixed(2) : null,
      rating_sum: undefined,
    }))
    .sort((a, b) => (a.avg_rating ?? 99) - (b.avg_rating ?? 99));

  return res.json(summary);
}

/**
 * GET /api/reviews/ai-summary
 * Analyzes recent feedback text with Claude AI and returns themes, sentiment, and top issue.
 */
async function getReviewsAiSummary(req, res) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured" });
  }

  try {
    const { data: reviews, error } = await supabase
      .from("client_feedback")
      .select("text, rating, wait_time_minutes, information_accurate, inaccuracy_types")
      .not("text", "is", null)
      .neq("text", "")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!reviews?.length) {
      return res.json({
        themes: ["No feedback text available yet"],
        sentiment: "No data",
        topIssue: "None",
        reviewCount: 0,
        generatedAt: new Date().toISOString(),
      });
    }

    const avgRating = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
    const inaccuracyTypes = reviews
      .flatMap(r => r.inaccuracy_types || [])
      .reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {});
    const topInaccuracy = Object.entries(inaccuracyTypes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";

    const context = `You are analyzing community feedback for NYC food pantries.

Aggregate stats:
- Total reviews analyzed: ${reviews.length}
- Average rating: ${avgRating.toFixed(1)} / 5.0
- Most reported inaccuracy: ${topInaccuracy}

Recent feedback text samples:
${reviews.slice(0, 30).map((r, i) => `${i + 1}. "${r.text}"`).join("\n")}

Respond in JSON only with this exact structure:
{
  "themes": ["theme 1 in plain English", "theme 2", "theme 3"],
  "sentiment": "one sentence describing overall community sentiment",
  "topIssue": "the single most actionable improvement food banks could make"
}`;

    const Anthropic = require("@anthropic-ai/sdk");
    const client = new Anthropic.default();
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: context }],
    });

    const responseText = message.content[0]?.text ?? "{}";
    const clean = responseText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    res.json({
      ...parsed,
      reviewCount: reviews.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("AI summary error:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createReview, getReviews, getReviewsSummary, getReviewsAiSummary };
