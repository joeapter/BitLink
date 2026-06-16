import type { createSupabaseServerClient } from "@/lib/supabase/server";

type AppSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export function safeInternalPath(path: string | null | undefined) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

export async function defaultAuthenticatedPath(supabase: AppSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "/account";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.role === "admin" ? "/admin" : "/account";
}

export async function authenticatedRedirectPath(
  supabase: AppSupabaseClient,
  next: string | null | undefined,
) {
  return safeInternalPath(next) ?? (await defaultAuthenticatedPath(supabase));
}
