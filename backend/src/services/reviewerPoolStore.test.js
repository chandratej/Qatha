import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('reviewerPoolStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('loads seeded pool in mock mode', async () => {
    const { loadReviewerPool, getReviewerPoolSummary } = await import(
      `./reviewerPoolStore.js?test=${Date.now()}`
    );
    const pool = await loadReviewerPool();
    assert.ok(pool.length >= 6);
    const summary = await getReviewerPoolSummary();
    assert.ok(summary.total >= 6);
    assert.equal(typeof summary.canFulfill, 'boolean');
  });
});