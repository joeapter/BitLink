"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { BrandMark } from "@/components/brand/BrandMark";

const links = [
  { href: "/plans", label: "Plans" },
  { href: "/refer", label: "Refer" },
  { href: "/support", label: "Support" },
  { href: "/account", label: "Account" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="grid h-11 w-11 place-items-center rounded-full border border-ink/10 bg-white/80 text-ink shadow-sm backdrop-blur"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-ink/35 p-3 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="liquid-bg ml-auto flex min-h-full max-w-sm flex-col rounded-[2rem] bg-white p-5 shadow-liquid">
            <div className="relative z-10 flex items-center justify-between">
              <BrandMark />
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-ink/5 text-ink"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="relative z-10 mt-10 grid gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-3xl px-4 py-4 text-xl font-semibold text-ink transition hover:bg-ink/5"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="relative z-10 mt-auto grid gap-3 pt-10">
              <ButtonLink href="/plans" size="lg">
                Choose your plan
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary" size="lg">
                Sign in
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
