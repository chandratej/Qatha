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

  it('marks notification read in mock mode', async () => {
    const {
      createInAppNotification,
      listNotificationsForUser,
      markNotificationRead,
      markAllNotificationsRead,
    } = await import(`./notificationsStore.js?test=${Date.now()}-read`);
    const userId = `user-read-${Date.now()}`;
    const n = await createInAppNotification(userId, 'moderation_outcome', { body: 'Approved.' });
    const read = await markNotificationRead(userId, n.id);
    assert.ok(read.read_at);
    const feed = await listNotificationsForUser(userId);
    assert.equal(feed[0].read_at, read.read_at);

    await createInAppNotification(userId, 'review_assigned', { body: 'New invite.' });
    const marked = await markAllNotificationsRead(userId);
    assert.equal(marked, 1);
  });
});