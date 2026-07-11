import {
  CREATOR_NOTIFICATION_DOMAIN_LABELS,
  DEFAULT_CREATOR_NOTIFICATION_PREFS,
  normalizeCreatorNotificationPrefs,
  type CreatorNotificationDomainPrefs,
} from '../../../packages/shared/creatorNotificationPrefs';
import type { NotificationDomain } from '../../../packages/shared/notifications';

const STORAGE_KEY = 'katha_creator_notification_prefs';

export { CREATOR_NOTIFICATION_DOMAIN_LABELS };
export type { CreatorNotificationDomainPrefs };

export function loadLocalNotificationPrefs(userId: string): CreatorNotificationDomainPrefs {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${userId}`);
    if (!raw) return { ...DEFAULT_CREATOR_NOTIFICATION_PREFS };
    return normalizeCreatorNotificationPrefs(JSON.parse(raw) as Partial<CreatorNotificationDomainPrefs>);
  } catch {
    return { ...DEFAULT_CREATOR_NOTIFICATION_PREFS };
  }
}

export function saveLocalNotificationPrefs(
  userId: string,
  prefs: CreatorNotificationDomainPrefs,
): CreatorNotificationDomainPrefs {
  const normalized = normalizeCreatorNotificationPrefs(prefs);
  localStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify(normalized));
  return normalized;
}

export function domainKeys(): NotificationDomain[] {
  return Object.keys(DEFAULT_CREATOR_NOTIFICATION_PREFS) as NotificationDomain[];
}