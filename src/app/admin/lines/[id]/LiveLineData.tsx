import { AlertTriangle, Phone, Shield } from "lucide-react";
import { getAdminDb } from "@/lib/db/admin";
import { getTelecomProvider } from "@/lib/telecom/provider.registry";
import type { LineDetail, LineClid } from "@/types/telecom";
import { EsimProfileCard } from "@/components/admin/EsimProfileCard";
import { LineBalanceCard } from "@/components/admin/LineBalanceCard";
import { LinePlansCard } from "@/components/admin/LinePlansCard";
import { LineForwardsCard } from "@/components/admin/LineForwardsCard";
import { LineBarringsCard } from "@/components/admin/LineBarringsCard";
import { AddIntlNumberCard } from "@/components/admin/AddIntlNumberCard";
import { AddTopupCard } from "@/components/admin/AddTopupCard";
import { LineClidCard } from "@/components/admin/LineClidCard";
import { IntlPortInCard } from "@/components/admin/IntlPortInCard";
import { IsraeliPortInCard } from "@/components/admin/IsraeliPortInCard";
import { LineNumberExtrasCard } from "@/components/admin/LineNumberExtrasCard";
import { listIntlPortInRequests } from "@/lib/custom-orders/intl-port-in-requests";
import { listIsraeliPortInRequests } from "@/lib/custom-orders/israeli-port-in";
import { getCdrUsageBuckets } from "@/lib/cdr/usage";
import { formatDate, formatDateTime } from "@/lib/utils";

// The left column of the line-detail page: everything that depends on a LIVE
// Annatel fetch (getLineDetail) plus the DB-backed number/topup/port-in cards.
// Rendered inside a <Suspense> so the page shell (header + action buttons)
// paints instantly and this whole column streams in once the carrier data
// resolves. Suspensions are rendered here too (they need the live data), so
// only one getLineDetail call is made.

export function LiveLineDataSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 sm:gap-6" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-40 rounded-2xl bg-slate-100 sm:rounded-4xl" />
      ))}
    </div>
  );
}

type TopupGrantRow = {
  id: string;
  label: string;
  frequency: string;
  billing_mode: string;
  created_at: string;
};

