import { describe, expect, it } from 'vitest';
import {
  eventAcceptsRegistration,
  platformRevenueFromEntry,
  isAcquisitionEvent,
  registrationCtaLabel,
} from './eventRegistration';
import type { KathaEvent } from '../types/platform';

const base: KathaEvent = {
  id: 'e1',
  organizer_id: 'platform',
  title: 'Test',
  event_type: 'genre_challenge',
  status: 'registration_open',
  judging_model: 'weighted_rubric',
  entry_fee_inr: 99,
  prize_pool_inr: 10000,
  platform_commission_pct: 15,
  organizer_commission_pct: 10,
};

describe('eventRegistration', () => {
  it('allows registration when open', () => {
    expect(eventAcceptsRegistration(base)).toBe(true);
  });

  it('blocks draft and closed', () => {
    expect(eventAcceptsRegistration({ ...base, status: 'draft' })).toBe(false);
    expect(eventAcceptsRegistration({ ...base, status: 'completed' })).toBe(false);
  });

  it('respects registration close date', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(eventAcceptsRegistration({ ...base, registration_closes_at: past })).toBe(false);
  });

  it('computes platform revenue on paid entry (15%)', () => {
    const split = platformRevenueFromEntry(100);
    expect(split.platformInr).toBe(15);
    expect(split.prizePoolInr).toBeGreaterThan(0);
  });

  it('labels free vs paid CTAs', () => {
    expect(registrationCtaLabel({ ...base, entry_fee_inr: 0 })).toMatch(/free/i);
    expect(registrationCtaLabel(base)).toContain('99');
  });

  it('flags acquisition events', () => {
    expect(isAcquisitionEvent({ ...base, entry_fee_inr: 0 })).toBe(true);
    expect(isAcquisitionEvent(base)).toBe(false);
  });
});
