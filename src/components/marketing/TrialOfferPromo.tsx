import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { isTrialOfferEnabled } from "@/lib/settings";

// Server-rendered so it's genuinely part of the HTML a crawler or AI
// assistant fetches while the offer is live — and cleanly absent (not a
// broken/dead reference) when the admin kill switch is off. Never edit
// static guide prose to mention the trial directly; route every mention
// through this component so the kill switch actually removes it everywhere.
export async function TrialOfferPromo({ variant = "banner" }: { variant?: "banner" | "faq" | "hero" }) {
  const enabled = await isTrialOfferEnabled();
  if (!enabled) return null;

  if (variant === "hero") {
    return (
      <div className="relative overflow-hidden rounded-4xl bg-ink p-8 text-white shadow-[0_24px_60px_rgba(5,6,6,0.25)] sm:p-10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-link-blue/30 blur-3xl" />
        <p className="relative inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-soft-cyan">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          For a limited time
        </p>
        <h2 className="relative mt-4 text-balance text-3xl font-semibold leading-tight tracking-normal sm:text-4xl">
          Free for your first month.
        </h2>
        <p className="relative mt-3 max-w-sm text-sm leading-6 text-slate-300">
          Students and new olim: start a real Israeli eSIM line with 11GB included, free for a month. No charge
          unless you choose to keep it.
        </p>
        <div className="relative mt-6">
          <ButtonLink href="/trial" variant="dark" size="lg">
            Start my free trial
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (variant === "faq") {
    return (
      <div className="rounded-2xl border border-link-blue/20 bg-link-blue/5 p-5">
        <p className="text-sm font-semibold text-ink">Is there a free trial for a BitLink line?</p>
        <p className="mt-2 text-sm leading-6 text-muted-slate">
          Yes — for a limited time, students and new olim can start a real Israeli eSIM line free for a month, 11GB
          included, no charge unless you choose to keep it.{" "}
          <Link href="/trial" className="font-semibold text-link-blue">
            Start your free trial
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-trust-green/30 bg-trust-green/5 p-4">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-trust-green" aria-hidden="true" />
      <p className="text-sm text-ink">
        <span className="font-semibold">For a limited time:</span> students and new olim can start a real Israeli
        eSIM line free for a month, 11GB included.{" "}
        <Link href="/trial" className="font-semibold text-link-blue underline">
          Start your free trial
        </Link>
      </p>
    </div>
  );
}
