// Fires on every line completion (same event notify-provisioned listens to).
// If the line belongs to a pending trial, grants the free 10GB bonus and
// flips the trial to active. A no-op for every non-trial line.

import { inngest } from '@/inngest/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { activateTrialTopup } from '@/lib/trial-offer';
import { logger } from '@/lib/logger';

const log = logger.child({ fn: 'trial-topup-grant' });

export const trialTopupGrant = inngest.createFunction(
  { id: 'trial-topup-grant', retries: 3 },
  { event: 'provisioning/line.completed' },
  async ({ event, step }) => {
    const { lineId } = event.data as { lineId: string; providerLineId: string | null };

    const admin = createSupabaseAdminClient();
    if (!admin) return { skipped: true, reason: 'no_admin_client' };

    await step.run('grant-trial-topup', async () => {
      await activateTrialTopup(admin, lineId);
    });

    log.info({ lineId }, 'trial-topup-grant complete');
    return { lineId };
  },
);
