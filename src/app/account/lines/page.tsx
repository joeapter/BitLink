import type { Metadata } from "next";
import { Suspense } from "react";
import { LinesPanel } from "@/components/account/LinesPanel";
import { LineUsageMeter } from "@/components/account/LineUsageMeter";
import { EsimQrCard } from "@/components/account/EsimQrCard";
import { PauseLineCard } from "@/components/account/PauseLineCard";
import { PlanChangeCard } from "@/components/account/PlanChangeCard";
import { AddIntlNumberCard } from "@/components/account/AddIntlNumberCard";
import { TopupCard } from "@/components/account/TopupCard";
import { requireUser } from "@/lib/auth/server";
import { getAccountSnapshot } from "@/lib/db/account";

export const metadata: Metadata = { title: "Lines" };
export const dynamic = "force-dynamic";

export default async function AccountLinesPage() {
  const user = await requireUser();
  const snapshot = await getAccountSnapshot(user.id, user.email);

  return (
    <LinesPanel lines={snapshot.lines} lineBillings={snapshot.lineBillings}>
      {snapshot.lines.map((line) => {
        const meta = (line.metadata ?? {}) as Record<string, unknown>;
        const activationCode = meta.esim_activation_code as string | undefined;
        const billing = snapshot.lineBillings.find((item) => item.lineId === line.id);
        const currentPlanSlug = billing?.planSlug ?? ((meta.plan_slug as string | undefined) || null);
        // Hide QR once the SIM has first registered on the network
        const isActivated = !!(meta.esim_activated_at as string | undefined);
        const showQr = activationCode && !isActivated;

        return (
          <div key={line.id}>
            {/* eSIM QR — shown until first network registration */}
            {showQr && (
              <EsimQrCard activationCode={activationCode} />
            )}
            {/* Usage meters — only for active provisioned lines */}
            {line.status === "active" && line.provider_line_id && (
              <Suspense fallback={<div className="mt-3 h-14 animate-pulse rounded-xl bg-slate-100" />}>
                <LineUsageMeter providerLineId={line.provider_line_id} />
              </Suspense>
            )}
            <PlanChangeCard
              lineId={line.id}
              status={line.status}
              currentPlanSlug={currentPlanSlug}
              isKosher={line.is_kosher}
            />
            {/* Pause My Plan — $10/mo freeze that holds the number and SIM */}
            <PauseLineCard
              lineId={line.id}
              status={line.status}
              pausedAt={(meta.paused_at as string | undefined) ?? null}
            />
            {/* US/CA/UK number add-on for an already-active line */}
            <AddIntlNumberCard
              lineId={line.id}
              status={line.status}
              existingNumber={
                (meta.intl_number as { number?: string; status?: string } | undefined)?.status === "assigned" ||
                (meta.intl_number as { number?: string; status?: string } | undefined)?.status === "reserved"
                  ? ((meta.intl_number as { number?: string }).number ?? null)
                  : null
              }
            />
            {/* One-time data/minute topups, charged immediately */}
            <TopupCard lineId={line.id} status={line.status} isKosher={line.is_kosher} />
          </div>
        );
      })}
    </LinesPanel>
  );
}
