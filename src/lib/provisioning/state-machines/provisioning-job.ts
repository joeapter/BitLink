// Provisioning job state machine.
// All status transitions go through `transition()` — never mutate status directly.
// Transitions are append-only; the full history lives in status_transitions.

export type ProvisioningJobStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'SYNCING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface StatusTransition {
  status: ProvisioningJobStatus;
  transitioned_at: string;
  metadata?: Record<string, unknown>;
}

export interface ProvisioningJob {
  id: string;
  line_id: string | null;
  provider_job_id: string | null;
  idempotency_key: string;
  type: string;
  status: ProvisioningJobStatus;
  attempt_count: number;
  max_attempts: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  next_retry_at: string | null;
  status_transitions: StatusTransition[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  created_by: string | null;
}

// FAILED → PENDING allows one retry path. All other terminal states are final.
export const TRANSITIONS: Record<ProvisioningJobStatus, ProvisioningJobStatus[]> = {
  PENDING:    ['SUBMITTED', 'CANCELLED'],
  SUBMITTED:  ['SYNCING', 'FAILED'],
  SYNCING:    ['COMPLETED', 'FAILED'],
  COMPLETED:  [],
  FAILED:     ['PENDING'],
  CANCELLED:  [],
};

export class InvalidTransitionError extends Error {
  constructor(jobId: string, from: ProvisioningJobStatus, to: ProvisioningJobStatus) {
    super(`Invalid provisioning job transition [${jobId}]: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export function canTransition(
  from: ProvisioningJobStatus,
  to: ProvisioningJobStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function transition(
  job: ProvisioningJob,
  to: ProvisioningJobStatus,
  metadata?: Record<string, unknown>,
): ProvisioningJob {
  if (!canTransition(job.status, to)) {
    throw new InvalidTransitionError(job.id, job.status, to);
  }
  const now = new Date().toISOString();
  const isTerminal = to === 'COMPLETED' || to === 'CANCELLED';
  return {
    ...job,
    status: to,
    status_transitions: [
      ...job.status_transitions,
      { status: to, transitioned_at: now, metadata },
    ],
    updated_at: now,
    completed_at: isTerminal ? now : job.completed_at,
  };
}
