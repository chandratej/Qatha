import { RECOMMENDATION_SIGNALS } from '../../../packages/shared/recommendations';

export interface RecommendableStory {
  id: string;
  genre: string;
  tags: string[];
  views_this_week: number;
  completion_rate: number;
  bookmarked?: boolean;
}

export function ruleBasedScore(
  story: RecommendableStory,
  prefs: { genres: string[]; tags: string[] },
): number {
  let score = 0;
  for (const signal of RECOMMENDATION_SIGNALS) {
    if (signal.status === 'planned') continue;
    const w = signal.weight;
    const id = signal.id as string;
    if (id === 'genres' && prefs.genres.includes(story.genre)) score += w;
    if (id === 'tags' && story.tags.some((t) => prefs.tags.includes(t))) score += w;
    if (id === 'reading_completion') score += w * (story.completion_rate / 100);
    if (id === 'bookmarks' && story.bookmarked) score += w;
    if (id === 'trending') score += w * Math.min(story.views_this_week / 1000, 1);
  }
  return Math.round(score * 1000) / 1000;
}

export function rankStories(stories: RecommendableStory[], prefs: { genres: string[]; tags: string[] }) {
  return [...stories]
    .map((s) => ({ story: s, score: ruleBasedScore(s, prefs) }))
    .sort((a, b) => b.score - a.score);
}