export function hasSupabasePublicEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabasePublicEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "missing-anon-key",
  };
}

export function hasSupabaseServiceEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseServiceEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "missing-service-role-key",
  };
}
