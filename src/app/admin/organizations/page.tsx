import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { getAdminDb } from "@/lib/db/admin";

export const metadata: Metadata = {
  title: "Admin Organizations",
};

const TYPE_LABELS: Record<string, string> = {
  yeshiva: "Yeshiva",
  seminary: "Seminary",
  shul: "Shul",
  other: "Other",
};

export default async function AdminOrganizationsPage() {
  const db = await getAdminDb();

  const orgs = db
    ? (await db.from("organizations").select("*, customers(count)").order("created_at", { ascending: false })).data ?? []
    : [];

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-link-blue">Organizations</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Org referral partners</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-slate">
            Each organization gets a unique referral link. Customers who sign up via that link are tracked here.
            A monthly report calculates 10% of profit as a charity check.
          </p>
        </div>
        <Link href="/admin/organizations/new">
          <Button>
            <Plus className="h-4 w-4" />
            New organization
          </Button>
        </Link>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
        {orgs.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-muted-slate">
                <tr>
                  <th className="px-5 py-4 font-semibold">Organization</th>
                  <th className="px-5 py-4 font-semibold">Type</th>
                  <th className="px-5 py-4 font-semibold">Referral code</th>
                  <th className="px-5 py-4 font-semibold">Subscribers</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {orgs.map((org) => {
                  const count = Array.isArray(org.customers) ? (org.customers[0] as { count: number } | undefined)?.count ?? 0 : 0;
                  return (
                    <tr key={org.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                            <Building2 className="h-4 w-4 text-muted-slate" />
                          </div>
                          <div>
                            <div className="font-semibold text-ink">{org.name}</div>
                            {org.contact_email ? (
                              <div className="text-xs text-muted-slate">{org.contact_email}</div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{TYPE_LABELS[org.type] ?? org.type}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{org.referral_code}</td>
                      <td className="px-5 py-4 text-slate-600">{count}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={org.active ? "active" : "inactive"} />
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/organizations/${org.id}`}
                          className="text-sm font-semibold text-link-blue hover:underline"
                        >
                          View report →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState title="No organizations yet — add a yeshiva, seminary, or shul to start tracking referral profit." />
          </div>
        )}
      </section>
    </div>
  );
}
