import type { Metadata } from "next";
import { Gift, Link2, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Refer Friends — Unlock Referral Rewards",
  description:
    "Share your BitLink referral link. When eligible friends join, rewards unlock automatically — and you track referrals and savings in your account.",
  path: "/refer",
});

export default function ReferPage() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef5f8_100%)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-soft-cyan/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold text-link-blue">BitLink referrals</p>
          <h1 className="mt-3 max-w-4xl text-balance text-5xl font-semibold tracking-normal text-ink sm:text-6xl">
            Link 2 friends. Unlock real savings.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-slate">
            Invite people who want a calmer phone plan experience. When two eligible friends join, BitLink applies the matching referral reward.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            ["Share your link", "Every customer account includes a referral link.", Link2],
            ["Two friends join", "Track referred friends and reward status in your account.", UsersRound],
            ["Unlock savings", "Eligible referrals can unlock a discount or first-month reward.", Gift],
          ].map(([title, body, Icon]) => (
            <div key={title as string} className="rounded-lg border border-ink/10 bg-[#f8fbfc] p-6">
              <Icon className="h-6 w-6 text-link-blue" aria-hidden="true" />
              <h2 className="mt-5 text-xl font-semibold text-ink">{title as string}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-slate">{body as string}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-7xl rounded-lg border border-ink/10 bg-white p-8 shadow-soft">
          <h2 className="text-3xl font-semibold tracking-normal text-ink">Already a customer?</h2>
          <p className="mt-3 max-w-2xl text-muted-slate">
            Your referral link lives in your account portal alongside status and reward tracking.
          </p>
          <ButtonLink href="/account/referrals" className="mt-6">
            Open referral portal
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
