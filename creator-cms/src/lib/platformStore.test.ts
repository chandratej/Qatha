import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getEventRevenueSummary,
  getMyEventRegistration,
  getPlatformEvent,
  registerForEvent,
  submitToEvent,
} from './platformStore';

const EVENTS_KEY = 'katha_platform_events';
const REGS_KEY = 'katha_event_registrations';
const SUBS_KEY = 'katha_event_submissions';
const REVENUE_KEY = 'katha_event_revenue_ledger';

const seedEvent = {
  id: 'evt-test-free',
  organizer_id: 'platform',
  title: 'E2E Free Contest',
  description: 'Test event',
  event_type: 'first_chapter_challenge',
  status: 'registration_open',
  judging_model: 'double_blind',
  entry_fee_inr: 0,
  prize_pool_inr: 5000,
  platform_commission_pct: 15,
  organizer_commission_pct: 0,
  registration_count: 0,
  submission_count: 0,
  registration_opens_at: new Date(Date.now() - 86400000).toISOString(),
  registration_closes_at: new Date(Date.now() + 30 * 86400000).toISOString(),
};

const paidEvent = {
  ...seedEvent,
  id: 'evt-test-paid',
  title: 'E2E Paid Contest',
  event_type: 'genre_challenge',
  entry_fee_inr: 99,
  prize_pool_inr: 10000,
};

function clearStore() {
  localStorage.removeItem(EVENTS_KEY);
  localStorage.removeItem(REGS_KEY);
  localStorage.removeItem(SUBS_KEY);
  localStorage.removeItem(REVENUE_KEY);
}

describe('platformStore event registration', () => {
  beforeEach(() => {
    clearStore();
    localStorage.setItem(EVENTS_KEY, JSON.stringify([seedEvent, paidEvent]));
  });

  afterEach(() => {
    clearStore();
    vi.restoreAllMocks();
  });

  it('registers free with waived payment', () => {
    const { registration } = registerForEvent({
      eventId: 'evt-test-free',
      participantId: 'creator-1',
      participantName: 'Test Creator',
    });
    expect(registration.payment_status).toBe('waived');
    expect(getMyEventRegistration('evt-test-free', 'creator-1')).toBeDefined();
    const event = getPlatformEvent('evt-test-free');
    expect(event?.registration_count).toBe(1);
  });

  it('tracks platform fee on paid registration', () => {
    const { registration } = registerForEvent({
      eventId: 'evt-test-paid',
      participantId: 'creator-2',
      markPaid: true,
    });
    expect(registration.payment_status).toBe('paid');
    expect(registration.platform_fee_inr).toBeGreaterThan(0);
    const rev = getEventRevenueSummary();
    expect(rev.paidRegistrations).toBe(1);
    expect(rev.totalPlatformFeesInr).toBeGreaterThan(0);
  });

  it('rejects duplicate registration', () => {
    registerForEvent({ eventId: 'evt-test-free', participantId: 'creator-3' });
    const again = registerForEvent({ eventId: 'evt-test-free', participantId: 'creator-3' });
    expect(again.alreadyRegistered).toBe(true);
  });

  it('requires registration before submit', () => {
    expect(() => submitToEvent({
      eventId: 'evt-test-free',
      participantId: 'no-reg',
      storyId: 'story-1',
      storyTitle: 'Draft',
    })).toThrow(/register/i);
  });

  it('submits story after registration', () => {
    registerForEvent({ eventId: 'evt-test-free', participantId: 'creator-4' });
    const { registration, submission } = submitToEvent({
      eventId: 'evt-test-free',
      participantId: 'creator-4',
      storyId: 'story-42',
      storyTitle: 'Telugu Tale',
    });
    expect(submission.story_id).toBe('story-42');
    expect(registration.story_title).toBe('Telugu Tale');
    expect(getPlatformEvent('evt-test-free')?.submission_count).toBe(1);
  });
});