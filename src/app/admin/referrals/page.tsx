import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminDb } from "@/lib/db/admin";

export const metadata: Metadata = {
  title: "Admin Referrals",
};

export default async function AdminReferralsPage() {
  const db = await getAdminDb();
  const referrals = db
    ? (await db.from("referrals").select("*").order("created_at", { ascending: false }).limit(100)).data ?? []
    : [];

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Referrals</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Referral rewards</h1>
      </section>
      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        {referrals.length ? (
          <div className="grid gap-3">
            {referrals.map((referral) => (
              <div key={referral.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="font-mono text-xs text-muted-slate">{referral.id}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{referral.referral_code ?? "No code"}</p>
                </div>
                <StatusBadge status={referral.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No referral activity yet" />
        )}
      </section>
    </div>
  );
}
