import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { getAdminDb } from "@/lib/db/admin";
import { createMacroAction, toggleMacroAction, deleteMacroAction } from "@/lib/admin/support-actions";

export const metadata: Metadata = { title: "Support Macros" };
export const dynamic = "force-dynamic";

const CATEGORIES = [
  "activation", "esim_activation", "no_data", "no_service_sos",
  "porting", "billing", "change_plan", "roaming_travel", "lost_phone", "escalation", "resolved", "other",
];

export default async function AdminMacrosPage() {
  const db = await getAdminDb();
  const { data: macros } = db
    ? await db.from("support_macros").select("*").order("usage_count", { ascending: false })
    : { data: [] };

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/support" className="flex items-center gap-1 text-sm text-muted-slate hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to queue
        </Link>
      </div>

      <section>
        <p className="text-sm font-semibold text-link-blue">Support</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Saved replies</h1>
        <p className="mt-2 text-sm text-muted-slate">
          Macros are quick replies you can copy into WhatsApp. Click a macro on any ticket page to copy it instantly.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        {/* Macro list */}
        <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
          <div className="border-b border-ink/8 px-6 py-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-link-blue" />
            <h2 className="font-semibold text-ink">{macros?.length ?? 0} saved replies</h2>
          </div>

          {macros && macros.length > 0 ? (
            <ul className="divide-y divide-ink/8">
              {macros.map((m) => (
                <li key={m.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink">{m.title}</p>
                        {m.category && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.6rem] font-semibold text-slate-600">
                            {m.category}
                          </span>
                        )}
                        {!m.active && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[0.6rem] font-semibold text-red-600">
                            disabled
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-slate whitespace-pre-wrap">{m.body}</p>
                      <p className="mt-2 text-xs text-slate-400">Used {m.usage_count} times</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <form action={toggleMacroAction}>
                        <input type="hidden" name="macroId" value={m.id} />
                        <input type="hidden" name="active" value={String(m.active)} />
                        <button
                          type="submit"
                          className="rounded-xl border border-ink/10 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          {m.active ? "Disable" : "Enable"}
                        </button>
                      </form>
                      <form action={deleteMacroAction}>
                        <input type="hidden" name="macroId" value={m.id} />
                        <button
                          type="submit"
                          className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 text-center text-sm text-muted-slate">No macros yet — create your first one.</div>
          )}
        </section>

        {/* Create new macro */}
        <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
          <h2 className="font-semibold text-ink">Create new reply</h2>

          <form action={createMacroAction} className="mt-5 grid gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink">Title</label>
              <input
                name="title"
                required
                placeholder="e.g. No data — first checks"
                className="mt-2 w-full rounded-xl border border-ink/10 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-link-blue focus:ring-2 focus:ring-link-blue/15"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink">Category <span className="font-normal text-muted-slate">(optional)</span></label>
              <select
                name="category"
                className="mt-2 w-full rounded-xl border border-ink/10 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-link-blue"
              >
                <option value="">No specific category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink">Reply text</label>
              <textarea
                name="body"
                required
                rows={6}
                placeholder="Type the reply you want to save…"
                className="mt-2 w-full rounded-xl border border-ink/10 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-link-blue focus:ring-2 focus:ring-link-blue/15"
              />
            </div>
            <button
              type="submit"
              className="w-fit rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink/80"
            >
              Save reply
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
