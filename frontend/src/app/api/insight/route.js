// Server-side API route for AI insights in the Report Builder.
// Uses an in-memory cache keyed by (xVar, yVar, chartType, persona) so the
// same combination is never billed twice per server lifetime.
// Uses gemini-2.5-flash (thinking disabled) with maxOutputTokens: 150.

const insightCache = new Map();

const PERSONA_FRAME = {
  "pantry-operator":
    "Frame this for a food pantry operator deciding how to allocate volunteer shifts, request supplies, or expand their hours.",
  donor:
    "Frame this for a private donor deciding which NYC neighborhoods to fund first for maximum food-access impact.",
  government:
    "Frame this for a city policy analyst identifying systemic gaps that require targeted program interventions or budget allocation.",
};

function personaFrame(persona) {
  return PERSONA_FRAME[persona] ?? PERSONA_FRAME["donor"];
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { xVar, xLabel, yVar, yLabel, chartType, persona, summary } = body;

    if (!xVar || !chartType || !summary) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Cache key — same chart config + persona = same insight, free on repeat
    const cacheKey = `${xVar}|${yVar ?? "none"}|${chartType}|${persona ?? "donor"}`;
    if (insightCache.has(cacheKey)) {
      return Response.json({ insight: insightCache.get(cacheKey), cached: true });
    }

    const apiKey = (process.env.GOOGLE_AI_API_KEY ?? "").trim();
    if (!apiKey) {
      console.warn("[insight] GOOGLE_AI_API_KEY not set — using fallback");
      return Response.json({
        insight: buildFallback(persona, xLabel, summary),
        cached: false,
      });
    }

    const prompt = buildPrompt({ xLabel, yLabel, chartType, persona, summary });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text().catch(() => "(unreadable)");
      console.error(`[insight] Gemini API error ${response.status}: ${errBody}`);
      return Response.json({
        insight: buildFallback(persona, xLabel, summary),
        cached: false,
      });
    }

    const data = await response.json();
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
    if (!text) {
      console.warn("[insight] Gemini returned empty text, candidates:", JSON.stringify(data.candidates));
    }
    const insight = text || buildFallback(persona, xLabel, summary);

    insightCache.set(cacheKey, insight);
    return Response.json({ insight, cached: false });
  } catch {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

// ── Prompt builder ─────────────────────────────────────────────────────────

function buildPrompt({ xLabel, yLabel, chartType, persona, summary }) {
  const frame = personaFrame(persona);

  let dataBlock;
  if (summary.type === "single") {
    const { mean, median, min, max, top3, bottom3, count } = summary;
    dataBlock = `Variable: ${xLabel}
Chart: ${chartType}
NYC ZIPs analyzed: ${count}
Mean: ${mean} | Median: ${median} | Min: ${min} | Max: ${max}
Highest ZIPs: ${top3.map((z) => `${z.zip} (${z.borough}): ${z.value}`).join(", ")}
Lowest ZIPs: ${bottom3.map((z) => `${z.zip} (${z.borough}): ${z.value}`).join(", ")}`;
  } else {
    const { pearsonR, count, boroughAverages, topOutliers } = summary;
    dataBlock = `X variable: ${xLabel}
Y variable: ${yLabel}
Chart: ${chartType}
NYC ZIPs analyzed: ${count}
Pearson correlation (r): ${pearsonR}
Borough averages: ${boroughAverages.map((b) => `${b.borough} — ${xLabel}: ${b.avgX}, ${yLabel}: ${b.avgY}`).join("; ")}
Notable outliers: ${topOutliers.map((z) => `${z.zip} (${z.borough}): X=${z.x}, Y=${z.y}`).join(", ")}`;
  }

  return `You are analyzing real NYC food access data for LemonTree, a nonprofit food resource finder.

${dataBlock}

${frame}

Write exactly 2 sentences:
1. One specific finding using only the numbers above — name a specific ZIP code or borough if relevant.
2. One concrete, actionable implication for the person described above.

Use only the numbers provided. Do not invent any figures not listed above. No preamble.`;
}

// ── Deterministic fallback (no API key / API error) ────────────────────────

function buildFallback(persona, xLabel, summary) {
  const s = summary ?? {};
  if (persona === "pantry-operator") {
    return `${xLabel} varies significantly across NYC ZIPs — ZIP ${s.top3?.[0]?.zip ?? "data"} shows the highest value in this dataset. Understanding where your pantry sits relative to neighborhood averages can help you prioritize outreach and request targeted supply support.`;
  }
  if (persona === "government") {
    return `ZIPs in the bottom quartile for ${xLabel} show a persistent gap relative to citywide averages (mean: ${s.mean ?? "—"}). Targeted allocation of city resources toward these areas would address the most acute service deficits.`;
  }
  return `High-need areas often show lower ${xLabel}, with ZIP ${s.bottom3?.[0]?.zip ?? "data"} among the most under-resourced in NYC. Prioritizing donations to these neighborhoods would have the greatest measurable impact on food access.`;
}
