import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('debutSeasonStore', () => {
  beforeEach(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('returns active season in mock mode', async () => {
    const { getActiveSeason, __resetMockDebutSeasonForTests } = await import(
      `./debutSeasonStore.js?test=${Date.now()}-season`
    );
    __resetMockDebutSeasonForTests();
    const season = await getActiveSeason();
    assert.ok(season);
    assert.equal(season.status, 'active');
    assert.equal(season.chapter_threshold, 50);
  });

  it('enrolls author on first publish and tracks progress', async () => {
    const {
      enrollAuthorOnFirstPublish,
      getDebutProgress,
      syncDebutMetrics,
      __resetMockDebutSeasonForTests,
    } = await import(`./debutSeasonStore.js?test=${Date.now()}-enroll`);
    const { mockChapterStore } = await import('../data/seed.js');

    __resetMockDebutSeasonForTests();
    mockChapterStore.clear();

    const authorId = `author-${Date.now()}`;
    const storyId = `story-${Date.now()}`;

    mockChapterStore.set(`${storyId}:1`, {
      story_id: storyId,
      creator_id: authorId,
      chapter_number: 1,
      status: 'published',
      content: 'word '.repeat(2100),
      word_count: 2100,
    });

    const enroll = await enrollAuthorOnFirstPublish(authorId, storyId);
    assert.equal(enroll.enrolled, true);
    assert.equal(enroll.entry.author_id, authorId);
    assert.equal(enroll.entry.story_id, storyId);

    const progress = await getDebutProgress(authorId);
    assert.equal(progress.enrolled, true);
    assert.equal(progress.chapter_count, 1);
    assert.equal(progress.progress_pct, 2);
    assert.equal(progress.graduated, false);

    await syncDebutMetrics(storyId);
    const progress2 = await getDebutProgress(authorId);
    assert.equal(progress2.chapter_count, 1);
  });

  it('rejects duplicate enrollment for same author', async () => {
    const { enrollAuthorOnFirstPublish, __resetMockDebutSeasonForTests } = await import(
      `./debutSeasonStore.js?test=${Date.now()}-dup`
    );
    const { mockChapterStore } = await import('../data/seed.js');

    __resetMockDebutSeasonForTests();
    mockChapterStore.clear();

    const authorId = `author-dup-${Date.now()}`;
    const storyId = `story-dup-${Date.now()}`;

    mockChapterStore.set(`${storyId}:1`, {
      story_id: storyId,
      creator_id: authorId,
      chapter_number: 1,
      status: 'published',
      content: 'hello world',
      word_count: 2,
    });

    const first = await enrollAuthorOnFirstPublish(authorId, storyId);
    const second = await enrollAuthorOnFirstPublish(authorId, storyId);
    assert.equal(first.enrolled, true);
    assert.equal(second.enrolled, false);
    assert.equal(second.alreadyEnrolled, true);
  });

  it('graduates when 50 chapters and story completed', async () => {
    const {
      enrollAuthorOnFirstPublish,
      graduateDebutStory,
      getDebutProgress,
      __resetMockDebutSeasonForTests,
      __setMockStoryMetaForTests,
    } = await import(`./debutSeasonStore.js?test=${Date.now()}-grad`);
    const { mockChapterStore } = await import('../data/seed.js');

    __resetMockDebutSeasonForTests();
    mockChapterStore.clear();

    const authorId = `author-grad-${Date.now()}`;
    const storyId = `story-grad-${Date.now()}`;

    for (let i = 1; i <= 50; i += 1) {
      mockChapterStore.set(`${storyId}:${i}`, {
        story_id: storyId,
        creator_id: authorId,
        chapter_number: i,
        status: 'published',
        word_count: 2100,
      });
    }

    await enrollAuthorOnFirstPublish(authorId, storyId);

    const blocked = await graduateDebutStory(authorId, storyId);
    assert.equal(blocked.graduated, false);
    assert.equal(blocked.reason, 'story_not_completed');

    const progressBefore = await getDebutProgress(authorId);
    assert.equal(progressBefore.progress_pct, 100);

    __setMockStoryMetaForTests(storyId, {
      id: storyId,
      title: 'Graduated Arc',
      author_id: authorId,
      story_status: 'completed',
    });

    const graduated = await graduateDebutStory(authorId, storyId);
    assert.equal(graduated.graduated, true);
    assert.ok(graduated.award_level);

    const progressAfter = await getDebutProgress(authorId);
    assert.equal(progressAfter.graduated, true);
    assert.equal(progressAfter.eligibility_status, 'graduated');
  });

  it('onChapterPublished enrolls on first published chapter', async () => {
    const { onChapterPublished, getDebutProgress, __resetMockDebutSeasonForTests } = await import(
      `./debutSeasonStore.js?test=${Date.now()}-hook`
    );
    const { mockChapterStore } = await import('../data/seed.js');

    __resetMockDebutSeasonForTests();
    mockChapterStore.clear();

    const authorId = `author-hook-${Date.now()}`;
    const storyId = `story-hook-${Date.now()}`;

    mockChapterStore.set(`${storyId}:1`, {
      story_id: storyId,
      creator_id: authorId,
      chapter_number: 1,
      status: 'published',
      word_count: 2200,
    });

    const result = await onChapterPublished(authorId, storyId);
    assert.equal(result.handled, true);
    assert.equal(result.enrolled, true);

    const progress = await getDebutProgress(authorId);
    assert.equal(progress.enrolled, true);
    assert.equal(progress.chapter_count, 1);
  });
});