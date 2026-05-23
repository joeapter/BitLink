// In-process event bus for synchronous side-effects within a single request.
// For durable, cross-request event delivery use Inngest directly.
// Handlers registered here run in the same process but are not retried on failure.

import type { BitLinkEvent, BitLinkEventType } from './types';

type Handler<T = Record<string, unknown>> = (event: BitLinkEvent<T>) => Promise<void> | void;

const registry = new Map<BitLinkEventType, Handler[]>();

export function on<T = Record<string, unknown>>(
  type: BitLinkEventType,
  handler: Handler<T>,
): void {
  const existing = registry.get(type) ?? [];
  registry.set(type, [...existing, handler as Handler]);
}

export async function emit<T = Record<string, unknown>>(
  event: BitLinkEvent<T>,
): Promise<void> {
  const handlers = registry.get(event.type) ?? [];
  await Promise.all(handlers.map((fn) => fn(event as BitLinkEvent)));
}

export function clearHandlers(): void {
  registry.clear();
}
