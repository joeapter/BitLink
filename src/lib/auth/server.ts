import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export async function getCurrentUser() {
  if (!hasSupabasePublicEnv()) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(
  // Accept an already-resolved user so callers that just fetched it (e.g.
  // requireProfile) don't trigger a second supabase.auth.getUser() network
  // round-trip — that duplicate call was adding latency to every admin page.
  existingUser?: Awaited<ReturnType<typeof getCurrentUser>>,
) {
  const user = existingUser ?? (await getCurrentUser());
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireProfile() {
  const user = await requireUser();
  const profile = await getCurrentProfile(user);
  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await requireProfile();
  if (profile?.role !== "admin") redirect("/account");
  return { user, profile };
}
