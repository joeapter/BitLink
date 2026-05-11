import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { BrandMark } from "@/components/brand/BrandMark";
import { MobileNav } from "./MobileNav";

const links = [
  { href: "/plans", label: "Plans" },
  { href: "/refer", label: "Refer" },
  { href: "/support", label: "Support" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/72 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandMark />

        <nav className="hidden items-center gap-1 rounded-full border border-ink/8 bg-white/70 p-1 shadow-sm md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-ink hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ButtonLink href="/login" variant="ghost">
            Sign in
          </ButtonLink>
          <ButtonLink href="/plans">Choose your plan</ButtonLink>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
