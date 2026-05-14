import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/utils";
import { getStripe } from "@/lib/stripe/server";

export async function POST() {
  const user = await requireUser();
  const stripe = getStripe();

  if (!stripe) {
    return NextResponse.json({ error: "Billing management is temporarily unavailable." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!customer?.stripe_customer_id) {
    return NextResponse.json({ error: "Billing management is not available for this account yet." }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: absoluteUrl("/account/billing"),
  });

  return NextResponse.json({ url: session.url });
}
