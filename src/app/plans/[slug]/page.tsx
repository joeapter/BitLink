import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileText } from "lucide-react";
import { PlanFeatureList } from "@/components/plans/PlanFeatureList";
import { ButtonLink } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils";
import { getPlan, plans } from "@/lib/plans";
import { contractData } from "@/lib/contracts";
import { createPageMetadata, jsonLdScriptProps, planJsonLd, planMetaDescription } from "@/lib/seo";

export function generateStaticParams() {
  return plans.map((plan) => ({ slug: plan.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const plan = plans.find((item) => item.slug === slug);
  if (!plan) return { title: "Plan" };
  return createPageMetadata({
    title: plan.name,
    description: planMetaDescription(plan),
    path: `/plans/${plan.slug}`,
  });
}

export default async function PlanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plan = plans.find((item) => item.slug === slug);
  if (!plan) notFound();

  const nextPlan = getPlan(plan.slug === "max-5g" ? "student-5g" : "max-5g");
  const setupPath = plan.isKosher
    ? {
        href: "/kosher-phone-plans-israel",
        label: "Kosher plan guidance",
        title: "Made for certified kosher phones.",
        body: "This plan uses a physical SIM and is designed around clear voice service, not data bundles.",
      }
    : {
        href: plan.slug === "basic" ? "/israel-esim" : "/israeli-phone-plans-for-students",
        label: plan.slug === "basic" ? "Israel eSIM guidance" : "Student plan guidance",
        title: "Designed to keep activation understandable.",
        body: "Standard plans can support eSIM or physical SIM, depending on your device and setup needs.",
      };
  const fitCopy =
    plan.slug === "basic"
      ? "For lighter phone use when you want an Israeli number, basic data, and a simple monthly starting point."
      : plan.slug === "student-5g"
        ? "For most student use: enough data for daily life, local calling, SMS, and a clear setup path."
        : plan.slug === "max-5g"
          ? "For heavier data use, plus included calling minutes to US and Canadian numbers."
          : plan.slug === "kosher-basic"
            ? "For certified kosher phones when the need is clear monthly voice service in Israel."
            : "For certified kosher phones when Israel calling and some US/Canada calling both matter.";

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(planJsonLd(plan))} />
      <section className="liquid-bg relative overflow-hidden bg-ink px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8">
        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_24rem] md:items-center">
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

            {/* Contract details table */}
            {contractData[plan.slug] && (
              <div className="mt-10">
                <p className="text-sm font-semibold text-ink">Plan terms at a glance</p>
                <table className="mt-3 w-full text-sm">
                  <tbody className="divide-y divide-ink/8">
                    {[
                      ["Activation", contractData[plan.slug].activationTime],
                      ["Commitment", contractData[plan.slug].commitment],
                      ["SIM / Activation fee", contractData[plan.slug].simFee],
                      ["Monthly price", contractData[plan.slug].monthlyAlone],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td className="py-2 pr-4 font-semibold text-ink">{label}</td>
                        <td className="py-2 text-muted-slate">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ButtonLink
                  href={`/legal/plans/${plan.slug}`}
                  variant="secondary"
                  size="sm"
                  className="mt-5"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  View full contract
                </ButtonLink>
              </div>
            )}
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
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            {
              title: "Who it fits",
              body: fitCopy,
            },
            {
              title: "Setup path",
              body: setupPath.body,
            },
            {
              title: "Before checkout",
              body: "Review the included minutes, data, SMS, activation method, and plan contract. If compatibility matters, ask support first.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-ink">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-slate">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-6 flex max-w-7xl flex-wrap gap-4 text-sm font-semibold text-link-blue">
          <Link href={setupPath.href} className="hover:underline">
            {setupPath.label}
          </Link>
          <Link href="/faq" className="hover:underline">
            Read the FAQ
          </Link>
          <Link href="/support" className="hover:underline">
            Ask support
          </Link>
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
