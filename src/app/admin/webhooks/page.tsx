import type { Metadata } from "next";
import { getTelecomProvider } from "@/lib/telecom/provider.registry";
import { createWebhookEndpointAction, deleteWebhookEndpointAction } from "@/lib/admin/line-actions";
import { Plus, Trash2, Webhook, CheckCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Webhooks" };
export const dynamic = "force-dynamic";

const KNOWN_PATTERNS = [
  "did.+.registered",
  "did.+.unregistered",
  "number.+.show_me_white_paw.created",
  "number.+.show_me_white_paw.completed",
  "sim.+.hss.added",
  "sim.+.hss.first_registered",
  "bulk_request.+.done",
  "bulk_request.+.failed",
  "line.+.suspended",
  "line.+.terminated",
];

export default async function AdminWebhooksPage() {
  const provider = getTelecomProvider();

  let endpoints: Awaited<ReturnType<typeof provider.listWebhookEndpoints>> = [];
  let fetchError: string | null = null;
  try {
    endpoints = await provider.listWebhookEndpoints();
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load webhook endpoints";
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Webhooks</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Annatel webhook endpoints</h1>
        <p className="mt-2 text-sm text-muted-slate">
          These endpoints receive real-time events from Annatel — SIM registration, bulk request status, line changes, etc.
          BitLink&apos;s webhook receiver is at <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">/api/webhooks/annatel</code>.
        </p>
      </section>

      {fetchError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {/* Existing endpoints */}
      <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
        <div className="border-b border-ink/8 px-6 py-4">
          <h2 className="flex items-center gap-2 font-semibold text-ink">
            <Webhook className="h-4 w-4 text-link-blue" />
            Registered endpoints
          </h2>
        </div>
        {endpoints.length ? (
          <ul className="divide-y divide-ink/8">
            {endpoints.map((ep) => (
              <li key={ep.id} className="flex items-start justify-between gap-4 px-6 py-5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {ep.isEnabled ? (
                      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                    )}
                    <span className="truncate font-mono text-sm text-ink">{ep.url}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {ep.enabledNotificationPatterns.map((p) => (
                      <span key={p} className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[0.6rem] text-slate-600">
                        {p}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-slate">Created {formatDate(ep.createdAt)}</p>
                </div>
                <form action={deleteWebhookEndpointAction}>
                  <input type="hidden" name="id" value={ep.id} />
                  <button
                    type="submit"
                    className="rounded-xl p-2 text-red-500 hover:bg-red-50"
                    title="Delete endpoint"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-muted-slate">
            No webhook endpoints registered yet.
          </div>
        )}
      </section>

      {/* Add new endpoint */}
      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <Plus className="h-4 w-4 text-link-blue" />
          Register new endpoint
        </h2>

        <form action={createWebhookEndpointAction} className="mt-5 grid gap-4">
          <div>
            <label className="block text-sm font-semibold text-ink">Endpoint URL</label>
            <input
              name="url"
              type="url"
              placeholder="https://bitlink.co.il/api/webhooks/annatel"
              required
              className="mt-2 w-full rounded-xl border border-ink/10 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-link-blue focus:ring-2 focus:ring-link-blue/15"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink">
              Event patterns <span className="font-normal text-muted-slate">(one per line)</span>
            </label>
            <textarea
              name="patterns"
              rows={6}
              defaultValue={KNOWN_PATTERNS.join('\n')}
              className="mt-2 w-full rounded-xl border border-ink/10 bg-slate-50 px-3 py-2.5 font-mono text-xs outline-none focus:border-link-blue focus:ring-2 focus:ring-link-blue/15"
            />
          </div>

          <button
            type="submit"
            className="w-fit rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink/80"
          >
            Register endpoint
          </button>
        </form>
      </section>
    </div>
  );
}
