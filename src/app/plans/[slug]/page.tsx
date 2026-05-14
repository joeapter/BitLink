import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PlanFeatureList } from "@/components/plans/PlanFeatureList";
import { ButtonLink } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils";
import { getPlan, plans } from "@/lib/plans";

export function generateStaticParams() {
  return plans.map((plan) => ({ slug: plan.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const plan = plans.find((item) => item.slug === slug);
  if (!plan) return { title: "Plan" };
  return {
    title: plan.name,
    description: plan.description,
  };
}

export default async function PlanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plan = plans.find((item) => item.slug === slug);
  if (!plan) notFound();

  const nextPlan = getPlan(plan.slug === "unlimited-data-plus" ? "israel-plus" : "unlimited-data-plus");

  return (
    <div className="bg-white">
      <section className="liquid-bg relative overflow-hidden bg-ink px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8">
        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_24rem] md:items-end">
          <div>
            <p className="text-sm font-semibold text-soft-cyan">{plan.tone}</p>
            <h1 className="mt-3 max-w-4xl text-balance text-5xl font-semibold tracking-normal sm:text-6xl">
              {plan.name}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">{plan.description}</p>
          </div>

          <div className="rounded-[2rem] border border-white/14 bg-white/10 p-6 backdrop-blur">
            <div className="text-5xl font-semibold">
              {formatMoney(plan.priceCents, plan.currency)}
              <span className="text-lg font-medium text-slate-300">/mo</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-200">Checkout securely. We&apos;ll get your connection moving.</p>
            <ButtonLink href={`/checkout?plan=${plan.slug}`} variant="dark" size="lg" className="mt-6 w-full">
              Choose this plan
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_0.85fr]">
          <div>
            <p className="text-sm font-semibold text-link-blue">Plan details</p>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink">
              A simpler phone plan experience, with clear monthly details.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-slate">{plan.detail}</p>
            {plan.longDistance ? (
              <p className="mt-5 inline-flex rounded-full bg-trust-green/10 px-4 py-2 text-sm font-semibold text-emerald-700">
                Long-distance allowance: {plan.longDistance}
              </p>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-ink/10 bg-slate-50 p-6">
            <h3 className="text-xl font-semibold text-ink">Included in {plan.name}</h3>
            <div className="mt-5">
              <PlanFeatureList plan={plan} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 rounded-[2rem] bg-white p-6 shadow-soft sm:p-8 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-link-blue">Still comparing?</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-ink">Compare {plan.name} with {nextPlan.name}.</h2>
          </div>
          <ButtonLink href="/plans" variant="secondary">
            Back to plan selector
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
