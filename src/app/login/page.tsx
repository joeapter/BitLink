import type { Metadata } from "next";
import Link from "next/link";
import { loginAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="liquid-bg bg-slate-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="relative z-10 mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-liquid md:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-ink p-8 text-white sm:p-10">
          <p className="text-sm font-semibold text-soft-cyan">BitLink account</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">Welcome back.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-200">
            View your plan, subscription status, activation progress, referrals, and support from one place.
          </p>
        </div>

        <form action={loginAction} className="p-8 sm:p-10">
          <input type="hidden" name="next" value={params.next ?? "/account"} />
          <h2 className="text-2xl font-semibold text-ink">Sign in</h2>
          <div className="mt-6 grid gap-4">
            <Input label="Email" name="email" type="email" autoComplete="email" required />
            <Input label="Password" name="password" type="password" autoComplete="current-password" required />
          </div>

          {params.error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {params.error}
            </div>
          ) : null}
          {params.message ? (
            <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm font-medium text-sky-700">
              {params.message}
            </div>
          ) : null}

          <Button type="submit" size="lg" className="mt-6 w-full">
            Sign in
          </Button>
          <p className="mt-5 text-center text-sm text-muted-slate">
            New to BitLink?{" "}
            <Link href="/signup" className="font-semibold text-ink">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
