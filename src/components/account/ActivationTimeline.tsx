import { provisioningLabels, provisioningStatuses } from "@/lib/status";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function ActivationTimeline({
  currentStatus,
  events,
}: {
  currentStatus?: string | null;
  events: Array<{ id: string; status: string; note: string | null; created_at: string }>;
}) {
  const currentIndex = provisioningStatuses.findIndex((status) => status === currentStatus);

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
      <p className="text-sm font-semibold text-link-blue">Activation</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">Your connection setup.</h1>

      <div className="mt-8 grid gap-3">
        {provisioningStatuses.map((status, index) => {
          const done = currentIndex >= index;
          return (
            <div key={status} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className={done ? "h-4 w-4 rounded-full bg-trust-green" : "h-4 w-4 rounded-full bg-slate-200"} />
                {index < provisioningStatuses.length - 1 ? <span className="h-8 w-px bg-slate-200" /> : null}
              </div>
              <div className="pb-4">
                <p className="text-sm font-semibold text-ink">{provisioningLabels[status]}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-ink">Recent events</h2>
        <div className="mt-4 grid gap-3">
          {events.length ? (
            events.map((event) => (
              <div key={event.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge status={event.status} />
                  <span className="text-xs text-muted-slate">{new Date(event.created_at).toLocaleString()}</span>
                </div>
                {event.note ? <p className="mt-2 text-sm leading-6 text-muted-slate">{event.note}</p> : null}
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-muted-slate">No activation events yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
