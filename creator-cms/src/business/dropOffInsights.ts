import type { DropOffInsight } from '../types/database';

export function buildDropOffInsights(
  chapters: Array<{
    chapter_number: number;
    total_views: number;
    completion_rate: number;
    avg_scroll_pct: number;
  }>,
): DropOffInsight[] {
  const insights: DropOffInsight[] = [];
  for (let i = 1; i < chapters.length; i++) {
    const prev = chapters[i - 1];
    const curr = chapters[i];
    const viewDrop = prev.total_views > 0
      ? Math.round(100 * (prev.total_views - curr.total_views) / prev.total_views)
      : 0;
    const completionDrop = prev.completion_rate - curr.completion_rate;
    if (viewDrop >= 15 || completionDrop >= 12) {
      insights.push({
        chapter_number: curr.chapter_number,
        view_drop_pct: viewDrop,
        completion_drop_pct: completionDrop,
        avg_scroll_pct: curr.avg_scroll_pct,
        suggestion: curr.avg_scroll_pct < 70
          ? `Most readers stopped around ${100 - curr.avg_scroll_pct}% into Chapter ${curr.chapter_number}. Consider shorter paragraphs or a stronger hook.`
          : `Chapter ${curr.chapter_number} loses ${viewDrop}% of readers vs. the previous chapter. Review pacing and cliffhanger strength.`,
      });
    }
  }
  return insights;
}