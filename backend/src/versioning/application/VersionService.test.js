/**
 * Version Service — unit tests (memory storage).
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryVersionStorage } from '../infrastructure/MemoryVersionStorage.js';
import { createVersionService } from './VersionService.js';

describe('VersionService', () => {
  let service;

  beforeEach(() => {
    service = createVersionService({
      storage: createMemoryVersionStorage(),
      rules: {
        minIntervalMs: 0,
        significantEditChars: 10,
        onStoryCreate: true,
        onChapterCreate: true,
        onPublish: true,
        onManualSave: true,
        maxVersionsPerChapter: 50,
      },
    });
  });

  const sampleContent = {
    title: 'Chapter 1',
    scenes: [{ id: 's1', title: 'Opening', content: '<p>Hello world story text here</p>' }],
  };

  it('creates a manual version with monotonic numbers', async () => {
    const v1 = await service.createManualVersion({
      storyId: 'story-1',
      chapterId: '1',
      createdBy: 'user-1',
      content: sampleContent,
    });
    const v2 = await service.createManualVersion({
      storyId: 'story-1',
      chapterId: '1',
      createdBy: 'user-1',
      content: sampleContent,
      versionName: 'After edit',
    });
    assert.equal(v1.metadata.versionNumber, 1);
    assert.equal(v2.metadata.versionNumber, 2);
    assert.equal(v2.metadata.versionName, 'After edit');
    assert.equal(v1.metadata.versionType, 'Manual');
  });

  it('auto checkpoint skips within interval when minIntervalMs > 0', async () => {
    const gated = createVersionService({
      storage: createMemoryVersionStorage(),
      rules: {
        minIntervalMs: 60_000,
        significantEditChars: 10,
        onStoryCreate: true,
        onChapterCreate: true,
        onPublish: true,
        onManualSave: true,
        maxVersionsPerChapter: 50,
      },
    });
    const first = await gated.createAutoCheckpoint({
      storyId: 'story-1',
      chapterId: '1',
      createdBy: 'user-1',
      content: sampleContent,
    });
    const second = await gated.createAutoCheckpoint({
      storyId: 'story-1',
      chapterId: '1',
      createdBy: 'user-1',
      content: sampleContent,
    });
    assert.equal(first.skipped, false);
    assert.equal(second.skipped, true);
    assert.equal(second.reason, 'interval');
  });

  it('restore creates a new version without deleting history', async () => {
    const v1 = await service.createManualVersion({
      storyId: 'story-1',
      chapterId: '1',
      createdBy: 'user-1',
      content: { plainContent: 'Original text' },
      versionName: 'Original',
    });
    await service.createManualVersion({
      storyId: 'story-1',
      chapterId: '1',
      createdBy: 'user-1',
      content: { plainContent: 'Changed text' },
      versionName: 'Changed',
    });

    const restored = await service.restoreVersion({
      versionId: v1.metadata.id,
      createdBy: 'user-1',
    });

    assert.equal(restored.metadata.status, 'Restored');
    assert.equal(restored.metadata.restoredFromId, v1.metadata.id);
    assert.equal(restored.content.plainContent, 'Original text');
    assert.equal(restored.metadata.versionNumber, 3);

    const { items, total } = await service.listVersions({ storyId: 'story-1', chapterId: '1' });
    assert.equal(total, 3);
    assert.ok(items.find((x) => x.metadata.id === v1.metadata.id));
  });

  it('timeline returns entries', async () => {
    await service.createDraftVersion({
      storyId: 'story-1',
      chapterId: '1',
      createdBy: 'user-1',
      content: sampleContent,
    });
    await service.createPublishVersion({
      storyId: 'story-1',
      chapterId: '1',
      createdBy: 'user-1',
      content: sampleContent,
    });
    const timeline = await service.getTimeline('story-1', '1');
    assert.equal(timeline.entries.length, 2);
    const types = timeline.entries.map((e) => e.versionType).sort();
    assert.deepEqual(types, ['Draft', 'Publish']);
    assert.equal(timeline.total, 2);
  });

  it('publish version type is Publish', async () => {
    const v = await service.createPublishVersion({
      storyId: 'story-1',
      chapterId: '2',
      createdBy: 'user-1',
      content: sampleContent,
    });
    assert.equal(v.metadata.versionType, 'Publish');
  });

  it('future branch APIs are not implemented', async () => {
    await assert.rejects(() => service.createBranch(), (err) => err.status === 501);
    await assert.rejects(() => service.mergeBranch(), (err) => err.status === 501);
    await assert.rejects(() => service.compareVersions(), (err) => err.status === 501);
  });
});
