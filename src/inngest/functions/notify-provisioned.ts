// Post-provisioning notification — fired when a line reaches COMPLETED status
// from ANY completion path (direct processing, reconcile cron, Annatel webhook;
// the event is dispatched from completeJob in the orchestrator, which also
// falls back to sending synchronously if this dispatch itself fails to fire).
//
// Actual send logic lives in lib/notifications/send-provisioned.ts, shared
// with the orchestrator's fallback and the admin "Resend" button.

import { inngest } from '@/inngest/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendProvisionedNotifications } from '@/lib/notifications/send-provisioned';
import { logger } from '@/lib/logger';

const log = logger.child({ fn: 'notify-provisioned' });

export const notifyProvisioned = inngest.createFunction(
  { id: 'notify-provisioned', retries: 3 },
  { event: 'provisioning/line.completed' },
  async ({ event, step }) => {
    const { lineId, providerLineId } = event.data as {
      lineId: string;
      providerLineId: string | null;
    };

    const admin = createSupabaseAdminClient();
    if (!admin) return { skipped: true, reason: 'no_admin_client' };

    const result = await step.run('send-notifications', async () => {
      return sendProvisionedNotifications(admin, lineId, providerLineId);
    });

    log.info({ lineId, result }, 'notify-provisioned complete');
    return result;
  },
);
