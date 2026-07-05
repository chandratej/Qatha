import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkOnboardingRequired } from './onboardingStatus';
import { ONBOARDING_KEY } from './constants';

vi.mock('./api', () => ({
  api: {
    getCreatorStories: vi.fn(),
    getStoryChapters: vi.fn(),
  },
}));

import { api } from './api';

describe('checkOnboardingRequired', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.getCreatorStories).mockReset();
    vi.mocked(api.getStoryChapters).mockReset();
  });

  it('returns false when onboarding key is set', async () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    await expect(checkOnboardingRequired()).resolves.toBe(false);
    expect(api.getCreatorStories).not.toHaveBeenCalled();
  });

  it('returns true when creator has no stories', async () => {
    vi.mocked(api.getCreatorStories).mockResolvedValueOnce({ stories: [] });
    await expect(checkOnboardingRequired()).resolves.toBe(true);
  });

  it('returns false and marks complete when a chapter is published', async () => {
    vi.mocked(api.getCreatorStories).mockResolvedValueOnce({
      stories: [{ id: 's1', title: 'T', genre: 'romance', chapter_count: 1, total_readers: 0 }],
    });
    vi.mocked(api.getStoryChapters).mockResolvedValueOnce({
      chapters: [{ chapter_number: 1, title: 'Ch1', status: 'published', word_count: 100, scene_count: 1 }],
    });
    await expect(checkOnboardingRequired()).resolves.toBe(false);
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
  });
});