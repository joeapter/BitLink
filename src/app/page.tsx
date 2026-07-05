import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CreditCard, Headphones, RadioTower, Smartphone } from "lucide-react";
import { HumanSupportSection } from "@/components/marketing/HumanSupportSection";
import { LiquidHero } from "@/components/marketing/LiquidHero";
import { ReferralBand } from "@/components/marketing/ReferralBand";
import { TrustRibbon } from "@/components/marketing/TrustRibbon";
import { AddOnCard } from "@/components/plans/AddOnCard";
import { PlanSelector } from "@/components/plans/PlanSelector";
import { ButtonLink } from "@/components/ui/Button";
import { TextWithLinks } from "@/components/ui/TextWithLinks";
import { faqItems } from "@/lib/public-content";
import { createPageMetadata, faqPageJsonLd, jsonLdScriptProps } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  // The root segment doesn't inherit the layout title template, so the brand
  // suffix is written out here and rendered as-is via the absolute-title path.
  title: "Israeli Phone Plans in English — eSIM & Human Support | BitLink",
  description:
    "Israeli phone service for English speakers. Monthly plans from $14.99 (USD, VAT incl.), instant eSIM, US/Canada/UK number add-on, and real WhatsApp support.",
  path: "/",
});

const steps = [
  {
    title: "Choose a clear plan",
    body: "Pick a monthly plan with the details visible before you checkout.",
    icon: Smartphone,
  },
  {
    title: "Checkout securely",
    body: "Enter your details once, review the monthly price, and pay through a secure flow.",
    icon: CreditCard,
  },
  {
    title: "Get guided activation",
    body: "BitLink prepares your connection and keeps the setup process understandable.",
    icon: RadioTower,
  },
  {
    title: "Reach human support",
    body: "View account status online and get help from people who understand the service.",
    icon: Headphones,
  },
];

const servicePaths = [
  {
    href: "/israel-esim",
    title: "Israel eSIM",
    body: "For compatible phones when the fastest path is activating directly from the device.",
  },
  {
    href: "/israeli-phone-plans-for-students",
    title: "Student plans",
    body: "For students who need an Israeli number, enough data, and clear support from the start.",
  },
  {
    href: "/kosher-phone-plans-israel",
    title: "Kosher plans",
    body: "For certified kosher phones, with voice-only options and physical SIM activation.",
  },
  {
    href: "/israeli-phone-plans-for-olim",
    title: "Plans for new olim",
    body: "For your first weeks in Israel: a working number for the bank, Misrad HaPnim, and family back home.",
  },
];

const homeFaqQuestions = new Set([
  "Can BitLink set me up with an Israeli phone number?",
  "Can I use eSIM?",
  "What mobile network does BitLink use?",
  "Can family in the US or Canada reach me more easily?",
  "Can I use BitLink for a short trip to Israel?",
]);

const homeFaqItems = faqItems.filter((item) => homeFaqQuestions.has(item.question));

