import type { Metadata } from "next";
import { AccountOverview } from "@/components/account/AccountOverview";
import { requireUser } from "@/lib/auth/server";
import { getAccountSnapshot } from "@/lib/db/account";

export const metadata: Metadata = {
  title: "Account",
};

export default async function AccountPage() {
  const user = await requireUser();
  const snapshot = await getAccountSnapshot(user.id);
  const nextBillingDate = snapshot.subscription?.current_period_end
    ? new Date(snapshot.subscription.current_period_end).toLocaleDateString()
    : null;
  const referralLink = snapshot.customer?.referral_code
    ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://bitlink.co.il"}/signup?referral=${snapshot.customer.referral_code}`
    : null;

  return (
    <AccountOverview
      planName={snapshot.planName}
      subscriptionStatus={snapshot.subscription?.status ?? snapshot.order?.payment_status}
      activationStatus={snapshot.order?.provisioning_status}
      nextBillingDate={nextBillingDate}
      referralLink={referralLink}
    />
  );
}
