import type { StoryData } from '../types/database';

export interface DashboardTask {
  id: string;
  label: string;
  done: boolean;
  href?: string;
}

export function buildDashboardTasks(stories: StoryData[]): DashboardTask[] {
  const tasks: DashboardTask[] = [];
  const published = stories.find((s) => s.moderation_status === 'published');
  const pending = stories.find((s) => s.moderation_status === 'pending_review');
  const draft = stories.find((s) => !s.moderation_status || s.moderation_status === 'draft');

  if (published) {
    tasks.push({ id: 'write', label: `Write next chapter of ${published.title}`, done: false, href: `/stories/${published.id}` });
  }
  if (pending) {
    tasks.push({ id: 'review', label: `Review feedback for ${pending.title}`, done: false, href: `/stories/${pending.id}` });
  }
  if (draft) {
    tasks.push({ id: 'desc', label: `Update description for ${draft.title}`, done: false, href: `/stories/${draft.id}` });
  }
  tasks.push({ id: 'events', label: 'Browse open contests & register', done: false, href: '/events' });
  tasks.push({ id: 'comments', label: 'Respond to reader comments', done: false });
  return tasks.slice(0, 4);
}