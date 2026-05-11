import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { defaultPlanSlug, plans, type PlanSlug } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Start BitLink monthly checkout securely with Stripe Billing.",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const initialPlanSlug = plans.some((item) => item.slug === plan) ? (plan as PlanSlug) : defaultPlanSlug;

  return (
    <section className="liquid-bg bg-slate-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="relative z-10 mx-auto max-w-7xl">
        <CheckoutForm initialPlanSlug={initialPlanSlug} />
      </div>
    </section>
  );
}
