import type { Metadata } from "next";
import { ReferralPanel } from "@/components/account/ReferralPanel";
import { requireUser } from "@/lib/auth/server";
import { getAccountSnapshot } from "@/lib/db/account";

export const metadata: Metadata = {
  title: "Referrals",
};

export default async function AccountReferralsPage() {
  const user = await requireUser();
  const snapshot = await getAccountSnapshot(user.id);
  const referralLink = snapshot.customer?.referral_code
    ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://bitlink.co.il"}/signup?referral=${snapshot.customer.referral_code}`
    : null;

  return <ReferralPanel referralLink={referralLink} referrals={snapshot.referrals} />;
}
