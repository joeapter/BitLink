import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type Stripe from "stripe";
import { inngest } from "@/inngest/client";
import { provisionSubscriptionLines } from "@/lib/custom-orders/provision-lines";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCheckoutSession, getStripe } from "@/lib/stripe/server";
import { addLinesToExistingSubscription } from "@/lib/stripe/custom-orders";
import { upsertSubscription } from "@/lib/db/subscriptions";
import { getPlan } from "@/lib/plans";
import { absoluteUrl, normalizeIsraeliMobile } from "@/lib/utils";
import { getTelecomProvider } from "@/lib/telecom/provider.registry";
import { logger } from "@/lib/logger";
import { resolveAccountCustomer } from "@/lib/db/account";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const log = logger.child({ route: "account/create-line-checkout" });

const bodySchema = z.object({
  planSlug: z.enum(["basic", "kosher-basic", "kosher-plus", "student-5g", "max-5g"]),
  isEsim: z.boolean().default(true),
  isPortIn: z.boolean().default(false),
  skipActivationFee: z.boolean().default(false),
  portInNumber: z.string().nullable().optional(),
  wantsIntlNumber: z.boolean().default(false),
  intlNumberCountry: z.enum(["us", "canada", "uk"]).optional(),
  intlNumberSource: z.enum(["new", "port"]).optional(),
  intlPortNumber: z.string().nullable().optional(),
});

async function getActiveStripeSubscription(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  stripe: Stripe,
  customerId: string,
): Promise<Stripe.Subscription | null> {
  const { data: subscriptionRow } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, status")
    .eq("customer_id", customerId)
    .not("stripe_subscription_id", "is", null)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const stripeSubscriptionId = subscriptionRow?.stripe_subscription_id as string | undefined;
  if (!stripeSubscriptionId) return null;

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  return ["active", "trialing"].includes(subscription.status) ? subscription : null;
}

