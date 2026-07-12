import type { PlatformNotification } from './notificationsLocal';
import { NOTIFICATION_DOMAINS } from '../../../packages/shared/notifications';

export type NotificationFilter = 'all' | 'reviews' | 'publishing' | 'revenue' | 'readers';

export const NOTIFICATION_FILTER_LABELS: Record<NotificationFilter, string> = {
  all: 'All',
  reviews: 'Reviews',
  publishing: 'Publishing',
  revenue: 'Revenue',
  readers: 'Readers',
};

const FILTER_DOMAINS: Record<Exclude<NotificationFilter, 'all'>, readonly string[]> = {
  reviews: ['reviews', 'collaboration'],
  publishing: ['publishing', 'story_creation'],
  revenue: ['revenue_payments', 'moderation'],
  readers: ['reader_engagement'],
};

export function normalizePlatformNotification(
  row: PlatformNotification | Record<string, unknown>,
): PlatformNotification {
  if (
    typeof row.id === 'string'
    && typeof row.title === 'string'
    && typeof row.notification_type === 'string'
  ) {
    return row as PlatformNotification;
  }
  const raw = row as Record<string, unknown>;
  return {
    id: String(raw.id ?? ''),
    notification_type: String(raw.notification_type ?? 'unknown'),
    domain: String(raw.domain ?? 'system_platform'),
    priority: String(raw.priority ?? 'informational'),
    title: String(raw.title ?? 'Notification'),
    body: raw.body != null ? String(raw.body) : null,
    action_url: raw.action_url != null ? String(raw.action_url) : null,
    read_at: raw.read_at != null ? String(raw.read_at) : null,
    created_at: String(raw.created_at ?? new Date().toISOString()),
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