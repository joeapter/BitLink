import { ArrowRight, CreditCard, Headphones, RadioTower, Settings2 } from "lucide-react";
import { LiquidHero } from "@/components/marketing/LiquidHero";
import { ReferralBand } from "@/components/marketing/ReferralBand";
import { TrustRibbon } from "@/components/marketing/TrustRibbon";
import { PlanSelector } from "@/components/plans/PlanSelector";
import { ButtonLink } from "@/components/ui/Button";

const steps = [
  {
    title: "Choose your plan",
    body: "Pick a simple monthly plan that matches how you use your phone.",
    icon: Settings2,
  },
  {
    title: "Checkout securely",
    body: "Enter your details once, review the monthly price, and pay through a secure flow.",
    icon: CreditCard,
  },
  {
    title: "We handle activation",
    body: "BitLink prepares your connection and keeps you updated as your service gets ready.",
    icon: RadioTower,
  },
  {
    title: "Manage everything online",
    body: "View billing status, activation progress, support, and referrals in one account.",
    icon: Headphones,
  },
];

export default function Home() {
  return (
    <>
      <LiquidHero />

      <section className="relative overflow-hidden bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-link-blue">Simple monthly plans</p>
              <h2 className="mt-3 max-w-2xl text-balance text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
                Built for people who want their phone plan to just work.
              </h2>
            </div>
            <ButtonLink href="/plans" variant="secondary">
              View all plans
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
          <PlanSelector />
        </div>
      </section>

      <section id="how-it-works" className="relative overflow-hidden bg-slate-50 py-16 sm:py-24">
        <div className="absolute left-1/2 top-24 h-px w-[80vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-link-blue/40 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-link-blue">How BitLink works</p>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
              No confusing bundles. No maze of fine print. Just a smoother way to stay connected.
            </h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-[1.75rem] border border-ink/10 bg-white p-5 shadow-sm md:translate-y-[calc(var(--step)*1rem)]"
                style={{ "--step": index % 2 } as React.CSSProperties}
              >
                <div className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white">
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

      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2.5rem] bg-ink px-6 py-12 text-center text-white shadow-liquid sm:px-12">
          <p className="text-sm font-semibold text-soft-cyan">Need help choosing?</p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal sm:text-5xl">
            Simple monthly plans. Human support. Smooth activation.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-200">
            Talk to BitLink support before you checkout, or start with a plan and we&apos;ll get your connection moving.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/support" variant="dark" size="lg">
              Contact support
            </ButtonLink>
            <ButtonLink href="/checkout" variant="secondary" size="lg" className="border-white/20 bg-white/10 text-white hover:bg-white/16">
              Start checkout
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
