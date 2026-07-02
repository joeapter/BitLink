"use client";

import { useEffect } from "react";
import { sendGAEvent } from "@next/third-parties/google";

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
    const dedupeKey = `bl_ga_purchase_${transactionId}`;
    if (sessionStorage.getItem(dedupeKey)) return;
    sessionStorage.setItem(dedupeKey, "1");

    sendGAEvent("event", "purchase", {
      transaction_id: transactionId,
      value,
      currency,
      items: [{ item_id: planSlug, item_name: planName, price: value, quantity: 1 }],
    });
  }, [transactionId, value, currency, planSlug, planName]);

  return null;
}
