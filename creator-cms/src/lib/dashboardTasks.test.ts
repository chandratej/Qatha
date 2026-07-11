import { describe, it, expect } from 'vitest';
import { buildDashboardTasks } from './dashboardTasks';
import type { StoryData } from '../types/database';

const baseStory: StoryData = {
  id: 's1',
  title: 'Test Story',
  genre: 'fiction',
  language: 'te',
  cover_url: null,
  chapter_count: 2,
  moderation_status: 'draft',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  author_id: 'a1',
};

describe('buildDashboardTasks', () => {
  it('prioritizes onboarding task for new creators', () => {
    const tasks = buildDashboardTasks([], 'onboarding');
    expect(tasks[0].id).toBe('onboard');
    expect(tasks[0].href).toBe('/onboarding');
  });

  it('suggests first chapter for first_draft stage', () => {
    const tasks = buildDashboardTasks([{ ...baseStory, chapter_count: 0 }], 'first_draft');
    expect(tasks.some((t) => t.id === 'first-chapter')).toBe(true);
  });

  it('caps tasks at four items', () => {
    const stories = [
      { ...baseStory, moderation_status: 'published' as const },
      { ...baseStory, id: 's2', moderation_status: 'pending_review' as const },
      { ...baseStory, id: 's3', moderation_status: 'draft' as const },
    ];
    const tasks = buildDashboardTasks(stories, 'active');
    expect(tasks.length).toBeLessThanOrEqual(4);
  });
});