import { api } from './api';
import { ONBOARDING_KEY } from './constants';

export async function checkOnboardingRequired(): Promise<boolean> {
  if (localStorage.getItem(ONBOARDING_KEY) === 'true') return false;

  try {
    const { stories } = await api.getCreatorStories();
    if (!stories?.length) return true;

    const results = await Promise.all(
      stories.map((s) => api.getStoryChapters(s.id).catch(() => ({ chapters: [] }))),
    );

    const hasPublished = results.some((r) =>
      r.chapters.some((c) => c.status === 'published' || c.status === 'pending_review'),
    );
    if (hasPublished) {
      localStorage.setItem(ONBOARDING_KEY, 'true');
      return false;
    }

    const hasChapters = results.some((r) => r.chapters.length > 0);
    return !hasChapters;
  } catch {
    // Fail closed: unknown creator state must not skip the funnel (matches Login finishLogin).
    return true;
  }
}