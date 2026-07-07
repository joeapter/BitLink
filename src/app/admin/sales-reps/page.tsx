import type { Metadata } from "next";
import { CheckCircle2, ExternalLink, Handshake } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminDb } from "@/lib/db/admin";
import { formatDate, formatDateTime } from "@/lib/utils";
import { formatAgorot } from "@/lib/referrals";
import { recordSalesRepPaymentAction } from "@/lib/admin/sales-rep-actions";

export const metadata: Metadata = { title: "Sales Reps" };
export const dynamic = "force-dynamic";

type ProfileRow = { id: string; full_name: string | null; email: string | null };
type CustomerRow = { id: string; full_name: string | null; email: string | null };
type LineRow = { id: string; status: string | null; metadata: unknown };

function sumAgorot(rows: Array<{ amount_agorot: number | null }>) {
  return rows.reduce((total, row) => total + Number(row.amount_agorot ?? 0), 0);
}

export default async function AdminSalesRepsPage() {
  const db = await getAdminDb();
  if (!db) {
    return <EmptyState title="Database unavailable" />;
  }

  const [
    { data: repsRaw },
    { data: commissionsRaw },
    { data: paymentsRaw },
  ] = await Promise.all([
    db.from("sales_reps").select("*").order("created_at", { ascending: false }),
    db.from("sales_rep_commissions").select("*").order("earned_at", { ascending: false }),
    db.from("sales_rep_payments").select("*").order("paid_at", { ascending: false }),
  ]);

  const reps = repsRaw ?? [];
  const commissions = commissionsRaw ?? [];
  const payments = paymentsRaw ?? [];

  const profileIds = [...new Set(reps.map((rep) => rep.profile_id as string).filter(Boolean))];
  const repCustomerIds = [...new Set(reps.map((rep) => rep.customer_id as string | null).filter(Boolean) as string[])];
  const referredCustomerIds = [
    ...new Set(commissions.map((commission) => commission.referred_customer_id as string | null).filter(Boolean) as string[]),
  ];
  const referredLineIds = [
    ...new Set(commissions.map((commission) => commission.referred_line_id as string | null).filter(Boolean) as string[]),
  ];

  const [
    { data: profilesRaw },
    { data: repCustomersRaw },
    { data: referredCustomersRaw },
    { data: referredLinesRaw },
  ] = await Promise.all([
    profileIds.length
      ? db.from("profiles").select("id, full_name, email").in("id", profileIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
    repCustomerIds.length
      ? db.from("customers").select("id, full_name, email").in("id", repCustomerIds)
      : Promise.resolve({ data: [] as CustomerRow[] }),
    referredCustomerIds.length
      ? db.from("customers").select("id, full_name, email").in("id", referredCustomerIds)
      : Promise.resolve({ data: [] as CustomerRow[] }),
    referredLineIds.length
      ? db.from("telecom_lines").select("id, status, metadata").in("id", referredLineIds)
      : Promise.resolve({ data: [] as LineRow[] }),
  ]);

  const profiles = new Map((profilesRaw ?? []).map((profile) => [profile.id, profile as ProfileRow]));
  const repCustomers = new Map((repCustomersRaw ?? []).map((customer) => [customer.id, customer as CustomerRow]));
  const referredCustomers = new Map((referredCustomersRaw ?? []).map((customer) => [customer.id, customer as CustomerRow]));
  const referredLines = new Map((referredLinesRaw ?? []).map((line) => [line.id, line as LineRow]));

  const totalPending = sumAgorot(commissions.filter((commission) => commission.status === "pending"));
  const totalPaid = sumAgorot(commissions.filter((commission) => commission.status === "paid"));
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bitlink.co.il").replace(/\/$/, "");

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Sales reps</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Referral payouts</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-slate">
          Sales reps get a checkout referral link. Each active referred line creates a one-time ₪30 commission
          and records that amount as the referral cost for the line.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-slate">Reps</p>
          <p className="mt-1 text-3xl font-semibold text-ink">{reps.length}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-slate">Referrals</p>
          <p className="mt-1 text-3xl font-semibold text-ink">{commissions.length}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-slate">Balance due</p>
          <p className="mt-1 text-3xl font-semibold text-ink">{formatAgorot(totalPending)}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-slate">Paid</p>
          <p className="mt-1 text-3xl font-semibold text-ink">{formatAgorot(totalPaid)}</p>
        </div>
      </section>

      {reps.length ? (
        <div className="grid gap-6">
          {reps.map((rep) => {
            const profile = profiles.get(rep.profile_id as string);
            const customer = rep.customer_id ? repCustomers.get(rep.customer_id as string) : null;
            const repCommissions = commissions.filter((commission) => commission.sales_rep_id === rep.id);
            const repPayments = payments.filter((payment) => payment.sales_rep_id === rep.id);
            const pending = sumAgorot(repCommissions.filter((commission) => commission.status === "pending"));
            const paid = sumAgorot(repCommissions.filter((commission) => commission.status === "paid"));
            const referralLink = `${siteUrl}/checkout?referral=${encodeURIComponent(rep.referral_code as string)}`;

            return (
              <section key={rep.id} className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
                <div className="grid gap-4 border-b border-ink/8 p-6 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Handshake className="h-5 w-5 text-link-blue" aria-hidden="true" />
                      <h2 className="text-2xl font-semibold tracking-normal text-ink">
                        {profile?.full_name ?? customer?.full_name ?? "Sales rep"}
                      </h2>
                      <StatusBadge status={rep.status as string} />
                    </div>
                    <p className="mt-1 text-sm text-muted-slate">{profile?.email ?? customer?.email ?? "No email"}</p>
                    <a
                      href={referralLink}
                      className="mt-3 inline-flex max-w-full items-center gap-2 break-all rounded-2xl bg-slate-50 px-4 py-3 font-mono text-xs font-semibold text-ink hover:bg-slate-100"
                    >
                      {referralLink}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </a>
                  </div>

                  <form action={recordSalesRepPaymentAction} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:min-w-80">
                    <input type="hidden" name="salesRepId" value={rep.id as string} />
                    <p className="text-sm font-semibold text-ink">Record payment</p>
                    <Input
                      label="Amount paid"
                      name="amountIls"
                      defaultValue={(pending / 100).toFixed(2)}
                      inputMode="decimal"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="Method" name="method" placeholder="Cash, bank..." />
                      <Input label="Reference" name="reference" placeholder="Optional" />
                    </div>
                    <Input label="Note" name="notes" placeholder="Optional" />
                    <Button type="submit" size="sm" disabled={pending <= 0}>
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Record payment
                    </Button>
                  </form>
                </div>

                <div className="grid gap-4 p-6 md:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-slate">Referrals</p>
                    <p className="mt-1 text-2xl font-semibold text-ink">{repCommissions.length}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-slate">Balance due</p>
                    <p className="mt-1 text-2xl font-semibold text-ink">{formatAgorot(pending)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-slate">Paid</p>
                    <p className="mt-1 text-2xl font-semibold text-ink">{formatAgorot(paid)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-slate">Last payment</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {repPayments[0]?.paid_at ? formatDate(repPayments[0].paid_at as string) : "None"}
                    </p>
                  </div>
                </div>

                {repCommissions.length ? (
                  <div className="overflow-x-auto border-t border-ink/8">
                    <table className="min-w-[880px] w-full text-left text-sm">
                      <thead className="bg-slate-50 text-muted-slate">
                        <tr>
                          <th className="px-5 py-4 font-semibold">Date</th>
                          <th className="px-5 py-4 font-semibold">Referred customer</th>
                          <th className="px-5 py-4 font-semibold">Line</th>
                          <th className="px-5 py-4 font-semibold">Cost</th>
                          <th className="px-5 py-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/8">
                        {repCommissions.map((commission) => {
                          const referredCustomer = commission.referred_customer_id
                            ? referredCustomers.get(commission.referred_customer_id as string)
                            : null;
                          const line = commission.referred_line_id
                            ? referredLines.get(commission.referred_line_id as string)
                            : null;
                          const phoneNumber = (line?.metadata as Record<string, unknown> | undefined)?.phone_number as string | undefined;
                          return (
                            <tr key={commission.id}>
                              <td className="px-5 py-4 text-slate-500">{formatDateTime(commission.earned_at as string)}</td>
                              <td className="px-5 py-4">
                                <div className="font-semibold text-ink">{referredCustomer?.full_name ?? "Unknown customer"}</div>
                                <div className="text-xs text-muted-slate">{referredCustomer?.email ?? "No email"}</div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="font-mono text-xs text-slate-600">{commission.referred_line_id ?? "No line"}</div>
                                <div className="mt-1 text-xs text-muted-slate">{phoneNumber ?? line?.status ?? "No number yet"}</div>
                              </td>
                              <td className="px-5 py-4 font-semibold text-ink">{formatAgorot(Number(commission.amount_agorot ?? 0))}</td>
                              <td className="px-5 py-4"><StatusBadge status={commission.status as string} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border-t border-ink/8 p-6">
                    <EmptyState title="No referrals for this rep yet" />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
          <EmptyState title="No sales reps yet">
            Use Make rep from the customer list after the customer has a BitLink login.
          </EmptyState>
        </section>
      )}
    </div>
  );
}
