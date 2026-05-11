import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminDb } from "@/lib/db/admin";

export const metadata: Metadata = {
  title: "Admin Orders",
};

export default async function AdminOrdersPage() {
  const db = await getAdminDb();
  const orders = db
    ? (await db.from("orders").select("*").order("created_at", { ascending: false }).limit(100)).data ?? []
    : [];

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Orders</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Checkout and order status</h1>
      </section>
      <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
        {orders.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-muted-slate">
                <tr>
                  <th className="px-5 py-4 font-semibold">Order</th>
                  <th className="px-5 py-4 font-semibold">Payment</th>
                  <th className="px-5 py-4 font-semibold">Order status</th>
                  <th className="px-5 py-4 font-semibold">Provisioning</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-4">
                      <div className="font-mono text-xs text-ink">{order.id}</div>
                      <div className="mt-1 font-mono text-xs text-muted-slate">{order.stripe_checkout_session_id ?? "No Stripe session yet"}</div>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={order.payment_status} /></td>
                    <td className="px-5 py-4"><StatusBadge status={order.order_status} /></td>
                    <td className="px-5 py-4"><StatusBadge status={order.provisioning_status} /></td>
                    <td className="px-5 py-4 text-slate-500">{new Date(order.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6"><EmptyState title="No orders yet" /></div>
        )}
      </section>
    </div>
  );
}
