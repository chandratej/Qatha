import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('reviewerDashboardStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('returns dashboard stats for a reviewer slot', async () => {
    const { getReviewerDashboardStats } = await import(`./reviewerDashboardStore.js?test=${Date.now()}`);
    const { seedPeerReviewMockIfEmpty } = await import('./peerReviewStore.js');

    seedPeerReviewMockIfEmpty();
    const stats = await getReviewerDashboardStats('slot-1');

    assert.equal(stats.slot, 'slot-1');
    assert.ok(typeof stats.rqi === 'number');
    assert.ok(typeof stats.reviewsCompleted === 'number');
    assert.ok(typeof stats.invitationsPending === 'number');
    assert.ok(Array.isArray(stats.badges));
  });
});