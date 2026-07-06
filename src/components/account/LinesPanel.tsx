import type { ReactNode } from "react";
import { Phone, Wifi } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMoney } from "@/lib/utils";
import type { AccountLineBilling } from "@/lib/db/account";

type LineRow = {
  id: string;
  external_id: string;
  status: string;
  provider_line_id: string | null;
  is_kosher: boolean;
  language: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

function lineStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "Pending",
    PROVISIONING: "Setting up",
    ACTIVE: "Active",
    SUSPENDED: "Suspended",
    PAUSED: "Paused",
    PORTING: "Porting",
    TERMINATED: "Terminated",
    FAILED: "Failed",
  };
  return labels[status.toUpperCase()] ?? status;
}

export function LinesPanel({
  lines,
  lineBillings = [],
  children,
}: {
  lines: LineRow[];
  lineBillings?: AccountLineBilling[];
  children?: ReactNode;
}) {
  const childrenArray = Array.isArray(children) ? children : children ? [children] : [];
  const billingByLineId = new Map(lineBillings.map((billing) => [billing.lineId, billing]));
  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-ink text-white">
            <Phone className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-link-blue">Lines</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Your Israeli numbers.</h1>
          </div>
        </div>
        <ButtonLink href="/account/add-line" size="sm">
          Add line
        </ButtonLink>
      </div>

      <div className="mt-8">
        {lines.length ? (
          <div className="grid gap-4">
            {lines.map((line, i) => (
              <div
                key={line.id}
                className="rounded-[1.5rem] border border-ink/10 bg-slate-50 p-5"
              >
                {(() => {
                  const billing = billingByLineId.get(line.id);
                  return billing ? (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink">
                        {billing.planName}
                      </span>
                      <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink">
                        {formatMoney(billing.priceCents, billing.currency)}/mo
                      </span>
                      {billing.nextBillingDate ? (
                        <span className="text-xs text-muted-slate">
                          Renews {new Date(billing.nextBillingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      ) : null}
                    </div>
                  ) : null;
                })()}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-muted-slate" aria-hidden="true" />
                      <span className="text-lg font-semibold tracking-wide text-ink">
                        {(line.metadata?.phone_number as string | undefined) ?? "Number pending assignment"}
                      </span>
                      {line.is_kosher ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          Kosher
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-slate">
                      Added {new Date(line.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <StatusBadge status={line.status} label={lineStatusLabel(line.status)} />
                </div>
                {childrenArray[i] ?? null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No lines yet">
            <p>Your Israeli line will appear here once your order is activated.</p>
            <div className="mt-4">
              <ButtonLink href="/account/add-line" size="sm">
                Add your first line
              </ButtonLink>
            </div>
          </EmptyState>
        )}
      </div>
    </section>
  );
}
