import type { Metadata } from "next";
import { Handshake } from "lucide-react";
import { getAdminDb } from "@/lib/db/admin";
import { getRepSummaries } from "@/lib/admin/rep-earnings";
import { setRepStatusAction, recordRepPaymentAction } from "@/lib/admin/rep-actions";
import { repSharePath } from "@/lib/rep-links";
import { RepLandingSelect } from "@/components/admin/RepLandingSelect";
import { RepCreateForm } from "@/components/admin/RepCreateForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatMoney, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Reps" };
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bitlink.co.il";

export default async function AdminRepsPage() {
  const db = await getAdminDb();
  const reps = db ? await getRepSummaries(db) : null;

  const totals = (reps ?? []).reduce(
    (acc, r) => ({
      trials: acc.trials + r.trials,
      converted: acc.converted + r.converted,
      earned: acc.earned + r.earnedCents,
      owed: acc.owed + r.owedCents,
    }),
    { trials: 0, converted: 0, earned: 0, owed: 0 },
  );

  return (
    <div className="grid gap-4 sm:gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Reps</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">BitLink Reps</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-slate">
          Influencers who share the free trial. A Rep earns when a trial they sent{" "}
          <strong>keeps its plan</strong> after the free month — nothing for trials still running, nothing for
          trials that cancel.
        </p>
      </section>

      {reps === null ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Migration 036 isn&apos;t applied yet — run supabase/migrations/036_affiliates.sql in the Supabase SQL
          editor to create the Reps tables.
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Trials sent", String(totals.trials)],
              ["Converted", String(totals.converted)],
              ["Earned", formatMoney(totals.earned)],
              ["Owed now", formatMoney(totals.owed)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-slate">{label}</p>
                <p className="mt-1 text-3xl font-semibold text-ink">{value}</p>
              </div>
            ))}
          </section>

          {/* Add a Rep */}
          <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:rounded-4xl">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <Handshake className="h-4 w-4 text-link-blue" aria-hidden="true" /> Add a Rep
            </h2>
            <RepCreateForm />
            <p className="mt-3 text-xs text-muted-slate">
              The code becomes their link. Codes are stored uppercase and attribution is recorded the moment
              someone starts a trial from it.
            </p>
          </section>

          {reps.length ? (
            <section className="grid gap-4">
              {reps.map((rep) => {
                // One stable link per Rep whatever their destination — see
                // lib/rep-links.ts. Switching where it points doesn't reissue it.
                const link = `${SITE}${repSharePath(rep.code)}`;
                return (
                  <div key={rep.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft sm:rounded-4xl">
                    <div className="flex flex-col gap-4 border-b border-ink/8 p-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-semibold text-ink">{rep.name}</h2>
                          <StatusBadge status={rep.status} />
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                            {rep.code}
                          </span>
                        </div>
                        {rep.contact && <p className="mt-1 text-sm text-muted-slate">{rep.contact}</p>}
                        <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-slate">Their link</p>
                        <p className="mt-1 break-all font-mono text-sm text-link-blue">{link}</p>
                        <div className="mt-3">
                          <RepLandingSelect key={rep.landing} repId={rep.id} landing={rep.landing} />
                        </div>
                        <p className="mt-2 text-xs text-muted-slate">
                          Pays {formatMoney(rep.rateBasicCents)} on Basic · {formatMoney(rep.ratePremiumCents)} on
                          Student 5G or Max 5G
                        </p>
                      </div>

                      <div className="grid shrink-0 gap-3 sm:min-w-[22rem]">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {[
                            ["Trials", String(rep.trials)],
                            ["Kept", String(rep.converted)],
                            ["Owed", formatMoney(rep.owedCents)],
                          ].map(([l, v]) => (
                            <div key={l} className="rounded-2xl bg-slate-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-widest text-muted-slate">{l}</p>
                              <p className="mt-1 text-xl font-semibold text-ink">{v}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-slate">
                          {rep.trialsRunning} still running · {rep.cancelled} cancelled · {formatMoney(rep.earnedCents)}{" "}
                          earned all-time · {formatMoney(rep.paidCents)} paid
                        </p>

                        <form action={recordRepPaymentAction} className="grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]">
                          <input type="hidden" name="repId" value={rep.id} />
                          <Input name="amountUsd" placeholder="Amount $" aria-label="Amount paid in dollars" />
                          <Input name="method" placeholder="Method" aria-label="Payment method" />
                          <Button type="submit" variant="secondary" size="sm">Record payment</Button>
                        </form>

                        <form action={setRepStatusAction}>
                          <input type="hidden" name="repId" value={rep.id} />
                          <input type="hidden" name="status" value={rep.status === "active" ? "paused" : "active"} />
                          <Button type="submit" variant="ghost" size="sm">
                            {rep.status === "active" ? "Pause this Rep" : "Reactivate"}
                          </Button>
                        </form>
                      </div>
                    </div>

                    {rep.conversions.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] text-left text-sm">
                          <thead className="bg-slate-50 text-muted-slate">
                            <tr>
                              <th className="px-5 py-3 font-semibold">Customer</th>
                              <th className="px-5 py-3 font-semibold">Plan kept</th>
                              <th className="px-5 py-3 font-semibold">Converted</th>
                              <th className="px-5 py-3 text-right font-semibold">Earns</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ink/8">
                            {rep.conversions.map((c, i) => (
                              <tr key={i}>
                                <td className="px-5 py-3">
                                  <p className="font-semibold text-ink">{c.customerName ?? "—"}</p>
                                  <p className="text-xs text-muted-slate">{c.customerEmail ?? ""}</p>
                                </td>
                                <td className="px-5 py-3 text-slate-700">{c.planSlug ?? "—"}</td>
                                <td className="px-5 py-3 text-xs text-muted-slate">
                                  {c.convertedAt ? formatDate(c.convertedAt) : "—"}
                                </td>
                                <td className="px-5 py-3 text-right font-semibold text-ink">
                                  {formatMoney(c.amountCents)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-5">
                        <p className="text-sm text-muted-slate">
                          No conversions yet.{" "}
                          {rep.trials > 0
                            ? `${rep.trials} trial${rep.trials === 1 ? "" : "s"} sent — they earn once someone keeps their plan.`
                            : "Nothing tracked against this code yet."}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          ) : (
            <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft sm:rounded-4xl">
              <EmptyState title="No Reps yet">Add one above and hand them their link.</EmptyState>
            </section>
          )}
        </>
      )}
    </div>
  );
}
