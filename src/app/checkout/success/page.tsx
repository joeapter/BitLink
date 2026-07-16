import type { Metadata } from "next";
import { CheckCircle2, Clock, Mail, Smartphone } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { createNoIndexMetadata } from "@/lib/seo";
import { getStripe } from "@/lib/stripe/server";
import { getPlan } from "@/lib/plans";
import { PurchaseEvent } from "./PurchaseEvent";

export const metadata: Metadata = createNoIndexMetadata("Payment confirmed");
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

type PurchaseDetails = {
  transactionId: string;
  value: number;
  currency: string;
  planSlug: string;
  planName: string;
  hasIntlNumber: boolean;
};

async function getPurchaseDetails(sessionId: string | undefined): Promise<PurchaseDetails | null> {
  if (!sessionId) return null;
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" || session.amount_total == null) return null;

    const planSlug = session.metadata?.plan_slug ?? "";
    return {
      transactionId: session.id,
      value: session.amount_total / 100,
      currency: (session.currency ?? "usd").toUpperCase(),
      planSlug,
      planName: getPlan(planSlug).name,
      hasIntlNumber: session.metadata?.wants_intl_number === "1",
    };
  } catch {
    return null;
  }
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const [email, purchase] = await Promise.all([
    getLoggedInEmail(),
    getPurchaseDetails(sessionId),
  ]);

  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {purchase ? (
        <PurchaseEvent
          transactionId={purchase.transactionId}
          value={purchase.value}
          currency={purchase.currency}
          planSlug={purchase.planSlug}
          planName={purchase.planName}
        />
      ) : null}
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

        {/* US/Canada/UK number: confirm it for buyers, one gentle nudge for
            everyone else. Kosher plans excluded from the nudge — the add-on
            works there, but the self-serve picker flow is smartphone-oriented. */}
        {purchase?.hasIntlNumber ? (
          <div className="mt-8 rounded-[1.5rem] border border-trust-green/30 bg-emerald-50 p-5 text-center">
            <p className="font-semibold text-ink">Your US/Canada/UK number is part of this order</p>
            <p className="mt-1 text-sm leading-6 text-muted-slate">
              It gets set up alongside your Israeli line — you&apos;ll see both in your account, and family
              can start calling as soon as activation completes.
            </p>
          </div>
        ) : purchase && !getPlan(purchase.planSlug).isKosher ? (
          <div className="mt-8 rounded-[1.5rem] border border-link-blue/20 bg-link-blue/5 p-5 text-center">
            <p className="font-semibold text-ink">One thing worth adding: a US, Canadian, or UK number</p>
            <p className="mt-1 text-sm leading-6 text-muted-slate">
              $9.99/month on top of your plan — family back home dials a local number and your phone rings
              in Israel, and it receives US verification texts (tested with real bank and Google codes).
              Takes about a minute in{" "}
              <a href="/account/lines" className="font-semibold text-link-blue hover:underline">
                account → Lines
              </a>{" "}
              once your line is active, and you pick the exact number you want.
            </p>
          </div>
        ) : null}

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
