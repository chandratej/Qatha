import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('mediaAssetStore', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('creates and lists media assets', async () => {
    const { createMediaAsset, listMediaAssets, deleteMediaAsset } = await import(
      `./mediaAssetStore.js?test=${Date.now()}`
    );
    const storyId = `story-media-${Date.now()}`;
    const asset = await createMediaAsset(storyId, 'user-1', {
      url: 'https://example.com/img.png',
      attribution: 'Artist credit',
      asset_type: 'illustration',
    });
    assert.equal(asset.attribution, 'Artist credit');

    const list = await listMediaAssets(storyId);
    assert.equal(list.length, 1);

    await deleteMediaAsset(storyId, asset.id);
    assert.equal((await listMediaAssets(storyId)).length, 0);
  });
});