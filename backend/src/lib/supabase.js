const { createClient } = require("@supabase/supabase-js");

/**
 * Server-side Supabase client.
 * Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from env.
 */
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

module.exports = { getSupabaseClient };
