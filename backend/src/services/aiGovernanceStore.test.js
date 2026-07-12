import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('aiGovernanceStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('returns advisory governance dashboard snapshot', async () => {
    const { registerAdvisorySuggestionForGovernance, getAdvisoryGovernanceDashboard } =
      await import(`./aiGovernanceStore.js?test=${Date.now()}`);

    registerAdvisorySuggestionForGovernance({
      id: 'sug-1',
      status: 'accepted',
      provider: 'heuristic',
      category: 'pacing',
      confidence: 0.82,
      created_at: new Date().toISOString(),
      resolved_at: new Date().toISOString(),
    });
    registerAdvisorySuggestionForGovernance({
      id: 'sug-2',
      status: 'ignored',
      provider: 'heuristic',
      category: 'dialogue',
      confidence: 0.55,
      created_at: new Date().toISOString(),
      resolved_at: new Date().toISOString(),
    });

    const dashboard = await getAdvisoryGovernanceDashboard();
    assert.ok(dashboard.summary.total >= 2);
    assert.equal(dashboard.summary.accepted, 1);
    assert.equal(dashboard.summary.ignored, 1);
    assert.ok(dashboard.summary.accept_rate_pct > 0);
  });
});