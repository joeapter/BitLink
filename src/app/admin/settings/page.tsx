import type { Metadata } from "next";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata: Metadata = {
  title: "Admin Settings",
};

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

export default function AdminSettingsPage() {
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
