import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, BarChart2, Phone, RefreshCw, Shield, Wifi, Zap } from "lucide-react";
import { getAdminDb } from "@/lib/db/admin";
import { getTelecomProvider } from "@/lib/telecom/provider.registry";
import type { LineDetail } from "@/types/telecom";
import { LineActionsPanel } from "@/components/admin/LineActionsPanel";
import { EsimProfileCard } from "@/components/admin/EsimProfileCard";
import { LineBalanceCard } from "@/components/admin/LineBalanceCard";
import { LinePlansCard } from "@/components/admin/LinePlansCard";
import { LineForwardsCard } from "@/components/admin/LineForwardsCard";
import { LineBarringsCard } from "@/components/admin/LineBarringsCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/utils";

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

  // Fetch live data from Annatel if line is provisioned
  let liveDetail: LineDetail | null = null;
  let liveError: string | null = null;
  if (providerLineId) {
    try {
      const provider = getTelecomProvider();
      liveDetail = await provider.getLineDetail(providerLineId);
    } catch (err) {
      liveError = err instanceof Error ? err.message : "Failed to fetch live line data";
    }
  }

  const metadata = (line.metadata ?? {}) as Record<string, unknown>;
  const isEsim = metadata.is_esim === true || metadata.is_esim === "true" || metadata.is_esim === 1;

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-link-blue">Lines / {id.slice(0, 8)}…</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">
            {customer?.full_name ?? "Unknown customer"}
          </h1>
          <p className="mt-1 text-sm text-muted-slate">{customer?.email}</p>
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
            <LineBalanceCard balances={liveDetail.balances} />
          )}

          {/* Plans */}
          {liveDetail && (
            <LinePlansCard
              lineId={line.id}
              providerLineId={providerLineId!}
              plans={liveDetail.plans}
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

          {/* DIDs */}
          {liveDetail && liveDetail.dids.length > 0 && (
            <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <Phone className="h-4 w-4 text-link-blue" />
                Assigned numbers
              </h2>
              <div className="mt-4 grid gap-2">
                {liveDetail.dids.map((did) => (
                  <div key={did.number} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                    <span className="font-semibold text-ink">{did.number}</span>
                    <span className="text-xs text-muted-slate">
                      Since {formatDate(did.startAt)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column — actions */}
        <div className="grid content-start gap-6">
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
