import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveFreeChapterCount,
  getUnprovenFreeChapterDefault,
  resolveFreeChapterCountForStory,
  getOrLockSampleFreeChapterCount,
  __resetMockSampleLocksForTests,
  PROVEN_FREE_CHAPTERS,
  UNPROVEN_FREE_CHAPTER_COHORTS,
} from './freeChapterThreshold.js';

describe('deriveFreeChapterCount', () => {
  it('gives proven stories (Performing+) 3 free chapters', () => {
    const r = deriveFreeChapterCount({ trustLevel: 'performing' });
    assert.deepEqual(r, { count: PROVEN_FREE_CHAPTERS, source: 'proven_story' });
    assert.equal(deriveFreeChapterCount({ trustLevel: 'apex' }).count, 3);
  });

  it('gives unproven stories the platform default', () => {
    const r = deriveFreeChapterCount({ trustLevel: 'incubation' });
    assert.deepEqual(r, { count: getUnprovenFreeChapterDefault(), source: 'unproven_default' });
  });

  it('grants proven-author carryover to a brand new unrated story', () => {
    const r = deriveFreeChapterCount({ trustLevel: 'incubation', authorHasProvenStory: true });
    assert.deepEqual(r, { count: PROVEN_FREE_CHAPTERS, source: 'proven_author_carryover' });
  });

  it('manual override always wins, even over a proven story', () => {
    const r = deriveFreeChapterCount({ trustLevel: 'apex', overrideCount: 7 });
    assert.deepEqual(r, { count: 7, source: 'override' });
  });

  it('applies an unproven-tier A/B cohort when no override/proven signal applies', () => {
    const r = deriveFreeChapterCount({ trustLevel: 'foundation', cohort: 'control_5' });
    assert.deepEqual(r, { count: UNPROVEN_FREE_CHAPTER_COHORTS.control_5, source: 'cohort:control_5' });
  });

  it('ignores an unknown cohort key and falls through to the platform default', () => {
    const r = deriveFreeChapterCount({ trustLevel: 'foundation', cohort: 'not_a_real_cohort' });
    assert.equal(r.source, 'unproven_default');
  });
});

describe('getUnprovenFreeChapterDefault', () => {
  const ORIGINAL = process.env.KATHA_UNPROVEN_FREE_CHAPTERS;
  after(() => {
    if (ORIGINAL === undefined) delete process.env.KATHA_UNPROVEN_FREE_CHAPTERS;
    else process.env.KATHA_UNPROVEN_FREE_CHAPTERS = ORIGINAL;
  });

  it('defaults to 12 with no env override', () => {
    delete process.env.KATHA_UNPROVEN_FREE_CHAPTERS;
    assert.equal(getUnprovenFreeChapterDefault(), 12);
  });

  it('respects a valid env override without a code deploy', () => {
    process.env.KATHA_UNPROVEN_FREE_CHAPTERS = '15';
    assert.equal(getUnprovenFreeChapterDefault(), 15);
  });

  it('rejects an out-of-range env override and falls back to default', () => {
    process.env.KATHA_UNPROVEN_FREE_CHAPTERS = '999';
    assert.equal(getUnprovenFreeChapterDefault(), 12);
    delete process.env.KATHA_UNPROVEN_FREE_CHAPTERS;
  });
});

describe('resolveFreeChapterCountForStory (mock mode)', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });

  it('derives from total_readers heuristic when trust_level is absent', async () => {
    const r = await resolveFreeChapterCountForStory({ id: 's1', author_id: 'a1', total_readers: 50 });
    assert.equal(r.source, 'unproven_default');
  });

  it('honors a per-story override even with low readership', async () => {
    const r = await resolveFreeChapterCountForStory({
      id: 's1', author_id: 'a1', total_readers: 10, free_chapter_count: 8,
    });
    assert.deepEqual(r, { count: 8, source: 'override' });
  });

  it('treats a high-readership story as proven via the heuristic', async () => {
    const r = await resolveFreeChapterCountForStory({ id: 's1', author_id: 'a1', total_readers: 5000 });
    assert.deepEqual(r, { count: PROVEN_FREE_CHAPTERS, source: 'proven_story' });
  });
});

describe('getOrLockSampleFreeChapterCount (mock mode)', () => {
  before(() => {
    process.env.MOCK_MODE = 'true';
  });
  beforeEach(() => __resetMockSampleLocksForTests());

  it('freezes the derived count on first access for a logged-in reader', async () => {
    const story = { id: 'story-lock-1', author_id: 'a1', total_readers: 10 };
    const first = await getOrLockSampleFreeChapterCount('user-1', story);
    assert.equal(first, getUnprovenFreeChapterDefault());

    // Story crosses into Performing after the reader already started sampling —
    // the reader's locked value must not move.
    story.trust_level = 'performing';
    const second = await getOrLockSampleFreeChapterCount('user-1', story);
    assert.equal(second, first);
  });

  it('resolves live (no lock) for anonymous readers', async () => {
    const story = { id: 'story-lock-2', author_id: 'a1', trust_level: 'incubation' };
    const anon1 = await getOrLockSampleFreeChapterCount(null, story);
    assert.equal(anon1, getUnprovenFreeChapterDefault());
    story.trust_level = 'performing';
    const anon2 = await getOrLockSampleFreeChapterCount(null, story);
    assert.equal(anon2, PROVEN_FREE_CHAPTERS);
  });

  it('locks each user independently per story', async () => {
    const story = { id: 'story-lock-3', author_id: 'a1', trust_level: 'incubation' };
    const a = await getOrLockSampleFreeChapterCount('user-a', story);
    story.free_chapter_count = 7;
    const b = await getOrLockSampleFreeChapterCount('user-b', story);
    assert.equal(a, getUnprovenFreeChapterDefault());
    assert.equal(b, 7);
  });
});
