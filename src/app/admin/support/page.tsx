import type { Metadata } from "next";
import Link from "next/link";
import { getAdminDb } from "@/lib/db/admin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Support" };
export const dynamic = "force-dynamic";

const STATUSES = ["open", "waiting_on_customer", "waiting_on_provider", "resolved", "closed"];
const CATEGORIES = [
  "activation", "esim_activation", "no_data", "no_service_sos",
  "porting", "billing", "change_plan", "roaming_travel", "lost_phone", "other",
];
const PRIORITIES = ["low", "normal", "high", "urgent"];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-700 bg-red-50",
  high:   "text-orange-700 bg-orange-50",
  normal: "text-slate-600 bg-slate-100",
  low:    "text-slate-400 bg-slate-50",
};

const CATEGORY_LABELS: Record<string, string> = {
  activation:      "Activation",
  esim_activation: "eSIM",
  no_data:         "No data",
  no_service_sos:  "No service",
  porting:         "Porting",
  billing:         "Billing",
  change_plan:     "Change plan",
  roaming_travel:  "Roaming",
  lost_phone:      "Lost phone",
  other:           "Other",
};

interface Props {
  searchParams: Promise<{ status?: string; category?: string; priority?: string; q?: string }>;
}

export default async function AdminSupportPage({ searchParams }: Props) {
  const { status, category, priority, q } = await searchParams;
  const db = await getAdminDb();

  let query = db
    ? db.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(200)
    : null;

  if (query && status)   query = query.eq("status", status);
  if (query && category) query = query.eq("category", category);
  if (query && priority) query = query.eq("priority", priority);

  let tickets = query ? ((await query).data ?? []) : [];

  if (q) {
    const lq = q.toLowerCase();
    tickets = tickets.filter((t) =>
      t.ticket_number?.toLowerCase().includes(lq) ||
      t.customer_name?.toLowerCase().includes(lq) ||
      t.whatsapp_number?.toLowerCase().includes(lq) ||
      t.bitlink_phone?.toLowerCase().includes(lq)
    );
  }

  const openCount     = tickets.filter((t) => t.status === "open").length;
  const urgentCount   = tickets.filter((t) => t.priority === "urgent").length;

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-link-blue">Support</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Ticket queue</h1>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">{openCount} open</span>
          {urgentCount > 0 && (
            <span className="rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700">{urgentCount} urgent</span>
          )}
          <Link href="/admin/support/macros" className="rounded-full border border-ink/10 px-3 py-1 font-semibold text-ink hover:bg-slate-50">
            Macros
          </Link>
          <Link href="/admin/support/insights" className="rounded-full border border-ink/10 px-3 py-1 font-semibold text-ink hover:bg-slate-50">
            Insights
          </Link>
        </div>
      </section>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, ticket #, WhatsApp, number…"
          className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-link-blue w-72"
        />
        <select name="status" defaultValue={status ?? ""} className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-link-blue">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <select name="category" defaultValue={category ?? ""} className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-link-blue">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>)}
        </select>
        <select name="priority" defaultValue={priority ?? ""} className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-link-blue">
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button type="submit" className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/80">Filter</button>
        {(status || category || priority || q) && (
          <a href="/admin/support" className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Clear</a>
        )}
      </form>

      {/* Table */}
      <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
        {tickets.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-muted-slate">
                <tr>
                  <th className="px-5 py-4 font-semibold">Ticket</th>
                  <th className="px-5 py-4 font-semibold">Customer</th>
                  <th className="px-5 py-4 font-semibold">WhatsApp</th>
                  <th className="px-5 py-4 font-semibold">Category</th>
                  <th className="px-5 py-4 font-semibold">Priority</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                  <th className="px-5 py-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-ink">
                      {t.ticket_number ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-ink">{t.customer_name ?? "Unknown"}</div>
                      {t.bitlink_phone && <div className="text-xs text-muted-slate">{t.bitlink_phone}</div>}
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-slate">{t.whatsapp_number ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {CATEGORY_LABELS[t.category as string] ?? t.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[t.priority as string] ?? ""}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-slate whitespace-nowrap">
                      {formatDateTime(t.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/support/${t.id}`}
                        className="rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/80"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-muted-slate">
            {(status || category || priority || q) ? "No tickets match your filters." : "No support tickets yet."}
          </div>
        )}
      </section>
    </div>
  );
}
