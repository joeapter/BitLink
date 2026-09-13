import { supabase } from "./supabase";

// Row level security is the security boundary, but it is NOT a substitute for
// scoping the query. The customers policy is `user_id = auth.uid() OR
// is_admin()`, so an admin's session legitimately sees every customer row —
// which made maybeSingle() fail with "Results contain 91 rows" the first time
// this ran against a real admin account. Always filter by the signed-in user's
// id explicitly: correct for customers and admins alike, and it keeps the app
// showing "my account" rather than whichever row happened to come back first.

export type LineMetadata = {
  plan_slug?: string;
  phone_number?: string;
  is_esim?: boolean;
  is_trial?: boolean;
  intl_number?: string;
  esim_activation_code?: string;
  esim_icc_id?: string;
  esim_sm_dp_plus?: string;
};

export type AccountLine = {
  id: string;
  status: string;
  isKosher: boolean;
  createdAt: string;
  metadata: LineMetadata;
};

export type AccountSnapshot = {
  /**
   * False when no customers row is linked to this login. The website resolves
   * a customer by user_id and then falls back to matching on email, claiming
   * the row by stamping user_id onto it. The app cannot do that second step:
   * an unclaimed row (user_id null) fails the customers SELECT policy, so it
   * is invisible here rather than merely unlinked. As of 2026-09-13 that is
   * 1 of the 54 customers who own lines — but for that person "no lines yet"
   * would be a lie, so the screen says something true instead.
   */
  hasCustomerRecord: boolean;
  fullName: string | null;
  email: string | null;
  referralCode: string | null;
  lines: AccountLine[];
};

export async function fetchAccount(userId: string): Promise<AccountSnapshot> {
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, full_name, email, referral_code")
    .eq("user_id", userId)
    .maybeSingle();

  if (customerError) throw customerError;

  if (!customer) {
    // Either someone who registered but never bought, or someone whose
    // customer row is not yet linked to their login. Not an error state.
    return { hasCustomerRecord: false, fullName: null, email: null, referralCode: null, lines: [] };
  }

  const { data: lines, error: linesError } = await supabase
    .from("telecom_lines")
    .select("id, status, is_kosher, metadata, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  if (linesError) throw linesError;

  return {
    hasCustomerRecord: true,
    fullName: customer.full_name,
    email: customer.email,
    referralCode: customer.referral_code,
    lines: (lines ?? []).map((line) => ({
      id: line.id as string,
      status: (line.status as string) ?? "unknown",
      isKosher: Boolean(line.is_kosher),
      createdAt: line.created_at as string,
      metadata: (line.metadata ?? {}) as LineMetadata,
    })),
  };
}

// Israeli numbers arrive as +9725XXXXXXXX; show them the way people here read
// them. Anything else (US/UK numbers on the intl add-on) is left alone rather
// than mangled by rules that don't apply to it.
export function formatPhone(raw?: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("972") && digits.length === 12) {
    const local = digits.slice(3);
    return `0${local.slice(0, 2)}-${local.slice(2, 5)}-${local.slice(5)}`;
  }
  return raw;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  terminated: "Ended",
  failed: "Needs attention",
  pending: "Setting up",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
