import { NextResponse } from "next/server";
import { z } from "zod";
import { createBitLinkCheckoutSession } from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPlan, plans } from "@/lib/plans";

const checkoutSchema = z.object({
  planSlug: z.string().refine((value) => plans.some((plan) => plan.slug === value), "Choose a valid plan."),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  referralCode: z.string().optional().nullable(),
});

function referralCode() {
  return `BL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your checkout details." }, { status: 400 });
  }

  const data = parsed.data;
  const plan = getPlan(data.planSlug);
  const supabase = createSupabaseAdminClient();
  let orderId: string | undefined;
  let customerRecordId: string | undefined;

  try {
    if (supabase) {
      const { data: planRow } = await supabase.from("plans").select("id").eq("slug", plan.slug).maybeSingle();

      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("*")
        .eq("email", data.email)
        .maybeSingle();

      const { data: customer } = existingCustomer
        ? await supabase
            .from("customers")
            .update({
              full_name: data.fullName,
              phone: data.phone,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingCustomer.id)
            .select("*")
            .single()
        : await supabase
            .from("customers")
            .insert({
              full_name: data.fullName,
              email: data.email,
              phone: data.phone,
              referral_code: referralCode(),
              referred_by: data.referralCode || null,
            })
            .select("*")
            .single();

      customerRecordId = customer?.id;

      if (customer?.id) {
        const { data: order } = await supabase
          .from("orders")
          .insert({
            customer_id: customer.id,
            plan_id: planRow?.id ?? null,
            payment_status: "pending",
            order_status: "checkout_created",
            provisioning_status: "new_order",
          })
          .select("*")
          .single();
        orderId = order?.id;
      }
    }

    const session = await createBitLinkCheckoutSession({
      plan,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      referralCode: data.referralCode ?? undefined,
      metadata: {
        order_id: orderId ?? "",
        customer_record_id: customerRecordId ?? "",
      },
    });

    if (supabase && orderId) {
      await supabase
        .from("orders")
        .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
        .eq("id", orderId);
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout session.";
    console.error("Checkout session creation failed:", message);
    return NextResponse.json(
      { error: "Secure checkout is temporarily unavailable. Please contact BitLink support." },
      { status: 503 },
    );
  }
}
