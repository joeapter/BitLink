import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { BrandMark } from "@/components/brand/BrandMark";
import { MobileNav } from "./MobileNav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

const links = [
  { href: "/plans", label: "Plans" },
  { href: "/refer", label: "Refer" },
  { href: "/support", label: "Support" },
];

export async function SiteHeader() {
  let isLoggedIn = false;
  if (hasSupabasePublicEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.auth.getUser();
      isLoggedIn = !!data.user;
    } catch {
      // not critical — fall back to signed-out state
    }
  }

  return (
    <header className="site-header-surface sticky top-0 z-40 border-b border-white/70 bg-white/68 backdrop-blur-2xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandMark />

        <nav className="hidden items-center gap-10 md:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="premium-nav-link text-sm font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link-blue"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isLoggedIn ? (
            <ButtonLink href="/account" variant="ghost">
              Account
            </ButtonLink>
          ) : (
            <ButtonLink href="/login" variant="ghost">
              Sign in
            </ButtonLink>
          )}
          <ButtonLink href="/plans" className="premium-cta">
            Choose plan
          </ButtonLink>
        </div>

        <MobileNav isLoggedIn={isLoggedIn} />
      </div>
    </header>
  );
}
