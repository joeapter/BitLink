import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { AccountOverview } from "@/components/account/AccountOverview";
import { LineUsageMeter } from "@/components/account/LineUsageMeter";
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

  // First active line with a provider ID — used for the overview usage card
  const activeLine = snapshot.lines.find(
    (l) => l.status === "active" && l.provider_line_id,
  );
  const activeLinePhone = activeLine
    ? ((activeLine.metadata as Record<string, unknown>)?.phone_number as string | undefined)
    : undefined;

  return (
    <div className="grid gap-6">
      <AccountOverview
        planName={snapshot.planName}
        subscriptionStatus={snapshot.subscription?.status ?? snapshot.order?.payment_status}
        activationStatus={snapshot.order?.provisioning_status}
        nextBillingDate={nextBillingDate}
        referralLink={referralLink}
        referralStats={snapshot.referralStats}
      />

      {activeLine?.provider_line_id ? (
        <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">This month&apos;s plan balance</p>
              {activeLinePhone ? (
                <p className="mt-0.5 text-xs text-muted-slate">{activeLinePhone}</p>
              ) : null}
            </div>
            <Link
              href="/account/usage"
              className="flex items-center gap-1 text-xs font-semibold text-link-blue hover:underline"
            >
              Full usage history
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <Suspense fallback={<div className="mt-4 h-20 animate-pulse rounded-xl bg-slate-100" />}>
            <LineUsageMeter providerLineId={activeLine.provider_line_id} />
          </Suspense>
        </section>
      ) : null}
    </div>
  );
}
