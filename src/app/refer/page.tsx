import type { Metadata } from "next";
import { Gift, Link2, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Refer Friends — Free Data for Every Referral",
  description:
    "Earn 5GB of bonus data every month for each active referral, up to 25GB per month. Share your BitLink link and track referrals in your account.",
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
            Refer friends. Earn free data every month.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-slate">
            Every active referral adds 5GB of bonus data to your plan each month — up to 25GB per month. Share your link, friends join, and the extra data keeps coming while they stay active.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            ["Share your link", "Every customer account includes a referral link.", Link2],
            ["Friends join", "Each friend who signs up through your link and stays active counts as a referral.", UsersRound],
            ["Earn monthly data", "Get 5GB of bonus data per active referral, every month — up to 25GB per month.", Gift],
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
