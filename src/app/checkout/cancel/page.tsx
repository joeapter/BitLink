import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Checkout Canceled",
};

export default function CheckoutCancelPage() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-ink/10 bg-slate-50 p-8 text-center">
        <h1 className="text-4xl font-semibold tracking-normal text-ink">Checkout was canceled.</h1>
        <p className="mt-4 text-muted-slate">
          No payment was completed. You can return to checkout or compare plans again.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/checkout">Return to checkout</ButtonLink>
          <ButtonLink href="/plans" variant="secondary">
            Compare plans
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
