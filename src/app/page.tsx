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
import { createPageMetadata } from "@/lib/seo";

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

export default function Home() {
  return (
    <>
      <LiquidHero />

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

      <ReferralBand />
      <TrustRibbon />
      <HumanSupportSection />
    </>
  );
}
