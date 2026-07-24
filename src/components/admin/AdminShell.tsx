import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/lib/auth/actions";
import { BrandMark } from "@/components/brand/BrandMark";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { adminNavLinks } from "@/components/admin/adminNavLinks";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid max-w-[96rem] gap-4 px-4 py-4 sm:px-6 sm:py-6 sm:gap-6 lg:grid-cols-[18rem_1fr] lg:px-8">
        {/* Mobile: a compact hamburger bar so the content starts at the top. */}
        <AdminMobileNav />

        {/* Desktop: the full sidebar (hidden on mobile — the hamburger replaces it). */}
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <div className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
            <BrandMark />
            <p className="mt-4 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-slate">
              Admin console
            </p>
            <nav className="mt-4 grid gap-1">
              {adminNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-ink hover:!text-white focus-visible:bg-ink focus-visible:!text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link-blue"
                >
                  <link.icon className="h-4 w-4" aria-hidden="true" />
                  {link.label}
                </Link>
              ))}
            </nav>
            <form action={logoutAction} className="mt-4 border-t border-ink/8 pt-4">
              <button className="w-full rounded-2xl px-3 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Sign out
              </button>
            </form>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
