import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('creatorNotificationPrefsStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('returns defaults when no prefs saved', async () => {
    const { getCreatorNotificationPrefs } = await import(
      `./creatorNotificationPrefsStore.js?test=${Date.now()}`
    );
    const userId = `prefs-${Date.now()}`;
    const prefs = await getCreatorNotificationPrefs(userId);
    assert.equal(prefs.reviews, true);
    assert.equal(prefs.publishing, true);
  });

  it('updates and merges domain toggles', async () => {
    const { getCreatorNotificationPrefs, updateCreatorNotificationPrefs } = await import(
      `./creatorNotificationPrefsStore.js?test=${Date.now()}-update`
    );
    const userId = `prefs-update-${Date.now()}`;
    const updated = await updateCreatorNotificationPrefs(userId, { reviews: false, publishing: false });
    assert.equal(updated.reviews, false);
    assert.equal(updated.publishing, false);
    assert.equal(updated.moderation, true);

    const loaded = await getCreatorNotificationPrefs(userId);
    assert.deepEqual(loaded, updated);
  });

  it('isNotificationDomainEnabled respects opt-out', async () => {
    const { updateCreatorNotificationPrefs, isNotificationDomainEnabled } = await import(
      `./creatorNotificationPrefsStore.js?test=${Date.now()}-enabled`
    );
    const userId = `prefs-enabled-${Date.now()}`;
    await updateCreatorNotificationPrefs(userId, { publishing: false });
    assert.equal(await isNotificationDomainEnabled(userId, 'publishing'), false);
    assert.equal(await isNotificationDomainEnabled(userId, 'reviews'), true);
  });
});