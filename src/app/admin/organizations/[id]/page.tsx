import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Copy } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAdminDb } from "@/lib/db/admin";
import { getPartnerSlugForOrgCode } from "@/lib/partner-org-codes";
import { getUsdToIlsRate } from "@/lib/fx";
import { formatMoney } from "@/lib/utils";
import { updateOrganizationAction } from "../actions";

export const metadata: Metadata = { title: "Organization Report" };

const TYPE_LABELS: Record<string, string> = {
  yeshiva: "Yeshiva", seminary: "Seminary", shul: "Shul", other: "Other",
};

function formatIls(agurot: number): string {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 2 }).format(agurot / 100);
}

// Cost in agurot for one customer's CDR usage + active line fee
function calcCdrCost(
  cdrs: Array<{ call_type: string; duration_sec: number; data_bytes: number; sms_count: number }>,
  rates: Record<string, number>,
  hasActivity: boolean,
): number {
  let cost = 0;

  // Active line fee — charged if the line had any activity this month
  if (hasActivity) cost += rates.line_fee ?? 0;

  for (const cdr of cdrs) {
    if (cdr.call_type === "data") {
      // GB = bytes / 1,000,000,000 (decimal GB, standard for telecom billing)
      cost += (cdr.data_bytes / 1_000_000_000) * (rates.data ?? 0);
    } else if (cdr.call_type === "voice") {
      const minutes = Math.ceil(cdr.duration_sec / 60);
      cost += minutes * (rates.voice ?? 0);
      // Interconnect is on top of per-minute rate (direction determines which applies)
      cost += minutes * (rates.interconnect_out ?? 0);
    } else if (cdr.call_type === "sms") {
      cost += cdr.sms_count * (rates.sms ?? 0);
    }
  }

  return cost;
}

