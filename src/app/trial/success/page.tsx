import type { Metadata } from "next";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata("You're in!", "Your BitLink trial is being set up.");

export default function TrialSuccessPage() {
  return (
    <section className="liquid-bg bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto max-w-xl rounded-4xl border border-ink/10 bg-white p-8 text-center shadow-soft">
        <h1 className="text-2xl font-semibold text-ink">You&apos;re all set</h1>
        <p className="mt-3 text-sm leading-6 text-muted-slate">
          We&apos;re setting up your real Israeli eSIM line now — check your email in the next few minutes for your
          QR code. Nothing was charged today.
        </p>
      </div>
    </section>
  );
}
