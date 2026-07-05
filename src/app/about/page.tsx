import type { Metadata } from "next";
import { ArrowRight, Building2, Globe2, Headphones, ReceiptText } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import {
  breadcrumbJsonLd,
  canonicalUrl,
  createPageMetadata,
  jsonLdScriptProps,
  organizationId,
} from "@/lib/seo";

const pagePath = "/about";

export const metadata: Metadata = createPageMetadata({
  title: "About BitLink — Israeli Phone Service in English",
  description:
    "BitLink Ltd. is an Israeli mobile carrier founded in 2026 for English speakers: USD pricing with VAT included, real human support on WhatsApp, on Israel's Partner network.",
  path: pagePath,
});

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "About", path: pagePath },
    ]),
    {
      "@type": "AboutPage",
      "@id": `${canonicalUrl(pagePath)}#about`,
      url: canonicalUrl(pagePath),
      name: "About BitLink",
      mainEntity: {
        "@id": organizationId,
      },
    },
  ],
};

const differences = [
  {
    icon: ReceiptText,
    title: "Prices in USD, VAT included",
    body: "Every plan is priced and charged in US dollars with VAT already included — no shekel conversion surprises, and family abroad can pay with their own card.",
  },
  {
    icon: Headphones,
    title: "Real people on WhatsApp, in English",
    body: "No bots and no Hebrew call-center maze. A real team member reads every message and answers in English, from before checkout through activation and billing.",
  },
  {
    icon: Globe2,
    title: "Sign up before you land",
    body: "Checkout is online and eSIM activation takes minutes, so your Israeli number can be working before you clear passport control.",
  },
  {
    icon: Building2,
    title: "Plain-English contracts, published",
    body: "Every plan's full contract is published on its page — activation time, commitment, fees, and monthly price — before you pay, not after.",
  },
];

const companyFacts = [
  ["Legal name", "BitLink Ltd."],
  ["Company number", "341280188"],
  ["Founded", "2026"],
  ["Registered office", "HaRashar Hirsch 4/1, Beit Shemesh, Israel 9965000"],
  ["Networks", "Partner (primary), Pelephone (secondary)"],
  ["Support hours", "Sun–Thu 9:00–18:00, Fri 9:00–12:00 (Israel)"],
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(aboutJsonLd)} />

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef5f8_100%)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-soft-cyan/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <Breadcrumbs items={[{ label: "About" }]} />
          <p className="text-sm font-semibold text-link-blue">About BitLink</p>
          <h1 className="mt-3 max-w-4xl text-balance text-5xl font-semibold tracking-normal text-ink sm:text-6xl">
            The phone company we wished existed when we got here.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-slate">
            BitLink is an Israeli mobile carrier built for English speakers — students, new olim, families, and
            frequent visitors — with USD pricing, eSIM activation in minutes, and support from real people who answer
            in English.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold text-link-blue">Why BitLink exists</p>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink">
              Israeli telecom works. The experience around it didn&apos;t.
            </h2>
          </div>
          <div className="max-w-2xl space-y-5 text-base leading-7 text-muted-slate sm:text-lg sm:leading-8">
            <p>
              Anyone who has moved to Israel knows the drill: excellent networks wrapped in Hebrew call centers,
              in-store signups, shekel bills that never match what you expected, and contracts you sign without fully
              reading. If you grew up with American-style customer service, the gap is jarring — especially in your
              first weeks, when a working phone number is what everything else depends on.
            </p>
            <p>
              BitLink was founded in 2026 to close that gap: one clear monthly price in dollars, activation you can do
              from your couch before you fly, kosher options recognized by Vaadat Harabanim, and a support team that
              answers on WhatsApp like a person, not a phone tree.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#eef5f8] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-link-blue">The network question</p>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink">
              New company. Proven network.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-slate sm:text-lg sm:leading-8">
              BitLink is new — and the infrastructure under it isn&apos;t. Your calls and data run primarily on the
              Partner network, in commercial operation since 1999 (it launched under the Orange brand), with Pelephone,
              another major national carrier, as a secondary network. That&apos;s nationwide 5G on the same
              infrastructure most Israelis use every day — with the service layer rebuilt in English around it.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-link-blue">What we do differently</p>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink">
              Four things we refuse to complicate.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {differences.map((item) => (
              <div key={item.title} className="rounded-lg border border-ink/10 bg-[#f8fbfc] p-6">
                <item.icon className="h-5 w-5 text-link-blue" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-slate">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-link-blue">On the record</p>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink">Company details.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-slate">
              The boring facts, published on purpose — a phone company asking for your monthly payment should be easy
              to look up.
            </p>
          </div>
          <dl className="grid border-y border-ink/10 bg-white sm:grid-cols-2">
            {companyFacts.map(([label, value], index) => (
              <div
                key={label}
                className={`p-6 ${index > 1 ? "border-t border-ink/10" : ""} ${index % 2 === 1 ? "sm:border-l sm:border-ink/10" : ""}`}
              >
                <dt className="text-sm font-semibold text-muted-slate">{label}</dt>
                <dd className="mt-2 text-base font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-ink px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-normal sm:text-4xl">
              Questions before you decide? Ask a person.
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
              Reach the team on WhatsApp, by phone, or by email — before checkout, not just after.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/plans" variant="dark" size="lg">
              See the plans
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/support" variant="secondary" size="lg">
              Talk to support
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
