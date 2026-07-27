/**
 * Email delivery state machine — LRC-11-D8
 * Operations Council: queued → sending → terminal (sent | mock_sent | failed).
 */

export const EMAIL_DELIVERY_STATES = [
  'queued',
  'sending',
  'sent',
  'mock_sent',
  'failed',
] as const;

export type EmailDeliveryState = (typeof EMAIL_DELIVERY_STATES)[number];

const TRANSITIONS: Record<EmailDeliveryState, EmailDeliveryState[]> = {
  queued: ['sending', 'failed'],
  sending: ['sent', 'mock_sent', 'failed', 'queued'],
  sent: [],
  mock_sent: [],
  failed: ['queued'],
};

export function canTransitionEmailDelivery(from: EmailDeliveryState, to: EmailDeliveryState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionEmailDelivery(
  from: EmailDeliveryState,
  to: EmailDeliveryState,
): EmailDeliveryState {
  if (!canTransitionEmailDelivery(from, to)) {
    throw new Error(`Invalid email delivery transition: ${from} → ${to}`);
  }
  return to;
}

export const EMAIL_DELIVERY_MAX_RETRIES = 3;