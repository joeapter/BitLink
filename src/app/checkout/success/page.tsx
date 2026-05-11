import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Checkout Success",
};

export default function CheckoutSuccessPage() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-ink/10 bg-slate-50 p-8 text-center shadow-soft">
        <CheckCircle2 className="mx-auto h-12 w-12 text-trust-green" aria-hidden="true" />
        <h1 className="mt-6 text-4xl font-semibold tracking-normal text-ink">Payment received.</h1>
        <p className="mt-4 text-muted-slate">
          Your checkout completed through Stripe. Once the webhook confirms payment, BitLink will move your order into activation.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/account">Open account</ButtonLink>
          <ButtonLink href="/support" variant="secondary">
            Contact support
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
