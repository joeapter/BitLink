"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// A brief branded hop, not a destination. Everything here exists for the
// fraction of a second before the redirect lands — and for the rare visitor
// whose browser blocks the script, who gets a working link instead of a
// dead end.
export function RepRedirect({ to, repName }: { to: string; repName: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6 py-20">
      <div className="text-center">
        <p className="text-sm font-semibold text-link-blue">
          {repName ? `${repName} sent you` : "Welcome"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-ink">
          Taking you to BitLink…
        </h1>
        <p className="mt-4 text-sm text-muted-slate">
          Not moving?{" "}
          <a href={to} className="font-semibold text-link-blue underline">
            Tap here to continue
          </a>
          .
        </p>
      </div>
    </section>
  );
}
