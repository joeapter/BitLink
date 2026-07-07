"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Silently re-fetches the current server component tree on an interval so
// admin status pages track the pipeline without manual reloads.
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(interval);
  }, [router, seconds]);

  return null;
}
