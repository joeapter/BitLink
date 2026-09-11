import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/server";
import { getAccountSnapshot } from "@/lib/db/account";
import { logoutAction, requestPasswordResetAction } from "@/lib/auth/actions";
import { DeleteAccountButton } from "@/components/account/DeleteAccountButton";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function AccountSettingsPage() {
  const user = await requireUser();
  const snapshot = await getAccountSnapshot(user.id, user.email);
  const email = snapshot.customer?.email ?? user.email ?? "";
  const fullName = snapshot.customer?.full_name ?? "";

  return (
    <div className="grid gap-6">
      <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        <h1 className="text-lg font-semibold text-ink">Profile</h1>
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex items-center justify-between border-b border-ink/8 pb-3">
            <dt className="text-muted-slate">Name</dt>
            <dd className="font-medium text-ink">{fullName || "—"}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-slate">Email</dt>
            <dd className="font-medium text-ink">{email || "—"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-slate">
          To change your name or email, contact support@bitlink.co.il.
        </p>
      </div>

      <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Password</h2>
        <p className="mt-2 text-sm text-muted-slate">
          We&apos;ll email you a link to set a new password.
        </p>
        <form action={requestPasswordResetAction} className="mt-4">
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            Send password reset email
          </button>
        </form>
      </div>

      <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Sign out</h2>
        <p className="mt-2 text-sm text-muted-slate">Sign out of BitLink on this device.</p>
        <form action={logoutAction} className="mt-4">
          <button
            type="submit"
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="rounded-[2rem] border border-red-100 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Delete account</h2>
        <p className="mt-2 text-sm text-muted-slate">
          Submit a request to close your BitLink account. If you have active lines or an open
          balance, we&apos;ll follow up before anything is finalized.
        </p>
        <div className="mt-4">
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}
