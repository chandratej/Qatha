import type { CreatorLifecycleStage } from '../../../packages/shared/fsm';
import type { StoryData } from '../types/database';

export interface DashboardTask {
  id: string;
  label: string;
  done: boolean;
  href?: string;
}

export function buildDashboardTasks(
  stories: StoryData[],
  lifecycleStage: CreatorLifecycleStage | string = 'active',
): DashboardTask[] {
  const tasks: DashboardTask[] = [];
  const published = stories.find((s) => s.moderation_status === 'published');
  const pending = stories.find((s) => s.moderation_status === 'pending_review');
  const draft = stories.find((s) => !s.moderation_status || s.moderation_status === 'draft');

  if (lifecycleStage === 'registered' || lifecycleStage === 'onboarding') {
    tasks.push({ id: 'onboard', label: 'Complete creator onboarding', done: false, href: '/onboarding' });
  }
  if (lifecycleStage === 'first_draft' && !stories.some((s) => s.chapter_count > 0)) {
    tasks.push({ id: 'first-chapter', label: 'Write your first chapter', done: false, href: '/stories' });
  }
  if (lifecycleStage === 'first_publish' && !published) {
    tasks.push({ id: 'first-publish', label: 'Publish your first chapter', done: false, href: '/stories' });
  }
  if (lifecycleStage === 'active' && !published && stories.length > 0) {
    tasks.push({ id: 'publish', label: 'Publish a chapter to grow your readership', done: false, href: '/stories' });
  }

  if (published) {
    tasks.push({ id: 'write', label: `Write next chapter of ${published.title}`, done: false, href: `/stories/${published.id}` });
  }
  if (pending) {
    tasks.push({ id: 'review', label: `Review feedback for ${pending.title}`, done: false, href: `/stories/${pending.id}` });
  }
  if (draft) {
    tasks.push({ id: 'desc', label: `Update description for ${draft.title}`, done: false, href: `/stories/${draft.id}` });
  }
  tasks.push({ id: 'schedule', label: 'Schedule your next chapter release', done: false, href: '/schedule' });
  tasks.push({ id: 'events', label: 'Browse open contests & register', done: false, href: '/events' });
  return tasks.slice(0, 4);
}