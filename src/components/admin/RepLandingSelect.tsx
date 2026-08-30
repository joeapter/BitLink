"use client";

import { useState, useTransition } from "react";
import { setRepLandingAction } from "@/lib/admin/rep-actions";
import { REP_LANDINGS, type RepLanding } from "@/lib/rep-links";

// Saves on change, with no separate confirm button.
//
// The previous version was an uncontrolled <select defaultValue> next to an
// "Update" button. defaultValue only applies at mount, so once the server
// re-rendered after a save React reset the visible selection — the change had
// been written, but the control snapped back to the old option and looked like
// it had failed. Holding the value in state and writing on change removes both
// the stale display and the question of whether the button was pressed.
//
// The parent passes key={landing}, so when the server value really does change
// this remounts with the new value as its initial state — no effect syncing
// props into state.
export function RepLandingSelect({ repId, landing }: { repId: string; landing: RepLanding }) {
  const [value, setValue] = useState<RepLanding>(landing);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-slate">Opens</span>
      <select
        aria-label="Where this Rep's link opens"
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as RepLanding;
          const previous = value;
          setValue(next);
          setError(null);
          const payload = new FormData();
          payload.set("repId", repId);
          payload.set("landing", next);
          startTransition(async () => {
            try {
              await setRepLandingAction(payload);
            } catch {
              // Put the control back where it was — showing the new option
              // after a failed write is the bug this component exists to fix.
              setValue(previous);
              setError("Didn't save — try again.");
            }
          });
        }}
        className="h-8 rounded-full border border-ink/15 bg-white px-3 text-xs font-semibold text-ink outline-none focus:border-link-blue disabled:opacity-60"
      >
        {REP_LANDINGS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {pending ? <span className="text-xs text-muted-slate">Saving…</span> : null}
      {error ? <span className="text-xs font-semibold text-rose-700">{error}</span> : null}
    </span>
  );
}
