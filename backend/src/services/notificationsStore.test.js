import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('notificationsStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('creates in-app notification in mock mode', async () => {
    const { createInAppNotification, listNotificationsForUser } = await import(
      `./notificationsStore.js?test=${Date.now()}`
    );
    const userId = `user-${Date.now()}`;
    const n = await createInAppNotification(userId, 'review_consensus_ready', {
      body: 'Decision ready for your story.',
    });
    assert.equal(n.notification_type, 'review_consensus_ready');
    const feed = await listNotificationsForUser(userId);
    assert.equal(feed.length, 1);
  });
});