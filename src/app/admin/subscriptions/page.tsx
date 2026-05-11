import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminDb } from "@/lib/db/admin";

export const metadata: Metadata = {
  title: "Admin Subscriptions",
};

export default async function AdminSubscriptionsPage() {
  const db = await getAdminDb();
  const subscriptions = db
    ? (await db.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(100)).data ?? []
    : [];

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Subscriptions</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Recurring billing state</h1>
      </section>
      <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
        {subscriptions.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-muted-slate">
                <tr>
                  <th className="px-5 py-4 font-semibold">Subscription</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Period end</th>
                  <th className="px-5 py-4 font-semibold">Cancel at period end</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td className="px-5 py-4">
                      <div className="font-mono text-xs text-ink">{subscription.id}</div>
                      <div className="mt-1 font-mono text-xs text-muted-slate">{subscription.stripe_subscription_id ?? "No Stripe subscription"}</div>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={subscription.status} /></td>
                    <td className="px-5 py-4 text-slate-600">
                      {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{subscription.cancel_at_period_end ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6"><EmptyState title="No subscriptions yet" /></div>
        )}
      </section>
    </div>
  );
}
