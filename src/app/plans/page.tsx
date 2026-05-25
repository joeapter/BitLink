import type { Metadata } from "next";
import { PlanComparison } from "@/components/plans/PlanComparison";
import { PlanSelector } from "@/components/plans/PlanSelector";

export const metadata: Metadata = {
  title: "Plans",
  description: "Compare BitLink monthly phone and data plans.",
};

export default function PlansPage() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef5f8_100%)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-soft-cyan/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold text-link-blue">BitLink plans</p>
          <h1 className="mt-3 max-w-4xl text-balance text-5xl font-semibold tracking-normal text-ink sm:text-6xl">
            Plans shaped around real monthly use.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-slate">
            Choose a plan, checkout securely, and let BitLink guide your connection setup. Clear monthly pricing, without confusing bundles.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PlanSelector />
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold text-link-blue">Comparison</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-normal text-ink">Clean plan details, side by side.</h2>
          </div>
          <PlanComparison />
        </div>
      </section>
    </div>
  );
}
