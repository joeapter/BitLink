import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CreditCard, DollarSign, Globe2, Phone, RadioTower, Share2, Users } from "lucide-react";
import { AdminMetric } from "@/components/admin/AdminMetric";
import { ProvisioningQueue } from "@/components/admin/ProvisioningQueue";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAdminOverview } from "@/lib/db/admin";
import { getMonthlyRevenue } from "@/lib/stripe/revenue";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const [overview, revenue] = await Promise.all([getAdminOverview(), getMonthlyRevenue()]);
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });

  return (
    <div className="grid gap-4 sm:gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">BitLink admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">Operations overview</h1>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <AdminMetric label="Active customers" value={overview.metrics.activeCustomers} icon={Users} tone="blue" />
        <AdminMetric label="Active subscriptions" value={overview.metrics.activeSubscriptions} icon={CreditCard} tone="green" />
        <AdminMetric label="Provisioning queue" value={overview.metrics.provisioningQueue} icon={RadioTower} tone="amber" />
        <AdminMetric label="Failed payments" value={overview.metrics.failedPayments} icon={AlertTriangle} tone="red" />
      </section>

      <section className="grid gap-4 sm:gap-6 lg:grid-cols-2">
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
          <p className="mt-3 text-xs text-muted-slate">
            Pulled live from paid Stripe invoices this month. One-time includes activation fees and topup purchases.
          </p>
        </div>

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
    </div>
  );
}
