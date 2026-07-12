import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CustomerTable, type CustomerRow } from "@/components/admin/CustomerTable";
import { getAdminDb } from "@/lib/db/admin";
import { getPlan } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Admin Customers",
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string }>;
}) {
  const { q, view: viewParam } = await searchParams;
  const view: "active" | "archived" = viewParam === "archived" ? "archived" : "active";
  const db = await getAdminDb();

  const baseQuery = db
    ?.from("customers")
    .select("*")
    .or(q ? `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%` : "id.not.is.null")
    .order("created_at", { ascending: false })
    .limit(100);

  const customers = baseQuery
    ? (
        view === "archived"
          ? (await baseQuery.not("archived_at", "is", null)).data
          : (await baseQuery.is("archived_at", null)).data
      ) ?? []
    : [];

  const archivedCount = db
    ? (await db.from("customers").select("id", { count: "exact", head: true }).not("archived_at", "is", null)).count ?? 0
    : 0;

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

  const lines = db && customerIds.length
    ? (
        await db
          .from("telecom_lines")
          .select("customer_id, status, metadata")
          .in("customer_id", customerIds)
          .neq("status", "terminated")
      ).data ?? []
    : [];
  const plansByCustomer = new Map<string, string[]>();
  for (const line of lines) {
    const planSlug = (line.metadata as Record<string, unknown> | null)?.plan_slug as string | undefined;
    if (!planSlug) continue;
    const existing = plansByCustomer.get(line.customer_id as string) ?? [];
    existing.push(getPlan(planSlug).name);
    plansByCustomer.set(line.customer_id as string, existing);
  }

  const rows: CustomerRow[] = customers.map((customer) => ({
    id: customer.id as string,
    full_name: (customer.full_name ?? null) as string | null,
    email: (customer.email ?? null) as string | null,
    phone: (customer.phone ?? null) as string | null,
    stripe_customer_id: (customer.stripe_customer_id ?? null) as string | null,
    referral_code: (customer.referral_code ?? null) as string | null,
    user_id: (customer.user_id ?? null) as string | null,
    created_at: customer.created_at as string,
    plans: plansByCustomer.get(customer.id as string) ?? [],
    salesRep: salesRepByCustomer.get(customer.id)
      ? {
          status: salesRepByCustomer.get(customer.id)!.status as string,
          referral_code: salesRepByCustomer.get(customer.id)!.referral_code as string,
        }
      : null,
  }));

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-link-blue">Customers</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Customer records</h1>
        </div>
        <form className="flex gap-2">
          <input type="hidden" name="view" value={view} />
          <Input name="q" placeholder="Search customers" defaultValue={q ?? ""} aria-label="Search customers" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </section>

      <div className="flex gap-2">
        <Link
          href={q ? `/admin/customers?q=${encodeURIComponent(q)}` : "/admin/customers"}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            view === "active" ? "bg-ink text-white!" : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          Active
        </Link>
        <Link
          href={`/admin/customers?view=archived${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            view === "archived" ? "bg-ink text-white!" : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          Archived ({archivedCount})
        </Link>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
        {rows.length ? (
          <CustomerTable customers={rows} view={view} />
        ) : (
          <div className="p-6">
            <EmptyState title={view === "archived" ? "No archived customers" : "No customers found"} />
          </div>
        )}
      </section>
    </div>
  );
}
