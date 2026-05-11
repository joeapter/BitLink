import type { Metadata } from "next";
import Link from "next/link";
import { signupAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; referral?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="liquid-bg bg-slate-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="relative z-10 mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-liquid md:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-ink p-8 text-white sm:p-10">
          <p className="text-sm font-semibold text-soft-cyan">Your connection, simplified.</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">Create your BitLink account.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-200">
            Simple monthly plans. Human support. Smooth activation.
          </p>
        </div>

        <form action={signupAction} className="p-8 sm:p-10">
          <h2 className="text-2xl font-semibold text-ink">Sign up</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input label="Full name" name="fullName" autoComplete="name" required />
            <Input label="Phone" name="phone" type="tel" autoComplete="tel" required />
            <Input label="Email" name="email" type="email" autoComplete="email" required className="sm:col-span-2" />
            <Input label="Password" name="password" type="password" autoComplete="new-password" required className="sm:col-span-2" />
            <Input label="Referral code" name="referralCode" defaultValue={params.referral ?? ""} placeholder="Optional" className="sm:col-span-2" />
          </div>

          {params.error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {params.error}
            </div>
          ) : null}

          <Button type="submit" size="lg" className="mt-6 w-full">
            Create account
          </Button>
          <p className="mt-5 text-center text-sm text-muted-slate">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-ink">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
