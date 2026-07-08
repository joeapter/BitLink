import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { CustomOrderBuilder } from "@/components/admin/CustomOrderBuilder";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminDb } from "@/lib/db/admin";
import { absoluteUrl, formatDateTime, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Custom Orders" };
export const dynamic = "force-dynamic";

export default async function AdminCustomOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const params = await searchParams;
  const db = await getAdminDb();
  const customers = db
    ? (
        await db
          .from("customers")
          .select("id, full_name, email, phone")
          .order("created_at", { ascending: false })
          .limit(500)
      ).data ?? []
    : [];

  const recentOrders = db
    ? (
        await db
          .from("custom_line_orders")
          .select("id, token, status, lines, stripe_checkout_session_id, stripe_subscription_id, created_at, customers(full_name, email)")
          .order("created_at", { ascending: false })
          .limit(20)
      ).data ?? []
    : [];

  return (
    <div className="grid gap-6">
      <CustomOrderBuilder
        customers={customers.map((customer) => ({
          id: customer.id as string,
          fullName: (customer.full_name ?? null) as string | null,
          email: (customer.email ?? null) as string | null,
          phone: (customer.phone ?? null) as string | null,
        }))}
        initialCustomerId={params.customer ?? null}
      />

      <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
        <div className="border-b border-ink/8 px-5 py-4">
          <p className="text-sm font-semibold text-link-blue">Recent custom orders</p>
        </div>
        {recentOrders.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-muted-slate">
                <tr>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Lines</th>
                  <th className="px-5 py-4 font-semibold">Monthly</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Link</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {recentOrders.map((order) => {
                  const lines = Array.isArray(order.lines) ? order.lines as Array<Record<string, unknown>> : [];
                  const total = lines.reduce((sum, line) => sum + Number(line.customPriceCents ?? line.custom_price_cents ?? 0), 0);
                  const customer = order.customers as { full_name?: string | null; email?: string | null } | null;
                  const payUrl = absoluteUrl(`/pay/${order.token}`);
                  return (
                    <tr key={order.id}>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-ink">{customer?.full_name ?? "Unnamed"}</div>
                        <div className="text-xs text-muted-slate">{customer?.email ?? "No email"}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{lines.length}</td>
                      <td className="px-5 py-4 font-semibold text-ink">{formatMoney(total)}</td>
                      <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                      <td className="px-5 py-4">
                        <Link
                          href={payUrl}
                          className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50"
                          target="_blank"
                        >
                          Open
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{formatDateTime(order.created_at as string)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState title="No custom orders yet" />
          </div>
        )}
      </section>
    </div>
  );
}
