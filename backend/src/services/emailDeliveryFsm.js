/**
 * Email delivery FSM — LRC-11-D8
 * Mirrors packages/shared/emailDeliveryFsm.ts
 */

export const EMAIL_DELIVERY_MAX_RETRIES = 3;

const TRANSITIONS = {
  queued: new Set(['sending', 'failed']),
  sending: new Set(['sent', 'mock_sent', 'failed', 'queued']),
  sent: new Set(),
  mock_sent: new Set(),
  failed: new Set(['queued']),
};

export function canTransitionEmailDelivery(from, to) {
  return TRANSITIONS[from]?.has(to) ?? false;
}

export function transitionEmailDelivery(from, to) {
  if (!canTransitionEmailDelivery(from, to)) {
    throw new Error(`Invalid email delivery transition: ${from} → ${to}`);
  }
  return to;
}

export function applyEmailDeliveryTransition(row, to, patch = {}) {
  const from = row.status || 'queued';
  const next = transitionEmailDelivery(from, to);
  return { ...row, ...patch, status: next };
}