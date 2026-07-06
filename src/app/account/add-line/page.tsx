import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddLineForm } from "@/components/account/AddLineForm";
import { requireUser } from "@/lib/auth/server";
import { getAccountSnapshot } from "@/lib/db/account";
import { defaultPlanSlug, plans, type PlanSlug } from "@/lib/plans";

export const metadata: Metadata = { title: "Add Line" };
export const dynamic = "force-dynamic";

function normalizePlanSlug(value?: string): PlanSlug {
  return plans.some((plan) => plan.slug === value) ? (value as PlanSlug) : defaultPlanSlug;
}

export default async function AddLinePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const user = await requireUser();
  const snapshot = await getAccountSnapshot(user.id, user.email);
  const params = await searchParams;

  if (!snapshot.customer) {
    redirect("/account");
  }

  return (
    <AddLineForm
      initialPlanSlug={normalizePlanSlug(params.plan)}
      customerName={snapshot.customer.full_name}
      customerEmail={snapshot.customer.email}
    />
  );
}
