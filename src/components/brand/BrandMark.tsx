"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  const timestamps = useRef<number[]>([]);
  const [toast, setToast] = useState(false);

  const handleClick = useCallback(() => {
    const now = Date.now();
    const recent = [...timestamps.current, now].filter((t) => now - t < 2000);
    timestamps.current = recent;

    if (recent.length >= 7) {
      timestamps.current = [];
      const already = localStorage.getItem("bl_staff") === "1";
      if (!already) {
        localStorage.setItem("bl_staff", "1");
        setToast(true);
        setTimeout(() => setToast(false), 2500);
      }
    }
  }, []);

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
          Activation fee waived
        </div>
      )}
    </>
  );
}
