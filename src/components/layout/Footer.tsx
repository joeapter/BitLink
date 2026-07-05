import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";

const planLinks = [
  { href: "/plans", label: "All plans" },
  { href: "/plans/basic", label: "Basic" },
  { href: "/plans/student-5g", label: "Student 5G" },
  { href: "/plans/max-5g", label: "Max 5G" },
  { href: "/plans/kosher-basic", label: "Kosher Basic" },
  { href: "/plans/kosher-plus", label: "Kosher+" },
];

const guideLinks = [
  { href: "/israeli-phone-plans-for-students", label: "Student phone plans" },
  { href: "/israeli-phone-plans-for-olim", label: "Phone plans for olim" },
  { href: "/israel-esim", label: "Israel eSIM" },
  { href: "/kosher-phone-plans-israel", label: "Kosher plans" },
  { href: "/aliyah", label: "Aliyah" },
  { href: "/faq", label: "FAQ" },
];

const companyLinks = [
  { href: "/support", label: "Support" },
  { href: "/refer", label: "Refer friends" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/acceptable-use", label: "Acceptable Use" },
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

        <div className="grid gap-8 sm:grid-cols-2 sm:items-start lg:grid-cols-[auto_auto_auto_auto] lg:gap-12">
          <nav aria-label="Plans" className="grid content-start gap-3 text-sm font-semibold text-slate-600">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">Plans</p>
            {planLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Guides" className="grid content-start gap-3 text-sm font-semibold text-slate-600">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">Guides</p>
            {guideLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Company" className="grid content-start gap-3 text-sm font-semibold text-slate-600">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">Company</p>
            {companyLinks.map((link) => (
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
