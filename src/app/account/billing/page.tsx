import type { Metadata } from "next";
import { BillingPanel, type InvoiceRow } from "@/components/account/BillingPanel";
import { requireUser } from "@/lib/auth/server";
import { getAccountSnapshot } from "@/lib/db/account";
import { getStripe } from "@/lib/stripe/server";

export const metadata: Metadata = {
  title: "Billing",
};

export default async function AccountBillingPage() {
  const user = await requireUser();
  const snapshot = await getAccountSnapshot(user.id, user.email);
  const nextBillingDate = snapshot.subscription?.current_period_end
    ? new Date(snapshot.subscription.current_period_end).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  let invoices: InvoiceRow[] = [];
  const stripe = getStripe();
  const stripeCustomerId = snapshot.customer?.stripe_customer_id;
  if (stripe && stripeCustomerId) {
    const result = await stripe.invoices.list({ customer: stripeCustomerId, limit: 24 });
    invoices = result.data.map((inv) => ({
      id: inv.id,
      number: inv.number ?? null,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status ?? null,
      created: inv.created,
      invoicePdf: inv.invoice_pdf ?? null,
      hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    }));
  }

  return (
    <BillingPanel
      subscriptionStatus={snapshot.subscription?.status}
      nextBillingDate={nextBillingDate}
      invoices={invoices}
      lineBillings={snapshot.lineBillings}
    />
  );
}
