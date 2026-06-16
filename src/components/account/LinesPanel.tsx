import type { ReactNode } from "react";
import { Phone, Wifi } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

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
    PORTING: "Porting",
    TERMINATED: "Terminated",
    FAILED: "Failed",
  };
  return labels[status.toUpperCase()] ?? status;
}

export function LinesPanel({ lines, children }: { lines: LineRow[]; children?: ReactNode }) {
  const childrenArray = Array.isArray(children) ? children : children ? [children] : [];
  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-ink text-white">
          <Phone className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-link-blue">Lines</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Your Israeli numbers.</h1>
        </div>
      </div>

      <div className="mt-8">
        {lines.length ? (
          <div className="grid gap-4">
            {lines.map((line, i) => (
              <div
                key={line.id}
                className="rounded-[1.5rem] border border-ink/10 bg-slate-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-muted-slate" aria-hidden="true" />
                      <span className="text-lg font-semibold tracking-wide text-ink">
                        {line.provider_line_id ?? "Number pending assignment"}
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
            Your Israeli line will appear here once your order is activated. This usually takes 1–2 business days after payment.
          </EmptyState>
        )}
      </div>
    </section>
  );
}
