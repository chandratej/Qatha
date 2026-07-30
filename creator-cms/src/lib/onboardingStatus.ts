import { api } from './api';
import { ONBOARDING_KEY } from './constants';

/**
 * Whether the creator still needs the first-run funnel.
 *
 * Uses a single getCreatorStories() call — that endpoint now batches chapter/draft
 * status (2 queries total, not 2×N) and floors chapter_count with observed drafts.
 * Do not fan out getStoryChapters here; that recreated the N+1 storm on every boot.
 */
export async function checkOnboardingRequired(): Promise<boolean> {
  if (localStorage.getItem(ONBOARDING_KEY) === 'true') return false;

  try {
    const { stories } = await api.getCreatorStories();
    if (!stories?.length) return true;

    const hasPublished = stories.some(
      (s) => s.moderation_status === 'published' || s.moderation_status === 'pending_review',
    );
    if (hasPublished) {
      localStorage.setItem(ONBOARDING_KEY, 'true');
      return false;
    }

    const hasChapters = stories.some((s) => (s.chapter_count ?? 0) > 0);
    return !hasChapters;
  } catch {
    // Fail closed: unknown creator state must not skip the funnel (matches Login finishLogin).
    return true;
  }
}