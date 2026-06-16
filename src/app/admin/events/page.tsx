import type { Metadata } from "next";
import { getTelecomProvider } from "@/lib/telecom/provider.registry";
import { Activity } from "lucide-react";

export const metadata: Metadata = { title: "Admin Events" };
export const dynamic = "force-dynamic";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; resource?: string }>;
}) {
  const { type, resource } = await searchParams;
  const provider = getTelecomProvider();

  let events: Awaited<ReturnType<typeof provider.listEvents>> = [];
  let fetchError: string | null = null;

  try {
    events = await provider.listEvents({
      type: type || undefined,
      resourceId: resource || undefined,
      limit: 100,
    });
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load events";
  }

  const EVENT_COLORS: Record<string, string> = {
    "sim": "text-blue-700 bg-blue-50",
    "did": "text-purple-700 bg-purple-50",
    "bulk_request": "text-amber-700 bg-amber-50",
    "line": "text-emerald-700 bg-emerald-50",
    "number": "text-link-blue bg-blue-50",
  };

  function colorForType(type: string): string {
    for (const [prefix, cls] of Object.entries(EVENT_COLORS)) {
      if (type.startsWith(prefix)) return cls;
    }
    return "text-slate-600 bg-slate-100";
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Events</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Annatel event log</h1>
        <p className="mt-2 text-sm text-muted-slate">
          Real-time event stream from Annatel. Showing last 100 events.
        </p>
      </section>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <input
          name="type"
          defaultValue={type ?? ""}
          placeholder="Filter by type (e.g. sim.+.hss)"
          className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-link-blue w-64"
        />
        <input
          name="resource"
          defaultValue={resource ?? ""}
          placeholder="Filter by resource ID"
          className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-link-blue w-64"
        />
        <button
          type="submit"
          className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/80"
        >
          Filter
        </button>
        {(type || resource) && (
          <a href="/admin/events" className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Clear
          </a>
        )}
      </form>

      {fetchError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
        {events.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-muted-slate">
                <tr>
                  <th className="px-5 py-4 font-semibold">Type</th>
                  <th className="px-5 py-4 font-semibold">Ref</th>
                  <th className="px-5 py-4 font-semibold">Resource</th>
                  <th className="px-5 py-4 font-semibold">When</th>
                  <th className="px-5 py-4 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${colorForType(ev.type)}`}>
                        {ev.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{ev.ref}</td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-muted-slate">{ev.resourceObject}</div>
                      <div className="font-mono text-xs text-ink">{ev.resourceId.slice(0, 12)}…</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-slate whitespace-nowrap">
                      {ev.occurredAt.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <details>
                        <summary className="cursor-pointer text-xs text-link-blue hover:underline">
                          View
                        </summary>
                        <pre className="mt-2 max-w-sm overflow-auto rounded-lg bg-slate-100 p-2 text-[0.6rem] text-slate-700">
                          {JSON.stringify(ev.data, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Activity className="mx-auto h-8 w-8 text-muted-slate" />
            <p className="mt-3 text-sm text-muted-slate">No events found.</p>
          </div>
        )}
      </section>
    </div>
  );
}
