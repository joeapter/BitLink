import type { Metadata } from "next";
import { plans as staticPlans } from "@/lib/plans";
import { formatMoney } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminDb } from "@/lib/db/admin";

export const metadata: Metadata = {
  title: "Admin Plans",
};

export default async function AdminPlansPage() {
  const db = await getAdminDb();
  const dbPlans = db ? (await db.from("plans").select("*").order("sort_order", { ascending: true })).data ?? [] : [];

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Plans</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Plan catalog</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-slate">
          Editing is intentionally stubbed for MVP. Update plans through seed/migration or a future admin editor.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {(dbPlans.length ? dbPlans : staticPlans).length ? (
          (dbPlans.length ? dbPlans : staticPlans).map((plan) => {
            const name = "monthly_price_cents" in plan ? plan.name : plan.name;
            const price = "monthly_price_cents" in plan ? plan.monthly_price_cents : plan.priceCents;
            const currency = "currency" in plan ? plan.currency : plan.currency;
            const active = "active" in plan ? plan.active : true;
            return (
              <div key={"slug" in plan ? plan.slug : name} className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-ink">{name}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-slate">
                      {"description" in plan ? plan.description : ""}
                    </p>
                  </div>
                  <StatusBadge status={active ? "active" : "inactive"} />
                </div>
                <p className="mt-5 text-3xl font-semibold text-ink">{formatMoney(price, currency)}/mo</p>
              </div>
            );
          })
        ) : (
          <EmptyState title="No plans found" />
        )}
      </section>
    </div>
  );
}
