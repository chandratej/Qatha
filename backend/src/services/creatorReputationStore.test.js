import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('creatorReputationStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('returns explainable reputation summary in mock mode', async () => {
    const { getCreatorReputationSummary } = await import(`./creatorReputationStore.js?test=${Date.now()}`);
    const summary = await getCreatorReputationSummary('demo-creator-001');
    assert.ok(summary.top_trust_level);
    assert.ok(summary.total_reads >= 0);
    assert.equal(summary.mock, true);
  });
});