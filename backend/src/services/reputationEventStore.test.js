import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('reputationEventStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('appends and lists reputation events', async () => {
    const store = await import('./reputationEventStore.js');
    const userId = `rep-user-${Date.now()}`;

    await store.appendReputationEvent(userId, 'review_completed', {
      reason: 'Test event',
      delta_rqi: 2,
      metadata: { request_id: 'req-1' },
    });

    const events = await store.listReputationEvents(userId);
    assert.equal(events.length, 1);
    assert.equal(events[0].event_type, 'review_completed');
    assert.equal(Number(events[0].delta_rqi), 2);
  });
});