"use client";

import { useState } from "react";
import { Check, Copy, Gift, Share2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { REFERRAL_CAP, REFERRAL_BONUS_GB } from "@/lib/referrals";

type ReferralRow = {
  id: string;
  status: string;
  reward_type: string | null;
  reward_value_cents: number | null;
  created_at?: string;
};

type ReferralStats = {
  activeCount: number;
  totalCount: number;
  bonusGb: number;
  cap: number;
};

function CopyShareButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  const canNativeShare = typeof window !== "undefined" && "share" in navigator;

  async function handleShare() {
    if (canNativeShare) {
      try {
        await navigator.share({
          title: "Join BitLink — Israeli mobile for students",
          text: "Get an Israeli phone number and eSIM with BitLink. Use my link to sign up:",
          url: link,
        });
      } catch {
        // User dismissed share sheet — not an error
      }
      return;
    }
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={handleShare}>
      {copied ? (
        <Check className="h-4 w-4 text-trust-green" aria-hidden="true" />
      ) : canNativeShare ? (
        <Share2 className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      {copied ? "Copied!" : "Share link"}
    </Button>
  );
}

export function ReferralPanel({
  referralLink,
  referrals,
  referralStats,
}: {
  referralLink?: string | null;
  referrals: ReferralRow[];
  referralStats: ReferralStats;
}) {
  const { activeCount, bonusGb, cap } = referralStats;
  const slotsRemaining = cap - activeCount;

  return (
    <div className="grid gap-6">
      {/* Hero */}
      <section className="liquid-bg overflow-hidden rounded-[2rem] bg-ink p-6 text-white shadow-liquid sm:p-8">
        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15 text-white">
              <Gift className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-soft-cyan">Referral program</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-normal">
                Earn +5GB for every friend you bring.
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">
                When a friend signs up and activates service using your link, you both benefit —
                they get set up faster, and you earn {REFERRAL_BONUS_GB}GB of extra monthly data.
                Up to {cap} friends, {cap * REFERRAL_BONUS_GB}GB maximum per month.
              </p>
            </div>
          </div>

          {/* Slot indicators */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              {Array.from({ length: cap }).map((_, i) => (
                <div
                  key={i}
                  className={
                    i < activeCount
                      ? "flex h-9 w-9 items-center justify-center rounded-full bg-trust-green text-white text-xs font-bold"
                      : "flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/20 text-white/30 text-xs font-bold"
                  }
                >
                  {i < activeCount ? "✓" : i + 1}
                </div>
              ))}
            </div>
            <div className="ml-2">
              {bonusGb > 0 ? (
                <p className="text-lg font-semibold">
                  +{bonusGb}GB/mo earned
                  <span className="ml-2 text-sm font-normal text-slate-300">
                    ({activeCount}/{cap} active {activeCount === 1 ? "friend" : "friends"})
                  </span>
                </p>
              ) : (
                <p className="text-sm text-slate-300">
                  {slotsRemaining} {slotsRemaining === 1 ? "slot" : "slots"} available — share your link to start earning
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Link + share */}
      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-semibold text-link-blue">Your referral link</p>
        <p className="mt-1 text-sm text-muted-slate">
          Share this link with friends. When they activate, your bonus data kicks in automatically.
        </p>

        {referralLink ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 rounded-[1.5rem] border border-ink/10 bg-slate-50 px-4 py-3 font-mono text-sm text-ink select-all break-all">
              {referralLink}
            </div>
            <CopyShareButton link={referralLink} />
          </div>
        ) : (
          <div className="mt-4 rounded-[1.5rem] bg-slate-50 p-4 text-sm text-muted-slate">
            Your referral link will appear here once your account is fully activated.
          </div>
        )}
      </section>

      {/* Referral history */}
      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-semibold text-link-blue">Your referrals</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal text-ink">
          {referrals.length ? `${referrals.length} referral${referrals.length !== 1 ? "s" : ""}` : "No referrals yet"}
        </h2>

        <div className="mt-6">
          {referrals.length ? (
            <div className="grid gap-3">
              {referrals.map((referral, i) => (
                <div
                  key={referral.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-slate-50 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Friend #{i + 1}
                      {referral.reward_type ? (
                        <span className="ml-2 font-normal text-muted-slate">
                          · {referral.reward_type === "data_gb" ? `+${REFERRAL_BONUS_GB}GB/mo` : referral.reward_type}
                        </span>
                      ) : null}
                    </p>
                    {referral.created_at ? (
                      <p className="mt-0.5 text-xs text-muted-slate">
                        Referred{" "}
                        {new Date(referral.created_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={referral.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No referrals yet">
              Share your link above. Each friend who activates will appear here with their status and your earned bonus.
            </EmptyState>
          )}
        </div>
      </section>
    </div>
  );
}
