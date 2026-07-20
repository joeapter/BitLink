"use client";

import { useEffect, useState, useTransition } from "react";
import { Voicemail, MessageSquareShare, ShieldAlert, Plus, Trash2, Loader2 } from "lucide-react";
import type { LineDidVoicemail, LineDidSmsForwarderSetting, AflaloRequest } from "@/types/telecom";
import {
  createVoicemailAction,
  deleteVoicemailAction,
  addSmsForwarderAction,
  removeSmsForwarderAction,
  createAflaloRequestAction,
} from "@/lib/admin/line-actions";

interface Props {
  lineId: string;
  providerLineId: string;
  dids: Array<{ id: string; number: string }>;
}

type ExtrasData = {
  voicemails: LineDidVoicemail[];
  smsForwarders: LineDidSmsForwarderSetting[];
  aflaloRequests: AflaloRequest[];
};

// Everything scoped to ONE number on the line — voicemail, backup SMS
// forwarding, and aflalo history — loaded on demand per selected number
// rather than upfront for every DID. Whether BitLink lines have a
// voicemail box by default, what valid destination groups exist, and what
// "aflalo open/block" actually does are all unconfirmed — this exposes the
// capability for testing, not a finished customer-facing feature.
export function LineNumberExtrasCard({ lineId, providerLineId, dids }: Props) {
  const [selectedId, setSelectedId] = useState(dids[0]?.id ?? "");
  const [data, setData] = useState<ExtrasData | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const selected = dids.find((d) => d.id === selectedId);

  async function refetch() {
    if (!selected) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        providerLineId,
        lineDidId: selected.id,
        number: selected.number,
      });
      const res = await fetch(`/api/admin/lines/${lineId}/number-extras?${params}`);
      const payload = (await res.json()) as ExtrasData & { error?: string };
      if (res.ok) setData(payload);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetch-on-mount-and-on-selection-change; same pattern as IntlNumberPicker.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function run(action: (fd: FormData) => Promise<{ success?: boolean; error?: string }>, fd: FormData) {
    startTransition(async () => {
      const result = await action(fd);
      if (result.error) setNotice(result.error);
      else {
        setNotice(null);
        await refetch();
      }
    });
  }

  if (!dids.length) return null;

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <Voicemail className="h-4 w-4 text-link-blue" />
        Voicemail, SMS backup &amp; aflalo (per number)
      </h2>
      <p className="mt-1 text-xs text-muted-slate">
        Experimental — recently confirmed against Annatel&apos;s real API. Whether lines have voicemail by
        default, and what aflalo &quot;open/block&quot; actually does, are both unconfirmed.
      </p>

      <label className="mt-4 grid gap-1.5 text-xs font-semibold text-ink">
        <span>Number</span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="h-10 w-full max-w-xs rounded-xl border border-ink/10 bg-white px-3 text-sm font-mono text-ink outline-none focus:border-link-blue"
        >
          {dids.map((d) => (
            <option key={d.id} value={d.id}>{d.number}</option>
          ))}
        </select>
      </label>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-slate">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : data ? (
        <div className="mt-5 grid gap-6">
          {/* Voicemail */}
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Voicemail className="h-3.5 w-3.5 text-muted-slate" /> Voicemail
            </p>
            {data.voicemails.length ? (
              <div className="mt-2 grid gap-2">
                {data.voicemails.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                    <div>
                      <p className="font-semibold text-ink">{v.fullname || "(no name)"}</p>
                      <p className="text-xs text-muted-slate">{v.email || "no email"} · {v.language ?? "—"} · {v.timezone ?? "—"}</p>
                    </div>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("lineId", lineId);
                        fd.set("providerLineId", providerLineId);
                        fd.set("lineDidId", selected!.id);
                        fd.set("voicemailId", v.id);
                        run(deleteVoicemailAction, fd);
                      }}
                      className="rounded-xl p-2 text-red-500 hover:bg-red-50 disabled:opacity-40"
                      title="Delete voicemail box"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  fd.set("lineId", lineId);
                  fd.set("providerLineId", providerLineId);
                  fd.set("lineDidId", selected!.id);
                  run(createVoicemailAction, fd);
                  e.currentTarget.reset();
                }}
                className="mt-2 grid gap-2 sm:grid-cols-2"
              >
                <input name="fullname" placeholder="Name on mailbox" className="h-9 rounded-lg border border-ink/10 px-3 text-xs" />
                <input name="email" type="email" placeholder="Notify email (optional)" className="h-9 rounded-lg border border-ink/10 px-3 text-xs" />
                <input name="language" placeholder="Language (e.g. he, en)" className="h-9 rounded-lg border border-ink/10 px-3 text-xs" />
                <input name="timezone" placeholder="Timezone (e.g. israel)" className="h-9 rounded-lg border border-ink/10 px-3 text-xs" />
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-9 w-fit items-center gap-1.5 rounded-lg bg-ink px-3 text-xs font-semibold text-white disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" /> Create voicemail box
                </button>
              </form>
            )}
          </div>

          {/* SMS forwarding */}
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <MessageSquareShare className="h-3.5 w-3.5 text-muted-slate" /> SMS backup forwarding
            </p>
            <p className="text-xs text-muted-slate">Optional copy of incoming SMS — device delivery already works without this.</p>
            <div className="mt-2 grid gap-2">
              {data.smsForwarders.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="text-ink">{s.emailRecipientAddress || s.telegramChatId || "(configured)"}</p>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      const fd = new FormData();
                      fd.set("lineId", lineId);
                      fd.set("providerLineId", providerLineId);
                      fd.set("lineDidId", selected!.id);
                      fd.set("settingId", s.id);
                      run(removeSmsForwarderAction, fd);
                    }}
                    className="rounded-xl p-2 text-red-500 hover:bg-red-50 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("lineId", lineId);
                fd.set("providerLineId", providerLineId);
                fd.set("lineDidId", selected!.id);
                run(addSmsForwarderAction, fd);
                e.currentTarget.reset();
              }}
              className="mt-2 flex flex-wrap gap-2"
            >
              <input name="emailRecipientAddress" type="email" required placeholder="Forward to email" className="h-9 flex-1 min-w-[10rem] rounded-lg border border-ink/10 px-3 text-xs" />
              <input name="telegramChatId" placeholder="Telegram chat id (optional)" className="h-9 flex-1 min-w-[10rem] rounded-lg border border-ink/10 px-3 text-xs" />
              <button type="submit" disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3 text-xs font-semibold text-white disabled:opacity-40">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </form>
          </div>

          {/* Aflalo */}
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-700">
              <ShieldAlert className="h-3.5 w-3.5" /> Aflalo (telemarketing consent — uncertain effect)
            </p>
            <p className="text-xs text-amber-700/80">
              Near-certainly related to Israel&apos;s telemarketing-consent law. We do NOT know exactly what
              &quot;open&quot;/&quot;block&quot; does to a live number — confirm with Annatel before using this on a real
              customer.
            </p>
            <div className="mt-2 grid gap-1">
              {data.aflaloRequests.length ? (
                data.aflaloRequests.map((a) => (
                  <p key={a.id} className="text-xs text-muted-slate">
                    {a.operation} — {a.doneAt ? a.doneAt.toLocaleString() : "pending"}
                  </p>
                ))
              ) : (
                <p className="text-xs text-muted-slate">No aflalo history for this number.</p>
              )}
            </div>
            <div className="mt-2 flex gap-2">
              {(["open", "block"] as const).map((op) => (
                <button
                  key={op}
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (
                      !window.confirm(
                        `This calls Annatel's aflalo API with operation "${op}" on ${selected!.number}. We do NOT fully understand what this does — confirm with Annatel first. Proceed anyway?`,
                      )
                    ) {
                      return;
                    }
                    const fd = new FormData();
                    fd.set("lineId", lineId);
                    fd.set("number", selected!.number);
                    fd.set("operation", op);
                    run(createAflaloRequestAction, fd);
                  }}
                  className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-40"
                >
                  {op === "open" ? "Send “open”" : "Send “block”"}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {notice ? <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{notice}</p> : null}
    </section>
  );
}
