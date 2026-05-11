import type { Metadata } from "next";
import { BillingPanel } from "@/components/account/BillingPanel";
import { requireUser } from "@/lib/auth/server";
import { getAccountSnapshot } from "@/lib/db/account";

export const metadata: Metadata = {
  title: "Billing",
};

export default async function AccountBillingPage() {
  const user = await requireUser();
  const snapshot = await getAccountSnapshot(user.id);
  const nextBillingDate = snapshot.subscription?.current_period_end
    ? new Date(snapshot.subscription.current_period_end).toLocaleDateString()
    : null;

  return <BillingPanel subscriptionStatus={snapshot.subscription?.status} nextBillingDate={nextBillingDate} />;
}
