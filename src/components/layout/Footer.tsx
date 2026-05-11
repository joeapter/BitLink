import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";

const footerLinks = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/acceptable-use", label: "Acceptable Use" },
  { href: "/support", label: "Support" },
  { href: "mailto:hello@bitlink.co.il", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <BrandMark />
          <p className="mt-5 max-w-md text-sm leading-6 text-muted-slate">
            Your connection, simplified. Simple monthly plans. Human support. Smooth activation.
          </p>
          <p className="mt-4 text-xs text-slate-400">
            Plans and activation are subject to availability, eligibility, and final BitLink confirmation.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-slate-600">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
