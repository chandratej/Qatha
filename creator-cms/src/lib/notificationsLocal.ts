/**
 * Local notification feed — ARC-01 mock fallback when platform API is offline.
 * Product Council: mirror backend shape so bell + /notifications work in dev mock.
 */

export interface PlatformNotification {
  id: string;
  notification_type: string;
  domain: string;
  priority: string;
  title: string;
  body?: string | null;
  action_url?: string | null;
  read_at?: string | null;
  created_at: string;
}

const STORAGE_KEY = 'katha_notifications_local';

function readAll(): Record<string, PlatformNotification[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PlatformNotification[]>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, PlatformNotification[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function listLocalNotifications(userId: string, limit = 50): PlatformNotification[] {
  const feed = readAll()[userId] || [];
  return feed.slice(0, limit);
}

export function pushLocalNotification(
  userId: string,
  typeId: string,
  opts: { title: string; body?: string; action_url?: string; domain?: string; priority?: string },
): PlatformNotification {
  const all = readAll();
  const feed = all[userId] || [];
  const notification: PlatformNotification = {
    id: `ntf-local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    notification_type: typeId,
    domain: opts.domain || 'moderation',
    priority: opts.priority || 'actionable',
    title: opts.title,
    body: opts.body ?? null,
    action_url: opts.action_url ?? null,
    read_at: null,
    created_at: new Date().toISOString(),
  };
  feed.unshift(notification);
  all[userId] = feed.slice(0, 100);
  writeAll(all);
  return notification;
}

export function markLocalNotificationRead(notificationId: string): PlatformNotification | null {
  const all = readAll();
  for (const userId of Object.keys(all)) {
    const idx = all[userId].findIndex((n) => n.id === notificationId);
    if (idx >= 0) {
      all[userId][idx] = { ...all[userId][idx], read_at: new Date().toISOString() };
      writeAll(all);
      return all[userId][idx];
    }
  }
  return null;
}

export function markAllLocalNotificationsRead(userId: string): number {
  const all = readAll();
  const feed = all[userId] || [];
  const now = new Date().toISOString();
  let marked = 0;
  all[userId] = feed.map((n) => {
    if (n.read_at) return n;
    marked += 1;
    return { ...n, read_at: now };
  });
  writeAll(all);
  return marked;
}