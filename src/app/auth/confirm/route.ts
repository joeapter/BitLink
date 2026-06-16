import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authenticatedRedirectPath, safeInternalPath } from "@/lib/auth/redirects";

export const dynamic = "force-dynamic";

const emailOtpTypes = new Set(["signup", "invite", "magiclink", "recovery", "email_change", "email"]);

function redirectTo(requestUrl: URL, path: string) {
  return NextResponse.redirect(new URL(path, requestUrl.origin));
}

export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = safeInternalPath(requestUrl.searchParams.get("next"));

  if (!tokenHash || !type || !emailOtpTypes.has(type)) {
    return redirectTo(requestUrl, "/login?error=Invalid%20or%20expired%20confirmation%20link");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return redirectTo(requestUrl, `/login?error=${encodeURIComponent(error.message)}`);
  }

  return redirectTo(requestUrl, await authenticatedRedirectPath(supabase, next));
}
