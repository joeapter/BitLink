"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { authenticatedRedirectPath, safeInternalPath } from "@/lib/auth/redirects";
import { absoluteUrl } from "@/lib/utils";
import { sendEmail } from "@/lib/email/send";
import { buildAdminSignupEmail } from "@/lib/email/templates";

const ADMIN_NOTIFY_EMAIL = "joe@bitlink.co.il";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function makeReferralCode() {
  return `BL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function loginAction(formData: FormData) {
  if (!hasSupabasePublicEnv()) {
    redirect(`/login?error=${encodeMessage("Sign in is temporarily unavailable. Please contact BitLink support.")}`);
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeInternalPath(String(formData.get("next") ?? ""));
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeMessage(error.message)}`);
  }

  redirect(next ?? (await authenticatedRedirectPath(supabase, null)));
}

export async function signupAction(formData: FormData) {
  if (!hasSupabasePublicEnv()) {
    redirect(`/signup?error=${encodeMessage("Account creation is temporarily unavailable. Please contact BitLink support.")}`);
  }

  const fullName = String(formData.get("fullName") ?? "");
  const email = String(formData.get("email") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");
  const referredBy = String(formData.get("referralCode") ?? "") || null;
  const cookieStore = await cookies();
  const orgFromCookie = cookieStore.get("bl_org")?.value ?? "";
  const orgReferralCode = (String(formData.get("orgReferralCode") ?? "") || orgFromCookie) || null;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: absoluteUrl("/auth/callback"),
      data: {
        full_name: fullName,
        phone,
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeMessage(error.message)}`);
  }

  const admin = createSupabaseAdminClient();
  if (admin && data.user?.id) {
    await admin.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      email,
      phone,
      role: "customer",
    });

    const { data: existingCustomer } = await admin
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingCustomer?.id) {
      await admin
        .from("customers")
        .update({
          user_id: data.user.id,
          full_name: fullName,
          phone,
          referred_by: referredBy,
          ...(orgReferralCode ? { org_referral_code: orgReferralCode } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingCustomer.id);
    } else {
      await admin.from("customers").insert({
        user_id: data.user.id,
        full_name: fullName,
        email,
        phone,
        referral_code: makeReferralCode(),
        referred_by: referredBy,
        org_referral_code: orgReferralCode,
      });
    }
  }

  cookieStore.delete("bl_org");

  // Fire-and-forget — never block the user redirect on this
  void sendEmail({
    to: ADMIN_NOTIFY_EMAIL,
    subject: `New BitLink signup — ${fullName}`,
    html: buildAdminSignupEmail({ fullName, email, phone, orgReferralCode }),
  });

  if (data.session) {
    redirect("/account");
  }

  redirect(
    `/login?message=${encodeMessage("Check your email to confirm your account, then sign in.")}&email=${encodeMessage(email)}`,
  );
}

export async function logoutAction() {
  if (hasSupabasePublicEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}
