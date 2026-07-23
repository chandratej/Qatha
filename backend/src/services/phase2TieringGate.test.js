import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { getPhase2TieringReadiness, isPhase2TieringEnabled } from './phase2TieringGate.js';

describe('phase2TieringGate', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('reports not eligible in mock mode (no real catalog data)', async () => {
    const readiness = await getPhase2TieringReadiness();
    assert.equal(readiness.eligible, false);
    assert.equal(readiness.trigger_story_count, 50);
    assert.equal(readiness.trigger_subscriber_count, 300);
  });

  it('stays disabled even with the flag flipped on, since the trigger is unmet', async () => {
    process.env.KATHA_PHASE2_TIERING_FLAG = 'true';
    assert.equal(await isPhase2TieringEnabled(), false);
    delete process.env.KATHA_PHASE2_TIERING_FLAG;
  });

  it('stays disabled by default with no flag set', async () => {
    delete process.env.KATHA_PHASE2_TIERING_FLAG;
    assert.equal(await isPhase2TieringEnabled(), false);
  });
});
