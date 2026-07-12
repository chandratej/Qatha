import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('reviewerProfileStore trial review', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('requires training then accepts passing trial review', async () => {
    const store = await import('./reviewerProfileStore.js');
    const userId = `trial-user-${Date.now()}`;

    await store.applyToReviewerPool(userId, {
      genres: ['romance'],
      languages: ['telugu'],
      motivation: 'I read Telugu fiction daily and want to give structured feedback.',
      agreement_accepted: true,
      agreement_version: 'v1.0.0',
    });

    await store.completeReviewerTraining(userId);

    const result = await store.submitTrialReview(userId, {
      strengths: 'Vivid sensory opening with strong place memory.',
      weaknesses: 'The emotional beat could land harder in the second sentence.',
      suggestion: 'Add one interior thought that connects teak grain to family history.',
      rubric_scores: {
        constructiveness: 4,
        evidence: 5,
        actionability: 4,
        craft_sensitivity: 5,
      },
    });

    assert.equal(result.onboarding.status, 'pending_moderation');
    assert.ok(result.trial_score >= 70);
  });
});