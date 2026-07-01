import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import type { LandingPageContent } from "@/lib/public-content";
import { getPlan } from "@/lib/plans";
import { formatMoney } from "@/lib/utils";

export function ServiceLandingPage({ content }: { content: LandingPageContent }) {
  const featuredPlans = content.planSlugs.map((slug) => getPlan(slug));

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef5f8_100%)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-soft-cyan/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold text-link-blue">{content.eyebrow}</p>
          <h1 className="mt-3 max-w-4xl text-balance text-5xl font-semibold tracking-normal text-ink sm:text-6xl">
            {content.h1}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-slate">{content.intro}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={content.primaryCta.href} size="lg">
              {content.primaryCta.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href={content.secondaryCta.href} variant="secondary" size="lg">
              {content.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl divide-y divide-ink/8 rounded-lg border border-ink/10 bg-[#f8fbfc] shadow-sm">
          {content.qaBlocks.map((block) => (
            <article key={block.question} className="p-6 sm:p-7">
              <h2 className="text-xl font-semibold tracking-normal text-ink">{block.question}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-slate">{block.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {content.highlights.map((item) => (
            <div key={item.title} className="rounded-lg border border-ink/10 bg-[#f8fbfc] p-6">
              <CheckCircle2 className="h-5 w-5 text-link-blue" aria-hidden="true" />
              <h2 className="mt-5 text-xl font-semibold tracking-normal text-ink">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-slate">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-link-blue">What stays clear</p>
            <h2 className="mt-3 max-w-xl text-balance text-4xl font-semibold tracking-normal text-ink">
              The details matter before checkout.
            </h2>
          </div>
          <div className="grid gap-4">
            {content.details.map((item) => (
              <div key={item.title} className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-slate">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold text-link-blue">Plans to compare</p>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink">
              Start with the plan that fits the use case.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featuredPlans.map((plan) => (
              <div key={plan.slug} className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
                <p className="text-sm font-semibold text-link-blue">{plan.tone}</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-normal text-ink">{plan.name}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-slate">{plan.description}</p>
                <div className="mt-5 text-3xl font-semibold text-ink">
                  {formatMoney(plan.priceCents, plan.currency)}
                  <span className="text-base font-medium text-muted-slate">/mo</span>
                </div>
                <ButtonLink href={`/plans/${plan.slug}`} variant="secondary" className="mt-6 w-full">
                  Plan details
                </ButtonLink>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-soft-cyan">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-balance text-3xl font-semibold tracking-normal sm:text-4xl">{content.finalHeading}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">{content.finalBody}</p>
          </div>
          <ButtonLink href="/support" variant="dark" size="lg">
            Talk to support
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
