import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceEnv, hasSupabaseServiceEnv } from "./env";

export function createSupabaseAdminClient() {
  if (!hasSupabaseServiceEnv()) {
    return null;
  }

  const { url, serviceRoleKey } = getSupabaseServiceEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
