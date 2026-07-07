import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata("Forgot password");

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="liquid-bg bg-slate-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="relative z-10 mx-auto max-w-md rounded-4xl border border-ink/10 bg-white p-8 shadow-liquid sm:p-10">
        <h1 className="text-3xl font-semibold tracking-normal text-ink">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-muted-slate">
          Enter the email on your BitLink account and we&apos;ll send you a link to set a new password.
        </p>

        <form action={requestPasswordResetAction} className="mt-6 grid gap-4">
          <Input label="Email" name="email" type="email" autoComplete="email" required />

          {params.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {params.error}
            </div>
          ) : null}

          <Button type="submit" size="lg" className="w-full">
            Send reset link
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-slate">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-ink">
            Back to sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
