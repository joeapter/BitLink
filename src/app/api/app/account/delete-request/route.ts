import type { NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Account deletion request from the native app.
//
// Exists for App Store Review Guideline 5.1.1(v): an account the customer can
// delete from inside the app. It files a request rather than deleting anything,
// on purpose.
//
// Deleting the auth row on its own would be the worst possible outcome: the
// Stripe subscription keeps billing, and the customer has just thrown away the
// only screen where they could see or stop it. The usual answer — make them
// cancel the line first — isn't available either, because there is no
// self-serve cancellation; cancelling is admin-only (lib/admin/refund-cancel).
//
// So a request is raised and a human closes it. That also keeps an irreversible
// number release away from a single tap: an Israeli number, once released back
// to Annatel, is not recoverable.

const log = logger.child({ route: 'api/app/account/delete-request' });

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(request: NextRequest): Promise<Response> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json(
      { error: 'Account deletion is temporarily unavailable. Please email support@bitlink.co.il.' },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return Response.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token);
  if (authError || !user) {
    return Response.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  let reason = '';
  try {
    const body = (await request.json()) as { reason?: unknown };
    if (typeof body.reason === 'string') reason = body.reason.slice(0, 500);
  } catch {
    // Reason is optional — an empty body is a valid request.
  }

  const { data: customer } = await admin
    .from('customers')
    .select('id, full_name, email, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  // Lines are listed so whoever works the request can see at a glance whether
  // service has to be cancelled and a number released, or whether this is just
  // a dormant login to remove.
  const { data: lines } = customer
    ? await admin
        .from('telecom_lines')
        // The number lives in metadata; telecom_lines has no phone column.
        .select('id, status, is_kosher, metadata')
        .eq('customer_id', customer.id)
    : { data: null };

  const rows = ((lines ?? []) as Array<{
    id: string;
    status: string | null;
    is_kosher: boolean | null;
    metadata: { phone_number?: string | null } | null;
  }>).map((l) => ({
    id: l.id,
    status: l.status,
    isKosher: Boolean(l.is_kosher),
    phone: l.metadata?.phone_number ?? null,
  }));
  const activeCount = rows.filter((l) => !['cancelled', 'canceled'].includes(String(l.status))).length;
  const who = customer?.full_name || customer?.email || user.email || user.id;

  log.warn(
    { userId: user.id, customerId: customer?.id ?? null, lineCount: rows.length, activeCount },
    'Account deletion requested from the app',
  );

  const sent = await sendEmail({
    to: 'joe@bitlink.co.il',
    replyTo: customer?.email ?? user.email ?? undefined,
    subject: `🗑️ Account deletion requested — ${who}${activeCount > 0 ? ` (${activeCount} active line${activeCount === 1 ? '' : 's'})` : ''}`,
    html: [
      `<p><b>${esc(String(who))}</b> requested account deletion from the mobile app.</p>`,
      `<p>Email: ${esc(customer?.email ?? user.email ?? '—')}<br/>`,
      `Auth user: <code>${esc(user.id)}</code><br/>`,
      `Customer: <code>${esc(customer?.id ?? 'no customer record')}</code><br/>`,
      `Stripe: <code>${esc(customer?.stripe_customer_id ?? '—')}</code></p>`,
      rows.length
        ? `<p><b>Lines on the account:</b></p><ul>${rows
            .map(
              (l) =>
                `<li>${esc(l.phone ?? l.id)} — ${esc(l.status ?? 'unknown')}${l.isKosher ? ' (kosher)' : ''}</li>`,
            )
            .join('')}</ul>`
        : `<p>No lines on this account.</p>`,
      reason ? `<p><b>Reason given:</b> ${esc(reason)}</p>` : '',
      activeCount > 0
        ? `<p><b>Active service.</b> Cancel the subscription and release the number before deleting the account — the customer was told you'd confirm first, and a released Israeli number cannot be recovered.</p>`
        : `<p>No active service — safe to delete the login and customer record.</p>`,
      `<p>They were told this is a request and that nothing is cancelled until someone confirms.</p>`,
    ].join(''),
  });

  if (!sent) {
    // The customer must not be told "we've got it" when nothing was recorded
    // anywhere a person will see.
    log.error({ userId: user.id }, 'Deletion request email failed to send');
    return Response.json(
      { error: 'We could not file your request. Please email support@bitlink.co.il and we will handle it.' },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    hasActiveService: activeCount > 0,
    message:
      activeCount > 0
        ? "We've received your request. Because you have active service, we'll confirm with you before anything is cancelled — your number stays active until then."
        : "We've received your request and will close your account shortly.",
  });
}
