"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import type { WebhookConversation } from "@/types/telecom";

// Delivery log for one webhook endpoint — collapsed by default, fetched on
// first expand. Cheap diagnostic value: several bugs this session would have
// been faster to spot with visibility into what Annatel actually sent us.
export function WebhookConversationsPanel({ endpointId }: { endpointId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<WebhookConversation[] | null>(null);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && conversations === null) {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/webhooks/${endpointId}/conversations`);
        const payload = (await res.json()) as { conversations?: WebhookConversation[] };
        setConversations(payload.conversations ?? []);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1 text-xs font-semibold text-link-blue hover:text-ink"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        View recent deliveries
      </button>

      {open && (
        <div className="mt-2 grid gap-2">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-slate">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </div>
          ) : conversations && conversations.length ? (
            conversations.map((c) => (
              <details key={c.id} className="rounded-xl bg-slate-50 p-3 text-xs">
                <summary className="flex cursor-pointer items-center gap-2 font-semibold text-ink">
                  {c.httpStatus >= 200 && c.httpStatus < 300 ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  )}
                  <span>{c.httpStatus || "no response"} · {c.requestedAt.toLocaleString()}</span>
                </summary>
                {c.clientErrorMessage ? (
                  <p className="mt-2 text-rose-700">{c.clientErrorMessage}</p>
                ) : null}
                {c.requestBody ? (
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-white p-2 font-mono text-[0.65rem] text-slate-600">
                    {c.requestBody}
                  </pre>
                ) : null}
              </details>
            ))
          ) : (
            <p className="text-xs text-muted-slate">No deliveries recorded yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
