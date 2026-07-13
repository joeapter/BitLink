import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicEnv, hasSupabasePublicEnv } from "@/lib/supabase/env";
import { partnerOrgCodes } from "@/lib/partner-org-codes";

export async function middleware(request: NextRequest) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabasePublicEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response = NextResponse.next({ request });
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  // Persist org referral code across sessions — set cookie on any page hit with
  // ?org=, or on a partner landing page (/partners/<slug>), which carries the
  // org's attribution in the path itself so partners share a clean URL.
  const partnerMatch = request.nextUrl.pathname.match(/^\/partners\/([^/]+)\/?$/);
  const partnerCode = partnerMatch ? partnerOrgCodes[partnerMatch[1]] : undefined;
  const orgCode = request.nextUrl.searchParams.get("org") ?? partnerCode;
  if (orgCode && /^ORG-[0-9A-F]{8}$/i.test(orgCode)) {
    response.cookies.set("bl_org", orgCode.toUpperCase(), {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
