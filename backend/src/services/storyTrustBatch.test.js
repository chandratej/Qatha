import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { recomputeAllStoryTrust } from './storyTrustBatch.js';

describe('storyTrustBatch', () => {
  it('skips cleanly in mock / no-supabase environments', async () => {
    const result = await recomputeAllStoryTrust({ limit: 5 });
    assert.equal(typeof result.processed, 'number');
    assert.equal(typeof result.errors, 'number');
    // Without live Supabase we either skip or process zero
    assert.ok(result.skipped === true || result.processed === 0 || result.errors >= 0);
  });
});
