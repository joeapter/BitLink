import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authenticatedRedirectPath, safeInternalPath } from "@/lib/auth/redirects";

export const dynamic = "force-dynamic";

function redirectTo(requestUrl: URL, path: string) {
  return NextResponse.redirect(new URL(path, requestUrl.origin));
}

export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeInternalPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return redirectTo(requestUrl, "/login?error=Invalid%20or%20expired%20confirmation%20link");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectTo(requestUrl, `/login?error=${encodeURIComponent(error.message)}`);
  }

  return redirectTo(requestUrl, await authenticatedRedirectPath(supabase, next));
}
