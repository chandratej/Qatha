import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('reviewerProfileStore agreement consent', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('requires agreement acceptance on apply', async () => {
    const { applyToReviewerPool } = await import(`./reviewerProfileStore.js?agr=${Date.now()}`);

    await assert.rejects(
      () => applyToReviewerPool(`user-${Date.now()}`, {
        genres: ['romance'],
        motivation: 'I love regional storytelling and want to help authors improve craft.',
        agreement_accepted: false,
        agreement_version: 'v1.0.0',
      }),
      /Accept the Reviewer Agreement/,
    );
  });

  it('records agreement version when accepted', async () => {
    const { applyToReviewerPool, getReviewerOnboarding } =
      await import(`./reviewerProfileStore.js?agr2=${Date.now()}`);

    const userId = `user-agr-${Date.now()}`;
    const { onboarding } = await applyToReviewerPool(userId, {
      genres: ['romance'],
      motivation: 'I love regional storytelling and want to help authors improve craft.',
      agreement_accepted: true,
      agreement_version: 'v1.0.0',
    });

    assert.equal(onboarding.agreement_version, 'v1.0.0');
    assert.ok(onboarding.agreement_accepted_at);

    const loaded = await getReviewerOnboarding(userId);
    assert.equal(loaded.agreement_version, 'v1.0.0');
  });
});