import { supabase } from "./supabase";
import { SITE_URL } from "./theme";

// Usage meters and the card that will actually be charged.
//
// Both come from /api/app/*, which reuse the website's own logic — the
// allowance maths (billing period, plan allowance, active top-ups) lives in
// getCdrUsageBuckets on the server and is never recomputed here. The app
// showing a different "remaining" figure than the portal would be worse than
// showing none.

export type MeterKind = "data" | "voice" | "sms" | "other";

export type Meter = {
  id: string;
  kind: MeterKind;
  remaining: number;
  total: number;
  used: number;
};

export type UsageResult = {
  meters: Meter[];
  source: "carrier" | "cdr" | "none";
};

export type CardSummary = {
  brand: string;
  last4: string;
  expMonth: number | null;
  expYear: number | null;
};

async function authedGet<T>(path: string): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in again.");

  const response = await fetch(`${SITE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!response.ok || payload?.error) {
    throw new Error(payload?.error ?? "Something went wrong.");
  }
  return payload as T;
}

export function fetchUsage(lineId: string): Promise<UsageResult> {
  return authedGet<UsageResult>(`/api/app/usage?lineId=${encodeURIComponent(lineId)}`);
}

export function fetchPaymentCard(lineId: string): Promise<{ card: CardSummary | null }> {
  return authedGet<{ card: CardSummary | null }>(
    `/api/app/payment-method?lineId=${encodeURIComponent(lineId)}`,
  );
}

// Presentation only — the numbers themselves are decided server-side.
export function formatAmount(kind: MeterKind, value: number): string {
  if (kind === "data") {
    if (value >= 1e9) return `${(value / 1e9).toFixed(value >= 1e10 ? 0 : 1)} GB`;
    if (value >= 1e6) return `${Math.round(value / 1e6)} MB`;
    return `${Math.max(0, Math.round(value / 1e3))} KB`;
  }
  if (kind === "voice") return `${Math.floor(value / 60)} min`;
  return String(Math.round(value));
}

export function meterLabel(kind: MeterKind): string {
  return kind === "data" ? "Data" : kind === "voice" ? "Minutes" : kind === "sms" ? "SMS" : "Other";
}

export function cardLabel(card: CardSummary): string {
  const brand = card.brand.charAt(0).toUpperCase() + card.brand.slice(1);
  return `${brand} ···· ${card.last4}`;
}