export default async function OrganizationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string; rate?: string; month?: string; year?: string }>;
}) {
  const { id } = await params;
  const { error, success, rate: rateParam, month: monthParam, year: yearParam } = await searchParams;

  const db = await getAdminDb();
  if (!db) notFound();

  const { data: org } = await db.from("organizations").select("*").eq("id", id).maybeSingle();
  if (!org) notFound();

  // Report month/year — default to current month
  const now = new Date();
  const reportYear = parseInt(yearParam ?? String(now.getFullYear()), 10);
  const reportMonth = Math.min(12, Math.max(1, parseInt(monthParam ?? String(now.getMonth() + 1), 10)));
  const monthStart = new Date(reportYear, reportMonth - 1, 1).toISOString();
  const monthEnd = new Date(reportYear, reportMonth, 1).toISOString();
  const monthLabel = new Date(reportYear, reportMonth - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  // Exchange rate USD→ILS: live by default (fetched from a free FX source,
  // cached), with a manual ?rate= override so a specific rate can still be
  // pinned when generating a check.
  const liveRate = await getUsdToIlsRate();
  const exchangeRate = rateParam ? Math.max(1, parseFloat(rateParam) || liveRate.rate) : liveRate.rate;

  // Carrier rates keyed by call_type
  const { data: rateRows } = await db.from("carrier_rates").select("call_type, rate_agurot");
  const rates: Record<string, number> = {};
  for (const r of rateRows ?? []) {
    rates[r.call_type] = Number(r.rate_agurot);
  }
  const hasCdrRates = Object.keys(rates).length > 0;

  // Plan price + cost lookup by slug. This is the reliable revenue source:
  // subscribers.monthly_price_cents is frequently null (not set until the
  // first invoice), whereas plans always carries the list price by slug.
  const { data: planRows } = await db
    .from("plans")
    .select("slug, name, monthly_price_cents, cost_agurot");
  const planBySlug: Record<string, { name: string; monthly_price_cents: number; cost_agurot: number }> = {};
  for (const p of planRows ?? []) {
    planBySlug[p.slug] = {
      name: p.name,
      monthly_price_cents: p.monthly_price_cents ?? 0,
      cost_agurot: p.cost_agurot ?? 0,
    };
  }

  // Customers linked to this org
  const { data: rows } = await db
    .from("customers")
    .select("id, full_name, email")
    .eq("org_referral_code", org.referral_code)
    .order("full_name", { ascending: true });

  const customers = rows ?? [];
  const customerIds = customers.map((c) => c.id);

  // Subscriptions live in the `subscribers` table (Stripe-driven). The older
  // `subscriptions` table this report used to read is legacy and was never
  // populated with a plan_id, so every customer showed $0 revenue / no plan.
  // A subscriber counts as revenue when it's active — or when its status is
  // stale (commonly stuck at 'provisioning') but the telecom line is live.
  type OrgSub = { status: string; plan_slug: string | null; lineStatus: string | null };
  const subsByCustomer: Record<string, OrgSub[]> = {};
  if (customerIds.length > 0) {
    const { data: subRows } = await db
      .from("subscribers")
      .select("customer_id, status, plan_slug, telecom_line_id")
      .in("customer_id", customerIds);

    const lineIds = [...new Set((subRows ?? []).map((s) => s.telecom_line_id).filter(Boolean))] as string[];
    const lineStatusById: Record<string, string> = {};
    if (lineIds.length > 0) {
      const { data: lineRows } = await db.from("telecom_lines").select("id, status").in("id", lineIds);
      for (const l of lineRows ?? []) lineStatusById[l.id] = l.status;
    }
    for (const s of subRows ?? []) {
      (subsByCustomer[s.customer_id] ??= []).push({
        status: s.status,
        plan_slug: s.plan_slug,
        lineStatus: s.telecom_line_id ? lineStatusById[s.telecom_line_id] ?? null : null,
      });
    }
  }

  const DEAD_SUB_STATUS = new Set(["cancelled", "canceled", "incomplete_expired", "paused"]);
  const isLiveSub = (s: OrgSub) =>
    !DEAD_SUB_STATUS.has(s.status) && (s.status === "active" || s.lineStatus === "active");

  // CDR records for all customers in the selected month
  const cdrByCustomer: Record<string, Array<{ call_type: string; duration_sec: number; data_bytes: number; sms_count: number }>> = {};
  if (customerIds.length > 0) {
    const { data: cdrRows } = await db
      .from("cdr_records")
      .select("customer_id, call_type, duration_sec, data_bytes, sms_count")
      .in("customer_id", customerIds)
      .gte("occurred_at", monthStart)
      .lt("occurred_at", monthEnd);

    for (const cdr of cdrRows ?? []) {
      if (!cdrByCustomer[cdr.customer_id]) cdrByCustomer[cdr.customer_id] = [];
      cdrByCustomer[cdr.customer_id].push(cdr);
    }
  }

  const hasCdrData = Object.keys(cdrByCustomer).length > 0;

  // Build per-customer report rows
  type CustomerRow = {
    id: string;
    full_name: string | null;
    email: string | null;
    planName: string | null;
    revenueCents: number;
    costAgurot: number;
    costSource: "cdr" | "plan" | "none";
    profitIls: number;
    hasActiveSub: boolean;
  };

  const customerRows: CustomerRow[] = customers.map((c) => {
    const liveSubs = (subsByCustomer[c.id] ?? []).filter(isLiveSub);

    // Revenue = sum of plan list prices across the customer's live lines
    // (handles multi-line customers correctly; cost stays per-customer below
    // since CDR usage is only keyed by customer, not line).
    let revenueCents = 0;
    const planNames: string[] = [];
    let planCostAgurot = 0;
    for (const s of liveSubs) {
      const plan = s.plan_slug ? planBySlug[s.plan_slug] : undefined;
      if (plan) {
        revenueCents += plan.monthly_price_cents;
        planCostAgurot += plan.cost_agurot;
        planNames.push(plan.name);
      }
    }
    const hasLive = liveSubs.length > 0;

    const customerCdrs = cdrByCustomer[c.id] ?? [];
    const hasActivity = customerCdrs.length > 0;

    let costAgurot: number;
    let costSource: "cdr" | "plan" | "none";

    if (hasCdrRates && hasActivity) {
      costAgurot = calcCdrCost(customerCdrs, rates, hasActivity);
      costSource = "cdr";
    } else if (planCostAgurot > 0) {
      costAgurot = planCostAgurot;
      costSource = "plan";
    } else {
      // No CDR data and no plan cost — charge active line fee only if live
      costAgurot = hasLive ? (rates.line_fee ?? 0) : 0;
      costSource = "none";
    }

    const revenueIls = (revenueCents / 100) * exchangeRate;
    const costIls = costAgurot / 100;
    const profitIls = revenueIls - costIls;

    return {
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      planName: planNames.length ? [...new Set(planNames)].join(", ") : null,
      revenueCents,
      costAgurot,
      costSource,
      profitIls,
      hasActiveSub: hasLive,
    };
  });

  const totalRevenueCents = customerRows.reduce((s, r) => s + r.revenueCents, 0);
  const totalCostAgurot = customerRows.reduce((s, r) => s + r.costAgurot, 0);
  const totalProfitIls = customerRows.reduce((s, r) => s + r.profitIls, 0);
  const charityCheckIls = totalProfitIls * 0.1;

  // Best link for the org to share, in preference order: their dedicated
  // partner page (clean URL, attribution set by middleware) → a type-matched
  // marketing landing page with ?org= → the plans page with ?org=. Never the
  // bare signup form: the cookie is captured on ANY page hit, and a marketing
  // page converts; a signup form shown cold doesn't.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const partnerSlug = getPartnerSlugForOrgCode(org.referral_code as string);
  const landingByType: Record<string, string> = {
    yeshiva: "/yeshiva-seminary-phone-plans",
    seminary: "/yeshiva-seminary-phone-plans",
    shul: "/israeli-phone-plans-for-olim",
  };
  const signupLink = partnerSlug
    ? `${siteUrl}/partners/${partnerSlug}`
    : `${siteUrl}${landingByType[org.type as string] ?? "/plans"}?org=${org.referral_code}`;

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold text-link-blue">Organizations</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">{org.name}</h1>
          <p className="mt-1 text-sm text-muted-slate">{TYPE_LABELS[org.type] ?? org.type}</p>
        </div>
        <StatusBadge status={org.active ? "active" : "inactive"} />
      </section>

      {/* Referral link */}
      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold text-ink">Referral signup link</p>
        <p className="mt-1 text-xs text-muted-slate">Share with the organization. Sign-ups via this URL are automatically tracked.</p>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <code className="flex-1 break-all text-xs text-slate-700">{signupLink}</code>
          <Copy className="h-4 w-4 shrink-0 text-muted-slate" aria-hidden />
        </div>
      </section>

      {/* Monthly profit report */}
      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">Monthly profit report — {monthLabel}</p>
            <p className="mt-1 text-xs text-muted-slate">
              {hasCdrData
                ? "Cost calculated from CDR usage × carrier rates (from Annatel contract)."
                : "No CDR data for this month — falling back to per-plan carrier cost estimate."}
              {" "}Profit = (revenue × rate) − carrier cost.
            </p>
          </div>
          {/* Controls: month + exchange rate */}
          <form method="GET" className="flex flex-wrap items-end gap-2">
            <div className="grid gap-1">
              <label className="text-xs font-semibold text-muted-slate">Month</label>
              <select
                name="month"
                defaultValue={reportMonth}
                className="h-10 rounded-2xl border border-ink/10 bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-link-blue"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1, 1).toLocaleString("en-US", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Year"
              name="year"
              type="number"
              min="2024"
              max="2030"
              defaultValue={reportYear}
              className="w-24"
            />
            <div className="grid gap-1">
              <Input
                label="USD → ILS rate"
                name="rate"
                type="number"
                step="0.01"
                min="1"
                defaultValue={exchangeRate.toFixed(2)}
                className="w-28"
              />
              <span className="text-[10px] text-muted-slate">
                {rateParam
                  ? "Manual override"
                  : liveRate.source === "live"
                    ? `Live rate${liveRate.asOf ? ` · ${new Date(liveRate.asOf).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}`
                    : "Fallback rate (FX source unreachable)"}
              </span>
            </div>
            <Button type="submit" variant="secondary" size="sm">Apply</Button>
          </form>
        </div>

        {customerRows.length ? (
          <>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-[720px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-muted-slate">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold text-right">Revenue (USD)</th>
                    <th className="px-4 py-3 font-semibold text-right">Carrier cost (ILS)</th>
                    <th className="px-4 py-3 font-semibold text-right">Profit (ILS)</th>
                    <th className="px-4 py-3 font-semibold">Sub</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/8">
                  {customerRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">{row.full_name ?? "—"}</div>
                        <div className="text-xs text-muted-slate">{row.email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.planName ?? <span className="text-muted-slate">—</span>}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">{formatMoney(row.revenueCents)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-slate-700">{formatIls(row.costAgurot)}</span>
                        {row.costSource === "plan" ? (
                          <span className="ml-1 text-[10px] text-amber-600">(est.)</span>
                        ) : row.costSource === "none" ? (
                          <span className="ml-1 text-[10px] text-rose-500">(no data)</span>
                        ) : null}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${row.profitIls >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                        {formatIls(row.profitIls * 100)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.hasActiveSub ? "active" : "pending"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-ink/10 bg-slate-50 font-semibold">
                  <tr>
                    <td className="px-4 py-3 text-ink" colSpan={2}>
                      Totals ({customerRows.length} subscriber{customerRows.length !== 1 ? "s" : ""})
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-ink">{formatMoney(totalRevenueCents)}</td>
                    <td className="px-4 py-3 text-right font-mono text-ink">{formatIls(totalCostAgurot)}</td>
                    <td className={`px-4 py-3 text-right font-mono ${totalProfitIls >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                      {formatIls(totalProfitIls * 100)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Charity check */}
            <div className="mt-5 flex items-center gap-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900">10% charity check — {org.name}</p>
                <p className="mt-0.5 text-xs text-emerald-700">
                  {monthLabel} · {formatMoney(totalRevenueCents)} revenue · {formatIls(totalCostAgurot)} cost · rate ₪{exchangeRate.toFixed(2)}/$
                  {hasCdrData ? " · CDR-based" : " · estimated"}
                </p>
              </div>
              <p className="text-3xl font-bold tabular-nums text-emerald-800">{formatIls(charityCheckIls * 100)}</p>
            </div>
          </>
        ) : (
          <div className="mt-5">
            <EmptyState title="No subscribers linked to this organization yet." />
          </div>
        )}
      </section>

      {/* Edit org */}
      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        <p className="mb-5 text-sm font-semibold text-ink">Edit organization</p>
        <form action={updateOrganizationAction} className="grid max-w-lg gap-4">
          <input type="hidden" name="id" value={org.id} />
          <Input label="Organization name" name="name" defaultValue={org.name} required />
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-ink" htmlFor="edit-type">Type</label>
            <select id="edit-type" name="type" defaultValue={org.type}
              className="h-11 rounded-2xl border border-ink/10 bg-white px-4 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-link-blue">
              <option value="yeshiva">Yeshiva</option>
              <option value="seminary">Seminary</option>
              <option value="shul">Shul</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input label="Contact name" name="contactName" defaultValue={org.contact_name ?? ""} />
          <Input label="Contact email" name="contactEmail" type="email" defaultValue={org.contact_email ?? ""} />
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-ink" htmlFor="edit-notes">Notes</label>
            <textarea id="edit-notes" name="notes" rows={3} defaultValue={org.notes ?? ""}
              className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted-slate focus:outline-none focus:ring-2 focus:ring-link-blue" />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-ink" htmlFor="edit-active">Status</label>
            <select id="edit-active" name="active" defaultValue={org.active ? "true" : "false"}
              className="h-11 rounded-2xl border border-ink/10 bg-white px-4 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-link-blue">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{decodeURIComponent(error)}</div> : null}
          {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">Changes saved.</div> : null}
          <div className="flex gap-3 pt-1">
            <Button type="submit">Save changes</Button>
            <Link href="/admin/organizations"><Button type="button" variant="secondary">Back to list</Button></Link>
          </div>
        </form>
      </section>
    </div>
  );
}
