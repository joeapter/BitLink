import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { updatePasswordAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/server";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata("Set a new password");

// Reached from the password-recovery email link, which signs the user in via
// /auth/callback before landing here.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/forgot-password?error=Your%20reset%20link%20has%20expired%20—%20request%20a%20new%20one.");
  }

  return (
    <section className="liquid-bg bg-slate-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="relative z-10 mx-auto max-w-md rounded-4xl border border-ink/10 bg-white p-8 shadow-liquid sm:p-10">
        <h1 className="text-3xl font-semibold tracking-normal text-ink">Set a new password</h1>
        <p className="mt-3 text-sm leading-6 text-muted-slate">
          Signed in as <span className="font-semibold text-ink">{user.email}</span>. Choose a new password below.
        </p>

        <form action={updatePasswordAction} className="mt-6 grid gap-4">
          <Input label="New password" name="password" type="password" autoComplete="new-password" required />
          <Input label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required />

          {params.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {params.error}
            </div>
          ) : null}

          <Button type="submit" size="lg" className="w-full">
            Update password
          </Button>
        </form>
      </div>
    </section>
  );
}
