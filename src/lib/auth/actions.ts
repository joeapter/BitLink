"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { authenticatedRedirectPath, safeInternalPath } from "@/lib/auth/redirects";
import { requireUser } from "@/lib/auth/server";
import { absoluteUrl } from "@/lib/utils";
import { sendEmail } from "@/lib/email/send";
import { buildAdminSignupEmail } from "@/lib/email/templates";
import { generateReferralCode, normalizeReferralCode } from "@/lib/referrals";

const ADMIN_NOTIFY_EMAIL = "joe@bitlink.co.il";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
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

export async function requestPasswordResetAction(formData: FormData) {
  if (!hasSupabasePublicEnv()) {
    redirect(`/forgot-password?error=${encodeMessage("Password reset is temporarily unavailable. Please contact BitLink support.")}`);
  }

  const email = String(formData.get("email") ?? "").trim();
  if (email) {
    const supabase = await createSupabaseServerClient();
    // The recovery link goes through /auth/callback which exchanges the code
    // for a session, then lands on /reset-password to set the new password.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: absoluteUrl("/auth/callback?next=/reset-password"),
    });
  }

  // Same response whether or not the account exists — no account enumeration.
  redirect(`/login?message=${encodeMessage("If an account exists for that email, a password reset link is on its way.")}`);
}

export async function updatePasswordAction(formData: FormData) {
  if (!hasSupabasePublicEnv()) {
    redirect(`/reset-password?error=${encodeMessage("Password reset is temporarily unavailable. Please contact BitLink support.")}`);
  }

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) {
    redirect(`/reset-password?error=${encodeMessage("Password must be at least 8 characters.")}`);
  }
  if (password !== confirm) {
    redirect(`/reset-password?error=${encodeMessage("Passwords do not match.")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/reset-password?error=${encodeMessage(error.message)}`);
  }

  redirect(`/account?message=${encodeMessage("Password updated.")}`);
}

export async function signupAction(formData: FormData) {
  if (!hasSupabasePublicEnv()) {
    redirect(`/signup?error=${encodeMessage("Account creation is temporarily unavailable. Please contact BitLink support.")}`);
  }

  const fullName = String(formData.get("fullName") ?? "");
  const email = String(formData.get("email") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");
  const referredBy = normalizeReferralCode(String(formData.get("referralCode") ?? ""));
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
      .select("id, referred_by")
      .eq("email", email)
      .maybeSingle();

    if (existingCustomer?.id) {
      await admin
        .from("customers")
        .update({
          user_id: data.user.id,
          full_name: fullName,
          phone,
          ...(!existingCustomer.referred_by && referredBy ? { referred_by: referredBy } : {}),
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
        referral_code: generateReferralCode(),
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

// Real carrier lines and billing can't be safely torn down by an unattended
// customer action, so this doesn't delete anything itself — it's the
// in-app request Apple's account-deletion guideline (5.1.1(v)) requires:
// the customer submits it without leaving the app or contacting support,
// and it's Joe who processes the actual teardown from the admin console.
// Archiving immediately (same soft-hide admin uses for any other customer)
// pulls them out of the active list right away as a visible "needs review"
// signal, on top of the email.
export async function requestAccountDeletionAction() {
  const user = await requireUser();
  const admin = createSupabaseAdminClient();
  if (!admin) {
    redirect(`/login?error=${encodeMessage("Account deletion is temporarily unavailable. Please try again shortly.")}`);
  }

  const { data: customer } = await admin
    .from("customers")
    .select("id, full_name, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (customer?.id) {
    await admin
      .from("customers")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", customer.id);

    try {
      await admin.from("audit_logs").insert({
        actor_user_id: user.id,
        action: "customer_requested_deletion",
        entity_type: "customer",
        entity_id: customer.id,
        metadata: {},
      });
    } catch {
      // audit failure is non-fatal
    }

    await sendEmail({
      to: ADMIN_NOTIFY_EMAIL,
      subject: `⚠ Account deletion requested — ${(customer.full_name as string | null) ?? customer.email}`,
      html: [
        `<p><b>${(customer.full_name as string | null) ?? "A customer"}</b> (${customer.email}) requested account deletion from the app.</p>`,
        `<p>They've been archived out of the active list as a placeholder. Review their lines/billing and process the deletion in the admin console.</p>`,
        `<p><a href="https://www.bitlink.co.il/admin/customers/${customer.id}">Open in admin</a></p>`,
      ].join(""),
    }).catch(() => {});
  }

  if (hasSupabasePublicEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect(
    `/login?message=${encodeMessage("Your account deletion request has been submitted. We'll follow up by email once it's processed.")}`,
  );
}
