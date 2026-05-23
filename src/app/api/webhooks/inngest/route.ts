// Inngest serve endpoint — required for Inngest to invoke durable functions.
// Register all Inngest functions here as they are created.

import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { processAnnatelWebhook } from '@/inngest/functions/process-annatel-webhook';
import { provisionLine } from '@/inngest/functions/provision-line';
import { reconcileJobsCron } from '@/inngest/functions/reconcile-jobs';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processAnnatelWebhook, provisionLine, reconcileJobsCron],
});
