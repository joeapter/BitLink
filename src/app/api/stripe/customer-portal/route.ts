import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/utils";
import { getStripe } from "@/lib/stripe/server";

export async function POST() {
  const user = await requireUser();
  const stripe = getStripe();

  if (!stripe) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY is not configured." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!customer?.stripe_customer_id) {
    return NextResponse.json({ error: "No Stripe customer is connected to this account yet." }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: absoluteUrl("/account/billing"),
  });

  return NextResponse.json({ url: session.url });
}
