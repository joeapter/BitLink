// BitLink Reps — influencers who share the free-trial link and get paid when a
// trial they sent converts onto a paid plan.
//
// Stored in the `affiliates` table rather than `sales_reps`: that program is a
// different thing (portal customers, flat ILS commission, needs a login). A Rep
// needs no account at all — attribution is the raw code on customers.referred_by,
// the same mechanism the airport driver cards use.
//
// Counting rules:
//   trials     — every trial started by a customer carrying the Rep's code
//   paid lines — lines belonging to those customers that are on a real paid
//                plan, whether they came via a converted trial or a straight
//                purchase
//   earned     — per paid line, priced off the plan it's on
//
// Earnings count PAID LINES, not trials. Reps can be pointed at the free trial
// or at the plans page (affiliates.landing), and someone who buys outright
// earns their Rep exactly what a converted trial does — otherwise a Rep sending
// people to /plans would show conversions and earn nothing.
//
// Counting lines rather than trials is also what keeps a converted trial from
// paying twice: the conversion turns the *same* line into a paid one
// (is_trial: false + a Stripe subscription), so it appears once either way.
//
// A running trial earns nothing yet; a cancelled one earns nothing ever.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanSlug } from "@/lib/plans";
import { isRepLanding, type RepLanding } from "@/lib/rep-links";

/** Plans that pay the higher rate. Everything else pays the basic rate. */
const PREMIUM_PLANS: ReadonlySet<string> = new Set<PlanSlug>(["student-5g", "max-5g"]);

export type RepConversion = {
  customerName: string | null;
  customerEmail: string | null;
  planSlug: string | null;
  amountCents: number;
  convertedAt: string | null;
};

export type RepSummary = {
  id: string;
  name: string;
  code: string;
  contact: string | null;
  status: string;
  landing: RepLanding;
  rateBasicCents: number;
  ratePremiumCents: number;
  trials: number;
  trialsRunning: number;
  converted: number;
  cancelled: number;
  earnedCents: number;
  paidCents: number;
  owedCents: number;
  conversions: RepConversion[];
};

type AffiliateRow = {
  id: string; name: string; code: string; contact: string | null;
  status: string; landing: string | null; rate_basic_cents: number; rate_premium_cents: number;
};

