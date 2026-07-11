/** Notification taxonomy — Vol_02-03 Part 1 + Vol_09-06 */

export const NOTIFICATION_DOMAINS = [
  'account_security',
  'story_creation',
  'collaboration',
  'reviews',
  'publishing',
  'reader_engagement',
  'community',
  'revenue_payments',
  'moderation',
  'ai_assistant',
  'system_platform',
] as const;

export type NotificationDomain = (typeof NOTIFICATION_DOMAINS)[number];

export const NOTIFICATION_PRIORITIES = ['critical', 'actionable', 'informational'] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

/** SLA minutes for in-app surfacing — Operations Council */
export const NOTIFICATION_PRIORITY_SLA_MINUTES: Record<NotificationPriority, number> = {
  critical: 15,
  actionable: 240,
  informational: 1440,
};

export const NOTIFICATION_CHANNELS = ['in_app', 'email', 'push', 'sms'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export interface NotificationTypeDef {
  id: string;
  domain: NotificationDomain;
  priority: NotificationPriority;
  defaultChannels: readonly NotificationChannel[];
  retentionDays: number;
}

/** Wave 2 MVP subset — review + publish first (retention-driving). */
export const NOTIFICATION_TYPES: readonly NotificationTypeDef[] = [
  {
    id: 'review_assigned',
    domain: 'reviews',
    priority: 'actionable',
    defaultChannels: ['in_app', 'email'],
    retentionDays: 90,
  },
  {
    id: 'review_due_soon',
    domain: 'reviews',
    priority: 'critical',
    defaultChannels: ['in_app', 'email'],
    retentionDays: 30,
  },
  {
    id: 'review_consensus_ready',
    domain: 'reviews',
    priority: 'actionable',
    defaultChannels: ['in_app'],
    retentionDays: 180,
  },
  {
    id: 'chapter_scheduled',
    domain: 'publishing',
    priority: 'informational',
    defaultChannels: ['in_app'],
    retentionDays: 60,
  },
  {
    id: 'moderation_outcome',
    domain: 'moderation',
    priority: 'actionable',
    defaultChannels: ['in_app', 'email'],
    retentionDays: 365,
  },
  {
    id: 'payout_processed',
    domain: 'revenue_payments',
    priority: 'critical',
    defaultChannels: ['in_app', 'email'],
    retentionDays: 2555,
  },
] as const;

export function notificationTypeById(id: string): NotificationTypeDef | undefined {
  return NOTIFICATION_TYPES.find((t) => t.id === id);
}