import type { Metadata } from "next";
import Link from "next/link";
import { Printer, Truck, Mail } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminDb } from "@/lib/db/admin";
import { getPlan } from "@/lib/plans";
import { formatDateTime } from "@/lib/utils";
import { markDeliveryShippedAction, markDeliveryDeliveredAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Orders",
};

const DELIVERY_STATUS_ORDER: Record<string, number> = { pending: 0, shipped: 1, delivered: 2, cancelled: 3 };

export default async function AdminOrdersPage() {
  const db = await getAdminDb();

  const orders = db
    ? (await db.from("orders").select("*").order("created_at", { ascending: false }).limit(100)).data ?? []
    : [];

  const deliveries = db
    ? (await db.from("physical_sim_deliveries").select("*").order("created_at", { ascending: false }).limit(200)).data ?? []
    : [];

  const lineIds = [...new Set(deliveries.map((d) => d.telecom_line_id).filter(Boolean))] as string[];
  const linesById: Record<string, { customer_id: string | null; plan_slug: string | null; phone_number: string | null }> = {};
  if (db && lineIds.length) {
    const { data: lineRows } = await db.from("telecom_lines").select("id, customer_id, metadata").in("id", lineIds);
    for (const l of lineRows ?? []) {
      const meta = (l.metadata as Record<string, unknown> | null) ?? {};
      linesById[l.id] = {
        customer_id: l.customer_id as string | null,
        plan_slug: (meta.plan_slug as string | undefined) ?? null,
        phone_number: (meta.phone_number as string | undefined) ?? null,
      };
    }
  }

  const customerIds = [...new Set(Object.values(linesById).map((l) => l.customer_id).filter(Boolean))] as string[];
  const customersById: Record<string, { full_name: string | null; email: string | null; phone: string | null }> = {};
  if (db && customerIds.length) {
    const { data: customerRows } = await db.from("customers").select("id, full_name, email, phone").in("id", customerIds);
    for (const c of customerRows ?? []) {
      customersById[c.id] = { full_name: c.full_name, email: c.email, phone: c.phone };
    }
  }

  const deliveryRows = deliveries
    .map((d) => {
      const line = linesById[d.telecom_line_id as string];
      const customer = line?.customer_id ? customersById[line.customer_id] : null;
      const plan = line?.plan_slug ? getPlan(line.plan_slug) : null;
      return { ...d, customer, planName: plan?.name ?? line?.plan_slug ?? "—", lineId: d.telecom_line_id as string };
    })
    .sort((a, b) => (DELIVERY_STATUS_ORDER[a.status] ?? 9) - (DELIVERY_STATUS_ORDER[b.status] ?? 9));

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Orders</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Checkout and order status</h1>
      </section>

      {/* Physical SIM deliveries — fulfillment queue */}
      <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
        <div className="p-6 pb-0">
          <p className="text-sm font-semibold text-ink">Physical SIM deliveries</p>
          <p className="mt-1 text-xs text-muted-slate">
            Next-day courier for Jerusalem, Beit Shemesh, Modiin, Beitar Illit, Telstone, Mivaseret, and Beit Meir —
            Israel Post everywhere else.
          </p>
        </div>
        {deliveryRows.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-muted-slate">
                <tr>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Plan</th>
                  <th className="px-5 py-4 font-semibold">Method</th>
                  <th className="px-5 py-4 font-semibold">Address</th>
                  <th className="px-5 py-4 font-semibold">Requested date</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {deliveryRows.map((d) => (
                  <tr key={d.id}>
                    <td className="px-5 py-4">
                      <Link href={`/admin/lines/${d.lineId}`} className="font-semibold text-ink hover:text-link-blue">
                        {d.customer?.full_name ?? "—"}
                      </Link>
                      <div className="text-xs text-muted-slate">{d.customer?.email}</div>
                      {d.customer?.phone ? <div className="text-xs text-muted-slate">{d.customer.phone}</div> : null}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{d.planName}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        d.method === "courier" ? "bg-trust-green/10 text-trust-green" : "bg-link-blue/10 text-link-blue"
                      }`}>
                        {d.method === "courier" ? <Truck className="h-3.5 w-3.5" aria-hidden="true" /> : <Mail className="h-3.5 w-3.5" aria-hidden="true" />}
                        {d.method === "courier" ? "Courier" : "Israel Post"}
                      </span>
                      <div className="mt-1 text-xs text-muted-slate">{d.city}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <div>{d.address_line1}</div>
                      {d.address_line2 ? <div className="text-xs text-muted-slate">{d.address_line2}</div> : null}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {d.requested_date ? new Date(d.requested_date as string).toLocaleDateString("en-GB") : "ASAP"}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={d.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          href={`/admin/orders/deliveries/${d.id}/slip`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-slate-50"
                        >
                          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                          Print slip
                        </Link>
                        {d.status === "pending" && (
                          <form action={markDeliveryShippedAction}>
                            <input type="hidden" name="id" value={d.id} />
                            <button type="submit" className="rounded-lg border border-link-blue/30 bg-link-blue/5 px-2.5 py-1 text-xs font-semibold text-link-blue hover:bg-link-blue/10">
                              Mark shipped
                            </button>
                          </form>
                        )}
                        {d.status === "shipped" && (
                          <form action={markDeliveryDeliveredAction}>
                            <input type="hidden" name="id" value={d.id} />
                            <button type="submit" className="rounded-lg border border-trust-green/30 bg-trust-green/5 px-2.5 py-1 text-xs font-semibold text-trust-green hover:bg-trust-green/10">
                              Mark delivered
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6"><EmptyState title="No physical SIM orders yet" /></div>
        )}
      </section>

      {/* All checkout orders */}
      <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
        <p className="p-6 pb-0 text-sm font-semibold text-ink">All orders</p>
        {orders.length ? (
          <div className="mt-4 overflow-x-auto">
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
                    <td className="px-5 py-4 text-slate-500">{formatDateTime(order.created_at)}</td>
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
