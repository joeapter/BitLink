import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { getTelecomProvider } from "@/lib/provider";

async function recordPaymentEvent(event: Stripe.Event, customerId?: string | null) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("payment_events").insert({
    customer_id: customerId ?? null,
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>,
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, event: Stripe.Event) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  const orderId = session.metadata?.order_id || null;
  const customerRecordId = session.metadata?.customer_record_id || null;
  const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;
  const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : null;

  if (customerRecordId && stripeCustomerId) {
    await supabase
      .from("customers")
      .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
      .eq("id", customerRecordId);
  }

  if (orderId) {
    const { data: order } = await supabase
      .from("orders")
      .update({
        payment_status: session.payment_status ?? "paid",
        order_status: "payment_confirmed",
        provisioning_status: "payment_confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("*")
      .single();

    await supabase.from("provisioning_events").insert({
      order_id: orderId,
      customer_id: order?.customer_id ?? customerRecordId,
      status: "payment_confirmed",
      note: "Stripe checkout.session.completed verified by webhook.",
    });

    if (order) {
      await getTelecomProvider().createActivationRequest(order);
    }
  }

  if (customerRecordId && stripeSubscriptionId) {
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .maybeSingle();

    const payload = {
      customer_id: customerRecordId,
      stripe_subscription_id: stripeSubscriptionId,
      status: "active",
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await supabase.from("subscriptions").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("subscriptions").insert(payload);
    }
  }

  await recordPaymentEvent(event, customerRecordId);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, event: Stripe.Event) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  const subscriptionWithPeriod = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };

  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: subscriptionWithPeriod.current_period_start
        ? new Date(subscriptionWithPeriod.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subscriptionWithPeriod.current_period_end
        ? new Date(subscriptionWithPeriod.current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  await recordPaymentEvent(event);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, event);
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.created"
  ) {
    await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, event);
  }

  return NextResponse.json({ received: true });
}
