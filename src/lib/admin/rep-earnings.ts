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
//   converted  — those trials whose status is 'converted' (they kept the plan)
//   earned     — per converted trial, priced off the plan it landed on
//
// A trial that is still running earns nothing yet, and one that was cancelled
// earns nothing ever — matching what the Rep was told: "anyone who keeps their
// plan after the free month, you get paid for".

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanSlug } from "@/lib/plans";

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
  status: string; rate_basic_cents: number; rate_premium_cents: number;
};

export async function getRepSummaries(db: SupabaseClient): Promise<RepSummary[] | null> {
  const { data: affiliates, error } = await db
    .from("affiliates")
    .select("id, name, code, contact, status, rate_basic_cents, rate_premium_cents")
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

  const lineIds = (trials ?? []).map((t) => t.telecom_line_id as string).filter(Boolean);
  const { data: lines } = lineIds.length
    ? await db.from("telecom_lines").select("id, metadata").in("id", lineIds)
    : { data: [] };
  const planByLine = new Map<string, string | null>();
  for (const l of lines ?? []) {
    const metadata = (l.metadata ?? {}) as Record<string, unknown>;
    planByLine.set(l.id as string, (metadata.plan_slug as string | undefined) ?? null);
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

    let converted = 0, cancelled = 0, running = 0, earnedCents = 0;
    const conversions: RepConversion[] = [];

    for (const t of theirTrials) {
      const status = String(t.status);
      if (status === "converted") {
        converted++;
        const planSlug = planByLine.get(t.telecom_line_id as string) ?? null;
        const amountCents = planSlug && PREMIUM_PLANS.has(planSlug)
          ? rep.rate_premium_cents
          : rep.rate_basic_cents;
        earnedCents += amountCents;
        const c = nameById.get(t.customer_id as string);
        conversions.push({
          customerName: c?.name ?? null,
          customerEmail: c?.email ?? null,
          planSlug,
          amountCents,
          convertedAt: (t.decided_at ?? null) as string | null,
        });
      } else if (status === "cancelled" || status === "frozen") {
        cancelled++;
      } else {
        // pending_provision | active — live, not yet earning
        running++;
      }
    }

    conversions.sort((a, b) => (b.convertedAt ?? "").localeCompare(a.convertedAt ?? ""));
    const paidCents = paidByAffiliate.get(rep.id) ?? 0;

    return {
      id: rep.id,
      name: rep.name,
      code: rep.code,
      contact: rep.contact,
      status: rep.status,
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
