import { ArrowRight, Gift } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export function ReferralBand() {
  return (
    <section className="relative overflow-hidden bg-ink py-16 text-white sm:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(18,189,178,0.28),transparent_32rem),radial-gradient(circle_at_82%_70%,rgba(19,199,132,0.16),transparent_28rem)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-soft-cyan">
            <Gift className="h-4 w-4" aria-hidden="true" />
            Referral savings
          </div>
          <h2 className="max-w-2xl text-balance text-4xl font-semibold tracking-normal sm:text-5xl">
            Link 2 friends. Unlock real savings.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">
            Share BitLink with people who want their phone plan to just work. We&apos;ll track eligible referrals and apply rewards when they qualify.
          </p>
        </div>

        <ButtonLink href="/refer" variant="dark" size="lg">
          See referrals
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
      </div>
    </section>
  );
}
