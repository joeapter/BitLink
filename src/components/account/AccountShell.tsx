import Link from "next/link";
import type { ReactNode } from "react";
import { CreditCard, Home, LogOut, RadioTower, Share2 } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { initials } from "@/lib/utils";

const links = [
  { href: "/account", label: "Overview", icon: Home },
  { href: "/account/billing", label: "Billing", icon: CreditCard },
  { href: "/account/activation", label: "Activation", icon: RadioTower },
  { href: "/account/referrals", label: "Referrals", icon: Share2 },
];

export function AccountShell({
  children,
  profile,
}: {
  children: ReactNode;
  profile: { full_name: string | null; email: string | null } | null;
}) {
  return (
    <div className="bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[18rem_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-3 border-b border-ink/8 pb-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-ink text-sm font-semibold text-white">
                {initials(profile?.full_name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{profile?.full_name ?? "BitLink customer"}</p>
                <p className="truncate text-xs text-muted-slate">{profile?.email ?? "Account portal"}</p>
              </div>
            </div>

            <nav className="mt-4 grid gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-ink hover:text-white"
                >
                  <link.icon className="h-4 w-4" aria-hidden="true" />
                  {link.label}
                </Link>
              ))}
            </nav>

            <form action={logoutAction} className="mt-4 border-t border-ink/8 pt-4">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div>{children}</div>
      </div>
    </div>
  );
}
