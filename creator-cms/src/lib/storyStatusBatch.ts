import { deriveStoryModerationStatus } from '../business/moderationStatus';
import type { StoryData } from '../types/database';

export type StatusRow = { story_id: string; status?: string | null; chapter_number?: number | null };

/**
 * Group status rows by story_id (from batched .in('story_id', ids) queries).
 */
export function groupStatusRowsByStoryId(rows: StatusRow[]): Map<string, Array<{ status: string }>> {
  const map = new Map<string, Array<{ status: string }>>();
  for (const row of rows) {
    const id = String(row.story_id);
    const list = map.get(id) ?? [];
    list.push({
      status: typeof row.status === 'string' && row.status ? row.status : 'draft',
    });
    map.set(id, list);
  }
  return map;
}

/**
 * Attach moderation_status (and a chapter_count floor from live+draft rows)
 * without per-story round-trips.
 */
export function attachBatchedStoryStatuses<T extends {
  id: string | number;
  title?: unknown;
  genre?: unknown;
  chapter_count?: unknown;
  total_readers?: unknown;
}>(
  stories: T[],
  chapterRows: StatusRow[],
  draftRows: StatusRow[],
): Array<T & StoryData> {
  const chaptersByStory = groupStatusRowsByStoryId(chapterRows);
  const draftsByStory = groupStatusRowsByStoryId(draftRows);

  return stories.map((s) => {
    const id = String(s.id);
    const ch = chaptersByStory.get(id) ?? [];
    const dr = draftsByStory.get(id) ?? [];
    const statusRows = [...ch, ...dr];
    const storedCount = Number(s.chapter_count) || 0;
    // Floor chapter_count with observed rows so onboarding/library don't need
    // a second per-story chapters fetch when drafts exist but story.chapter_count is stale.
    const observedCount = statusRows.length;

    return {
      ...s,
      id,
      title: String(s.title ?? ''),
      genre: String(s.genre ?? 'romance'),
      chapter_count: Math.max(storedCount, observedCount),
      total_readers: Number(s.total_readers) || 0,
      moderation_status: deriveStoryModerationStatus(statusRows),
    } as T & StoryData;
  });
}
