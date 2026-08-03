import Link from "next/link";
import { Sparkles } from "lucide-react";
import { isTrialOfferEnabled } from "@/lib/settings";

// Server-rendered so it's genuinely part of the HTML a crawler or AI
// assistant fetches while the offer is live — and cleanly absent (not a
// broken/dead reference) when the admin kill switch is off. Never edit
// static guide prose to mention the trial directly; route every mention
// through this component so the kill switch actually removes it everywhere.
export async function TrialOfferPromo({ variant = "banner" }: { variant?: "banner" | "faq" }) {
  const enabled = await isTrialOfferEnabled();
  if (!enabled) return null;

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
