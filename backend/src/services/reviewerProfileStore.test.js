import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

const PASSING_TRIAL_REVIEW = {
  strengths: 'Vivid sensory opening with strong place memory.',
  weaknesses: 'The emotional beat could land harder in the second sentence.',
  suggestion: 'Add one interior thought that connects teak grain to family history.',
  rubric_scores: {
    constructiveness: 4,
    evidence: 5,
    actionability: 4,
    craft_sensitivity: 5,
  },
};

async function completeOnboarding(store, userId) {
  await store.completeReviewerTraining(userId);
  return store.submitTrialReview(userId, PASSING_TRIAL_REVIEW);
}

describe('reviewerProfileStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('apply then trial review bootstraps reviewer profile', async () => {
    const store = await import(`./reviewerProfileStore.js?test=${Date.now()}`);

    const userId = `reviewer-${Date.now()}`;
    const { onboarding: applied } = await store.applyToReviewerPool(userId, {
      genres: ['romance', 'fantasy'],
      languages: ['telugu'],
      motivation: 'I want to help Telugu authors improve craft with respectful notes.',
      agreement_accepted: true,
      agreement_version: 'v1.0.0',
    });
    assert.equal(applied.status, 'applied');
    assert.equal(applied.trainingCompleted, false);

    const { onboarding: pending } = await completeOnboarding(store, userId);
    assert.equal(pending.status, 'pending_moderation');
    assert.equal(pending.trainingCompleted, true);
    assert.ok(pending.trialReviewSubmitted);

    const loaded = await store.getReviewerOnboarding(userId);
    assert.equal(loaded.status, 'pending_moderation');
    assert.equal(loaded.genres.length, 2);
  });

  it('moderator approves pending application', async () => {
    const store = await import(`./reviewerProfileStore.js?test=${Date.now() + 1}`);

    const userId = `mod-reviewer-${Date.now()}`;
    await store.applyToReviewerPool(userId, {
      genres: ['romance'],
      languages: ['telugu'],
      motivation: 'I bring a decade of Telugu literary critique experience.',
      agreement_accepted: true,
      agreement_version: 'v1.0.0',
    });
    await completeOnboarding(store, userId);

    const result = await store.moderateReviewerApplication('mod-1', userId, 'approve', 'Strong motivation');
    assert.equal(result.onboarding.status, 'certified');

    const loaded = await store.getReviewerOnboarding(userId);
    assert.equal(loaded.status, 'certified');
  });
});