import type { Metadata } from "next";
import { Mail, MessageCircle, PhoneCall } from "lucide-react";
import { createPublicSupportTicketAction } from "@/lib/support/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export const metadata: Metadata = {
  title: "Support",
  description: "Contact BitLink support for plans, activation, billing, and account help.",
};

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef5f8_100%)] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-soft-cyan/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold text-link-blue">BitLink support</p>
          <h1 className="mt-3 max-w-4xl text-balance text-5xl font-semibold tracking-normal text-ink sm:text-6xl">
            Human help for plans, billing, and activation.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-slate">
            Built for people who want their phone plan to just work. Send a request and the BitLink team will follow up.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid content-start gap-4">
            <a href="mailto:support@bitlink.co.il" className="rounded-lg border border-ink/10 bg-[#f8fbfc] p-5 hover:border-link-blue/30 hover:bg-blue-50/40 transition-colors">
              <Mail className="h-5 w-5 text-link-blue" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold text-ink">Email</h2>
              <p className="mt-1 text-sm leading-6 text-link-blue">support@bitlink.co.il</p>
            </a>
            {[
              ["Setup", "We guide your connection from order to ready", PhoneCall],
              ["Account", "Track billing, setup, referrals, and support after signup", MessageCircle],
            ].map(([title, body, Icon]) => (
              <div key={title as string} className="rounded-lg border border-ink/10 bg-[#f8fbfc] p-5">
                <Icon className="h-5 w-5 text-link-blue" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold text-ink">{title as string}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-slate">{body as string}</p>
              </div>
            ))}
          </div>

          <form action={createPublicSupportTicketAction} className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
            <h2 className="text-2xl font-semibold tracking-normal text-ink">Send a support request</h2>
            <p className="mt-2 text-sm leading-6 text-muted-slate">
              Tell us what you need help with and the BitLink team will follow up.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Input label="Full name" name="name" autoComplete="name" required />
              <Input label="Email" name="email" type="email" autoComplete="email" required />
              <Input label="Subject" name="subject" className="sm:col-span-2" required />
              <Textarea label="Message" name="message" className="sm:col-span-2" required />
            </div>
            {params.error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                {params.error}
              </div>
            ) : null}
            {params.message ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                {params.message}
              </div>
            ) : null}
            <Button type="submit" className="mt-6">
              Submit request
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
