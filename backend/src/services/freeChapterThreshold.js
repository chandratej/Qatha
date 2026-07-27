/**
 * Free-chapter threshold auto-tiering — proven vs. unproven story/author.
 * See Worklog/23 JUL 2026/katha-free-chapter-threshold-prompt.md
 *
 * 3 free chapters if the story itself is Performing+ (already monetizing), or the author has any
 * prior story that ever reached Performing+ (carryover, even if this story is brand new/unrated).
 * Otherwise the platform's "unproven" default (config, no deploy needed) — with room for an A/B
 * cohort split within that tier, and a per-story manual override that always wins.
 */

import { getSupabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { TRUST_ORDER, trustLevelForReaders } from './storyTrust.js';

export const PROVEN_FREE_CHAPTERS = 3;
const DEFAULT_UNPROVEN_FREE_CHAPTERS = 12;
const MIN_UNPROVEN_FREE_CHAPTERS = 5;
const MAX_UNPROVEN_FREE_CHAPTERS = 20;

/**
 * A/B cohorts for the unproven tier (Req 3.3) — assign a story to one via
 * `free_chapter_cohort`; `null`/unknown cohort falls through to the platform default.
 */
export const UNPROVEN_FREE_CHAPTER_COHORTS = Object.freeze({
  control_5: 5,
  test_12: 12,
  test_15: 15,
});

/** Platform default for the unproven tier — env-configurable, no deploy required. */
export function getUnprovenFreeChapterDefault() {
  const n = Number(process.env.KATHA_UNPROVEN_FREE_CHAPTERS);
  if (Number.isFinite(n) && n >= MIN_UNPROVEN_FREE_CHAPTERS && n <= MAX_UNPROVEN_FREE_CHAPTERS) {
    return Math.floor(n);
  }
  return DEFAULT_UNPROVEN_FREE_CHAPTERS;
}

export function isProvenTrustLevel(trustLevel) {
  return TRUST_ORDER.indexOf(trustLevel) >= TRUST_ORDER.indexOf('performing');
}

/**
 * Pure derivation — no I/O. `overrideCount` (per-story manual override) always wins.
 * Format Spec v1: Story Collection forces freeUnits=1 (story 1 permanently free).
 */
export function deriveFreeChapterCount({
  trustLevel,
  authorHasProvenStory = false,
  overrideCount = null,
  cohort = null,
  contentType = null,
} = {}) {
  // Collection paywall: story 1 free forever; story 2+ gated (Format Spec §2).
  if (contentType === 'short_story_collection') {
    if (Number.isFinite(overrideCount) && overrideCount > 0) {
      return { count: Math.floor(overrideCount), source: 'override' };
    }
    return { count: 1, source: 'collection_story1_free' };
  }

  if (Number.isFinite(overrideCount) && overrideCount > 0) {
    return { count: Math.floor(overrideCount), source: 'override' };
  }
  if (isProvenTrustLevel(trustLevel)) {
    return { count: PROVEN_FREE_CHAPTERS, source: 'proven_story' };
  }
  if (authorHasProvenStory) {
    return { count: PROVEN_FREE_CHAPTERS, source: 'proven_author_carryover' };
  }
  if (cohort && UNPROVEN_FREE_CHAPTER_COHORTS[cohort] != null) {
    return { count: UNPROVEN_FREE_CHAPTER_COHORTS[cohort], source: `cohort:${cohort}` };
  }
  return { count: getUnprovenFreeChapterDefault(), source: 'unproven_default' };
}

/** Mock-mode author track record — no cross-story trust history in seed data yet. */
async function authorHasProvenStoryElsewhere(authorId, excludeStoryId) {
  if (!authorId) return false;

  if (isMockMode()) return false;

  const sb = getSupabase();
  if (!sb) return false;
  let q = sb
    .from('stories')
    .select('id')
    .eq('author_id', authorId)
    .not('ever_reached_performing_at', 'is', null)
    .limit(1);
  if (excludeStoryId) q = q.neq('id', excludeStoryId);
  const { data, error } = await q;
  if (error) return false;
  return (data || []).length > 0;
}

/**
 * Resolve the free-chapter count for a story object (works against both mock seed
 * stories and real Supabase rows — both shapes carry author_id/total_readers,
 * and optionally trust_level/free_chapter_count/free_chapter_cohort).
 */
export async function resolveFreeChapterCountForStory(story) {
  if (!story) return { count: getUnprovenFreeChapterDefault(), source: 'unproven_default' };

  const trustLevel = story.trust_level || trustLevelForReaders(story.total_readers || 0);
  const authorHasProvenStory = await authorHasProvenStoryElsewhere(story.author_id, story.id);

  return deriveFreeChapterCount({
    trustLevel,
    authorHasProvenStory,
    contentType: story.content_type || null,
    overrideCount: story.free_chapter_count,
    cohort: story.free_chapter_cohort,
  });
}

/** In-memory lock table for mock mode, mirrors reader_story_sample_locks. */
const mockSampleLocks = new Map(); // `${userId}:${storyId}` -> { count, source }

/**
 * Returns the free-chapter count this reader's sample is locked to, deriving and
 * freezing it on first access. Anonymous reads (no userId) always resolve live —
 * there's no durable identity to freeze against, so anonymous behavior tracks the
 * story's current derived value, matching "no login required to sample" (Req 3.2).
 */
export async function getOrLockSampleFreeChapterCount(userId, story) {
  const resolved = await getOrLockSampleFreeChapterCountWithSource(userId, story);
  return resolved.count;
}

/**
 * Same as getOrLockSampleFreeChapterCount, but also returns the cohort/derivation `source`
 * (e.g. "proven_story", "cohort:control_5") — needed so callers can attach it to analytics
 * events for the founder's per-cohort conversion report (Req 3.3/3.4).
 */
export async function getOrLockSampleFreeChapterCountWithSource(userId, story) {
  if (!userId || !story?.id) {
    return resolveFreeChapterCountForStory(story);
  }

  if (isMockMode()) {
    const key = `${userId}:${story.id}`;
    if (mockSampleLocks.has(key)) return mockSampleLocks.get(key);
    const resolved = await resolveFreeChapterCountForStory(story);
    mockSampleLocks.set(key, resolved);
    return resolved;
  }

  const sb = getSupabase();
  if (!sb) {
    return resolveFreeChapterCountForStory(story);
  }

  const { data: existing, error: lockReadErr } = await sb
    .from('reader_story_sample_locks')
    .select('free_chapter_count, free_chapter_source')
    .eq('user_id', userId)
    .eq('story_id', story.id)
    .maybeSingle();
  // Table may be missing until migration 042 is applied — fall through to live derive.
  if (lockReadErr) {
    return resolveFreeChapterCountForStory(story);
  }
  if (existing) return { count: existing.free_chapter_count, source: existing.free_chapter_source };

  const resolved = await resolveFreeChapterCountForStory(story);
  const { error: lockWriteErr } = await sb
    .from('reader_story_sample_locks')
    .upsert(
      {
        user_id: userId,
        story_id: story.id,
        free_chapter_count: resolved.count,
        free_chapter_source: resolved.source,
      },
      { onConflict: 'user_id,story_id' },
    );
  if (lockWriteErr) {
    // Non-fatal: sample still works without a durable lock row.
  }
  return resolved;
}

/** Test-only: reset in-memory mock locks between test cases. */
export function __resetMockSampleLocksForTests() {
  mockSampleLocks.clear();
}
