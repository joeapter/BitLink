import { ArrowRight, CreditCard, Headphones, RadioTower, Smartphone } from "lucide-react";
import { LiquidHero } from "@/components/marketing/LiquidHero";
import { ReferralBand } from "@/components/marketing/ReferralBand";
import { TrustRibbon } from "@/components/marketing/TrustRibbon";
import { PlanSelector } from "@/components/plans/PlanSelector";
import { ButtonLink } from "@/components/ui/Button";

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

export default function Home() {
  return (
    <>
      <LiquidHero />

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7fafc_100%)] py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-link-blue">Simple monthly plans</p>
              <h2 className="mt-3 max-w-3xl text-balance text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
                Plans you can understand before you pay.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-slate">
                No maze of bundles. Choose the rhythm that fits your phone use and keep the details visible in your account.
              </p>
            </div>
            <ButtonLink href="/plans" variant="secondary">
              View all plans
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
          <PlanSelector />
        </div>
      </section>

      <section id="how-it-works" className="relative overflow-hidden bg-white py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-link-blue">How BitLink works</p>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
              A calmer path from plan to connected.
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-slate">
              The flow is intentionally simple: choose a plan, checkout securely, follow guided setup, and manage your service online.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-4">
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

      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#eef5f8_100%)] px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-semibold text-link-blue">Need help choosing?</p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
            Real people. Real answers.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-slate">
            Talk to BitLink support before you checkout, or start with a plan and we&apos;ll get your connection moving.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/support" size="lg">
              Contact support
            </ButtonLink>
            <ButtonLink href="/checkout" variant="secondary" size="lg">
              Start checkout
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
