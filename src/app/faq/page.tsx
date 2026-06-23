import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { faqItems } from "@/lib/public-content";
import { createPageMetadata, faqPageJsonLd, jsonLdScriptProps } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "FAQ",
  description: "Clear answers about BitLink Israeli phone plans, eSIM activation, kosher plans, support, and number options.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(faqPageJsonLd(faqItems))} />

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef5f8_100%)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-soft-cyan/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold text-link-blue">BitLink FAQ</p>
          <h1 className="mt-3 max-w-4xl text-balance text-5xl font-semibold tracking-normal text-ink sm:text-6xl">
            Questions before you choose a plan.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-slate">
            The useful details, without turning phone service into a puzzle.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-link-blue">Clear before checkout</p>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink">
              A few answers are worth having early.
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted-slate">
              If your question affects device compatibility, number porting, or a kosher setup, support can help before you pay.
            </p>
            <ButtonLink href="/support" variant="secondary" className="mt-6">
              Talk to support
            </ButtonLink>
          </div>

          <div className="divide-y divide-ink/8 rounded-lg border border-ink/10 bg-white shadow-soft">
            {faqItems.map((item) => (
              <article key={item.question} className="p-6 sm:p-7">
                <h2 className="text-xl font-semibold tracking-normal text-ink">{item.question}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-slate">{item.answer}</p>
                {"action" in item && item.action ? (
                  <a
                    href={item.action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-slate-50 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-100"
                  >
                    {item.action.label}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-link-blue">Ready to compare?</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-ink">Review the plans side by side.</h2>
          </div>
          <ButtonLink href="/plans" variant="secondary">
            View plans
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
