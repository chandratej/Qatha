import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('attributionStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('lists and updates contributor attributions', async () => {
    const { listContributorAttributions, updateContributorAttribution } = await import(
      `./attributionStore.js?test=${Date.now()}`
    );
    const storyId = `story-attr-${Date.now()}`;
    const list = await listContributorAttributions(storyId);
    assert.ok(list.length >= 1);
    assert.equal(list[0].role, 'owner');

    const updated = await updateContributorAttribution(storyId, list[0].id, {
      display_name: 'Lead Author',
      revenue_share_bps: 8000,
    });
    assert.equal(updated.display_name, 'Lead Author');
    assert.equal(updated.revenue_share_bps, 8000);
  });
});