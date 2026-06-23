import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { getAdminDb } from "@/lib/db/admin";
import { formatMoney } from "@/lib/utils";
import { updatePlanCostAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin Plans",
};

function formatAgurot(agurot: number): string {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 2 }).format(agurot / 100);
}

export default async function AdminPlansPage() {
  const db = await getAdminDb();
  const dbPlans = db
    ? (await db.from("plans").select("id, slug, name, description, monthly_price_cents, cost_agurot, currency, active, sort_order").order("sort_order", { ascending: true })).data ?? []
    : [];

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Plans</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Plan catalog</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-slate">
          Set the carrier cost (in ₪) for each plan. Profit = monthly price (converted to ILS) − carrier cost.
          This feeds the monthly organization charity reports.
        </p>
      </section>

      {dbPlans.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {dbPlans.map((plan) => (
            <div key={plan.id} className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-ink">{plan.name}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-slate">{plan.description}</p>
                </div>
                <StatusBadge status={plan.active ? "active" : "inactive"} />
              </div>

              <div className="mt-4 flex flex-wrap items-baseline gap-3">
                <p className="text-3xl font-semibold text-ink">{formatMoney(plan.monthly_price_cents, plan.currency)}/mo</p>
                <p className="text-sm text-muted-slate">
                  Carrier cost:{" "}
                  <span className={plan.cost_agurot > 0 ? "font-semibold text-ink" : "text-rose-500"}>
                    {plan.cost_agurot > 0 ? formatAgurot(plan.cost_agurot) : "Not set"}
                  </span>
                </p>
              </div>

              <form action={updatePlanCostAction} className="mt-5 flex items-end gap-3 border-t border-ink/8 pt-5">
                <input type="hidden" name="planId" value={plan.id} />
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold text-muted-slate" htmlFor={`cost-${plan.id}`}>
                    Carrier cost (₪ per month)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-slate">₪</span>
                    <input
                      id={`cost-${plan.id}`}
                      name="costAgurot"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={plan.cost_agurot > 0 ? (plan.cost_agurot / 100).toFixed(2) : ""}
                      placeholder="0.00"
                      className="h-10 w-36 rounded-2xl border border-ink/10 bg-white pl-7 pr-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-link-blue"
                    />
                  </div>
                </div>
                <Button type="submit" variant="secondary" size="sm">Save cost</Button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No plans found" />
      )}
    </div>
  );
}
