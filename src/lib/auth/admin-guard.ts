import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface AdminContext {
  user: { id: string };
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
}

// Returns an AdminContext on success, or a Response (401/403) on failure.
// Usage: const auth = await requireAdmin(); if (auth instanceof Response) return auth;
export async function requireAdmin(): Promise<AdminContext | Response> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 });

  return { user: { id: user.id }, supabase };
}
