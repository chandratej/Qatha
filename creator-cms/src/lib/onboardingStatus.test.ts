import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkOnboardingRequired } from './onboardingStatus';
import { ONBOARDING_KEY } from './constants';

vi.mock('./api', () => ({
  api: {
    getCreatorStories: vi.fn(),
  },
}));

import { api } from './api';

describe('checkOnboardingRequired', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.getCreatorStories).mockReset();
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

  it('returns false and marks complete from list moderation_status (no chapters fan-out)', async () => {
    vi.mocked(api.getCreatorStories).mockResolvedValueOnce({
      stories: [{
        id: 's1',
        title: 'T',
        genre: 'romance',
        chapter_count: 1,
        total_readers: 0,
        moderation_status: 'published',
      }],
    });
    await expect(checkOnboardingRequired()).resolves.toBe(false);
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true');
  });

  it('returns false when stories have drafts (chapter_count floored by list batch)', async () => {
    vi.mocked(api.getCreatorStories).mockResolvedValueOnce({
      stories: [{
        id: 's1',
        title: 'T',
        genre: 'romance',
        chapter_count: 2,
        total_readers: 0,
        moderation_status: 'draft',
      }],
    });
    await expect(checkOnboardingRequired()).resolves.toBe(false);
    expect(localStorage.getItem(ONBOARDING_KEY)).toBeNull();
  });

  it('returns true (require onboarding) when stories fetch fails', async () => {
    vi.mocked(api.getCreatorStories).mockRejectedValueOnce(new Error('network'));
    await expect(checkOnboardingRequired()).resolves.toBe(true);
    expect(localStorage.getItem(ONBOARDING_KEY)).toBeNull();
  });
});