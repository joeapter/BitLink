"use client";

import { useMacroAction } from "@/lib/admin/support-actions";

interface Macro {
  id: string;
  title: string;
  body: string;
  category?: string | null;
  usage_count?: number;
}

export function MacroCard({ macro, ticketId }: { macro: Macro; ticketId: string }) {
  function copyToClipboard() {
    navigator.clipboard?.writeText(macro.body).catch(() => {});
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-ink">{macro.title}</p>
        <form
          action={useMacroAction}
          onSubmit={copyToClipboard}
        >
          <input type="hidden" name="macroId" value={macro.id} />
          <input type="hidden" name="ticketId" value={ticketId} />
          <button
            type="submit"
            className="rounded-lg bg-link-blue px-2 py-1 text-[0.6rem] font-bold text-white hover:bg-link-blue/80"
          >
            Copy
          </button>
        </form>
      </div>
      <p className="mt-1.5 text-xs leading-5 text-muted-slate line-clamp-3">{macro.body}</p>
    </div>
  );
}
