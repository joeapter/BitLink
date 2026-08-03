// Admin notification the moment a free trial starts (card saved, before the
// line is even provisioned) — separate from notify-checkout's "New sale"
// email, since no money changed hands here.

import { inngest } from '@/inngest/client';
import { sendEmail } from '@/lib/email/send';
import { buildAdminTrialSignupEmail } from '@/lib/email/templates';
import { logger } from '@/lib/logger';

const ADMIN_NOTIFY_EMAIL = 'joe@bitlink.co.il';
const log = logger.child({ fn: 'notify-trial-signup' });

export const notifyTrialSignup = inngest.createFunction(
  { id: 'notify-trial-signup', retries: 2 },
  { event: 'trial/signup.completed' },
  async ({ event, step }) => {
    const { fullName, email, phone, lineId } = event.data as {
      fullName: string;
      email: string;
      phone: string;
      lineId: string;
    };

    const sent = await step.run('send-admin-notification', async () => {
      return sendEmail({
        to: ADMIN_NOTIFY_EMAIL,
        subject: `New BitLink trial — ${fullName}`,
        html: buildAdminTrialSignupEmail({ fullName, email, phone, lineId }),
      });
    });

    log.info({ email, sent }, 'Trial signup admin notification complete');
    return { sent };
  },
);
