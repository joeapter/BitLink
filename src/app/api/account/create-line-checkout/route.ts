import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCheckoutSession, getStripe } from "@/lib/stripe/server";
import { getPlan } from "@/lib/plans";
import { absoluteUrl, isValidIsraeliMobile } from "@/lib/utils";
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
  if (isPortIn && portInNumber && !isValidIsraeliMobile(portInNumber)) {
    return NextResponse.json(
      { error: "That does not look like a valid Israeli mobile number. Use the format 05x-xxx-xxxx." },
      { status: 400 },
    );
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
    .select("id, slug, name, stripe_price_id")
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
    portInNumber: isPortIn ? (portInNumber ?? null) : null,
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
