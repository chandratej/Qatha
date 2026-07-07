import { Award, CheckCircle2, Heart, UserPlus, Wallet } from 'lucide-react';
import type { DashboardData, CreatorMilestone } from '../types/database';
import type { LucideIcon } from 'lucide-react';

export interface ActivityFeedItem {
  id: string;
  icon: 'green' | 'gold' | 'purple' | 'pink';
  Icon: LucideIcon;
  title: string;
  description: string;
  time: string;
  group: string;
}

export function buildActivityFeed(d: DashboardData, milestones: CreatorMilestone[]): ActivityFeedItem[] {
  const items: ActivityFeedItem[] = [];
  if (d.total_subscribers > 0) {
    items.push({ id: 'sub', icon: 'green', Icon: UserPlus, title: 'New subscriber', description: 'Someone subscribed to your story', time: '2h ago', group: 'Engagement' });
  }
  items.push({ id: 'payout', icon: 'gold', Icon: Wallet, title: 'Payout initiated', description: 'Monthly payout is being processed', time: '1d ago', group: 'Revenue' });
  const top = d.stories.reduce((b, s) => (s.total_readers > (b?.total_readers ?? 0) ? s : b), d.stories[0]);
  if (top && top.total_readers >= 500) {
    items.push({ id: 'ms', icon: 'purple', Icon: Award, title: 'Reader milestone', description: `"${top.title}" crossed ${top.total_readers >= 2000 ? '2K' : '500'} readers`, time: '2d ago', group: 'Milestones' });
  }
  for (const m of milestones.slice(0, 1)) {
    items.push({ id: m.id, icon: 'purple', Icon: CheckCircle2, title: 'Milestone unlocked', description: m.milestone_type === 'FIRST_READER' ? 'Your first reader arrived!' : 'A new badge moment', time: '3d ago', group: 'Milestones' });
  }
  if (d.stories.some((s) => s.views_this_week > 0)) {
    items.push({ id: 'eng', icon: 'pink', Icon: Heart, title: 'Story engagement', description: 'New readers discovered your work this week', time: '3d ago', group: 'Engagement' });
  }
  return items.slice(0, 5);
}