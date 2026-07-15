"use client";

import { useEffect } from "react";

// Uses window.gtag from the inline bootstrap in app/layout.tsx directly.
// sendGAEvent from @next/third-parties is a silent no-op here: it only works
// when that package's <GoogleAnalytics /> component initialized GA, and this
// site can't use it (see the script comments in layout.tsx).
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function PurchaseEvent({
  transactionId,
  value,
  currency,
  planSlug,
  planName,
}: {
  transactionId: string;
  value: number;
  currency: string;
  planSlug: string;
  planName: string;
}) {
  useEffect(() => {
    if (typeof window.gtag !== "function") return;

    const dedupeKey = `bl_ga_purchase_${transactionId}`;
    if (sessionStorage.getItem(dedupeKey)) return;
    sessionStorage.setItem(dedupeKey, "1");

    window.gtag("event", "purchase", {
      transaction_id: transactionId,
      value,
      currency,
      items: [{ item_id: planSlug, item_name: planName, price: value, quantity: 1 }],
    });
  }, [transactionId, value, currency, planSlug, planName]);

  return null;
}
