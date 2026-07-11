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

    const { onboarding: pending } = await certifyReviewer(userId);
    assert.equal(pending.status, 'pending_moderation');
    assert.equal(pending.trainingCompleted, true);

    const loaded = await getReviewerOnboarding(userId);
    assert.equal(loaded.status, 'pending_moderation');
    assert.equal(loaded.genres.length, 2);
  });

  it('moderator approves pending application', async () => {
    const {
      applyToReviewerPool,
      certifyReviewer,
      moderateReviewerApplication,
      getReviewerOnboarding,
    } = await import(`./reviewerProfileStore.js?test=${Date.now() + 1}`);

    const userId = `mod-reviewer-${Date.now()}`;
    await applyToReviewerPool(userId, {
      genres: ['romance'],
      languages: ['telugu'],
      motivation: 'I bring a decade of Telugu literary critique experience.',
    });
    await certifyReviewer(userId);

    const result = await moderateReviewerApplication('mod-1', userId, 'approve', 'Strong motivation');
    assert.equal(result.onboarding.status, 'certified');

    const loaded = await getReviewerOnboarding(userId);
    assert.equal(loaded.status, 'certified');
  });
});