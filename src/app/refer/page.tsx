import type { Metadata } from "next";
import { Gift, Link2, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Refer Friends",
  description: "Link 2 friends and unlock BitLink referral savings.",
};

export default function ReferPage() {
  return (
    <div className="bg-white">
      <section className="liquid-bg bg-ink px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8">
        <div className="relative z-10 mx-auto max-w-7xl">
          <p className="text-sm font-semibold text-soft-cyan">BitLink referrals</p>
          <h1 className="mt-3 max-w-4xl text-balance text-5xl font-semibold tracking-normal sm:text-6xl">
            Link 2 friends. Unlock real savings.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            Invite people who want a calmer phone plan experience. Rewards can be configured as a discount or first month free before production launch.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            ["Share your link", "Every customer account includes a referral link.", Link2],
            ["Two friends join", "Track referred customers and reward status in the portal.", UsersRound],
            ["Unlock savings", "Admin can configure discount or first-month-free reward logic.", Gift],
          ].map(([title, body, Icon]) => (
            <div key={title as string} className="rounded-[2rem] border border-ink/10 bg-slate-50 p-6">
              <Icon className="h-6 w-6 text-link-blue" aria-hidden="true" />
              <h2 className="mt-5 text-xl font-semibold text-ink">{title as string}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-slate">{body as string}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-7xl rounded-[2rem] bg-ink p-8 text-white shadow-liquid">
          <h2 className="text-3xl font-semibold tracking-normal">Already a customer?</h2>
          <p className="mt-3 max-w-2xl text-slate-200">
            Your referral link lives in your account portal alongside status and reward tracking.
          </p>
          <ButtonLink href="/account/referrals" variant="dark" className="mt-6">
            Open referral portal
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
