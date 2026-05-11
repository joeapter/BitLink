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
      <section className="liquid-bg bg-ink px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8">
        <div className="relative z-10 mx-auto max-w-7xl">
          <p className="text-sm font-semibold text-soft-cyan">BitLink support</p>
          <h1 className="mt-3 max-w-4xl text-balance text-5xl font-semibold tracking-normal sm:text-6xl">
            Human help for plans, billing, and activation.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            Built for people who want their phone plan to just work. Send a request and the BitLink team will follow up.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid content-start gap-4">
            {[
              ["Email", "hello@bitlink.co.il", Mail],
              ["Activation", "Activation handled by BitLink", PhoneCall],
              ["Portal", "Create and track support tickets after signup", MessageCircle],
            ].map(([title, body, Icon]) => (
              <div key={title as string} className="rounded-[1.5rem] border border-ink/10 bg-slate-50 p-5">
                <Icon className="h-5 w-5 text-link-blue" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold text-ink">{title as string}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-slate">{body as string}</p>
              </div>
            ))}
          </div>

          <form action={createPublicSupportTicketAction} className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
            <h2 className="text-2xl font-semibold tracking-normal text-ink">Send a support request</h2>
            <p className="mt-2 text-sm leading-6 text-muted-slate">
              Public support form placeholder. Logged-in customers can create database-backed tickets in the account portal.
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
