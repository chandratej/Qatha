/**
 * Debut Season persistence — Wave 9 (migration 036)
 * Mirrors packages/shared/debutSeason.ts requirements.
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { mockChapterStore } from '../data/seed.js';
import {
  DEBUT_CHAPTER_THRESHOLD,
  DEBUT_MIN_WORDS_PER_CHAPTER,
  DEBUT_MAX_WORDS_PER_CHAPTER,
  debutProgressPct,
  awardLevelForScore,
} from '../config/debutSeasonConstants.js';

/** @type {object | null} */
let mockActiveSeason = null;
/** @type {Map<string, object>} authorId -> entry */
const mockEntriesDb = new Map();
/** @type {Map<string, object>} storyId -> metrics */
const mockMetricsDb = new Map();
/** @type {Map<string, object>} storyId -> story meta overrides (tests) */
const mockStoryMetaDb = new Map();

function seedMockSeasonIfEmpty() {
  if (mockActiveSeason) return mockActiveSeason;
  const now = new Date();
  const start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 3);
  end.setDate(end.getDate() - 1);
  mockActiveSeason = {
    id: 'season-vasanta-q1',
    season_name: 'Katha Debut Season — Vasanta Q1',
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
    status: 'active',
    chapter_threshold: DEBUT_CHAPTER_THRESHOLD,
    min_words_per_chapter: DEBUT_MIN_WORDS_PER_CHAPTER,
    max_words_per_chapter: DEBUT_MAX_WORDS_PER_CHAPTER,
    created_at: now.toISOString(),
  };
  return mockActiveSeason;
}

function rowToSeason(row) {
  if (!row) return null;
  return {
    id: row.id,
    season_name: row.season_name,
    start_date: row.start_date,
    end_date: row.end_date,
    status: row.status,
    chapter_threshold: row.chapter_threshold ?? DEBUT_CHAPTER_THRESHOLD,
    min_words_per_chapter: row.min_words_per_chapter ?? DEBUT_MIN_WORDS_PER_CHAPTER,
    max_words_per_chapter: row.max_words_per_chapter ?? DEBUT_MAX_WORDS_PER_CHAPTER,
    created_at: row.created_at,
  };
}

function rowToEntry(row) {
  if (!row) return null;
  return {
    id: row.id,
    author_id: row.author_id,
    story_id: row.story_id,
    season_id: row.season_id,
    enrolled_at: row.enrolled_at,
    graduation_date: row.graduation_date ?? null,
    eligibility_status: row.eligibility_status,
    total_score: row.total_score != null ? Number(row.total_score) : null,
    rank: row.rank ?? null,
    award_level: row.award_level ?? null,
  };
}

function rowToMetrics(row) {
  if (!row) return null;
  return {
    story_id: row.story_id,
    chapter_count: row.chapter_count ?? 0,
    total_words: row.total_words ?? 0,
    completion_rate: Number(row.completion_rate) || 0,
    reader_retention: Number(row.reader_retention) || 0,
    average_rating: row.average_rating != null ? Number(row.average_rating) : null,
    editorial_score: row.editorial_score != null ? Number(row.editorial_score) : null,
    engagement_score: row.engagement_score != null ? Number(row.engagement_score) : null,
    moderation_status: row.moderation_status || 'pending',
  };
}

export async function getActiveSeason() {
  if (isMockMode()) {
    return seedMockSeasonIfEmpty();
  }

  const { data, error } = await supabase
    .from('debut_seasons')
    .select('*')
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return rowToSeason(data);
}

