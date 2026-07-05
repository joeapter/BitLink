import type { Metadata } from "next";
import { AddOnCard } from "@/components/plans/AddOnCard";
import { PlanComparison } from "@/components/plans/PlanComparison";
import { PlanSelector } from "@/components/plans/PlanSelector";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { TextWithLinks } from "@/components/ui/TextWithLinks";
import { plans } from "@/lib/plans";
import { plansFaqItems } from "@/lib/public-content";
import { createPageMetadata, faqPageJsonLd, jsonLdScriptProps, plansCollectionJsonLd } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Israeli Phone Plans & Pricing — From $14.99/month",
  description:
    "Compare all five BitLink plans: 1GB to 120GB 5G data, kosher options, USD pricing with VAT included, no hidden fees. eSIM or physical SIM. See every price up front.",
  path: "/plans",
});

export default function PlansPage() {
  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(plansCollectionJsonLd(plans))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(faqPageJsonLd(plansFaqItems))} />
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef5f8_100%)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-soft-cyan/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <Breadcrumbs items={[{ label: "Plans" }]} />
          <p className="text-sm font-semibold text-link-blue">BitLink plans</p>
          <h1 className="mt-3 max-w-4xl text-balance text-5xl font-semibold tracking-normal text-ink sm:text-6xl">
            Israeli phone plans with prices you can actually see.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-slate">
            Five monthly plans from $14.99 to $39.99 — priced in USD with VAT included, no hidden fees, and no
            long-term contract. Every plan includes a real Israeli number and activates by eSIM or physical SIM, with
            kosher voice-only options and a US/Canada/UK number add-on.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PlanSelector />
          <AddOnCard />
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

      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold text-link-blue">Before you choose</p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink">
            Plan questions, answered plainly.
          </h2>
          <div className="mt-8 divide-y divide-ink/8 rounded-lg border border-ink/10 bg-[#f8fbfc] shadow-sm">
            {plansFaqItems.map((item) => (
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
    </div>
  );
}
