import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { defaultPlanSlug, plans, type PlanSlug } from "@/lib/plans";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata("Checkout", "Start BitLink monthly checkout securely.");

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; referral?: string; ref?: string; promo?: string }>;
}) {
  const { plan, referral, ref, promo } = await searchParams;
  const initialPlanSlug = plans.some((item) => item.slug === plan) ? (plan as PlanSlug) : defaultPlanSlug;
  const initialReferralCode = referral ?? ref ?? "";
  const cookieStore = await cookies();
  const initialOrgReferralCode = cookieStore.get("bl_org")?.value ?? "";

  return (
    <section className="liquid-bg bg-slate-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="relative z-10 mx-auto max-w-7xl">
        <CheckoutForm
          initialPlanSlug={initialPlanSlug}
          initialReferralCode={initialReferralCode}
          initialOrgReferralCode={initialOrgReferralCode}
          initialPromoCode={promo ?? ""}
        />
      </div>
    </section>
  );
}
