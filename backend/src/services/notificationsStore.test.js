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

  it('creates chapter_scheduled and chapter_published notifications', async () => {
    const { notifyChapterScheduled, notifyChapterPublished, listNotificationsForUser } = await import(
      `./notificationsStore.js?test=${Date.now()}-publish`
    );
    const userId = `user-publish-${Date.now()}`;
    const scheduled = await notifyChapterScheduled(userId, {
      storyTitle: 'Test Story',
      chapterNumber: 3,
      chapterTitle: 'The Lamp',
      scheduledAt: '2026-08-01T10:00:00Z',
      storyId: 'story-1',
    });
    assert.equal(scheduled.notification_type, 'chapter_scheduled');
    assert.equal(scheduled.domain, 'publishing');

    const published = await notifyChapterPublished(userId, {
      storyTitle: 'Test Story',
      chapterNumber: 3,
      chapterTitle: 'The Lamp',
      storyId: 'story-1',
    });
    assert.equal(published.notification_type, 'chapter_published');

    const feed = await listNotificationsForUser(userId);
    assert.equal(feed.length, 2);
  });

  it('creates reader_feedback_received notification', async () => {
    const { notifyReaderFeedbackReceived, listNotificationsForUser } = await import(
      `./notificationsStore.js?test=${Date.now()}-rf`
    );
    const userId = `user-rf-${Date.now()}`;
    const n = await notifyReaderFeedbackReceived(userId, {
      storyTitle: 'వర్షం వచ్చే ముందు',
      storyId: 'demo-valley-te',
      chapterNumber: 2,
      preview: 'Loved the pacing in this chapter.',
    });
    assert.equal(n.notification_type, 'reader_feedback_received');
    assert.equal(n.domain, 'reader_engagement');
    const feed = await listNotificationsForUser(userId);
    assert.equal(feed.length, 1);
  });

  it('skips notification when domain is opted out', async () => {
    const suffix = Date.now();
    const { updateCreatorNotificationPrefs } = await import('./creatorNotificationPrefsStore.js');
    const { createInAppNotification, listNotificationsForUser } = await import(
      `./notificationsStore.js?test=${suffix}-optout`
    );
    const userId = `user-optout-${suffix}`;
    await updateCreatorNotificationPrefs(userId, { reviews: false });
    const skipped = await createInAppNotification(userId, 'review_assigned', { body: 'Should not appear.' });
    assert.equal(skipped, null);
    const feed = await listNotificationsForUser(userId);
    assert.equal(feed.length, 0);
  });
});