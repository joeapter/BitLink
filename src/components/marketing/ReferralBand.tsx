import { ArrowRight, Gift } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export function ReferralBand() {
  return (
    <section className="relative overflow-hidden bg-[#f4fafc] py-16 sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(23,212,232,0.22),transparent_34rem),radial-gradient(circle_at_86%_72%,rgba(18,185,129,0.12),transparent_30rem)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/72 px-4 py-2 text-sm font-semibold text-link-blue shadow-sm backdrop-blur">
            <Gift className="h-4 w-4" aria-hidden="true" />
            Referral savings
          </div>
          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-normal text-ink sm:text-5xl">
            Refer friends. Earn up to 25GB of free data monthly.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-slate sm:text-lg sm:leading-8">
            Every active referral adds 5GB of bonus data to your plan each month. We&apos;ll track eligible referrals and apply the bonus data when they qualify.
          </p>
        </div>

        <ButtonLink href="/refer" size="lg" className="w-full sm:w-auto">
          See referrals
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
      </div>
    </section>
  );
}
