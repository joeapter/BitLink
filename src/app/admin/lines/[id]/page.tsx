import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AlertTriangle, MessageCircle } from "lucide-react";
import { getAdminDb } from "@/lib/db/admin";
import { LineActionsPanel } from "@/components/admin/LineActionsPanel";
import { retryProvisioningJobAction } from "@/lib/admin/line-actions";
import { EsimActivationCard } from "@/components/admin/EsimActivationCard";
import { EsimResendCard } from "@/components/admin/EsimResendCard";
import { AssignPhysicalSimCard } from "@/components/admin/AssignPhysicalSimCard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import QRCode from "qrcode";
import { toLpaString } from "@/lib/esim";
import { whatsappGreeting, whatsappWebUrl } from "@/lib/whatsapp";
import { LiveLineData, LiveLineDataSkeleton } from "./LiveLineData";

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
  // component, can just render the data URL. Normalized to the full LPA string.
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

  const metadata = (line.metadata ?? {}) as Record<string, unknown>;
  const isEsim = metadata.is_esim === true || metadata.is_esim === "true" || metadata.is_esim === 1;

  return (
    <div className="grid gap-4 sm:gap-6">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-link-blue">Lines / {id.slice(0, 8)}…</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
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

        {/* Key IDs — rows stack (label above value) on phones so the long
            UUIDs wrap cleanly; ≥640px keeps the original two-column rows. */}
        <div className="grid gap-2 rounded-2xl border border-ink/10 bg-slate-50 px-4 py-3 text-xs font-mono sm:gap-1">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <span className="text-muted-slate sm:w-28">BitLink ID</span>
            <span className="break-all text-ink sm:break-normal">{line.id}</span>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <span className="text-muted-slate sm:w-28">Provider line</span>
            <span className="break-all text-ink sm:break-normal">{providerLineId ?? "Not yet assigned"}</span>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <span className="text-muted-slate sm:w-28">Plan</span>
            <span className="break-all text-ink sm:break-normal">{String(metadata.plan_slug ?? "—")}</span>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
            <span className="text-muted-slate sm:w-28">Created</span>
            <span className="break-all text-ink sm:break-normal">{formatDateTime(line.created_at)}</span>
          </div>
        </div>
      </section>

      {!providerLineId && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>This line has not been assigned a provider line ID yet — provisioning may still be in progress.</span>
        </div>
      )}

      {/* Main grid */}
      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1fr_380px]">
        {/* Left column — live Annatel data + DB cards, streamed so the shell
            (header + actions) paints instantly. */}
        <Suspense fallback={<LiveLineDataSkeleton />}>
          <LiveLineData
            lineId={line.id}
            providerLineId={providerLineId}
            lineStatus={line.status}
            isKosher={Boolean(line.is_kosher)}
            isEsim={isEsim}
            planSlug={(metadata.plan_slug as string | undefined) ?? null}
            metadata={metadata}
          />
        </Suspense>

        {/* Right column — actions. On phones this floats ABOVE the streamed
            data (order-first) so the buttons you troubleshoot with are reached
            first; ≥640px keeps the original document order. */}
        <div className="grid content-start gap-4 order-first sm:order-0 sm:gap-6">
          {latestJob && (
            <section className="rounded-2xl border border-ink/10 bg-white p-4 shadow-soft sm:rounded-4xl sm:p-5">
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
            const metaIsEsim = meta.is_esim === true || meta.is_esim === "1" || meta.is_esim === 1;
            const installedAt = meta.esim_activated_at as string | undefined;
            if (!metaIsEsim || !pendingActivationCode || installedAt || !providerLineId) return null;
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

          {(() => {
            const meta = (line.metadata ?? {}) as Record<string, unknown>;
            const metaIsEsim = meta.is_esim === true || meta.is_esim === "1" || meta.is_esim === 1;
            // Shown for every eSIM line regardless of install state — recovery
            // (lost QR, or reissue a used/failed eSIM) can be needed after
            // activation too, when the EsimActivationCard above is hidden.
            if (!metaIsEsim || !providerLineId) return null;
            return <EsimResendCard lineId={line.id} providerLineId={providerLineId} />;
          })()}

          {!isEsim && providerLineId && (
            <AssignPhysicalSimCard
              lineId={line.id}
              providerLineId={providerLineId}
              currentIccId={metadata.sim_icc_id as string | undefined}
            />
          )}

          {providerLineId && (
            <LineActionsPanel
              lineId={line.id}
              providerLineId={providerLineId}
              currentStatus={line.status}
            />
          )}
        </div>
      </div>
    </div>
  );
}
