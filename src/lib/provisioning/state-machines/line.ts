// Line state machine.
// A line moves through exactly these states. No other status values are valid.
// TERMINATED and FAILED (non-retriable) are terminal — no exit.

export type LineStateMachineStatus =
  | 'DRAFT'
  | 'PROVISIONING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'PORTING'
  | 'TERMINATED'
  | 'FAILED';

export interface LineStatusTransition {
  status: LineStateMachineStatus;
  transitioned_at: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

export interface LineStateMachineRecord {
  id: string;
  status: LineStateMachineStatus;
  status_transitions: LineStatusTransition[];
  updated_at: string;
}

export const LINE_TRANSITIONS: Record<LineStateMachineStatus, LineStateMachineStatus[]> = {
  DRAFT:        ['PROVISIONING', 'FAILED'],
  PROVISIONING: ['ACTIVE', 'FAILED'],
  ACTIVE:       ['SUSPENDED', 'PORTING', 'TERMINATED'],
  SUSPENDED:    ['ACTIVE', 'TERMINATED'],
  PORTING:      ['ACTIVE', 'FAILED'],
  TERMINATED:   [],
  FAILED:       ['DRAFT'],  // DRAFT allows a fresh provisioning retry
};

export class InvalidLineTransitionError extends Error {
  constructor(lineId: string, from: LineStateMachineStatus, to: LineStateMachineStatus) {
    super(`Invalid line transition [${lineId}]: ${from} → ${to}`);
    this.name = 'InvalidLineTransitionError';
  }
}

export function canTransitionLine(
  from: LineStateMachineStatus,
  to: LineStateMachineStatus,
): boolean {
  return LINE_TRANSITIONS[from].includes(to);
}

export function transitionLine(
  record: LineStateMachineRecord,
  to: LineStateMachineStatus,
  options: { actor?: string; metadata?: Record<string, unknown> } = {},
): LineStateMachineRecord {
  if (!canTransitionLine(record.status, to)) {
    throw new InvalidLineTransitionError(record.id, record.status, to);
  }
  const now = new Date().toISOString();
  return {
    ...record,
    status: to,
    status_transitions: [
      ...record.status_transitions,
      {
        status: to,
        transitioned_at: now,
        actor: options.actor,
        metadata: options.metadata,
      },
    ],
    updated_at: now,
  };
}
