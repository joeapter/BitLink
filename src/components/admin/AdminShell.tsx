import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, CreditCard, Headphones, Home, RadioTower, Settings, Share2, ShoppingCart, Users } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { BrandMark } from "@/components/brand/BrandMark";

const links = [
  { href: "/admin", label: "Overview", icon: Home },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/provisioning", label: "Provisioning", icon: RadioTower },
  { href: "/admin/plans", label: "Plans", icon: BarChart3 },
  { href: "/admin/referrals", label: "Referrals", icon: Share2 },
  { href: "/admin/support", label: "Support", icon: Headphones },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid max-w-[96rem] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[18rem_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
            <BrandMark />
            <p className="mt-4 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-slate">
              Admin console
            </p>
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
