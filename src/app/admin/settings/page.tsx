import type { Metadata } from "next";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { isTrialOfferEnabled } from "@/lib/settings";
import { setTrialOfferEnabledAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin Settings",
};
export const dynamic = "force-dynamic";

const settings = [
  ["NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL],
  ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
  ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
  ["STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY],
  ["STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET],
  ["STRIPE_PRICE_BASIC", process.env.STRIPE_PRICE_BASIC],
  ["STRIPE_PRICE_KOSHER_BASIC", process.env.STRIPE_PRICE_KOSHER_BASIC],
  ["STRIPE_PRICE_KOSHER_PLUS", process.env.STRIPE_PRICE_KOSHER_PLUS],
  ["STRIPE_PRICE_STUDENT_5G", process.env.STRIPE_PRICE_STUDENT_5G],
  ["STRIPE_PRICE_MAX_5G", process.env.STRIPE_PRICE_MAX_5G],
  ["ANNATEL_API_KEY", process.env.ANNATEL_API_KEY],
  ["ANNATEL_API_URL", process.env.ANNATEL_API_URL],
  ["ANNATEL_WEBHOOK_SECRET", process.env.ANNATEL_WEBHOOK_SECRET],
  ["ANNATEL_REFERRAL_BONUS_TOPUP_NAME", process.env.ANNATEL_REFERRAL_BONUS_TOPUP_NAME],
  ["INNGEST_EVENT_KEY", process.env.INNGEST_EVENT_KEY],
  ["INNGEST_SIGNING_KEY", process.env.INNGEST_SIGNING_KEY],
  ["SMTP_HOST", process.env.SMTP_HOST],
  ["SMTP_PASSWORD", process.env.SMTP_PASSWORD],
  ["CDRS_INGEST_SECRET", process.env.CDRS_INGEST_SECRET],
];

export default async function AdminSettingsPage() {
  const trialOfferEnabled = await isTrialOfferEnabled();

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Settings</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Launch configuration</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-slate">
          Secret values are never shown here. This page only confirms whether required configuration exists.
        </p>
      </section>

      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Free trial offer</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-slate">
          Kill switch for the students/olim free-trial program. Turning this off immediately stops new signups and
          removes every promo mention across the site (guides, plans page, homepage) — it does <strong>not</strong>{" "}
          affect trials already in progress; those run their course (reminder + auto-freeze) either way.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <StatusBadge
            status={trialOfferEnabled ? "active" : "missing"}
            label={trialOfferEnabled ? "Offer is live" : "Offer is off"}
          />
          <form action={setTrialOfferEnabledAction}>
            <input type="hidden" name="enabled" value={trialOfferEnabled ? "false" : "true"} />
            <button
              type="submit"
              className={`rounded-full px-5 py-2 text-sm font-semibold text-white transition ${
                trialOfferEnabled ? "bg-rose-600 hover:bg-rose-700" : "bg-trust-green hover:opacity-90"
              }`}
            >
              {trialOfferEnabled ? "Turn off trial offer" : "Turn on trial offer"}
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        <div className="grid gap-3">
          {settings.map(([key, value]) => (
            <div key={key} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
              <span className="font-mono text-sm text-ink">{key}</span>
              <StatusBadge status={value ? "active" : "missing"} label={value ? "Configured" : "Missing"} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