export async function LiveLineData({
  lineId,
  providerLineId,
  lineStatus,
  isKosher,
  isEsim,
  planSlug,
  metadata,
}: {
  lineId: string;
  providerLineId: string | null;
  lineStatus: string;
  isKosher: boolean;
  isEsim: boolean;
  planSlug: string | null;
  metadata: Record<string, unknown>;
}) {
  const db = await getAdminDb();

  let liveDetail: LineDetail | null = null;
  let liveError: string | null = null;
  let clids: LineClid[] = [];
  if (providerLineId) {
    try {
      const provider = getTelecomProvider();
      liveDetail = await provider.getLineDetail(providerLineId);
    } catch (err) {
      liveError = err instanceof Error ? err.message : "Failed to fetch live line data";
    }
    try {
      const provider = getTelecomProvider();
      clids = await provider.listLineClids(providerLineId);
    } catch {
      clids = [];
    }
  }

  const [topupGrantRows, intlPortInRequests, israeliPortInRequests] = db
    ? await Promise.all([
        db
          .from("line_topup_grants")
          .select("id, label, frequency, billing_mode, created_at")
          .eq("line_id", lineId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .then((r) => (r.data ?? []) as TopupGrantRow[]),
        listIntlPortInRequests(db, lineId),
        listIsraeliPortInRequests(db, lineId),
      ])
    : [[] as TopupGrantRow[], [], []];

  // Annatel live balances have never populated (ocs_balances returns empty),
  // so derive usage meters from ingested CDR records when the live payload has none.
  let balances = liveDetail?.balances ?? [];
  let balanceNote: string | undefined;
  let balanceExpiryLabel: string | undefined;
  if (db && liveDetail && balances.length === 0) {
    const cdrUsage = await getCdrUsageBuckets(db, { telecomLineId: lineId }, planSlug ?? undefined);
    if (cdrUsage) {
      balances = cdrUsage.buckets;
      balanceNote = `Computed from carrier usage records (synced every ~4 hours) — ${cdrUsage.recordCount} records this calendar month. Voice and SMS count outgoing only.`;
      balanceExpiryLabel = "Resets";
    }
  }

  const isActiveOrSuspended = ["active", "suspended"].includes(lineStatus);

  return (
    <div className="grid gap-4 sm:gap-6">
      {liveError && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Could not load live Annatel data: {liveError}</span>
        </div>
      )}

      {/* eSIM profile */}
      {isEsim && liveDetail && (
        <EsimProfileCard lineId={lineId} providerLineId={providerLineId!} sims={liveDetail.sims} />
      )}

      {/* Balance / usage */}
      {liveDetail && <LineBalanceCard balances={balances} note={balanceNote} expiryLabel={balanceExpiryLabel} />}

      {/* Plans */}
      {liveDetail && (
        <LinePlansCard
          lineId={lineId}
          plans={liveDetail.plans}
          topupGrants={topupGrantRows.map((g) => ({
            topupId: g.id,
            label: g.label,
            billingMode: g.billing_mode,
            frequency: g.frequency,
          }))}
          isKosher={isKosher}
          currentPlanSlug={planSlug}
        />
      )}

      {/* International number add-on (for lines already active/suspended) */}
      {providerLineId && isActiveOrSuspended && (() => {
        const intlNumberMeta = metadata.intl_number as
          | { country: string; number: string; status: string; billing_mode?: string }
          | undefined;
        const extraIntlMeta = (Array.isArray(metadata.intl_numbers_extra) ? metadata.intl_numbers_extra : []) as Array<{
          country: string;
          number: string;
          status: string;
          billing_mode?: string;
        }>;
        return (
          <AddIntlNumberCard
            lineId={lineId}
            extraIntlNumbers={extraIntlMeta.map((n) => ({
              country: n.country,
              number: n.number,
              status: n.status,
              billingMode: n.billing_mode,
            }))}
            existingIntlNumber={
              intlNumberMeta
                ? {
                    country: intlNumberMeta.country,
                    number: intlNumberMeta.number,
                    status: intlNumberMeta.status,
                    billingMode: intlNumberMeta.billing_mode,
                  }
                : null
            }
          />
        );
      })()}

      {/* Topups — free/paid, one-time/monthly grants */}
      {providerLineId && isActiveOrSuspended && (
        <AddTopupCard
          lineId={lineId}
          isKosher={isKosher}
          activeGrants={topupGrantRows.map((grant) => ({
            id: grant.id,
            label: grant.label,
            frequency: grant.frequency as "once" | "monthly",
            billingMode: grant.billing_mode as "free" | "paid",
            createdAt: grant.created_at,
          }))}
        />
      )}

      {/* Call forwarding */}
      {providerLineId && (
        <LineForwardsCard lineId={lineId} providerLineId={providerLineId} forwards={liveDetail?.forwards ?? []} />
      )}

      {/* Barrings */}
      {providerLineId && (
        <LineBarringsCard lineId={lineId} providerLineId={providerLineId} barrings={liveDetail?.barrings ?? []} />
      )}

      {/* Caller ID by destination (CLID) — experimental */}
      {providerLineId && <LineClidCard lineId={lineId} providerLineId={providerLineId} clids={clids} />}

      {/* US/UK/Canada port-in tracker */}
      <IntlPortInCard lineId={lineId} requests={intlPortInRequests} />

      {/* Israeli port-in to this existing line */}
      <IsraeliPortInCard lineId={lineId} requests={israeliPortInRequests} />

      {/* Voicemail / SMS backup / aflalo — experimental, per number */}
      {providerLineId && liveDetail && liveDetail.dids.length > 0 && (
        <LineNumberExtrasCard
          lineId={lineId}
          providerLineId={providerLineId}
          dids={liveDetail.dids
            .filter((d): d is typeof d & { id: string } => Boolean(d.id))
            .map((d) => ({ id: d.id, number: d.number }))}
        />
      )}

      {/* SIMs raw info */}
      {liveDetail && liveDetail.sims.length > 0 && (
        <section className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:rounded-4xl sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Phone className="h-4 w-4 text-link-blue" />
            SIMs on this line
          </h2>
          <div className="mt-4 grid gap-2">
            {[...liveDetail.sims]
              .sort((a, b) => (a.endAt ? 1 : 0) - (b.endAt ? 1 : 0))
              .map((sim) => {
                const retired = Boolean(sim.endAt);
                return (
                  <div
                    key={sim.id}
                    className={`rounded-xl p-3 text-xs font-mono ${retired ? "bg-slate-100 opacity-60" : "bg-slate-50"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-semibold ${retired ? "text-muted-slate line-through" : "text-ink"}`}>{sim.iccId}</span>
                      <div className="flex items-center gap-1.5">
                        {retired ? (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[0.6rem] font-bold uppercase text-slate-500">Retired</span>
                        ) : null}
                        <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase ${sim.type === "esim" ? "bg-blue-50 text-blue-700" : "bg-slate-200 text-slate-600"}`}>
                          {sim.type}
                        </span>
                      </div>
                    </div>
                    {retired ? (
                      <span className="text-muted-slate">
                        Replaced{sim.endAt ? ` ${sim.endAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""} — no longer active
                      </span>
                    ) : sim.isMain ? (
                      <span className="text-emerald-700">Active · Main SIM</span>
                    ) : (
                      <span className="text-emerald-700">Active</span>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* DIDs + pending port-ins */}
      {(() => {
        const intlPortIn = metadata.intl_port_in as Record<string, unknown> | undefined;
        const intlNumber = metadata.intl_number as Record<string, unknown> | undefined;
        const hasDids = liveDetail && liveDetail.dids.length > 0;
        const hasPortIn = Boolean(intlPortIn?.number);
        const hasIntlNumber = Boolean(intlNumber?.status);
        if (!hasDids && !hasPortIn && !hasIntlNumber) return null;
        const intlNumberStatusColors: Record<string, string> = {
          awaiting_fulfillment: 'bg-amber-50 text-amber-700 border-amber-200',
          reserved:             'bg-blue-50 text-blue-700 border-blue-200',
          assigned:             'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
        const intlNumberStatusLabel: Record<string, string> = {
          awaiting_fulfillment: 'Needs manual number (admin)',
          reserved:             'Reserved — activating',
          assigned:             'Assigned',
        };
        const portInStatusColors: Record<string, string> = {
          awaiting_israeli_line: 'bg-amber-50 text-amber-700 border-amber-200',
          manual_pending:        'bg-orange-50 text-orange-700 border-orange-200',
          submitting:            'bg-blue-50 text-blue-700 border-blue-200',
          submitted:             'bg-blue-50 text-blue-700 border-blue-200',
          processing:            'bg-blue-50 text-blue-700 border-blue-200',
          porting:               'bg-violet-50 text-violet-700 border-violet-200',
          complete:              'bg-emerald-50 text-emerald-700 border-emerald-200',
          api_error:             'bg-red-50 text-red-700 border-red-200',
          failed:                'bg-red-50 text-red-700 border-red-200',
          pending:               'bg-slate-100 text-slate-600 border-slate-200',
        };
        const portInStatusLabel: Record<string, string> = {
          awaiting_israeli_line: 'Waiting for Israeli SIM',
          manual_pending:        'Pending manual port (Annatel)',
          submitting:            'Submitting',
          submitted:             'Submitted',
          processing:            'Processing',
          porting:               'Porting in progress',
          complete:              'Ported',
          api_error:             'API error',
          failed:                'Failed',
          pending:               'Pending',
        };
        return (
          <section className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:rounded-4xl sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <Phone className="h-4 w-4 text-link-blue" />
              Assigned numbers
            </h2>
            <div className="mt-4 grid gap-2">
              {hasDids && liveDetail!.dids.map((did) => (
                <div key={did.number} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{did.number}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-700">Active</span>
                  </div>
                  <span className="text-xs text-muted-slate">Since {formatDate(did.startAt)}</span>
                </div>
              ))}
              {hasPortIn && (
                <div className="rounded-xl border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-ink">{intlPortIn!.number as string}</span>
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-slate-500">
                        {(intlPortIn!.country as string | undefined)?.toUpperCase() ?? 'INTL'} {intlPortIn!.source === 'port' ? 'Port-in' : 'New'}
                      </span>
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${portInStatusColors[intlPortIn!.status as string] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {portInStatusLabel[intlPortIn!.status as string] ?? String(intlPortIn!.status)}
                    </span>
                  </div>
                  {intlPortIn!.error ? (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="font-mono">{String(intlPortIn!.error)}</span>
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.65rem] text-muted-slate">
                    {intlPortIn!.created_at ? <span>Requested {formatDateTime(intlPortIn!.created_at as string)}</span> : null}
                    {intlPortIn!.attempted_at ? <span>Last attempted {formatDateTime(intlPortIn!.attempted_at as string)}</span> : null}
                    {intlPortIn!.annatel_bur_id ? <span className="font-mono">BUR: {String(intlPortIn!.annatel_bur_id)}</span> : null}
                  </div>
                </div>
              )}
              {hasIntlNumber && (
                <div className="rounded-xl border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-ink">
                        {(intlNumber!.number as string | undefined) ?? "Not yet chosen"}
                      </span>
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-slate-500">
                        {(intlNumber!.country as string | undefined)?.toUpperCase() ?? 'INTL'} New
                      </span>
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${intlNumberStatusColors[intlNumber!.status as string] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {intlNumberStatusLabel[intlNumber!.status as string] ?? String(intlNumber!.status)}
                    </span>
                  </div>
                  {intlNumber!.requested_at ? (
                    <p className="mt-2 text-[0.65rem] text-muted-slate">
                      Requested {formatDateTime(intlNumber!.requested_at as string)}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* Suspensions — live data, so streamed here with the rest */}
      {liveDetail && liveDetail.suspensions.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-soft sm:rounded-4xl sm:p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-amber-800">
            <Shield className="h-4 w-4" />
            Active suspensions
          </h2>
          <ul className="mt-3 grid gap-2">
            {liveDetail.suspensions.map((s) => (
              <li key={s.id} className="rounded-xl bg-white p-3 text-xs">
                <span className="font-semibold text-amber-900">{s.type}</span>
                <span className="ml-2 text-amber-700">since {formatDate(s.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
