// Shared "make sure this customer can log in" logic — used wherever a
// customer record needs a Supabase auth account but never went through the
// password-setting /signup form (paid checkout, free trial signup, etc).
//
// Idempotent: skips account creation if the customer already has a linked
// user_id, or if an auth user with that email already exists (in which case
// it links rather than duplicating).

import type { createSupabaseAdminClient } from '@/lib/supabase/admin';

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export interface EnsureAuthAccountResult {
  userId: string | null;
  isNew: boolean;
  tempPassword: string | null;
}

function generateTempPassword(): string {
  // 12-char alphanumeric — strong enough for a temp password
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

export async function ensureAuthAccount(
  admin: AdminClient,
  params: { customerRecordId: string; email: string; fullName: string; existingUserId?: string | null; source: string },
): Promise<EnsureAuthAccountResult> {
  if (params.existingUserId) {
    return { userId: params.existingUserId, isNew: false, tempPassword: null };
  }

  const { data: { users } } = await admin.auth.admin.listUsers();
  const existing = users.find((u) => u.email === params.email);
  if (existing) {
    await admin.from('customers').update({ user_id: existing.id }).eq('id', params.customerRecordId);
    return { userId: existing.id, isNew: false, tempPassword: null };
  }

  const tempPassword = generateTempPassword();
  const { data: newUser, error } = await admin.auth.admin.createUser({
    email: params.email,
    password: tempPassword,
    email_confirm: true, // skip confirmation email — we send our own
    user_metadata: {
      full_name: params.fullName,
      source: params.source,
    },
  });

  if (error || !newUser.user) {
    return { userId: null, isNew: false, tempPassword: null };
  }

  await admin
    .from('customers')
    .update({ user_id: newUser.user.id, updated_at: new Date().toISOString() })
    .eq('id', params.customerRecordId);

  void admin
    .from('profiles')
    .upsert(
      { id: newUser.user.id, full_name: params.fullName, email: params.email, role: 'customer' },
      { onConflict: 'id', ignoreDuplicates: false },
    );

  return { userId: newUser.user.id, isNew: true, tempPassword };
}

export async function generateLoginUrl(
  admin: AdminClient,
  params: { email: string; tempPassword: string | null; baseUrl: string; welcomeMessage?: string },
): Promise<string> {
  if (params.tempPassword) {
    // With temp password: deep-link to login with email pre-filled
    return `${params.baseUrl}/login?email=${encodeURIComponent(params.email)}&message=${encodeURIComponent(
      params.welcomeMessage ?? 'Welcome to BitLink! Use the credentials from your email to sign in.',
    )}`;
  }

  // Generate magic link for existing accounts
  try {
    const { data } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: params.email,
      options: { redirectTo: `${params.baseUrl}/account` },
    });
    return data.properties?.action_link ?? `${params.baseUrl}/login`;
  } catch {
    return `${params.baseUrl}/login`;
  }
}
