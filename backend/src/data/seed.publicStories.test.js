import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('public reader catalog (mock creator stories)', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('surfaces creator-studio stories after a mock chapter is published', async () => {
    const seed = await import(`./seed.js?t=${Date.now()}`);
    const {
      mockCreatorStories,
      mockChapterStore,
      getPublicStoriesForReader,
      getPublicStoryById,
      getSeedChapter,
      markMockStoryChapterPublished,
    } = seed;

    const storyId = `story-test-${Date.now()}`;
    mockCreatorStories.push({
      id: storyId,
      author_id: 'creator-test',
      title: 'Test Studio Story',
      description: 'From creator studio',
      genre: 'romance',
      is_published: true,
      chapter_count: 0,
      total_readers: 0,
      views_this_week: 0,
      created_at: new Date().toISOString(),
    });

    // Not yet visible — no published chapters
    assert.equal(
      getPublicStoriesForReader().some((s) => s.id === storyId),
      false,
    );

    mockChapterStore.set(`${storyId}:1`, {
      id: `ch-${storyId}-1`,
      story_id: storyId,
      chapter_number: 1,
      title: 'Opening',
      content: '<p>First chapter content from studio.</p>',
      status: 'published',
      creator_id: 'creator-test',
      last_saved_at: new Date().toISOString(),
    });
    markMockStoryChapterPublished(storyId, 1, { creatorId: 'creator-test' });

    const catalog = getPublicStoriesForReader();
    const found = catalog.find((s) => s.id === storyId);
    assert.ok(found, 'story should appear in reader catalog');
    assert.equal(found.chapter_count, 1);
    assert.equal(found.title, 'Test Studio Story');

    const detail = getPublicStoryById(storyId);
    assert.ok(detail);
    assert.equal(detail.chapter_count, 1);

    const chapter = getSeedChapter(storyId, 1);
    assert.ok(chapter);
    assert.match(chapter.content, /First chapter content/);
  });
});
