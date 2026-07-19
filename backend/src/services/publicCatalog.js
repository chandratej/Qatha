/**
 * Public reader catalog — stories with at least one published chapter.
 * Keeps is_published + chapter_count in sync so Creator Studio publishes appear
 * in the reader app (including rows that had is_published=false by mistake).
 */

import { supabase } from '../lib/supabase.js';

const STORY_SELECT = `
  id, title, description, genre, cover_url, chapter_count,
  total_readers, views_this_week, release_schedule,
  release_day_of_week, release_time_of_day, created_at, is_published,
  creators(pen_name, avatar_url)
`;

/**
 * Count published chapters per story and repair story flags/counters.
 * @returns {Promise<Map<string, number>>}
 */
export async function publishedChapterCounts() {
  const { data, error } = await supabase
    .from('chapters')
    .select('story_id')
    .eq('status', 'published');

  if (error) throw error;

  const counts = new Map();
  for (const row of data || []) {
    if (!row.story_id) continue;
    counts.set(row.story_id, (counts.get(row.story_id) || 0) + 1);
  }
  return counts;
}

/**
 * After a chapter is approved, mark the parent story catalog-visible.
 */
export async function syncStoryAfterChapterPublish(storyId) {
  if (!storyId) return null;

  const { count, error: countErr } = await supabase
    .from('chapters')
    .select('id', { count: 'exact', head: true })
    .eq('story_id', storyId)
    .eq('status', 'published');

  if (countErr) {
    console.warn('[publicCatalog] count failed:', countErr.message);
  }

  const chapterCount = count ?? 0;
  const { data, error } = await supabase
    .from('stories')
    .update({
      is_published: chapterCount > 0,
      chapter_count: chapterCount,
    })
    .eq('id', storyId)
    .select(STORY_SELECT)
    .maybeSingle();

  if (error) {
    console.warn('[publicCatalog] story sync failed:', error.message);
    return null;
  }
  return data;
}

function withAccurateCount(story, counts) {
  const n = counts.get(story.id) || 0;
  return {
    ...story,
    chapter_count: n,
    is_published: n > 0 ? true : story.is_published,
    total_readers: story.total_readers ?? 0,
    views_this_week: story.views_this_week ?? 0,
    creators: story.creators || { pen_name: 'Author', avatar_url: null },
  };
}

/**
 * Stories available for the reader app to browse and open.
 */
export async function listPublicStories({
  genre,
  sort = 'trending',
  limit = 20,
  offset = 0,
} = {}) {
  const counts = await publishedChapterCounts();
  const readableIds = [...counts.keys()];

  if (readableIds.length === 0) {
    return { stories: [] };
  }

  // Repair flags async (non-blocking for response accuracy we already use counts)
  void repairStoryCatalogFlags(counts);

  let query = supabase
    .from('stories')
    .select(STORY_SELECT)
    .in('id', readableIds);

  if (genre) query = query.eq('genre', genre);

  // Fetch a bit more then sort in memory so chapter_count is accurate
  const { data, error } = await query.limit(200);
  if (error) throw error;

  let stories = (data || []).map((s) => withAccurateCount(s, counts));

  if (sort === 'trending') {
    stories.sort((a, b) => (b.views_this_week || 0) - (a.views_this_week || 0)
      || (b.total_readers || 0) - (a.total_readers || 0)
      || (b.chapter_count || 0) - (a.chapter_count || 0));
  } else if (sort === 'new') {
    stories.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  } else {
    stories.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'te'));
  }

  const start = Number(offset) || 0;
  const end = start + (Number(limit) || 20);
  return { stories: stories.slice(start, end) };
}

export async function getPublicStoryDetail(storyId) {
  const counts = await publishedChapterCounts();
  const publishedCount = counts.get(storyId) || 0;

  const { data: story, error } = await supabase
    .from('stories')
    .select(`*, creators(pen_name, avatar_url, bio)`)
    .eq('id', storyId)
    .maybeSingle();

  if (error) throw error;
  if (!story) return null;

  // Allow opening if it has published chapters even when is_published lagging
  if (!story.is_published && publishedCount === 0) return null;

  if (publishedCount > 0 && (!story.is_published || story.chapter_count !== publishedCount)) {
    void syncStoryAfterChapterPublish(storyId);
  }

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, chapter_number, title, estimated_read_time_minutes, view_count, status')
    .eq('story_id', storyId)
    .eq('status', 'published')
    .order('chapter_number');

  return {
    story: withAccurateCount(story, counts),
    chapters: chapters || [],
  };
}

export async function listDiscoverByGenre(genre) {
  const { stories } = await listPublicStories({ genre, sort: 'trending', limit: 50, offset: 0 });
  const trending = [...stories]
    .sort((a, b) => (b.views_this_week || 0) - (a.views_this_week || 0))
    .slice(0, 10);
  const new_releases = [...stories]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 10);
  return { genre, trending, new_releases };
}

async function repairStoryCatalogFlags(counts) {
  try {
    for (const [storyId, n] of counts.entries()) {
      await supabase
        .from('stories')
        .update({ is_published: true, chapter_count: n })
        .eq('id', storyId)
        .or(`is_published.eq.false,chapter_count.neq.${n}`);
    }
  } catch (e) {
    console.warn('[publicCatalog] repair skipped:', e?.message);
  }
}
