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

async function certifyReviewer(store, userId) {
  await store.applyToReviewerPool(userId, {
    genres: ['romance'],
    languages: ['telugu'],
    motivation: 'I read Telugu fiction daily and want to give structured feedback.',
    agreement_accepted: true,
    agreement_version: 'v1.0.0',
  });
  await store.completeReviewerTraining(userId);
  await store.submitTrialReview(userId, PASSING_TRIAL_REVIEW);
  await store.moderateReviewerApplication('mod-1', userId, 'approve', 'Strong trial');
}

describe('reviewerProfileStore availability', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('toggles is_available for certified reviewers', async () => {
    const store = await import(`./reviewerProfileStore.js?test=${Date.now()}`);
    const userId = `avail-user-${Date.now()}`;

    await certifyReviewer(store, userId);

    const off = await store.setReviewerAvailability(userId, false);
    assert.equal(off.is_available, false);

    const on = await store.setReviewerAvailability(userId, true);
    assert.equal(on.is_available, true);

    const bySlot = await store.getReviewerAvailabilityBySlot(on.pool_slot);
    assert.equal(bySlot.is_available, true);
  });

  it('rejects availability toggle before certification', async () => {
    const store = await import(`./reviewerProfileStore.js?test=${Date.now() + 1}`);
    const userId = `avail-pending-${Date.now()}`;

    await store.applyToReviewerPool(userId, {
      genres: ['romance'],
      languages: ['telugu'],
      motivation: 'I want to help authors with respectful craft notes daily.',
      agreement_accepted: true,
      agreement_version: 'v1.0.0',
    });

    await assert.rejects(
      () => store.setReviewerAvailability(userId, true),
      /Certified reviewers only/,
    );
  });
});