const carrierComparison = [
  ["Support", "Hebrew call centers", "Real people in English, on WhatsApp"],
  ["Billing", "NIS bills, terms in Hebrew", "USD prices with VAT included — the price shown is the price paid"],
  ["Signing up", "In-store, usually with an Israeli ID and bank account", "Online from anywhere, before you even land"],
  ["Contracts", "Fine print in Hebrew", "Plain-English contracts published on every plan page"],
  ["When you leave", "Cancel through a call center", "Cancel anytime, or pause for $10/mo and keep your number"],
];

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(faqPageJsonLd(homeFaqItems))} />
      <LiquidHero />

      <section className="border-b border-ink/10 bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold text-link-blue">What is BitLink?</p>
          <p className="mt-4 text-pretty text-lg leading-8 text-slate-700 sm:text-xl sm:leading-9">
            BitLink is an Israeli mobile carrier built for English speakers — students, new olim, families, and
            frequent visitors. Plans run $14.99–$39.99 per month in USD, VAT included, with a real Israeli number, 5G
            data on the Partner network, eSIM or physical SIM activation, kosher options recognized by Vaadat
            Harabanim, and an optional US, Canadian, or UK number add-on. Support comes from real people — in English,
            on WhatsApp, by phone, and by email.
          </p>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-link-blue">Built around real setup moments</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-normal text-ink sm:text-5xl">
              Choose the path that matches the way you need to connect.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-slate sm:text-lg sm:leading-8">
              Whether you need eSIM activation, a student-ready plan, a kosher phone setup, or a first Israeli number after aliyah, BitLink keeps the details clear before checkout.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {servicePaths.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-lg border border-ink/10 bg-[#f8fbfc] p-6 transition hover:border-link-blue/30 hover:bg-white hover:shadow-soft"
              >
                <h3 className="text-xl font-semibold tracking-normal text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-slate">{item.body}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-link-blue">
                  Learn more
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7fafc_100%)] py-16 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-link-blue">Simple monthly plans</p>
              <h2 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-normal text-ink sm:text-5xl">
                Plans you can understand before you pay.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-slate sm:text-lg sm:leading-8">
                No maze of bundles. Choose the rhythm that fits your phone use and keep the details visible in your account.
              </p>
            </div>
            <ButtonLink href="/plans" variant="secondary">
              View all plans
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
          <PlanSelector />
          <AddOnCard />
        </div>
      </section>

      <section id="how-it-works" className="relative overflow-hidden bg-white py-16 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-link-blue">How BitLink works</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-normal text-ink sm:text-5xl">
              A calmer path from plan to connected.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-slate sm:text-lg sm:leading-8">
              The flow is intentionally simple: choose a plan, checkout securely, follow guided setup, and manage your service online.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:mt-14 md:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-lg border border-ink/10 bg-[#f8fbfc] p-5 shadow-sm md:translate-y-[calc(var(--step)*0.75rem)]"
                style={{ "--step": index % 2 } as React.CSSProperties}
              >
                <div className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white shadow-sm">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-slate">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f7fafc_100%)] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold text-link-blue">Why BitLink</p>
          <h2 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-normal text-ink sm:text-5xl">
            Built for English speakers, not adapted for them.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-slate sm:text-lg sm:leading-8">
            Israel&apos;s big carriers run excellent networks with Hebrew-first service. BitLink runs on that same
            infrastructure — the difference is everything around it.
          </p>
          <div className="mt-10 overflow-x-auto rounded-lg border border-ink/10 bg-white shadow-sm">
            <table className="w-full min-w-xl text-sm">
              <thead>
                <tr className="bg-[#f8fbfc] text-left">
                  <th scope="col" className="p-4 font-semibold text-muted-slate" />
                  <th scope="col" className="p-4 font-semibold text-muted-slate">Typical Israeli carrier</th>
                  <th scope="col" className="p-4 font-semibold text-ink">BitLink</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {carrierComparison.map(([label, carrier, bitlink]) => (
                  <tr key={label}>
                    <th scope="row" className="p-4 text-left font-semibold text-ink">{label}</th>
                    <td className="p-4 leading-6 text-muted-slate">{carrier}</td>
                    <td className="p-4 font-medium leading-6 text-ink">{bitlink}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-slate">
            Honest caveat: if you&apos;re fluent in Hebrew and don&apos;t mind call centers, a big carrier can cost
            less. BitLink is for people who want the whole experience — signup, billing, support, contracts — in
            English.
          </p>
        </div>
      </section>

      <ReferralBand />
      <TrustRibbon />

      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-link-blue">Common questions</p>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink">
              Answers before you choose.
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted-slate">
              The questions people ask most before signing up — with the numbers stated plainly.
            </p>
            <ButtonLink href="/faq" variant="secondary" className="mt-6">
              See all questions
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
          <div className="divide-y divide-ink/8 rounded-lg border border-ink/10 bg-white shadow-soft">
            {homeFaqItems.map((item) => (
              <article key={item.question} className="p-6 sm:p-7">
                <h3 className="text-lg font-semibold tracking-normal text-ink">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-slate">
                  <TextWithLinks text={item.answer} />
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <HumanSupportSection />
    </>
  );
}
