"use client";

import { requestAccountDeletionAction } from "@/lib/auth/actions";

export function DeleteAccountButton() {
  return (
    <form
      action={requestAccountDeletionAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Request account deletion? This signs you out and asks BitLink to process closing your account. Active lines or unpaid balances need to be resolved first — we'll follow up by email.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
      >
        Delete my account
      </button>
    </form>
  );
}
