"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { adminNavLinks, activeAdminLink } from "@/components/admin/adminNavLinks";

// Mobile-only admin nav: a compact bar showing the current section, tapping it
// opens a dropdown of all tabs. Replaces the long stacked sidebar on phones so
// the page content sits at the top. Desktop keeps the sidebar (this is
// lg:hidden). Shown for lg and below.
export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const active = activeAdminLink(pathname);

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white px-3 py-2.5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-slate">Admin console</p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-sm font-semibold text-white"
        >
          {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          <span className="max-w-[9rem] truncate">{active?.label ?? "Menu"}</span>
        </button>
      </div>

      {open ? (
        <nav className="mt-2 grid max-h-[70vh] gap-1 overflow-y-auto rounded-2xl border border-ink/10 bg-white p-3 shadow-soft">
          {adminNavLinks.map((link) => {
            const isActive = active?.href === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                  isActive ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <link.icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
          <form action={logoutAction} className="mt-2 border-t border-ink/8 pt-2">
            <button className="w-full rounded-2xl px-3 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100">
              Sign out
            </button>
          </form>
        </nav>
      ) : null}
    </div>
  );
}
