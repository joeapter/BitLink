import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Clock, MessageSquare, AlertTriangle, BookOpen } from "lucide-react";
import { getAdminDb } from "@/lib/db/admin";

export const metadata: Metadata = { title: "Support Insights" };
export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  activation: "Activation", esim_activation: "eSIM", no_data: "No data",
  no_service_sos: "No service", porting: "Porting", billing: "Billing",
  change_plan: "Change plan", roaming_travel: "Roaming", lost_phone: "Lost phone", other: "Other",
};

export default async function AdminInsightsPage() {
  const db = await getAdminDb();
  if (!db) return <div className="p-8 text-muted-slate">Database unavailable.</div>;

  // All tickets
  const { data: allTickets } = await db.from("support_tickets").select("id, status, category, priority, created_at, resolved_at");
  const tickets = allTickets ?? [];

  // Counts
  const total     = tickets.length;
  const open      = tickets.filter((t) => t.status === "open").length;
  const resolved  = tickets.filter((t) => t.status === "resolved").length;
  const waiting   = tickets.filter((t) => t.status === "waiting_on_provider").length;
  const urgent    = tickets.filter((t) => t.priority === "urgent").length;

  // Category breakdown
  const byCat: Record<string, number> = {};
  for (const t of tickets) {
    byCat[t.category as string] = (byCat[t.category as string] ?? 0) + 1;
  }
  const catRows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  // Avg resolution time (hours)
  const resolvedWithTime = tickets.filter((t) => t.resolved_at && t.created_at);
  const avgHours = resolvedWithTime.length
    ? resolvedWithTime.reduce((acc, t) => {
        const ms = new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime();
        return acc + ms / 1000 / 3600;
      }, 0) / resolvedWithTime.length
    : null;

  // Most used macros
  const { data: macros } = await db
    .from("support_macros")
    .select("id, title, category, usage_count")
    .gt("usage_count", 0)
    .order("usage_count", { ascending: false })
    .limit(8);

  // Tickets flagged for macro creation
  const { data: macroFlags } = await db
    .from("support_call_notes")
    .select("id")
    .eq("should_create_macro", true);

  // Tickets flagged for onboarding update
  const { data: onboardFlags } = await db
    .from("support_call_notes")
    .select("id")
    .eq("should_update_onboarding", true);

  // 20-ticket learning loop — last 20 resolved tickets with call notes
  const { data: resolvedTickets } = await db
    .from("support_tickets")
    .select("id, ticket_number, customer_name, category, created_at, resolved_at")
    .eq("status", "resolved")
    .order("resolved_at", { ascending: false })
    .limit(20);

  const resolvedIds = (resolvedTickets ?? []).map((t) => t.id);
  const { data: loopNotes } = resolvedIds.length
    ? await db
        .from("support_call_notes")
        .select("*")
        .in("ticket_id", resolvedIds)
    : { data: [] };

  const notesByTicket = new Map<string, typeof loopNotes>(
    resolvedIds.map((id) => [id, (loopNotes ?? []).filter((n) => n.ticket_id === id)])
  );

  return (
    <div className="grid gap-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/support" className="flex items-center gap-1 text-sm text-muted-slate hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to queue
        </Link>
      </div>

      <section>
        <p className="text-sm font-semibold text-link-blue">Support</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Insights</h1>
        <p className="mt-2 text-sm text-muted-slate">Patterns across your support history. Use this to improve macros, onboarding, and provisioning.</p>
      </section>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Total tickets",      value: total,   icon: MessageSquare, color: "text-ink" },
          { label: "Open",               value: open,    icon: AlertTriangle, color: "text-emerald-600" },
          { label: "Resolved",           value: resolved, icon: TrendingUp,   color: "text-link-blue" },
          { label: "Waiting on provider",value: waiting, icon: Clock,         color: "text-amber-600" },
          { label: "Urgent",             value: urgent,  icon: AlertTriangle, color: "text-red-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
            <Icon className={`h-5 w-5 ${color}`} />
            <p className={`mt-3 text-3xl font-bold ${color}`}>{value}</p>
            <p className="mt-1 text-xs text-muted-slate">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category breakdown */}
        <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
          <h2 className="font-semibold text-ink">Tickets by category</h2>
          {catRows.length ? (
            <div className="mt-4 grid gap-2">
              {catRows.map(([cat, count]) => {
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink">{CATEGORY_LABELS[cat] ?? cat}</span>
                      <span className="font-semibold text-ink">{count} <span className="font-normal text-muted-slate">({pct}%)</span></span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-link-blue" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-slate">No tickets yet.</p>
          )}
        </section>

        {/* Avg resolution + macro flags */}
        <div className="grid gap-6 content-start">
          <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
            <h2 className="font-semibold text-ink">Resolution time</h2>
            {avgHours !== null ? (
              <div className="mt-4">
                <p className="text-4xl font-bold text-ink">{avgHours.toFixed(1)}h</p>
                <p className="mt-1 text-sm text-muted-slate">average across {resolvedWithTime.length} resolved tickets</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-slate">No resolved tickets yet.</p>
            )}
          </section>

          <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
            <h2 className="font-semibold text-ink">Flagged for action</h2>
            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
                <span className="text-sm font-semibold text-amber-800">Should create macro</span>
                <span className="text-2xl font-bold text-amber-700">{macroFlags?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-3">
                <span className="text-sm font-semibold text-blue-800">Should update onboarding</span>
                <span className="text-2xl font-bold text-blue-700">{onboardFlags?.length ?? 0}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Most used macros */}
      {macros && macros.length > 0 && (
        <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-ink">
              <BookOpen className="h-4 w-4 text-link-blue" /> Most used macros
            </h2>
            <Link href="/admin/support/macros" className="text-xs font-semibold text-link-blue hover:underline">Manage</Link>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {macros.map((m) => (
              <div key={m.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink truncate">{m.title}</p>
                  <span className="shrink-0 rounded-full bg-link-blue/10 px-2 py-0.5 text-xs font-bold text-link-blue">×{m.usage_count}</span>
                </div>
                {m.category && <p className="mt-1 text-xs text-muted-slate">{m.category}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 20-ticket learning loop */}
      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        <h2 className="font-semibold text-ink">20-ticket learning loop</h2>
        <p className="mt-1 text-sm text-muted-slate">
          Last {Math.min(20, resolvedTickets?.length ?? 0)} resolved tickets. After 20 conversations you&apos;ll clearly see patterns to fix in onboarding or macros.
        </p>

        {resolvedTickets && resolvedTickets.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[700px] w-full text-left text-sm">
              <thead className="text-muted-slate">
                <tr>
                  <th className="pb-3 font-semibold">Ticket</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Root cause</th>
                  <th className="pb-3 font-semibold">Fix given</th>
                  <th className="pb-3 font-semibold">Flags</th>
                  <th className="pb-3 font-semibold">Resolved in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {resolvedTickets.map((t) => {
                  const notes = notesByTicket.get(t.id) ?? [];
                  const note  = notes[0];
                  const hours = t.resolved_at
                    ? ((new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 3600000).toFixed(1)
                    : null;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="py-3 pr-4">
                        <Link href={`/admin/support/${t.id}`} className="font-mono text-xs font-bold text-link-blue hover:underline">
                          {t.ticket_number}
                        </Link>
                        <div className="text-xs text-muted-slate">{t.customer_name}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {CATEGORY_LABELS[t.category as string] ?? t.category}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-slate max-w-[160px]">
                        {note?.root_cause ?? <span className="italic">—</span>}
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-slate max-w-[160px]">
                        {note?.fix_given ?? <span className="italic">—</span>}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-col gap-1">
                          {note?.should_create_macro      && <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[0.6rem] font-semibold text-amber-700">macro</span>}
                          {note?.should_update_onboarding && <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[0.6rem] font-semibold text-blue-700">onboard</span>}
                          {!note && <span className="text-xs text-slate-300">no notes</span>}
                        </div>
                      </td>
                      <td className="py-3 text-xs text-muted-slate">
                        {hours ? `${hours}h` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center text-sm text-muted-slate">
            No resolved tickets yet. Once you resolve your first tickets and log call notes, the learning loop fills in here.
          </div>
        )}
      </section>
    </div>
  );
}
