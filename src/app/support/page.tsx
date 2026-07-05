import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { createPublicSupportTicketAction } from "@/lib/support/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { canonicalUrl, createPageMetadata, jsonLdScriptProps, organizationId } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Contact BitLink — WhatsApp, Phone & Email Support",
  description:
    "Real people, in English. Reach BitLink support by WhatsApp, phone, or email for activation, billing, porting, and plan help. Sun–Thu 9–6, Fri 9–12 (Israel).",
  path: "/support",
});

const supportJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${canonicalUrl("/support")}#contact`,
  url: canonicalUrl("/support"),
  name: "BitLink support",
  isPartOf: {
    "@id": organizationId,
  },
  about: {
    "@id": organizationId,
  },
};

const CATEGORIES = [
  { value: "activation",      label: "Activation — getting my line started" },
  { value: "esim_activation", label: "eSIM — QR code or install issues" },
  { value: "no_data",         label: "No data / internet not working" },
  { value: "no_service_sos",  label: "No service / SOS only" },
  { value: "porting",         label: "Porting my number to BitLink" },
  { value: "billing",         label: "Billing or payment question" },
  { value: "change_plan",     label: "Change or upgrade my plan" },
  { value: "roaming_travel",  label: "Roaming / travelling abroad" },
  { value: "lost_phone",      label: "Lost or stolen phone" },
  { value: "other",           label: "Something else" },
];

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(supportJsonLd)} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef5f8_100%)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-soft-cyan/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold text-link-blue">BitLink support</p>
          <h1 className="mt-3 max-w-3xl text-balance text-5xl font-semibold tracking-normal text-ink sm:text-6xl">
            Need help? Message a real BitLink person.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-slate">
            Choose what you need help with and we'll open WhatsApp with the right details so our team can help you faster.
          </p>
          <p className="mt-3 text-sm font-medium text-muted-slate">
            No chatbot maze. No ticket black hole. Just real support from people who understand Israeli phone service.
          </p>
        </div>
      </section>

      {/* Form + contact cards */}
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">

          {/* Contact cards */}
          <div className="grid content-start gap-4">
            <a
              href="https://wa.me/972587939426?text=Hi%20BitLink%20support%2C%20I%20need%20help%20with%20my%20plan."
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-ink/10 bg-[#f8fbfc] p-5 hover:border-green-400/40 hover:bg-green-50/40 transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <h2 className="mt-4 text-lg font-semibold text-ink">WhatsApp</h2>
              <p className="mt-1 text-sm leading-6 text-green-600">Message us directly</p>
            </a>

            <a
              href="mailto:support@bitlink.co.il"
              className="rounded-lg border border-ink/10 bg-[#f8fbfc] p-5 hover:border-link-blue/30 hover:bg-blue-50/40 transition-colors"
            >
              <Mail className="h-5 w-5 text-link-blue" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold text-ink">Email</h2>
              <p className="mt-1 text-sm leading-6 text-link-blue">support@bitlink.co.il</p>
            </a>

            <a
              href="tel:+972587939426"
              className="rounded-lg border border-ink/10 bg-[#f8fbfc] p-5 hover:border-link-blue/30 hover:bg-blue-50/40 transition-colors"
            >
              <Phone className="h-5 w-5 text-link-blue" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold text-ink">Call us</h2>
              <p className="mt-1 text-sm leading-6 text-link-blue">+972 58-793-9426</p>
            </a>

            <div className="rounded-lg border border-ink/10 bg-amber-50/60 p-5">
              <p className="text-sm font-semibold text-amber-800">Real humans only</p>
              <p className="mt-1 text-sm leading-6 text-amber-700">
                No AI, no bots. A real BitLink team member reads every message and replies personally.
              </p>
            </div>
          </div>

          {/* Form */}
          <form action={createPublicSupportTicketAction} className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
            <h2 className="text-2xl font-semibold tracking-normal text-ink">Open a support ticket</h2>
            <p className="mt-2 text-sm leading-6 text-muted-slate">
              Fill this in and we'll open WhatsApp for you — with your ticket number already in the message so we can find your account instantly.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                name="name"
                autoComplete="name"
                required
                placeholder="Moshe Cohen"
              />
              <Input
                label="Your WhatsApp number"
                name="whatsapp"
                type="tel"
                autoComplete="tel"
                required
                placeholder="+972 50-000-0000"
              />
              <Input
                label="BitLink phone number"
                name="bitlink_phone"
                type="tel"
                placeholder="+972 58-xxx-xxxx"
                className="sm:col-span-2"
              />
              <Input
                label="Email (optional)"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
              <Select label="What do you need help with?" name="category" required className="sm:col-span-2">
                <option value="">Choose a topic…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
              <Textarea
                label="Details"
                name="message"
                className="sm:col-span-2"
                rows={4}
                required
                placeholder="Describe what's happening…"
              />
            </div>

            {params.error && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                {params.error}
              </div>
            )}

            <Button type="submit" className="mt-6 w-full sm:w-auto">
              Get WhatsApp support →
            </Button>

            <p className="mt-3 text-xs text-muted-slate">
              A real BitLink team member will answer you on WhatsApp. Your ticket number helps us find your account faster.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
