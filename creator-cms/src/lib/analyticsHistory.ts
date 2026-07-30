/**
 * Durable client-side analytics history snapshots — compounds over series life.
 * Server events go to /api/analytics; this keeps a portable history of chapter metrics.
 */

const KEY = 'katha_analytics_history_v1';

export interface ChapterMetricSnapshot {
  story_id: string;
  captured_at: string;
  chapters: Array<{
    chapter_number: number;
    total_views: number;
    completion_rate: number;
    avg_scroll_pct?: number;
  }>;
}

function loadAll(): ChapterMetricSnapshot[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(rows: ChapterMetricSnapshot[]) {
  try {
    // Cap history — last 200 snapshots (~years of weekly captures)
    localStorage.setItem(KEY, JSON.stringify(rows.slice(-200)));
  } catch {
    /* quota */
  }
}

export function recordAnalyticsSnapshot(snapshot: ChapterMetricSnapshot) {
  const all = loadAll().filter(
    (s) => !(s.story_id === snapshot.story_id && s.captured_at.slice(0, 10) === snapshot.captured_at.slice(0, 10)),
  );
  all.push(snapshot);
  saveAll(all);
}

export function listAnalyticsHistory(storyId: string): ChapterMetricSnapshot[] {
  return loadAll()
    .filter((s) => s.story_id === storyId)
    .sort((a, b) => b.captured_at.localeCompare(a.captured_at));
}

export function exportAnalyticsHistoryJson(storyId?: string): string {
  const rows = storyId ? listAnalyticsHistory(storyId) : loadAll();
  return JSON.stringify({ version: 1, exported_at: new Date().toISOString(), snapshots: rows }, null, 2);
}
