"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createRepAction, type RepActionState } from "@/lib/admin/rep-actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { REP_LANDINGS } from "@/lib/rep-links";

// A client component purely so the result of the save can be shown. The form
// used to post straight to a server action that discarded its own errors, so a
// rejected insert and a successful one looked identical on screen.
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Create Rep"}
    </Button>
  );
}

export function RepCreateForm() {
  const [state, action] = useActionState<RepActionState, FormData>(createRepAction, null);

  return (
    <>
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input name="name" label="Name" placeholder="Racheli" required />
        <Input name="code" label="Code" placeholder="RACHELI" required />
        <Input name="email" label="Email (for conversion alerts)" type="email" placeholder="racheli@gmail.com" />
        <Input name="contact" label="Contact" placeholder="@racheli / whatsapp" />
        <Select name="landing" label="Their link opens" defaultValue="trial">
          {REP_LANDINGS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </Select>
        <Input name="rateBasic" label="Basic pays ($)" placeholder="5" defaultValue="5" />
        <Input name="ratePremium" label="Student / Max pays ($)" placeholder="10" defaultValue="10" />
        <div className="flex items-end">
          <SubmitButton />
        </div>
      </form>

      {state?.error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="mt-3 text-xs font-semibold text-emerald-700">{state.success}</p>
      ) : null}
    </>
  );
}
