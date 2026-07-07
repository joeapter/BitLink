import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getAdminDb } from "@/lib/db/admin";
import { formatDate } from "@/lib/utils";
import { makeSalesRepAction } from "@/lib/admin/sales-rep-actions";

export const metadata: Metadata = {
  title: "Admin Customers",
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const db = await getAdminDb();
  const customers = db
    ? (
        await db
          .from("customers")
          .select("*")
          .or(q ? `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%` : "id.not.is.null")
          .order("created_at", { ascending: false })
          .limit(100)
      ).data ?? []
    : [];
  const customerIds = customers.map((customer) => customer.id);
  const salesReps = db && customerIds.length
    ? (
        await db
          .from("sales_reps")
          .select("id, customer_id, referral_code, status")
          .in("customer_id", customerIds)
      ).data ?? []
    : [];
  const salesRepByCustomer = new Map(salesReps.map((rep) => [rep.customer_id, rep]));

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-link-blue">Customers</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Customer records</h1>
        </div>
        <form className="flex gap-2">
          <Input name="q" placeholder="Search customers" defaultValue={q ?? ""} aria-label="Search customers" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
        {customers.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[940px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-muted-slate">
                <tr>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Phone</th>
                  <th className="px-5 py-4 font-semibold">Stripe</th>
                  <th className="px-5 py-4 font-semibold">Referral</th>
                  <th className="px-5 py-4 font-semibold">Sales rep</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {customers.map((customer) => {
                  const salesRep = salesRepByCustomer.get(customer.id);
                  return (
                    <tr key={customer.id}>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-ink">{customer.full_name ?? "Unnamed customer"}</div>
                        <div className="text-xs text-muted-slate">{customer.email}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{customer.phone ?? "—"}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={customer.stripe_customer_id ? "active" : "pending"} label={customer.stripe_customer_id ? "Connected" : "Missing"} />
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{customer.referral_code ?? "—"}</td>
                      <td className="px-5 py-4">
                        {salesRep ? (
                          <div className="grid gap-1">
                            <StatusBadge status={salesRep.status} label="Rep" />
                            <span className="font-mono text-xs text-slate-500">{salesRep.referral_code}</span>
                          </div>
                        ) : customer.user_id ? (
                          <form action={makeSalesRepAction}>
                            <input type="hidden" name="customerId" value={customer.id} />
                            <Button type="submit" variant="secondary" size="sm">Make rep</Button>
                          </form>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Needs login</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(customer.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState title="No customers found" />
          </div>
        )}
      </section>
    </div>
  );
}
