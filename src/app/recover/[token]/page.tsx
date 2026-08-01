import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { plans, type PlanSlug } from "@/lib/plans";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata("Finish signing up", "Complete your BitLink checkout.");
export const dynamic = "force-dynamic";

export default async function RecoverCheckoutPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();

  const row = admin
    ? (
        await admin
          .from("abandoned_checkouts")
          .select("status, expires_at, plan_slug, is_esim, customers(full_name, email, phone)")
          .eq("token", token)
          .maybeSingle()
      ).data
    : null;

  const expired = !row || row.status !== "pending" || new Date(row.expires_at) <= new Date();

  if (expired) {
    return (
      <section className="liquid-bg bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative z-10 mx-auto max-w-xl rounded-4xl border border-ink/10 bg-white p-8 text-center shadow-soft">
          <h1 className="text-2xl font-semibold text-ink">This offer has expired</h1>
          <p className="mt-3 text-sm leading-6 text-muted-slate">
            No worries — you can still sign up any time, the activation fee just won&apos;t be waived.
          </p>
          <Link
            href="/plans"
            className="mt-6 inline-block rounded-full bg-link-blue px-6 py-3 text-sm font-semibold text-white"
          >
            View plans
          </Link>
        </div>
      </section>
    );
  }

  const customer = row!.customers as { full_name?: string | null; email?: string | null; phone?: string | null } | null;
  const planSlug = plans.some((p) => p.slug === row!.plan_slug) ? (row!.plan_slug as PlanSlug) : "basic";

  return (
    <section className="liquid-bg bg-slate-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="relative z-10 mx-auto max-w-7xl">
        <CheckoutForm
          initialPlanSlug={planSlug}
          initialSimType={row!.is_esim ? "esim" : "physical"}
          initialFullName={customer?.full_name ?? ""}
          initialEmail={customer?.email ?? ""}
          initialPhone={customer?.phone ?? ""}
          recoveryToken={token}
        />
      </div>
    </section>
  );
}
