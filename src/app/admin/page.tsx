import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, Clock, CreditCard, DollarSign, Globe2, Phone, RadioTower, Share2, Users } from "lucide-react";
import { AdminMetric } from "@/components/admin/AdminMetric";
import { ProvisioningQueue } from "@/components/admin/ProvisioningQueue";
import { InventoryPanel, InventoryPanelSkeleton } from "@/components/admin/InventoryPanel";
import { getInventorySnapshot } from "@/lib/admin/inventory";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAdminDb, getAdminOverview } from "@/lib/db/admin";
import { getExpectedRevenue, getMonthlyRevenue } from "@/lib/stripe/revenue";
import { getPlan } from "@/lib/plans";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin",
};

// Revenue comes from a live Stripe API call — the slow part of this page. It's
// rendered in its own Suspense boundary so the rest of the overview (metrics,
// queues, all from the DB) paints immediately and this tile streams in after.
async function RevenueCard({ monthLabel }: { monthLabel: string }) {
  const [revenue, expected] = await Promise.all([getMonthlyRevenue(), getAdminDb().then(getExpectedRevenue)]);
  const projectedCents = (revenue?.totalCents ?? 0) + (expected?.totalCents ?? 0);
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:rounded-4xl sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <DollarSign className="h-4 w-4 text-link-blue" aria-hidden="true" />
        Revenue this month ({monthLabel})
      </h2>
      {revenue ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-slate">Total</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{formatMoney(revenue.totalCents)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-slate">Subscriptions</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{formatMoney(revenue.recurringCents)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-slate">One-time</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{formatMoney(revenue.oneTimeCents)}</p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-slate">Stripe is not configured.</p>
      )}

      {expected && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-link-blue/40 bg-sky-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-slate">
              Still expected this month
            </p>
            <p className="mt-1 text-2xl font-semibold text-ink">{formatMoney(expected.totalCents)}</p>
            <p className="mt-1 text-xs text-muted-slate">
              {expected.renewalCount} renewal{expected.renewalCount === 1 ? "" : "s"}
              {expected.trialCount > 0
                ? ` · ${expected.trialCount} trial${expected.trialCount === 1 ? "" : "s"} converting (${formatMoney(expected.trialCents)})`
                : ""}
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-link-blue/40 bg-sky-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-slate">Projected month total</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{formatMoney(projectedCents)}</p>
            <p className="mt-1 text-xs text-muted-slate">Banked so far plus what&apos;s still due</p>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-muted-slate">
        Pulled live from paid Stripe invoices this month. One-time includes activation fees and topup purchases.
        Expected is a forecast of renewals still due before month end plus trials auto-continuing onto Basic — it
        moves if someone cancels mid-month or a card fails.
      </p>
    </div>
  );
}

function RevenueCardSkeleton({ monthLabel }: { monthLabel: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:rounded-4xl sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <DollarSign className="h-4 w-4 text-link-blue" aria-hidden="true" />
        Revenue this month ({monthLabel})
      </h2>
      <div className="mt-4 grid animate-pulse grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-100" />
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-slate">Loading live Stripe revenue…</p>
    </div>
  );
}

// Streamed like RevenueCard: the SIM counts come from the carrier, so this waits
// on a network call the rest of the overview has no reason to sit behind.
async function InventorySection() {
  const db = await getAdminDb();
  if (!db) return null;
  const snapshot = await getInventorySnapshot(db);
  return <InventoryPanel snapshot={snapshot} />;
}

