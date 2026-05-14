import { Gift } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function ReferralPanel({
  referralLink,
  referrals,
}: {
  referralLink?: string | null;
  referrals: Array<{ id: string; status: string; reward_type: string | null; reward_value_cents: number | null }>;
}) {
  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-ink text-white">
          <Gift className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-link-blue">Referrals</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Link 2 friends. Unlock real savings.</h1>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-slate-50 p-4 font-mono text-sm text-ink">
        {referralLink ?? "Referral link will appear after your customer profile is created."}
      </div>

      <div className="mt-8">
        {referrals.length ? (
          <div className="grid gap-3">
            {referrals.map((referral) => (
              <div key={referral.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 p-4">
                <div>
                  <p className="text-sm font-semibold text-ink">{referral.reward_type ?? "Referral reward"}</p>
                  <p className="text-xs text-muted-slate">
                    Reward value: {referral.reward_value_cents ? `$${(referral.reward_value_cents / 100).toFixed(2)}` : "Reward details will appear when eligible"}
                  </p>
                </div>
                <StatusBadge status={referral.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No referrals yet">
            Share your link with friends. We&apos;ll track eligible referrals and show rewards here.
          </EmptyState>
        )}
      </div>
    </section>
  );
}
