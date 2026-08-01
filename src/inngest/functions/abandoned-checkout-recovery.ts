// Inngest cron: every 2 hours, finds Basic-plan checkout sessions abandoned
// 2+ hours ago and emails a recovery link with the activation fee waived.

import { inngest } from '@/inngest/client';
import { logger } from '@/lib/logger';
import { processAbandonedCheckoutRecovery } from '@/lib/abandoned-checkout';

const log = logger.child({ fn: 'abandoned-checkout-recovery' });

export const abandonedCheckoutRecoveryCron = inngest.createFunction(
  { id: 'abandoned-checkout-recovery' },
  { cron: 'TZ=UTC 0 */2 * * *' },
  async ({ step }) => {
    const result = await step.run('recover', async () => {
      return processAbandonedCheckoutRecovery();
    });
    log.info(result, 'Abandoned checkout recovery run complete');
    return result;
  },
);
