import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('reviewSlaOpsStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('returns SLA ops dashboard snapshot', async () => {
    const store = await import('./reviewSlaOpsStore.js');
    const dash = await store.getReviewSlaOpsDashboard();
    assert.ok(dash.generated_at);
    assert.ok(typeof dash.active_assignments === 'number');
    assert.ok(typeof dash.breach_pct === 'number');
    assert.ok(dash.email_delivery);
    assert.ok(Array.isArray(dash.escalations));
  });
});