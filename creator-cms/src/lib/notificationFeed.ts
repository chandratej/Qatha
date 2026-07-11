import type { PlatformNotification } from './notificationsLocal';
import { NOTIFICATION_DOMAINS } from '../../../packages/shared/notifications';

export type NotificationFilter = 'all' | 'reviews' | 'publishing' | 'revenue';

export const NOTIFICATION_FILTER_LABELS: Record<NotificationFilter, string> = {
  all: 'All',
  reviews: 'Reviews',
  publishing: 'Publishing',
  revenue: 'Revenue',
};

const FILTER_DOMAINS: Record<Exclude<NotificationFilter, 'all'>, readonly string[]> = {
  reviews: ['reviews', 'collaboration'],
  publishing: ['publishing', 'story_creation'],
  revenue: ['revenue_payments', 'moderation'],
};

export function normalizePlatformNotification(row: Record<string, unknown>): PlatformNotification {
  return {
    id: String(row.id ?? ''),
    notification_type: String(row.notification_type ?? 'unknown'),
    domain: String(row.domain ?? 'system_platform'),
    priority: String(row.priority ?? 'informational'),
    title: String(row.title ?? 'Notification'),
    body: row.body != null ? String(row.body) : null,
    action_url: row.action_url != null ? String(row.action_url) : null,
    read_at: row.read_at != null ? String(row.read_at) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export function filterNotifications(
  items: PlatformNotification[],
  filter: NotificationFilter,
): PlatformNotification[] {
  if (filter === 'all') return items;
  const domains = FILTER_DOMAINS[filter];
  return items.filter((n) => domains.includes(n.domain));
}

export function unreadCount(items: PlatformNotification[]): number {
  return items.filter((n) => !n.read_at).length;
}

export function domainLabel(domain: string): string {
  if (NOTIFICATION_DOMAINS.includes(domain as (typeof NOTIFICATION_DOMAINS)[number])) {
    return domain.replace(/_/g, ' ');
  }
  return domain;
}

export function relativeTime(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (Number.isNaN(ms)) return '';
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}