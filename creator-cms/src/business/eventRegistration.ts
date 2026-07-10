/**
 * Event registration rules — research-backed contest funnel.
 * Register → Pay (escrow) → Submit → Judge → Prize.
 */

import type { KathaEvent } from '../types/platform';
import { calculateEscrowSplit, type EscrowSplitResult } from './escrow';

const OPEN_STATUSES = new Set([
  'registration_open',
  'submissions_open',
  'published',
]);

export function eventAcceptsRegistration(event: KathaEvent, now = Date.now()): boolean {
  if (!OPEN_STATUSES.has(event.status)) return false;
  if (event.status === 'draft' || event.status === 'cancelled' || event.status === 'completed') {
    return false;
  }
  if (event.registration_opens_at) {
    const opens = Date.parse(event.registration_opens_at);
    if (Number.isFinite(opens) && now < opens) return false;
  }
  if (event.registration_closes_at) {
    const closes = Date.parse(event.registration_closes_at);
    if (Number.isFinite(closes) && now > closes) return false;
  }
  return true;
}

export function eventAcceptsSubmission(event: KathaEvent, now = Date.now()): boolean {
  if (!['submissions_open', 'registration_open'].includes(event.status)) {
    // Allow submit right after free register during open window
    if (event.status !== 'published') return false;
  }
  if (event.submissions_close_at) {
    const closes = Date.parse(event.submissions_close_at);
    if (Number.isFinite(closes) && now > closes) return false;
  }
  return eventAcceptsRegistration(event, now) || event.status === 'submissions_open';
}

/** Platform take per entry — primary contest revenue lever (15% default). */
export function platformRevenueFromEntry(entryFeeInr: number): EscrowSplitResult {
  return calculateEscrowSplit({ entryFeeInr: Math.max(0, entryFeeInr) });
}

/** Acquisition events should be free; monetize via paid genre + sponsor tiers. */
export function isAcquisitionEvent(event: KathaEvent): boolean {
  return event.entry_fee_inr === 0
    || event.event_type === 'first_chapter_challenge'
    || event.event_type === 'writing_sprint';
}

export function registrationCtaLabel(event: KathaEvent): string {
  if (event.entry_fee_inr > 0) {
    return `Register · ₹${event.entry_fee_inr}`;
  }
  return 'Register free';
}
