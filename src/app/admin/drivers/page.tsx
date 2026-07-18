import type { Metadata } from "next";
import { getAdminDb } from "@/lib/db/admin";
import { ClaimDriverCodeForm } from "@/components/admin/ClaimDriverCodeForm";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Driver Codes" };
export const dynamic = "force-dynamic";

// The airport card program: pre-printed referral cards, claimed per driver on
// the spot. Payout owed = active lines × 30 shekel, counted right here.
export default async function AdminDriversPage() {
  const db = await getAdminDb();
  if (!db) return null;

  const { data: codes } = await db
    .from("driver_codes")
    .select("code, driver_name, driver_phone, claimed_at")
    .order("claimed_at", { ascending: false, nullsFirst: false })
    .order("code");

  const allCodes = codes ?? [];
  const codeList = allCodes.map((c) => c.code as string);

  // Signups per code: customers whose referred_by carries a driver code, and
  // how many of them reached an active line (the payable event).
  const { data: referred } = codeList.length
    ? await db
        .from("customers")
        .select("id, full_name, referred_by, telecom_lines(status)")
        .in("referred_by", codeList)
    : { data: [] };

  const statsByCode = new Map<string, { signups: number; activeLines: number }>();
  for (const customer of referred ?? []) {
    const code = customer.referred_by as string;
    const stat = statsByCode.get(code) ?? { signups: 0, activeLines: 0 };
    stat.signups += 1;
    const lines = (customer.telecom_lines ?? []) as Array<{ status: string }>;
    stat.activeLines += lines.filter((l) => l.status === "active").length;
    statsByCode.set(code, stat);
  }

  const claimed = allCodes.filter((c) => c.claimed_at);
  const unclaimed = allCodes.filter((c) => !c.claimed_at);
  const totalActive = [...statsByCode.values()].reduce((s, v) => s + v.activeLines, 0);

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Drivers</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Driver referral cards</h1>
        <p className="mt-1 text-sm text-muted-slate">
          {unclaimed.length} cards unclaimed · {claimed.length} with drivers · {totalActive} active lines ={" "}
          <span className="font-semibold text-ink">₪{totalActive * 30} owed</span> (30₪/line)
        </p>
      </section>

      <ClaimDriverCodeForm unclaimedCodes={unclaimed.map((c) => c.code as string)} />

      {claimed.length > 0 && (
        <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-140 text-left text-sm">
              <thead className="bg-slate-50 text-muted-slate">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Driver</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Claimed</th>
                  <th className="px-4 py-3 font-semibold">Signups</th>
                  <th className="px-4 py-3 font-semibold">Active lines</th>
                  <th className="px-4 py-3 font-semibold">Owed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {claimed.map((c) => {
                  const stat = statsByCode.get(c.code as string) ?? { signups: 0, activeLines: 0 };
                  return (
                    <tr key={c.code as string}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-ink">{c.code as string}</td>
                      <td className="px-4 py-3 font-semibold text-ink">{(c.driver_name as string) ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{(c.driver_phone as string) ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(c.claimed_at as string)}</td>
                      <td className="px-4 py-3 tabular-nums">{stat.signups}</td>
                      <td className="px-4 py-3 tabular-nums">{stat.activeLines}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-ink">₪{stat.activeLines * 30}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