export async function POST(request: NextRequest): Promise<Response> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in before adding a line." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid line options", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    log.error("Supabase admin client unavailable");
    return NextResponse.json({ error: "Line checkout is temporarily unavailable." }, { status: 503 });
  }

  const stripe = getStripe();
  if (!stripe) {
    log.error("Stripe client unavailable");
    return NextResponse.json({ error: "Line checkout is temporarily unavailable." }, { status: 503 });
  }

  const {
    planSlug,
    isPortIn,
    portInNumber,
    wantsIntlNumber,
    intlNumberCountry,
    intlNumberSource,
    intlPortNumber,
  } = parsed.data;

  const plan = getPlan(planSlug);
  const isEsim = plan.isKosher ? false : parsed.data.isEsim;

  if (isPortIn && !portInNumber?.trim()) {
    return NextResponse.json({ error: "Enter the Israeli number you want to port." }, { status: 400 });
  }

  // Malformed numbers 422 at Annatel AFTER payment — reject them here instead.
  const normalizedPortNumber = isPortIn && portInNumber ? normalizeIsraeliMobile(portInNumber) : null;
  if (isPortIn && !normalizedPortNumber) {
    return NextResponse.json(
      { error: "That does not look like a valid Israeli mobile number. Use the format 05x-xxx-xxxx." },
      { status: 400 },
    );
  }

  // Ports also require a completed SMS ownership authentication — refuse to
  // take payment until the number has been verified.
  if (isPortIn && normalizedPortNumber) {
    const authStatus = await getTelecomProvider()
      .getNumberAuthenticationStatus(normalizedPortNumber)
      .catch(() => "none" as const);
    if (authStatus !== "completed") {
      return NextResponse.json(
        { error: 'Please verify the number first — tap "Text me a verification code" and enter the code we send.' },
        { status: 400 },
      );
    }
  }

  if (wantsIntlNumber && intlNumberSource === "port" && !intlPortNumber?.trim()) {
    return NextResponse.json({ error: "Enter the international number you want to port." }, { status: 400 });
  }

  const customer = await resolveAccountCustomer(admin, user.id, user.email);

  if (!customer?.id || !customer.email) {
    log.warn({ userId: user.id }, "Customer record not found for add-line checkout");
    return NextResponse.json({ error: "We could not find your BitLink customer record." }, { status: 404 });
  }

  const { data: planRow, error: planError } = await admin
    .from("plans")
    .select("id, slug, name, stripe_price_id, monthly_price_cents")
    .eq("slug", planSlug)
    .eq("active", true)
    .maybeSingle();

  if (planError || !planRow?.stripe_price_id) {
    log.warn({ planSlug, error: planError?.message }, "Plan unavailable for add-line checkout");
    return NextResponse.json({ error: "This plan is not available for checkout." }, { status: 503 });
  }

  let stripeCustomerId: string | null = null;
  let stripeLivemode = false;
  const { data: existingStripeCustomer } = await admin
    .from("stripe_customers")
    .select("stripe_customer_id, livemode")
    .eq("customer_id", customer.id)
    .maybeSingle();

  stripeCustomerId = existingStripeCustomer?.stripe_customer_id ?? customer.stripe_customer_id ?? null;
  stripeLivemode = existingStripeCustomer?.livemode ?? false;

  if (!stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create({
      email: customer.email,
      name: customer.full_name ?? undefined,
      phone: customer.phone ?? undefined,
      metadata: {
        customer_record_id: customer.id,
        user_id: user.id,
        source: "bitlink_account_add_line",
      },
    });
    stripeCustomerId = stripeCustomer.id;
    stripeLivemode = stripeCustomer.livemode;
  }

  await Promise.all([
    admin
      .from("customers")
      .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
      .eq("id", customer.id),
    admin.from("stripe_customers").upsert(
      {
        customer_id: customer.id,
        stripe_customer_id: stripeCustomerId,
        stripe_email: customer.email,
        livemode: stripeLivemode,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "stripe_customer_id", ignoreDuplicates: false },
    ),
  ]);

  const existingSubscription = await getActiveStripeSubscription(admin, stripe, customer.id);
  if (existingSubscription) {
    const token = `account_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
    const monthlyPriceCents =
      Number(planRow.monthly_price_cents ?? plan.priceCents) +
      (wantsIntlNumber ? 999 : 0);
    const customLine = {
      planSlug,
      isEsim,
      isPortIn,
      portNumber: isPortIn ? normalizedPortNumber : null,
      wantsIntlNumber,
      intlCountry: wantsIntlNumber ? (intlNumberCountry ?? "us") : null,
      intlSource: wantsIntlNumber ? (intlNumberSource ?? "new") : null,
      intlPortNumber: wantsIntlNumber && intlNumberSource === "port" ? (intlPortNumber ?? null) : null,
      customPriceCents: monthlyPriceCents,
    };

    try {
      const [item] = await addLinesToExistingSubscription(stripe, {
        subscriptionId: existingSubscription.id,
        token,
        lines: [customLine],
      });
      if (!item) throw new Error("Stripe did not return a subscription item for the new line.");

      const refreshedSubscription = await stripe.subscriptions.retrieve(existingSubscription.id, {
        expand: ["items.data.price.product"],
      });
      await upsertSubscription(admin, customer.id, refreshedSubscription);

      const result = await provisionSubscriptionLines(admin, [
        {
          line: customLine,
          index: 0,
          subscriptionItem: item,
          stripeSubscriptionId: existingSubscription.id,
          stripeCustomerId,
          customerRecordId: customer.id,
          customerEmail: customer.email,
          userId: user.id,
          customOrderToken: token,
          source: "account_add_line",
        },
      ]);

      await admin.from("orders").insert({
        customer_id: customer.id,
        payment_status: "paid",
        order_status: "processing",
        provisioning_status: "payment_confirmed",
      });

      if (result.jobIds.length) {
        await inngest.send(
          result.jobIds.map((jobId) => ({
            name: "provisioning/line.create" as const,
            data: { jobId },
          })),
        );
      }

      log.info(
        { userId: user.id, customerId: customer.id, planSlug, subscriptionId: existingSubscription.id },
        "Line added to existing subscription with proration",
      );
      return NextResponse.json({ added: true, lineIds: result.lineIds, jobIds: result.jobIds });
    } catch (err) {
      log.error(
        { userId: user.id, customerId: customer.id, error: err instanceof Error ? err.message : String(err) },
        "Failed to add line to existing subscription",
      );
      return NextResponse.json(
        { error: "We could not add this line to your existing subscription. Please contact support." },
        { status: 503 },
      );
    }
  }

  const session = await createCheckoutSession(stripe, {
    stripePriceId: planRow.stripe_price_id,
    activationFeePriceId: parsed.data.skipActivationFee
      ? null
      : (process.env.STRIPE_PRICE_ACTIVATION_FEE?.trim() ?? null),
    intlNumberAddonPriceId: wantsIntlNumber ? (process.env.STRIPE_PRICE_US_CANADA_ADDON?.trim() ?? null) : null,
    intlPortInFeeId: (wantsIntlNumber && intlNumberSource === "port")
      ? (process.env.STRIPE_PRICE_INTL_PORT_IN_FEE?.trim() ?? null)
      : null,
    stripeCustomerId,
    planSlug,
    isKosher: plan.isKosher,
    isEsim,
    isPortIn,
    portInNumber: isPortIn ? normalizedPortNumber : null,
    portInIdNumber: isPortIn
      ? (process.env.PORT_IN_DEFAULT_ID?.trim() ?? process.env.ANNATEL_DEFAULT_IDENTITY_NUMBER?.trim() ?? null)
      : null,
    wantsIntlNumber,
    intlNumberCountry: wantsIntlNumber ? (intlNumberCountry ?? "us") : null,
    intlNumberSource: wantsIntlNumber ? (intlNumberSource ?? "new") : null,
    intlPortNumber: wantsIntlNumber && intlNumberSource === "port" ? (intlPortNumber ?? null) : null,
    customerRecordId: customer.id,
    userId: user.id,
    successUrl: absoluteUrl("/checkout/success?session_id={CHECKOUT_SESSION_ID}"),
    cancelUrl: absoluteUrl(`/account/add-line?plan=${planSlug}`),
    // Embedded (on-site) checkout when the publishable key is configured;
    // hosted redirect otherwise.
    uiMode: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ? "embedded" : "hosted",
  });

  log.info({ userId: user.id, customerId: customer.id, planSlug, sessionId: session.id }, "Add-line checkout created");
  return NextResponse.json(
    session.client_secret ? { clientSecret: session.client_secret } : { url: session.url },
  );
}
