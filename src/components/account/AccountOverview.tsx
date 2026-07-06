import { ArrowUpRight, Gift, LifeBuoy, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";

type ReferralStats = {
  activeCount: number;
  bonusGb: number;
  cap: number;
};

export function AccountOverview({
  planName,
  subscriptionStatus,
  activationStatus,
  nextBillingDate,
  referralLink,
  referralStats,
}: {
  planName: string;
  subscriptionStatus?: string | null;
  activationStatus?: string | null;
  nextBillingDate?: string | null;
  referralLink?: string | null;
  referralStats?: ReferralStats;
}) {
  return (
    <div className="grid gap-6">
      <section className="liquid-bg overflow-hidden rounded-[2rem] bg-ink p-6 text-white shadow-liquid sm:p-8">
        <div className="relative z-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-sm font-semibold text-soft-cyan">Current plan</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal">{planName}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200">
              Your account shows subscription, payment, activation, billing, and referral status in one place.
            </p>
          </div>
          <div className="grid gap-2">
            <ButtonLink href="/plans" variant="dark">
              Upgrade plan
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/account/add-line" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/16">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add line
            </ButtonLink>
            <ButtonLink href="/support" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/16">
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              Support
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.75rem] border border-ink/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-muted-slate">Subscription</p>
          <div className="mt-4">
            <StatusBadge status={subscriptionStatus ?? "pending"} />
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-ink/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-muted-slate">Activation</p>
          <div className="mt-4">
            <StatusBadge status={activationStatus ?? "new_order"} />
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-ink/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-muted-slate">Next billing</p>
          <p className="mt-4 text-lg font-semibold text-ink">{nextBillingDate ?? "Pending activation"}</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-link-blue">Referrals</p>
          <ButtonLink href="/account/referrals" variant="ghost" size="sm">
            <Gift className="h-4 w-4" aria-hidden="true" />
            {referralStats && referralStats.activeCount > 0
              ? `+${referralStats.bonusGb}GB/mo earned`
              : "Earn +5GB per friend"}
          </ButtonLink>
        </div>
        <div className="mt-3 rounded-[1.5rem] bg-slate-50 p-4 font-mono text-sm text-ink break-all select-all">
          {referralLink ?? "Your referral link will appear here after your account is ready."}
        </div>
        {referralStats && referralStats.activeCount > 0 ? (
          <p className="mt-2 text-xs text-muted-slate">
            {referralStats.activeCount} of {referralStats.cap} friends active · earning +{referralStats.bonusGb}GB extra data per month
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-slate">
            Earn +5GB/mo for each friend who activates — up to 5 friends, 25GB maximum.
          </p>
        )}
      </section>
    </div>
  );
}
