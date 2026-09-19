import type { Metadata } from "next";
import Link from "next/link";
import { TrialDecisionForm } from "@/components/checkout/TrialDecisionForm";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPlan } from "@/lib/plans";
import { TRIAL_AUTO_CONTINUE_PLAN } from "@/lib/trial-offer";
import { createNoIndexMetadata } from "@/lib/seo";

const autoContinuePlanName = getPlan(TRIAL_AUTO_CONTINUE_PLAN).name;

export const metadata: Metadata = createNoIndexMetadata("Pick your plan", "Choose your BitLink plan.");
export const dynamic = "force-dynamic";

function StatusCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="liquid-bg bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto max-w-xl rounded-4xl border border-ink/10 bg-white p-8 text-center shadow-soft">
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-slate">{body}</p>
        <Link href="/support" className="mt-6 inline-block rounded-full bg-link-blue px-6 py-3 text-sm font-semibold text-white">
          Message support
        </Link>
      </div>
    </section>
  );
}

export default async function TrialDecisionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  const row = admin
    ? (await admin.from("trial_lines").select("status, frozen_at").eq("token", token).maybeSingle()).data
    : null;

  if (!row) {
    return <StatusCard title="We couldn't find that trial" body="If you think this is a mistake, message us and we'll sort it out." />;
  }

  if (row.status === "pending_provision") {
    return (
      <StatusCard
        title="Almost there"
        body="Your line is still being set up — this usually takes just a few minutes. Check your email, then come back to this link."
      />
    );
  }

  if (row.status === "converted") {
    return <StatusCard title="You're already set" body="You've already picked a plan — your line is running normally." />;
  }

  if (row.status === "cancelled") {
    return (
      <StatusCard
        title="This trial was cancelled"
        body="Your line has been closed and you weren't charged. The number has gone back to our pool, so picking it back up would mean starting a new line — message us and we'll set one up."
      />
    );
  }

  if (row.status === "frozen") {
    return (
      <StatusCard
        title="This trial has ended"
        body="We tried to continue your line automatically but the charge didn't go through, so it froze instead. Message us and we'll help you sort it out."
      />
    );
  }

  // past_due says nothing about whether the line is up — it keeps working for
  // the first stretch of the retry ladder. frozen_at is the one that knows.
  if (row.status === "past_due") {
    return (
      <StatusCard
        title="We couldn't charge your card"
        body={
          row.frozen_at
            ? "Your line is paused and your number is still being held for you. Update your card on your billing page and we'll retry automatically — your line comes straight back on once a payment goes through."
            : "Your line is still working for now. Update your card on your billing page and we'll retry automatically, so nothing gets interrupted."
        }
      />
    );
  }

  if (row.status === "terminated") {
    return (
      <StatusCard
        title="This line has been closed"
        body="We weren't able to take a payment, so the line was closed and the number released. You haven't been charged. Message us if you'd like to start a new line."
      />
    );
  }

  return (
    <section className="liquid-bg bg-slate-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="relative z-10 mx-auto max-w-2xl">
        <p className="text-sm font-semibold text-link-blue">Your trial</p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
          Keep your number going
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-slate">
          Pick a plan and your line keeps running with no gap. We&apos;ll charge the card you already gave us — no new
          checkout. If you do nothing, we&apos;ll automatically continue you on {autoContinuePlanName} when the trial
          ends — see below if you&apos;d rather not.
        </p>
        <div className="mt-8">
          <TrialDecisionForm token={token} autoContinuePlanName={autoContinuePlanName} />
        </div>
      </div>
    </section>
  );
}
