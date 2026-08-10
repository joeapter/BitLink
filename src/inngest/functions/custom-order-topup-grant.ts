// Fires on every line completion (same event trial-topup-grant.ts listens
// to). If the line carries pending_topups (stashed by provision-lines.ts
// from an admin custom order's per-line topup selections), grants each one
// to the carrier directly and records a line_topup_grants row so the
// existing processMonthlyTopupGrants sweep re-applies it every subsequent
// month. A no-op for any line without pending_topups.
//
// Calls provider.addTopup directly rather than going through grantTopup() —
// grantTopup enforces topup.forKosher === line.is_kosher (the self-serve/
// admin single-topup-grant guardrail), but a custom order is a hand-built,
// already-reviewed deal where an admin may deliberately put a "kosher"-
// labeled topup like +120 Min USA/CA on a non-kosher line.

import { inngest } from '@/inngest/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { withProviderContext } from '@/lib/telecom/provider-context';
import { logger } from '@/lib/logger';

const log = logger.child({ fn: 'custom-order-topup-grant' });

type PendingTopup = {
  topupId: string;
  annatelPlanName: string;
  label: string;
  stripeSubscriptionItemId: string;
};

export const customOrderTopupGrant = inngest.createFunction(
  { id: 'custom-order-topup-grant', retries: 3 },
  { event: 'provisioning/line.completed' },
  async ({ event, step }) => {
    const { lineId, providerLineId } = event.data as { lineId: string; providerLineId: string | null };

    const admin = createSupabaseAdminClient();
    if (!admin) return { skipped: true, reason: 'no_admin_client' };
    if (!providerLineId) return { skipped: true, reason: 'no_provider_line_id' };

    const { data: line } = await admin
      .from('telecom_lines')
      .select('metadata')
      .eq('id', lineId)
      .maybeSingle();

    const pendingTopups = ((line?.metadata as Record<string, unknown> | null)?.pending_topups ?? []) as PendingTopup[];
    if (!pendingTopups.length) return { skipped: true, reason: 'no_pending_topups' };

    let granted = 0;
    for (const topup of pendingTopups) {
      if (!topup.annatelPlanName) {
        log.error({ lineId, topupId: topup.topupId }, 'Pending topup missing annatelPlanName — skipping');
        continue;
      }

      await step.run(`grant-${topup.topupId}`, async () => {
        const provider = getTelecomProvider();
        await withProviderContext({ correlationId: crypto.randomUUID(), telecomLineId: lineId }, () =>
          provider.addTopup(providerLineId, topup.annatelPlanName),
        );

        await admin.from('line_topup_grants').insert({
          line_id: lineId,
          topup_id: topup.topupId,
          topup_name: topup.annatelPlanName,
          label: topup.label,
          frequency: 'monthly',
          billing_mode: 'paid',
          status: 'active',
          stripe_subscription_item_id: topup.stripeSubscriptionItemId,
          source: 'admin',
        });
      });
      granted += 1;
    }

    log.info({ lineId, granted }, 'custom-order-topup-grant complete');
    return { lineId, granted };
  },
);