export default async function AdminPage() {
  const overview = await getAdminOverview();
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });

  return (
    <div className="grid gap-4 sm:gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">BitLink admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">Operations overview</h1>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <AdminMetric label="Active customers" value={overview.metrics.activeCustomers} icon={Users} tone="blue" />
        <AdminMetric label="Active subscriptions" value={overview.metrics.activeSubscriptions} icon={CreditCard} tone="green" />
        <AdminMetric label="Active trials" value={overview.metrics.activeTrials} icon={Clock} tone="purple" />
        <AdminMetric label="Provisioning queue" value={overview.metrics.provisioningQueue} icon={RadioTower} tone="amber" />
        <AdminMetric label="Failed payments" value={overview.metrics.failedPayments} icon={AlertTriangle} tone="red" />
      </section>

      {/* Named, not just counted. A number alone still leaves you opening
          Stripe to find out who — which is how three declines sat unnoticed
          for ten days while the tile read 0. */}
      {overview.pastDue.length > 0 && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-soft sm:rounded-4xl sm:p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-red-900">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            Payment failed — {overview.pastDue.length} {overview.pastDue.length === 1 ? "line" : "lines"}
          </h2>
          <p className="mt-1 text-sm text-red-800">
            Stripe declined these renewals and is still retrying. The lines are live until someone suspends them.
          </p>
          <div className="mt-4 grid gap-3">
            {overview.pastDue.map((sub) => {
              const customer = sub.customers as { full_name?: string; email?: string } | null;
              const failingSince = sub.updated_at ? new Date(sub.updated_at as string) : null;
              const days = failingSince
                ? Math.floor((Date.now() - failingSince.getTime()) / 86_400_000)
                : null;
              return (
                <div
                  key={sub.id as string}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{customer?.full_name ?? "Unknown customer"}</p>
                    <p className="truncate text-xs text-muted-slate">{customer?.email ?? "no email on file"}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-muted-slate">
                      {getPlan(sub.plan_slug as string).name}
                    </span>
                    {days !== null && (
                      <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-800">
                        {days === 0 ? "today" : `${days}d`}
                      </span>
                    )}
                    {sub.telecom_line_id ? (
                      <Link
                        href={`/admin/lines/${sub.telecom_line_id}`}
                        className="font-semibold text-link-blue hover:text-ink"
                      >
                        Open line
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Suspense fallback={<RevenueCardSkeleton monthLabel={monthLabel} />}>
          <RevenueCard monthLabel={monthLabel} />
        </Suspense>

        {overview.linesByPlan.length > 0 && (
          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:rounded-4xl sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Active lines by plan</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {overview.linesByPlan.map((item) => (
                <div key={item.name} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-slate">{item.name}</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="mb-4 text-xl font-semibold text-ink">Provisioning queue</h2>
          <ProvisioningQueue orders={overview.provisioningOrders} />
        </div>
        <div className="grid content-start gap-4 sm:gap-6">
          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:rounded-4xl sm:p-6">
            <h2 className="text-xl font-semibold text-ink">Recent orders</h2>
            <div className="mt-4 grid gap-3">
              {overview.recentOrders.length ? (
                overview.recentOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-muted-slate">{order.id.slice(0, 8)}</span>
                      <StatusBadge status={order.payment_status} />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No recent orders" />
              )}
            </div>
          </div>

          {overview.portInQueue.length > 0 && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-soft sm:rounded-4xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-orange-900">
                <Phone className="h-5 w-5" aria-hidden="true" />
                Port-in queue
              </h2>
              <div className="mt-4 grid gap-3">
                {overview.portInQueue.map((line) => {
                  const pi = (line.metadata as Record<string, unknown>)?.intl_port_in as Record<string, unknown>;
                  const customer = line.customers as { full_name?: string; email?: string } | null;
                  const statusColors: Record<string, string> = {
                    manual_pending: 'bg-orange-100 text-orange-800',
                    awaiting_israeli_line: 'bg-amber-100 text-amber-800',
                    api_error: 'bg-red-100 text-red-800',
                    failed: 'bg-red-100 text-red-800',
                  };
                  const statusColor = statusColors[pi?.status as string] ?? 'bg-slate-100 text-slate-700';
                  return (
                    <Link key={line.id} href={`/admin/lines/${line.id}`} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm hover:shadow transition-shadow">
                      <div>
                        <p className="text-sm font-semibold text-ink">{pi?.number as string}</p>
                        <p className="text-xs text-muted-slate">{customer?.full_name ?? customer?.email ?? 'Unknown'}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}>
                        {(pi?.status as string)?.replace(/_/g, ' ')}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {overview.intlNumberQueue.length > 0 && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-soft sm:rounded-4xl sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-orange-900">
                <Globe2 className="h-5 w-5" aria-hidden="true" />
                New number needs manual fulfillment
              </h2>
              <div className="mt-4 grid gap-3">
                {overview.intlNumberQueue.map((line) => {
                  const n = (line.metadata as Record<string, unknown>)?.intl_number as Record<string, unknown>;
                  const customer = line.customers as { full_name?: string; email?: string } | null;
                  return (
                    <Link key={line.id} href={`/admin/lines/${line.id}`} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm hover:shadow transition-shadow">
                      <div>
                        <p className="text-sm font-semibold text-ink">{(n?.country as string | undefined)?.toUpperCase() ?? 'INTL'} number requested</p>
                        <p className="text-xs text-muted-slate">{customer?.full_name ?? customer?.email ?? 'Unknown'}</p>
                      </div>
                      <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
                        Needs a number picked
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:rounded-4xl sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-ink">
              <Share2 className="h-5 w-5 text-link-blue" aria-hidden="true" />
              Referral activity
            </h2>
            <div className="mt-4 grid gap-3">
              {overview.referrals.length ? (
                overview.referrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                    <span className="font-mono text-xs text-muted-slate">{referral.id.slice(0, 8)}</span>
                    <StatusBadge status={referral.status} />
                  </div>
                ))
              ) : (
                <EmptyState title="No referrals yet" />
              )}
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<InventoryPanelSkeleton />}>
        <InventorySection />
      </Suspense>
    </div>
  );
}
