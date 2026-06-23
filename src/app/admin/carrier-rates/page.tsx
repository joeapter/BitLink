import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { getAdminDb } from "@/lib/db/admin";
import { updateCarrierRateAction } from "./actions";

export const metadata: Metadata = { title: "Carrier Rates" };

const TYPE_LABELS: Record<string, { label: string; hint: string; group: string }> = {
  data:             { label: "Data",                         hint: "₪ per GB",                        group: "Base rates (Annatel contract)" },
  voice:            { label: "Voice",                        hint: "₪ per minute (out + in)",          group: "Base rates (Annatel contract)" },
  sms:              { label: "SMS",                          hint: "₪ per outgoing SMS",               group: "Base rates (Annatel contract)" },
  line_fee:         { label: "Active line fee",              hint: "₪ per active line per month",      group: "Base rates (Annatel contract)" },
  interconnect_out: { label: "Interconnect (outgoing)",      hint: "₪ per minute — Israeli law",       group: "Base rates (Annatel contract)" },
  interconnect_in:  { label: "Interconnect (incoming)",      hint: "₪ per minute — Israeli law",       group: "Base rates (Annatel contract)" },
  intl_number_us:   { label: "US number — monthly fee",      hint: "₪ per DID number per month",       group: "International numbers (pending addendum)" },
  intl_number_uk:   { label: "UK number — monthly fee",      hint: "₪ per DID number per month",       group: "International numbers (pending addendum)" },
  intl_number_ca:   { label: "Canada number — monthly fee",  hint: "₪ per DID number per month",       group: "International numbers (pending addendum)" },
  intl_calls_us:    { label: "Calls to/from US number",      hint: "₪ per minute",                    group: "International numbers (pending addendum)" },
  intl_calls_uk:    { label: "Calls to/from UK number",      hint: "₪ per minute",                    group: "International numbers (pending addendum)" },
  intl_calls_ca:    { label: "Calls to/from Canada number",  hint: "₪ per minute",                    group: "International numbers (pending addendum)" },
};

// Israel abolished all mobile interconnect fees in June 2025 (Bill and Keep model).
const INTERCONNECT_ABOLISHED = true;

export default async function CarrierRatesPage() {
  const db = await getAdminDb();
  const rates = db
    ? (await db.from("carrier_rates").select("*").order("call_type")).data ?? []
    : [];

  // Group rates by section
  const grouped = new Map<string, typeof rates>();
  for (const rate of rates) {
    const meta = TYPE_LABELS[rate.call_type];
    const group = meta?.group ?? "Other";
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(rate);
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Settings</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Carrier rates</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-slate">
          Per-unit costs from your Annatel RESELLER contract. Used to calculate CDR-based cost per
          customer in monthly org reports. International number rates are placeholders — update them
          when the contract addendum is signed.
        </p>
      </section>

      {rates.length ? (
        <div className="grid gap-8">
          {Array.from(grouped.entries()).map(([groupName, groupRates]) => {
            const isPending = groupName.includes("pending");
            return (
              <section key={groupName}>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-ink">{groupName}</h2>
                  {isPending && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      Rates needed
                    </span>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {groupRates.map((rate) => {
                    const meta = TYPE_LABELS[rate.call_type] ?? { label: rate.call_type, hint: rate.unit };
                    const currentIls = (Number(rate.rate_agurot) / 100).toFixed(4);
                    const isInterconnect = rate.call_type.startsWith("interconnect");
                    const isIntlPending = rate.call_type.startsWith("intl_") && Number(rate.rate_agurot) === 0;

                    return (
                      <div key={rate.id} className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-ink">{meta.label}</p>
                            <p className="text-xs text-muted-slate">{meta.hint}</p>
                            {isInterconnect && INTERCONNECT_ABOLISHED ? (
                              <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                                Confirmed ₪0.00 — abolished by law (June 2025)
                              </p>
                            ) : isIntlPending ? (
                              <p className="mt-1 text-[11px] font-semibold text-amber-600">
                                Not set — update when addendum is signed
                              </p>
                            ) : null}
                          </div>
                          <p className={`text-lg font-bold tabular-nums ${isIntlPending ? "text-amber-500" : "text-ink"}`}>
                            ₪{currentIls}
                          </p>
                        </div>
                        <form action={updateCarrierRateAction} className="mt-4 flex items-end gap-2 border-t border-ink/8 pt-4">
                          <input type="hidden" name="id" value={rate.id} />
                          <div className="grid gap-1">
                            <label className="text-[11px] font-semibold text-muted-slate" htmlFor={`rate-${rate.id}`}>
                              New rate (₪)
                            </label>
                            <div className="relative">
                              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-slate">₪</span>
                              <input
                                id={`rate-${rate.id}`}
                                name="rateAgurot"
                                type="number"
                                step="0.0001"
                                min="0"
                                defaultValue={currentIls}
                                className="h-9 w-36 rounded-2xl border border-ink/10 bg-white pl-7 pr-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-link-blue"
                              />
                            </div>
                          </div>
                          <Button type="submit" variant="secondary" size="sm">Save</Button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No carrier rates found — run migrations 012 and 013." />
      )}
    </div>
  );
}
