"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function TrialSignupForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/trial/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
      }),
    });

    const payload = (await response.json()) as { url?: string; error?: string };
    setLoading(false);

    if (!response.ok || !payload.url) {
      setError(payload.error ?? "Something went wrong. Please try again.");
      return;
    }

    window.location.href = payload.url;
  }

  return (
    <form action={onSubmit} className="rounded-4xl border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
      <div className="grid gap-4">
        <Input label="Full name" name="fullName" autoComplete="name" required />
        <Input label="Email" name="email" type="email" autoComplete="email" required />
        <Input label="Phone" name="phone" type="tel" autoComplete="tel" required />
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-6">
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Start my free trial
        </Button>
        <p className="mt-3 text-xs leading-5 text-muted-slate">
          We&apos;ll ask for a card to hold your spot — you&apos;re not charged today, and won&apos;t be unless you choose a plan.
        </p>
      </div>
    </form>
  );
}
