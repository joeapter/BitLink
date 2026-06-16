import type { Metadata } from "next";
import { CheckCircle2, Clock, Mail, Smartphone } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Payment confirmed — BitLink" };
export const dynamic = "force-dynamic";

async function getLoggedInEmail(): Promise<string | null> {
  if (!hasSupabasePublicEnv()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export default async function CheckoutSuccessPage() {
  const email = await getLoggedInEmail();

  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-2xl">

        {/* Hero */}
        <div className="rounded-[2rem] border border-ink/10 bg-slate-50 p-8 text-center shadow-soft">
          <CheckCircle2 className="mx-auto h-14 w-14 text-trust-green" aria-hidden="true" />
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-ink">Payment received!</h1>
          <p className="mt-3 text-muted-slate">
            {email ? (
              <>We&apos;re activating your line now. Check <strong>{email}</strong> for your account credentials.</>
            ) : (
              <>We&apos;re activating your line now. Check your email — you&apos;ll receive login credentials and your eSIM code within a few minutes.</>
            )}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/account">Open account portal</ButtonLink>
            <ButtonLink href="/support" variant="secondary">Contact support</ButtonLink>
          </div>
        </div>

        {/* Steps */}
        <h2 className="mt-10 text-center text-xs font-semibold uppercase tracking-widest text-muted-slate">
          What happens next
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Mail,       n: "1", title: "Check your email",   body: "Login credentials are on their way. Use them to access your account portal." },
            { icon: Clock,      n: "2", title: "Line activates",     body: "Your Israeli number is provisioning now — usually under 5 minutes." },
            { icon: Smartphone, n: "3", title: "Install your eSIM",  body: "Your QR code appears in your account portal the moment the line is live. We'll email it too." },
          ].map(({ icon: Icon, n, title, body }) => (
            <div key={n} className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-link-blue/10 text-sm font-bold text-link-blue">{n}</span>
                <Icon className="h-4 w-4 text-muted-slate" aria-hidden="true" />
              </div>
              <p className="mt-3 font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-slate">{body}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-slate">
          Watch your line status live in{" "}
          <a href="/account/lines" className="font-semibold text-link-blue hover:underline">
            account → Lines
          </a>.
          Your eSIM QR appears there the moment activation completes.
        </p>
      </div>
    </section>
  );
}
