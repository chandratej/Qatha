import { useSupabaseDirect } from './api';
import { sbTrackAnalyticsEvent } from '../services';

export function trackCreatorEvent(event: string, properties: Record<string, unknown> = {}) {
  if (import.meta.env.DEV) {
    console.debug('[analytics]', event, properties);
  }

  if (useSupabaseDirect()) {
    sbTrackAnalyticsEvent(event, properties).catch(() => {});
    return;
  }

  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
  fetch(`${API_BASE}/api/analytics/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, properties: { source: 'creator_cms', ...properties } }),
  }).catch(() => {});
}