async function getAuthorEntry(authorId, seasonId) {
  if (isMockMode()) {
    const entry = mockEntriesDb.get(authorId);
    if (!entry || entry.season_id !== seasonId) return null;
    return entry;
  }

  const { data, error } = await supabase
    .from('debut_entries')
    .select('*')
    .eq('author_id', authorId)
    .eq('season_id', seasonId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return rowToEntry(data);
}

async function countPublishedChaptersForStory(storyId) {
  if (isMockMode()) {
    let count = 0;
    let totalWords = 0;
    for (const [key, ch] of mockChapterStore.entries()) {
      if (!key.startsWith(`${storyId}:`)) continue;
      if (ch.status !== 'published') continue;
      count += 1;
      totalWords += ch.word_count || (ch.content?.length ?? 0);
    }
    return { chapter_count: count, total_words: totalWords };
  }

  const { data, error } = await supabase
    .from('chapters')
    .select('content, content_delta')
    .eq('story_id', storyId)
    .eq('status', 'published');

  if (error) throw new Error(error.message);

  let totalWords = 0;
  for (const ch of data || []) {
    const deltaWords = ch.content_delta?.word_count;
    if (typeof deltaWords === 'number') {
      totalWords += deltaWords;
    } else if (ch.content) {
      totalWords += ch.content.trim().split(/\s+/).filter(Boolean).length;
    }
  }

  return { chapter_count: (data || []).length, total_words: totalWords };
}

async function getStoryMeta(storyId) {
  if (isMockMode()) {
    if (mockStoryMetaDb.has(storyId)) return mockStoryMetaDb.get(storyId);
    return {
      id: storyId,
      title: 'Debut Story',
      author_id: null,
      story_status: 'ongoing',
    };
  }

  const { data, error } = await supabase
    .from('stories')
    .select('id, title, author_id, story_status')
    .eq('id', storyId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function isAuthorsFirstPublishedStory(authorId, storyId) {
  if (isMockMode()) {
    for (const [, ch] of mockChapterStore.entries()) {
      if (ch.creator_id !== authorId) continue;
      if (ch.status !== 'published') continue;
      if (ch.story_id !== storyId) return false;
    }
    return true;
  }

  const { count, error } = await supabase
    .from('chapters')
    .select('id, stories!inner(author_id)', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('stories.author_id', authorId)
    .neq('story_id', storyId);

  if (error) throw new Error(error.message);
  return (count || 0) === 0;
}

export async function syncDebutMetrics(storyId) {
  const counts = await countPublishedChaptersForStory(storyId);
  const row = {
    story_id: storyId,
    chapter_count: counts.chapter_count,
    total_words: counts.total_words,
    moderation_status: counts.chapter_count > 0 ? 'approved' : 'pending',
  };

  if (isMockMode()) {
    const existing = mockMetricsDb.get(storyId) || {};
    const metrics = {
      ...existing,
      ...row,
      completion_rate: existing.completion_rate ?? 0,
      reader_retention: existing.reader_retention ?? 0,
    };
    mockMetricsDb.set(storyId, metrics);
    return metrics;
  }

  const { data, error } = await supabase
    .from('debut_metrics')
    .upsert(row, { onConflict: 'story_id' })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return rowToMetrics(data);
}

export async function enrollAuthorOnFirstPublish(authorId, storyId) {
  if (!authorId || !storyId) throw new Error('author_id and story_id required');

  const season = await getActiveSeason();
  if (!season) {
    return { enrolled: false, reason: 'no_active_season' };
  }

  const existing = await getAuthorEntry(authorId, season.id);
  if (existing) {
    return { enrolled: false, alreadyEnrolled: true, entry: existing };
  }

  const isFirst = await isAuthorsFirstPublishedStory(authorId, storyId);
  if (!isFirst) {
    return { enrolled: false, reason: 'not_first_published_story' };
  }

  const entryRow = {
    author_id: authorId,
    story_id: storyId,
    season_id: season.id,
    eligibility_status: 'active',
  };

  if (isMockMode()) {
    const entry = {
      id: `debut-entry-${randomUUID()}`,
      ...entryRow,
      enrolled_at: new Date().toISOString(),
      graduation_date: null,
      total_score: null,
      rank: null,
      award_level: null,
    };
    mockEntriesDb.set(authorId, entry);
    await syncDebutMetrics(storyId);
    return { enrolled: true, entry, season };
  }

  const { data, error } = await supabase
    .from('debut_entries')
    .insert(entryRow)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  await syncDebutMetrics(storyId);
  return { enrolled: true, entry: rowToEntry(data), season };
}

function computeMockGraduationScore(metrics) {
  const chapterScore = Math.min(100, (metrics.chapter_count / DEBUT_CHAPTER_THRESHOLD) * 100);
  const wordTarget = DEBUT_CHAPTER_THRESHOLD * DEBUT_MIN_WORDS_PER_CHAPTER;
  const wordScore = wordTarget > 0 ? Math.min(100, (metrics.total_words / wordTarget) * 100) : 0;
  return Math.round((chapterScore * 0.6 + wordScore * 0.4) * 10) / 10;
}

export async function graduateDebutStory(authorId, storyId) {
  if (!authorId || !storyId) throw new Error('author_id and story_id required');

  const season = await getActiveSeason();
  if (!season) {
    return { graduated: false, reason: 'no_active_season' };
  }

  const entry = await getAuthorEntry(authorId, season.id);
  if (!entry) {
    return { graduated: false, reason: 'not_enrolled' };
  }
  if (entry.story_id !== storyId) {
    return { graduated: false, reason: 'story_mismatch' };
  }
  if (entry.eligibility_status === 'graduated') {
    return { graduated: true, alreadyGraduated: true, entry };
  }

  const metrics = await syncDebutMetrics(storyId);
  const story = await getStoryMeta(storyId);
  const threshold = season.chapter_threshold ?? DEBUT_CHAPTER_THRESHOLD;

  if (metrics.chapter_count < threshold) {
    return {
      graduated: false,
      reason: 'chapters_incomplete',
      chapter_count: metrics.chapter_count,
      chapter_target: threshold,
    };
  }
  if (story.story_status !== 'completed') {
    return {
      graduated: false,
      reason: 'story_not_completed',
      story_status: story.story_status,
      chapter_count: metrics.chapter_count,
      chapter_target: threshold,
    };
  }

  const totalScore = computeMockGraduationScore(metrics);
  const awardLevel = awardLevelForScore(totalScore);
  const graduationDate = new Date().toISOString();
  const patch = {
    eligibility_status: 'graduated',
    graduation_date: graduationDate,
    total_score: totalScore,
    award_level: awardLevel,
  };

  if (isMockMode()) {
    const updated = { ...entry, ...patch };
    mockEntriesDb.set(authorId, updated);
    return { graduated: true, entry: updated, metrics, award_level: awardLevel };
  }

  const { data, error } = await supabase
    .from('debut_entries')
    .update(patch)
    .eq('id', entry.id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return { graduated: true, entry: rowToEntry(data), metrics, award_level: awardLevel };
}

export async function getDebutProgress(authorId) {
  if (!authorId) throw new Error('author_id required');

  const season = await getActiveSeason();
  const empty = {
    enrolled: false,
    season: season ? rowToSeason(season) : null,
    story_id: null,
    story_title: null,
    story_status: null,
    chapter_count: 0,
    chapter_target: season?.chapter_threshold ?? DEBUT_CHAPTER_THRESHOLD,
    progress_pct: 0,
    eligibility_status: null,
    graduated: false,
    graduation_date: null,
    award_level: null,
    total_score: null,
    metrics: null,
    mock: isMockMode(),
  };

  if (!season) return empty;

  const entry = await getAuthorEntry(authorId, season.id);
  if (!entry) return { ...empty, season: rowToSeason(season) };

  const story = await getStoryMeta(entry.story_id);
  const metrics = await syncDebutMetrics(entry.story_id);
  const target = season.chapter_threshold ?? DEBUT_CHAPTER_THRESHOLD;

  return {
    enrolled: true,
    season: rowToSeason(season),
    entry_id: entry.id,
    story_id: entry.story_id,
    story_title: story?.title ?? null,
    story_status: story?.story_status ?? 'ongoing',
    chapter_count: metrics.chapter_count,
    chapter_target: target,
    progress_pct: debutProgressPct(metrics.chapter_count, target),
    eligibility_status: entry.eligibility_status,
    graduated: entry.eligibility_status === 'graduated',
    graduation_date: entry.graduation_date,
    award_level: entry.award_level,
    total_score: entry.total_score,
    enrolled_at: entry.enrolled_at,
    metrics,
    mock: isMockMode(),
  };
}

/** Called after a chapter transitions to published — enroll, sync metrics, auto-graduate. */
export async function onChapterPublished(authorId, storyId) {
  if (!authorId || !storyId) return { handled: false };

  try {
    await syncDebutMetrics(storyId);

    const season = await getActiveSeason();
    if (!season) return { handled: false, reason: 'no_active_season' };

    let entry = await getAuthorEntry(authorId, season.id);
    if (!entry) {
      const enroll = await enrollAuthorOnFirstPublish(authorId, storyId);
      entry = enroll.entry || null;
    } else if (entry.story_id === storyId && entry.eligibility_status === 'active') {
      const grad = await graduateDebutStory(authorId, storyId);
      return {
        handled: true,
        enrolled: true,
        autoGraduated: grad.graduated === true && !grad.alreadyGraduated,
        graduation: grad,
      };
    }

    return { handled: true, enrolled: Boolean(entry), entry };
  } catch (err) {
    console.warn('[DebutSeason] onChapterPublished failed:', err?.message);
    return { handled: false, error: err?.message };
  }
}

/** Test helper — override mock story metadata */
export function __setMockStoryMetaForTests(storyId, meta) {
  mockStoryMetaDb.set(storyId, meta);
}

/** Test helper — reset in-memory state */
export function __resetMockDebutSeasonForTests() {
  mockActiveSeason = null;
  mockEntriesDb.clear();
  mockMetricsDb.clear();
  mockStoryMetaDb.clear();
}