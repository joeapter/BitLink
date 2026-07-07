import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminDb } from "@/lib/db/admin";

export const metadata: Metadata = {
  title: "Admin Provisioning",
};

export const dynamic = "force-dynamic";

type PipelineRow = {
  subscriberId: string;
  createdAt: string;
  planSlug: string;
  customerName: string;
  customerEmail: string;
  lineId: string | null;
  lineStatus: string;
  phoneNumber: string | null;
  jobStatus: string | null;
  jobError: string | null;
};

export default async function AdminProvisioningPage() {
  const db = await getAdminDb();

  let rows: PipelineRow[] = [];
  if (db) {
    const { data: subscribers } = await db
      .from("subscribers")
      .select("id, plan_slug, status, created_at, telecom_line_id, customer:customers(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(50);

    const lineIds = (subscribers ?? [])
      .map((s) => s.telecom_line_id as string | null)
      .filter((id): id is string => Boolean(id));

    const [{ data: lines }, { data: jobs }] = await Promise.all([
      lineIds.length
        ? db.from("telecom_lines").select("id, status, metadata").in("id", lineIds)
        : Promise.resolve({ data: [] as Array<{ id: string; status: string; metadata: unknown }> }),
      lineIds.length
        ? db
            .from("provisioning_jobs")
            .select("line_id, status, error, updated_at")
            .in("line_id", lineIds)
            .order("updated_at", { ascending: false })
        : Promise.resolve({ data: [] as Array<{ line_id: string; status: string; error: string | null; updated_at: string }> }),
    ]);

    const lineById = new Map((lines ?? []).map((l) => [l.id as string, l]));
    const latestJobByLine = new Map<string, { status: string; error: string | null }>();
    for (const job of jobs ?? []) {
      if (!latestJobByLine.has(job.line_id as string)) {
        latestJobByLine.set(job.line_id as string, { status: job.status as string, error: job.error as string | null });
      }
    }

    rows = (subscribers ?? []).map((s) => {
      const customer = (s.customer ?? {}) as { full_name?: string | null; email?: string | null };
      const line = s.telecom_line_id ? lineById.get(s.telecom_line_id as string) : undefined;
      const meta = (line?.metadata ?? {}) as Record<string, unknown>;
      const job = s.telecom_line_id ? latestJobByLine.get(s.telecom_line_id as string) : undefined;
      return {
        subscriberId: s.id as string,
        createdAt: s.created_at as string,
        planSlug: s.plan_slug as string,
        customerName: customer.full_name ?? "Unknown",
        customerEmail: customer.email ?? "",
        lineId: (s.telecom_line_id ?? null) as string | null,
        lineStatus: (line?.status as string | undefined) ?? (s.status as string),
        phoneNumber: (meta.phone_number as string | undefined) ?? null,
        jobStatus: job?.status ?? null,
        jobError: job?.error ?? null,
      };
    });
  }

  return (
    <div className="grid gap-6">
      <AutoRefresh seconds={10} />
      <section>
        <p className="text-sm font-semibold text-link-blue">Provisioning</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Provisioning pipeline</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-slate">
          Live view of the automated pipeline — statuses come from the lines and jobs themselves and this page
          refreshes every 10 seconds. Use a line&apos;s page for manual actions like retries.
        </p>
      </section>

      <div className="grid gap-3">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-ink/10 bg-white p-6 text-sm text-muted-slate">No orders yet.</p>
        ) : (
          rows.map((row) => (
            <div key={row.subscriberId} className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-ink">
                    {row.customerName}
                    <span className="ml-2 text-sm font-normal text-muted-slate">{row.customerEmail}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-slate">
                    {row.planSlug} · {row.phoneNumber ?? "number pending"} ·{" "}
                    {new Date(row.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {row.jobError ? (
                    <p className="mt-2 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700">{row.jobError}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={row.lineStatus} />
                  {row.jobStatus && row.jobStatus !== "completed" ? (
                    <StatusBadge status={row.jobStatus} label={`job: ${row.jobStatus}`} />
                  ) : null}
                  {row.lineId ? (
                    <Link
                      href={`/admin/lines/${row.lineId}`}
                      className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-slate-50"
                    >
                      Manage
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
