import { describe, expect, it } from 'vitest';
import { buildEventProgress, formatEventDeadline } from './eventProgress';
import type { EventRegistration, KathaEvent } from '../types/platform';

const event: KathaEvent = {
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

const reg: EventRegistration = {
  id: 'r1',
  event_id: 'e1',
  participant_id: 'u1',
  entry_fee_paid_inr: 99,
  payment_status: 'paid',
  registered_at: new Date().toISOString(),
};

describe('eventProgress', () => {
  it('formats deadlines for Indian locale', () => {
    const label = formatEventDeadline('2026-07-15T12:00:00.000Z');
    expect(label).toMatch(/2026/);
    expect(label).toMatch(/Jul/i);
  });

  it('starts at register when not enrolled', () => {
    const steps = buildEventProgress(event, null);
    expect(steps[0]?.state).toBe('active');
    expect(steps[1]?.state).toBe('upcoming');
  });

  it('advances to submit after paid registration', () => {
    const steps = buildEventProgress(event, reg);
    expect(steps[0]?.state).toBe('done');
    expect(steps[1]?.state).toBe('done');
    expect(steps[2]?.state).toBe('active');
  });

  it('shows judging after submission', () => {
    const steps = buildEventProgress(event, {
      ...reg,
      story_id: 's1',
      story_title: 'My Story',
    });
    expect(steps[2]?.state).toBe('done');
    expect(steps[3]?.state).toBe('active');
  });
});