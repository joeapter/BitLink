// Internal BitLink event taxonomy.
// These are the events that flow through the platform's event bus and Inngest queue.
// Provider webhook events get mapped to these types before any business logic runs.

export type BitLinkEventType =
  // Provisioning
  | 'provisioning.line.created'
  | 'provisioning.line.failed'
  | 'provisioning.sim.assigned'
  | 'provisioning.sim.ota_triggered'
  | 'provisioning.sim.ota_completed'
  | 'provisioning.plan.assigned'
  // Line lifecycle
  | 'line.activated'
  | 'line.suspended'
  | 'line.reactivated'
  | 'line.terminated'
  // Portability
  | 'portability.initiated'
  | 'portability.authentication_sent'
  | 'portability.authentication_completed'
  | 'portability.submitted_to_npl'
  | 'portability.transferred'
  | 'portability.failed'
  | 'portability.canceled'
  // Usage & billing
  | 'usage.balance_low'
  | 'usage.balance_depleted'
  | 'usage.synced'
  // Inbound webhooks from provider
  | 'webhook.received'
  | 'webhook.processed'
  | 'webhook.failed'
  // Payment
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.topup_triggered';

export type AggregateType = 'line' | 'sim' | 'portability' | 'phone_number' | 'unknown';

export interface BitLinkEvent<T = Record<string, unknown>> {
  type: BitLinkEventType;
  aggregateType: AggregateType;
  aggregateId?: string;
  payload: T;
  source: 'webhook' | 'api' | 'system' | 'admin';
  occurredAt: string;
}
