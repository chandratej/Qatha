import { NOTIFICATION_DOMAINS, type NotificationDomain } from './notifications';

/** Creator in-app domain toggles — Vol_02-03 Part 2E (DPDP fatigue control). */
export type CreatorNotificationDomainPrefs = Record<NotificationDomain, boolean>;

export const DEFAULT_CREATOR_NOTIFICATION_PREFS: CreatorNotificationDomainPrefs = Object.fromEntries(
  NOTIFICATION_DOMAINS.map((d) => [d, true]),
) as CreatorNotificationDomainPrefs;

/** Legal & Trust — revenue/payout alerts should stay on by default; UI warns on disable. */
export const CRITICAL_NOTIFICATION_DOMAINS: readonly NotificationDomain[] = [
  'revenue_payments',
  'account_security',
];

export const CREATOR_NOTIFICATION_DOMAIN_LABELS: Record<NotificationDomain, string> = {
  account_security: 'Account & security',
  story_creation: 'Story creation',
  collaboration: 'Collaboration',
  reviews: 'Reviews & Reviewer Pool',
  publishing: 'Publishing & schedule',
  reader_engagement: 'Reader engagement',
  community: 'Community',
  revenue_payments: 'Revenue & payouts',
  moderation: 'Moderation',
  ai_assistant: 'AI assistant',
  system_platform: 'Platform updates',
};

export function normalizeCreatorNotificationPrefs(
  raw: Partial<CreatorNotificationDomainPrefs> | null | undefined,
): CreatorNotificationDomainPrefs {
  const base = { ...DEFAULT_CREATOR_NOTIFICATION_PREFS };
  if (!raw) return base;
  for (const domain of NOTIFICATION_DOMAINS) {
    if (typeof raw[domain] === 'boolean') base[domain] = raw[domain];
  }
  return base;
}