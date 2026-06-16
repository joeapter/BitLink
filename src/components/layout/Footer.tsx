import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";

const footerLinks = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/acceptable-use", label: "Acceptable Use" },
  { href: "/support", label: "Support" },
];

const contactRows = [
  { label: "From Israel", href: "tel:+972587939426", value: "058-793-9426" },
  { label: "From USA", href: "tel:+13473445733", value: "347-344-5733" },
  { label: "Whatsapp", href: "https://wa.me/972587939426", value: "+972-58-793-9426" },
  { label: "Email", href: "mailto:support@bitlink.co.il", value: "Support@bitlink.co.il" },
];

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <BrandMark />
          <p className="mt-5 max-w-md text-sm leading-6 text-muted-slate">
            Modern Israeli telecom with simple monthly plans, guided activation, and human support.
          </p>
          <p className="mt-4 text-xs text-slate-400">
            Plans and activation are subject to availability, eligibility, and final BitLink confirmation.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-[auto_auto] sm:items-start lg:gap-12">
          <nav aria-label="Footer navigation" className="grid gap-3 text-sm font-semibold text-slate-600">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>

          <section aria-labelledby="customer-service-heading" className="text-sm text-slate-600">
            <h2 id="customer-service-heading" className="text-lg font-extrabold uppercase tracking-tight text-ink">
              Customer Service
            </h2>
            <dl className="mt-5 grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-1.5">
              {contactRows.map((row) => (
                <div key={row.label} className="contents">
                  <dt className="font-extrabold text-link-blue">{row.label}</dt>
                  <dd>
                    <a href={row.href} className="font-semibold text-slate-600 transition hover:text-ink">
                      {row.value}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6">
              <p className="text-base font-semibold text-slate-600">Israel Hours</p>
              <p className="mt-3 text-xs font-medium leading-6">
                Sunday to Thursday from <span className="font-extrabold">9:00am to 6:00pm</span>
                <br />
                Friday from <span className="font-extrabold">9:00am to 12:00pm</span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </footer>
  );
}
