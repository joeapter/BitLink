"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  const router = useRouter();
  const timestamps = useRef<number[]>([]);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // The logo doubles as the fee-waiver easter egg (7 rapid clicks). Navigation
  // is deferred by 400ms so a click burst never navigates — otherwise click #1
  // scrolls the page and the logo moves out from under the cursor.
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const now = Date.now();
    const recent = [...timestamps.current, now].filter((t) => now - t < 3000);
    timestamps.current = recent;

    if (navTimer.current) clearTimeout(navTimer.current);
    if (recent.length === 1) {
      // Single click: navigate home after a beat, unless a burst follows.
      navTimer.current = setTimeout(() => router.push("/"), 400);
    }

    if (recent.length >= 7) {
      timestamps.current = [];
      const already = localStorage.getItem("bl_staff") === "1";
      if (!already) localStorage.setItem("bl_staff", "1");
      // Always confirm — a silent success is indistinguishable from a bug.
      setToast(already ? "Activation fee waiver already active" : "Activation fee waived");
      setTimeout(() => setToast(null), 2500);
    }
  }, [router]);

  return (
    <>
      <Link
        href="/"
        className={cn("inline-flex items-center", className)}
        aria-label="BitLink home"
        onClick={handleClick}
      >
        <Image
          src="/assets/logo-v2.png"
          alt="BitLink"
          width={170}
          height={51}
          className="h-11 w-auto"
        />
      </Link>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-ink px-5 py-3 text-sm font-medium text-white shadow-liquid">
          {toast}
        </div>
      )}
    </>
  );
}