export async function getRepSummaries(db: SupabaseClient): Promise<RepSummary[] | null> {
  const { data: affiliates, error } = await db
    .from("affiliates")
    .select("id, name, code, contact, status, landing, rate_basic_cents, rate_premium_cents")
    .order("created_at", { ascending: true });

  // Table not applied yet — the page renders a setup notice instead of crashing.
  if (error) return null;
  const rows = (affiliates ?? []) as AffiliateRow[];
  if (!rows.length) return [];

  const codes = rows.map((r) => r.code);

  // Customers carrying any Rep code.
  const { data: customers } = await db
    .from("customers")
    .select("id, full_name, email, referred_by")
    .in("referred_by", codes);

  const byCode = new Map<string, { id: string; name: string | null; email: string | null }[]>();
  for (const c of customers ?? []) {
    const code = c.referred_by as string;
    const list = byCode.get(code) ?? [];
    list.push({ id: c.id as string, name: (c.full_name ?? null) as string | null, email: (c.email ?? null) as string | null });
    byCode.set(code, list);
  }

  const customerIds = (customers ?? []).map((c) => c.id as string);

  // Every trial belonging to those customers, plus the line it sits on so the
  // converted plan can be read.
  const { data: trials } = customerIds.length
    ? await db
        .from("trial_lines")
        .select("customer_id, telecom_line_id, status, decided_at")
        .in("customer_id", customerIds)
    : { data: [] };

  // Every line these customers hold, so a direct purchase counts even when no
  // trial was ever started.
  const { data: lines } = customerIds.length
    ? await db
        .from("telecom_lines")
        .select("id, customer_id, status, metadata")
        .in("customer_id", customerIds)
    : { data: [] };

  const planByLine = new Map<string, string | null>();
  for (const l of lines ?? []) {
    const metadata = (l.metadata ?? {}) as Record<string, unknown>;
    planByLine.set(l.id as string, (metadata.plan_slug as string | undefined) ?? null);
  }

  // "A real paid plan was executed": the line carries a Stripe subscription and
  // is no longer a trial. A converted trial satisfies both — process-stripe-event
  // stamps is_trial:false and the subscription id onto the same line — so it is
  // counted here once and nowhere else.
  type PaidLine = { id: string; customerId: string; planSlug: string | null; at: string | null };
  const paidLines: PaidLine[] = [];
  for (const l of lines ?? []) {
    const metadata = (l.metadata ?? {}) as Record<string, unknown>;
    if (!metadata.stripe_subscription_id) continue;
    if (metadata.is_trial === true || metadata.is_trial === "true") continue;
    paidLines.push({
      id: l.id as string,
      customerId: l.customer_id as string,
      planSlug: (metadata.plan_slug as string | undefined) ?? null,
      at: (metadata.provisioned_email_sent_at as string | undefined) ?? null,
    });
  }

  const { data: payments } = await db
    .from("affiliate_payments")
    .select("affiliate_id, amount_cents");
  const paidByAffiliate = new Map<string, number>();
  for (const p of payments ?? []) {
    const id = p.affiliate_id as string;
    paidByAffiliate.set(id, (paidByAffiliate.get(id) ?? 0) + Number(p.amount_cents ?? 0));
  }

  return rows.map((rep) => {
    const theirCustomers = byCode.get(rep.code) ?? [];
    const nameById = new Map(theirCustomers.map((c) => [c.id, c]));
    const theirTrials = (trials ?? []).filter((t) => nameById.has(t.customer_id as string));

    let cancelled = 0, running = 0, earnedCents = 0;
    const conversions: RepConversion[] = [];

    // Trials are still worth showing — they're the leading indicator of a Rep
    // who is active — but they no longer decide the money.
    for (const t of theirTrials) {
      const status = String(t.status);
      if (status === "cancelled" || status === "frozen") cancelled++;
      else if (status !== "converted") running++;
    }

    const decidedAtByLine = new Map(
      theirTrials.map((t) => [t.telecom_line_id as string, (t.decided_at ?? null) as string | null]),
    );

    const theirPaidLines = paidLines.filter((l) => nameById.has(l.customerId));
    for (const line of theirPaidLines) {
      const amountCents = line.planSlug && PREMIUM_PLANS.has(line.planSlug)
        ? rep.rate_premium_cents
        : rep.rate_basic_cents;
      earnedCents += amountCents;
      const c = nameById.get(line.customerId);
      conversions.push({
        customerName: c?.name ?? null,
        customerEmail: c?.email ?? null,
        planSlug: line.planSlug,
        amountCents,
        // A converted trial has a decision date; a straight purchase doesn't,
        // so fall back to when the line was provisioned.
        convertedAt: decidedAtByLine.get(line.id) ?? line.at,
      });
    }
    const converted = theirPaidLines.length;

    conversions.sort((a, b) => (b.convertedAt ?? "").localeCompare(a.convertedAt ?? ""));
    const paidCents = paidByAffiliate.get(rep.id) ?? 0;

    return {
      id: rep.id,
      name: rep.name,
      code: rep.code,
      contact: rep.contact,
      status: rep.status,
      landing: isRepLanding(rep.landing) ? rep.landing : "trial",
      rateBasicCents: rep.rate_basic_cents,
      ratePremiumCents: rep.rate_premium_cents,
      trials: theirTrials.length,
      trialsRunning: running,
      converted,
      cancelled,
      earnedCents,
      paidCents,
      owedCents: Math.max(0, earnedCents - paidCents),
      conversions,
    };
  });
}
