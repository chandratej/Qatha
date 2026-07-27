/**
 * Shared notification fetch with short TTL + in-flight coalescing.
 * Stops Layout bell + page + widgets from stampeding the API (~10 GETs).
 */

import { platformApi } from './platformApi';
import type { PlatformNotification } from './notificationsLocal';

const TTL_MS = 8_000;

let cache: { userId: string; at: number; data: PlatformNotification[] } | null = null;
let inflight: Promise<PlatformNotification[]> | null = null;
let inflightUserId: string | null = null;

export async function fetchNotificationsShared(userId: string): Promise<PlatformNotification[]> {
  const now = Date.now();
  if (cache && cache.userId === userId && now - cache.at < TTL_MS) {
    return cache.data;
  }
  if (inflight && inflightUserId === userId) {
    return inflight;
  }

  inflightUserId = userId;
  inflight = platformApi
    .getNotifications(userId)
    .then((r) => {
      const list = r.notifications || [];
      cache = { userId, at: Date.now(), data: list };
      return list;
    })
    .finally(() => {
      inflight = null;
      inflightUserId = null;
    });

  return inflight;
}

export function invalidateNotificationsCache() {
  cache = null;
}
