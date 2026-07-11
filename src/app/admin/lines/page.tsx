import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Phone, Radio } from "lucide-react";
import { getAdminDb } from "@/lib/db/admin";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPlan } from "@/lib/plans";

export const metadata: Metadata = { title: "Admin Lines" };

const STATUS_COLOR: Record<string, string> = {
  active: "text-emerald-700 bg-emerald-50",
  suspended: "text-amber-700 bg-amber-50",
  terminated: "text-red-700 bg-red-50",
  draft: "text-slate-600 bg-slate-100",
  provisioning: "text-blue-700 bg-blue-50",
  porting: "text-purple-700 bg-purple-50",
  failed: "text-red-700 bg-red-50",
};

export default async function AdminLinesPage() {
  const db = await getAdminDb();

  const lines = db
    ? (
        await db
          .from("telecom_lines")
          .select("*, customers(full_name, email, phone)")
          .order("created_at", { ascending: false })
          .limit(200)
      ).data ?? []
    : [];

  const countByStatus = lines.reduce<Record<string, number>>((acc, l) => {
    const s = l.status ?? "unknown";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Lines</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Telecom lines</h1>
        <p className="mt-2 text-sm text-muted-slate">
          Every provisioned line. Click a line to manage it — refresh, reset, suspend, change plans, and more.
        </p>
      </section>

      {/* Status summary strip */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["active", "provisioning", "suspended", "terminated"] as const).map((s) => (
          <div key={s} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-slate">{s}</p>
            <p className="mt-1 text-3xl font-semibold text-ink">{countByStatus[s] ?? 0}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
        {lines.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-muted-slate">
                <tr>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">Plan</th>
                  <th className="px-5 py-4 font-semibold">Line ID</th>
                  <th className="px-5 py-4 font-semibold">Provider line</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Kosher</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {lines.map((line) => {
                  const customer = line.customers as { full_name?: string; email?: string; phone?: string } | null;
                  const hasProvider = !!line.provider_line_id;
                  const planSlug = (line.metadata as Record<string, unknown> | null)?.plan_slug as string | undefined;
                  return (
                    <tr key={line.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-ink">{customer?.full_name ?? "—"}</div>
                        <div className="text-xs text-muted-slate">{customer?.email ?? ""}</div>
                      </td>
                      <td className="px-5 py-4">
                        {planSlug ? (
                          <span className="rounded-full bg-link-blue/10 px-2 py-0.5 text-xs font-semibold text-link-blue">
                            {getPlan(planSlug).name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-slate">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{line.id.slice(0, 8)}…</td>
                      <td className="px-5 py-4">
                        {hasProvider ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink">
                            <Radio className="h-3 w-3 text-emerald-500" />
                            {line.provider_line_id}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-slate">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_COLOR[line.status] ?? "text-slate-600 bg-slate-100"}`}>
                          {line.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-slate">
                        {line.is_kosher ? (
                          <span className="font-semibold text-emerald-700">Kosher</span>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {formatDate(line.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/lines/${line.id}`}
                          className="rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold !text-white transition hover:bg-ink/80 hover:!text-white"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState title="No lines yet">
              <Phone className="h-8 w-8 text-muted-slate" />
            </EmptyState>
          </div>
        )}
      </section>
    </div>
  );
}
