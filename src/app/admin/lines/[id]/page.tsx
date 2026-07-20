import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, MessageCircle, Phone, Shield } from "lucide-react";
import { getAdminDb } from "@/lib/db/admin";
import { getTelecomProvider } from "@/lib/telecom/provider.registry";
import type { LineDetail, LineClid } from "@/types/telecom";
import { LineActionsPanel } from "@/components/admin/LineActionsPanel";
import { EsimProfileCard } from "@/components/admin/EsimProfileCard";
import { LineBalanceCard } from "@/components/admin/LineBalanceCard";
import { LinePlansCard } from "@/components/admin/LinePlansCard";
import { LineForwardsCard } from "@/components/admin/LineForwardsCard";
import { LineBarringsCard } from "@/components/admin/LineBarringsCard";
import { AddIntlNumberCard } from "@/components/admin/AddIntlNumberCard";
import { AddTopupCard } from "@/components/admin/AddTopupCard";
import { LineClidCard } from "@/components/admin/LineClidCard";
import { IntlPortInCard } from "@/components/admin/IntlPortInCard";
import { listIntlPortInRequests } from "@/lib/custom-orders/intl-port-in-requests";
import { IsraeliPortInCard } from "@/components/admin/IsraeliPortInCard";
import { listIsraeliPortInRequests } from "@/lib/custom-orders/israeli-port-in";
import { LineNumberExtrasCard } from "@/components/admin/LineNumberExtrasCard";
import { retryProvisioningJobAction } from "@/lib/admin/line-actions";
import { getCdrUsageBuckets } from "@/lib/cdr/usage";
import { EsimActivationCard } from "@/components/admin/EsimActivationCard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/utils";
import QRCode from "qrcode";
import { toLpaString } from "@/lib/esim";
import { whatsappGreeting, whatsappWebUrl } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Line Detail" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminLineDetailPage({ params }: Props) {
  const { id } = await params;
  const db = await getAdminDb();
  if (!db) notFound();

  const { data: line } = await db
    .from("telecom_lines")
    .select("*, customers(full_name, email, phone)")
    .eq("id", id)
    .single();

  if (!line) notFound();

  const customer = line.customers as { full_name?: string; email?: string; phone?: string } | null;
  const providerLineId = line.provider_line_id as string | null;

  // Generated once here (server-side) so EsimActivationCard, a client
  // component (it needs useActionState for the resend button), can just
  // render the data URL rather than doing its own async work. Normalized to
  // the full LPA string — phones reject QR codes without the LPA: prefix.
  const lineMeta = (line.metadata ?? {}) as Record<string, unknown>;
  const rawActivationCode = lineMeta.esim_activation_code as string | undefined;
  const pendingActivationCode = rawActivationCode
    ? toLpaString(rawActivationCode, lineMeta.esim_sm_dp_plus as string | undefined)
    : undefined;
  const esimQrDataUrl = pendingActivationCode && !lineMeta.esim_activated_at
    ? await QRCode.toDataURL(pendingActivationCode, { width: 300, margin: 1, errorCorrectionLevel: "M" })
    : null;
  const { data: latestJob } = await db
    .from("provisioning_jobs")
    .select("id, status, error, attempt_count, max_attempts, updated_at, next_retry_at")
    .eq("line_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: topupGrantRows } = await db
    .from("line_topup_grants")
    .select("id, label, frequency, billing_mode, created_at")
    .eq("line_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Fetch live data from Annatel if line is provisioned
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
    // Separate, optional fetch — CLIDs aren't part of getLineDetail's parallel
    // load since this is an experimental feature, not core line data.
    try {
      const provider = getTelecomProvider();
      clids = await provider.listLineClids(providerLineId);
    } catch {
      clids = [];
    }
  }

  const intlPortInRequests = await listIntlPortInRequests(db, line.id);
  const israeliPortInRequests = await listIsraeliPortInRequests(db, line.id);

  const metadata = (line.metadata ?? {}) as Record<string, unknown>;
  const isEsim = metadata.is_esim === true || metadata.is_esim === "true" || metadata.is_esim === 1;

  // Annatel's live balance data has never populated (ocs_balances returns an
  // empty body — see lib/cdr/usage.ts), so derive the usage meters from the
  // ingested CDR records instead whenever the live payload has none.
  let balances = liveDetail?.balances ?? [];
  let balanceNote: string | undefined;
  let balanceExpiryLabel: string | undefined;
  if (liveDetail && balances.length === 0) {
    const cdrUsage = await getCdrUsageBuckets(
      db,
      { telecomLineId: id },
      metadata.plan_slug as string | undefined,
    );
    if (cdrUsage) {
      balances = cdrUsage.buckets;
      balanceNote = `Computed from carrier usage records (synced every ~4 hours) — ${cdrUsage.recordCount} records this calendar month. Voice and SMS count outgoing only.`;
      balanceExpiryLabel = "Resets";
    }
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-link-blue">Lines / {id.slice(0, 8)}…</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">
            {customer?.full_name ?? "Unknown customer"}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-slate">
            {customer?.email}
            {customer?.phone && whatsappWebUrl(customer.phone) ? (
              <a
                href={whatsappWebUrl(customer.phone, whatsappGreeting(customer.full_name)) ?? undefined}
                target="bitlink-whatsapp"
                rel="noopener noreferrer"
                title={`WhatsApp ${customer.phone} (business account)`}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <MessageCircle className="h-3 w-3" aria-hidden="true" />
                WhatsApp
              </a>
            ) : null}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={line.status} />
            {line.is_kosher && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                Kosher
              </span>
            )}
            {isEsim && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                eSIM
              </span>
            )}
          </div>
        </div>

        {/* Key IDs */}
        <div className="grid gap-1 rounded-2xl border border-ink/10 bg-slate-50 px-4 py-3 text-xs font-mono">
          <div className="flex gap-3">
            <span className="w-28 text-muted-slate">BitLink ID</span>
            <span className="text-ink">{line.id}</span>
          </div>
          <div className="flex gap-3">
            <span className="w-28 text-muted-slate">Provider line</span>
            <span className="text-ink">{providerLineId ?? "Not yet assigned"}</span>
          </div>
          <div className="flex gap-3">
            <span className="w-28 text-muted-slate">Plan</span>
            <span className="text-ink">{String(metadata.plan_slug ?? "—")}</span>
          </div>
          <div className="flex gap-3">
            <span className="w-28 text-muted-slate">Created</span>
            <span className="text-ink">{formatDateTime(line.created_at)}</span>
          </div>
        </div>
      </section>

      {/* Live data error banner */}
      {liveError && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Could not load live Annatel data: {liveError}</span>
        </div>
      )}

      {!providerLineId && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>This line has not been assigned a provider line ID yet — provisioning may still be in progress.</span>
        </div>
      )}

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-6">
          {/* eSIM profile */}
          {isEsim && liveDetail && (
            <EsimProfileCard
              lineId={line.id}
              providerLineId={providerLineId!}
              sims={liveDetail.sims}
            />
          )}

          {/* Balance / usage */}
          {liveDetail && (
            <LineBalanceCard balances={balances} note={balanceNote} expiryLabel={balanceExpiryLabel} />
          )}

          {/* Plans */}
          {liveDetail && (
            <LinePlansCard
              lineId={line.id}
              plans={liveDetail.plans}
              topupGrants={(topupGrantRows ?? []).map((g) => ({
                topupId: g.id as string,
                label: g.label as string,
                billingMode: g.billing_mode as string,
                frequency: g.frequency as string,
              }))}
              isKosher={Boolean(line.is_kosher)}
              currentPlanSlug={(metadata.plan_slug as string | undefined) ?? null}
            />
          )}

          {/* International number add-on (for lines already active/suspended) */}
          {providerLineId && ["active", "suspended"].includes(line.status) && (() => {
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
                lineId={line.id}
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
          {providerLineId && ["active", "suspended"].includes(line.status) && (
            <AddTopupCard
              lineId={line.id}
              isKosher={Boolean(line.is_kosher)}
              activeGrants={(topupGrantRows ?? []).map((grant) => ({
                id: grant.id as string,
                label: grant.label as string,
                frequency: grant.frequency as "once" | "monthly",
                billingMode: grant.billing_mode as "free" | "paid",
                createdAt: grant.created_at as string,
              }))}
            />
          )}

          {/* Call forwarding */}
          {providerLineId && (
            <LineForwardsCard
              lineId={line.id}
              providerLineId={providerLineId}
              forwards={liveDetail?.forwards ?? []}
            />
          )}

          {/* Barrings */}
          {providerLineId && (
            <LineBarringsCard
              lineId={line.id}
              providerLineId={providerLineId}
              barrings={liveDetail?.barrings ?? []}
            />
          )}

          {/* Caller ID by destination (CLID) — experimental */}
          {providerLineId && (
            <LineClidCard lineId={line.id} providerLineId={providerLineId} clids={clids} />
          )}

          {/* US/UK/Canada port-in tracker */}
          <IntlPortInCard lineId={line.id} requests={intlPortInRequests} />

          {/* Israeli port-in to this existing line */}
          <IsraeliPortInCard lineId={line.id} requests={israeliPortInRequests} />

          {/* Voicemail / SMS backup / aflalo — experimental, per number */}
          {providerLineId && liveDetail && liveDetail.dids.length > 0 && (
            <LineNumberExtrasCard
              lineId={line.id}
              providerLineId={providerLineId}
              dids={liveDetail.dids
                .filter((d): d is typeof d & { id: string } => Boolean(d.id))
                .map((d) => ({ id: d.id, number: d.number }))}
            />
          )}

          {/* SIMs raw info */}
          {liveDetail && liveDetail.sims.length > 0 && (
            <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <Phone className="h-4 w-4 text-link-blue" />
                SIMs on this line
              </h2>
              <div className="mt-4 grid gap-2">
                {liveDetail.sims.map((sim) => (
                  <div key={sim.id} className="rounded-xl bg-slate-50 p-3 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink">{sim.iccId}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase ${sim.type === "esim" ? "bg-blue-50 text-blue-700" : "bg-slate-200 text-slate-600"}`}>
                        {sim.type}
                      </span>
                    </div>
                    {sim.isMain && <span className="text-emerald-700">Main SIM</span>}
                  </div>
                ))}
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
              <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
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
        </div>

        {/* Right column — actions */}
        <div className="grid content-start gap-6">
          {latestJob && (
            <section className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Provisioning job</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-slate">Status</span>
                  <StatusBadge status={latestJob.status} />
                </div>
                {latestJob.status === "pending" && latestJob.next_retry_at ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-slate">Scheduled</span>
                    <span className="font-mono text-xs text-ink">
                      {new Date(latestJob.next_retry_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-slate">Attempts</span>
                  <span className="font-mono text-xs text-ink">
                    {latestJob.attempt_count} / {latestJob.max_attempts}
                  </span>
                </div>
                {latestJob.error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    {latestJob.error}
                  </div>
                ) : null}
                {latestJob.status === "failed" && latestJob.attempt_count < latestJob.max_attempts ? (
                  <form action={retryProvisioningJobAction}>
                    <input type="hidden" name="jobId" value={latestJob.id} />
                    <input type="hidden" name="lineId" value={line.id} />
                    <Button type="submit" size="sm" className="w-full">
                      Retry provisioning
                    </Button>
                  </form>
                ) : null}
              </div>
            </section>
          )}

          {(() => {
            const meta = (line.metadata ?? {}) as Record<string, unknown>;
            const isEsim = meta.is_esim === true || meta.is_esim === "1" || meta.is_esim === 1;
            const installedAt = meta.esim_activated_at as string | undefined;
            if (!isEsim || !pendingActivationCode || installedAt || !providerLineId) return null;
            return (
              <EsimActivationCard
                lineId={line.id}
                providerLineId={providerLineId}
                activationCode={pendingActivationCode}
                qrDataUrl={esimQrDataUrl ?? ""}
                iccId={meta.esim_icc_id as string | undefined}
              />
            );
          })()}

          {providerLineId && (
            <LineActionsPanel
              lineId={line.id}
              providerLineId={providerLineId}
              currentStatus={line.status}
            />
          )}

          {/* Suspensions */}
          {liveDetail && liveDetail.suspensions.length > 0 && (
            <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 shadow-soft">
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
      </div>
    </div>
  );
}
