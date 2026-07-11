import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('reviewerProfileStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('apply then certify bootstraps reviewer profile', async () => {
    const {
      applyToReviewerPool,
      certifyReviewer,
      getReviewerOnboarding,
    } = await import(`./reviewerProfileStore.js?test=${Date.now()}`);

    const userId = `reviewer-${Date.now()}`;
    const { onboarding: applied } = await applyToReviewerPool(userId, {
      genres: ['romance', 'fantasy'],
      languages: ['telugu'],
      motivation: 'I want to help Telugu authors improve craft with respectful notes.',
    });
    assert.equal(applied.status, 'applied');
    assert.equal(applied.trainingCompleted, false);

    const { onboarding: certified, pool_slot } = await certifyReviewer(userId);
    assert.equal(certified.status, 'certified');
    assert.equal(certified.trainingCompleted, true);
    assert.ok(pool_slot?.startsWith('slot-'));

    const loaded = await getReviewerOnboarding(userId);
    assert.equal(loaded.status, 'certified');
    assert.equal(loaded.genres.length, 2);
  });
});