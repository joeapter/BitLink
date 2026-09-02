// Inngest serve endpoint — required for Inngest to invoke durable functions.
// Register all Inngest functions here as they are created.

import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { processAnnatelWebhook } from '@/inngest/functions/process-annatel-webhook';
import { processStripeEvent } from '@/inngest/functions/process-stripe-event';
import { provisionLine } from '@/inngest/functions/provision-line';
import { reconcileJobsCron } from '@/inngest/functions/reconcile-jobs';
import { ingestCdrs } from '@/inngest/functions/ingest-cdrs';
import { notifyCheckout } from '@/inngest/functions/notify-checkout';
import { notifyProvisioned } from '@/inngest/functions/notify-provisioned';
import { referralBonusesCron } from '@/inngest/functions/referral-bonuses';
import { notifySalesRepCommission, notifySalesRepWelcome } from '@/inngest/functions/notify-sales-rep';
import { topupGrantsCron } from '@/inngest/functions/topup-grants';
import { dataUsageAlertsCron } from '@/inngest/functions/data-usage-alerts';
import { abandonedCheckoutRecoveryCron } from '@/inngest/functions/abandoned-checkout-recovery';
import { trialTopupGrant } from '@/inngest/functions/trial-topup-grant';
import { trialOfferLifecycleCron } from '@/inngest/functions/trial-offer-lifecycle';
import { notifyTrialSignup } from '@/inngest/functions/notify-trial-signup';
import { customOrderTopupGrant } from '@/inngest/functions/custom-order-topup-grant';
import { dunningCron } from '@/inngest/functions/dunning';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processAnnatelWebhook,
    processStripeEvent,
    provisionLine,
    reconcileJobsCron,
    ingestCdrs,
    notifyCheckout,
    notifyProvisioned,
    referralBonusesCron,
    notifySalesRepWelcome,
    notifySalesRepCommission,
    topupGrantsCron,
    dataUsageAlertsCron,
    abandonedCheckoutRecoveryCron,
    trialTopupGrant,
    trialOfferLifecycleCron,
    notifyTrialSignup,
    customOrderTopupGrant,
    dunningCron,
  ],
});
