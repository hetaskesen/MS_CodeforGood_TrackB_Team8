const { getSupabaseClient } = require("../lib/supabase");

const PAGE_SIZE = 1000;

async function getResources(req, res) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(503).json({
      error: "Supabase not configured",
      hint: "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env",
    });
  }

  const baseQuery = supabase
    .from("resources")
    .select("raw", { count: "exact" })
    .eq("status", "PUBLISHED")
    .or("merged_to_resource_id.is.null,merged_to_resource_id.eq.")
    .order("id", { ascending: true });

  const allRows = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await baseQuery.range(from, to);

    if (error) {
      return res.status(502).json({ error: error.message, code: error.code });
    }

    const page = data || [];
    allRows.push(...page);
    hasMore = page.length === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  const resources = allRows
    .map((row) => row?.raw)
    .filter((r) => r != null && r.id != null);

  res.json(resources);
}

module.exports = { getResources };
