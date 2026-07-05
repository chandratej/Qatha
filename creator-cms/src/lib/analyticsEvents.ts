const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

export function trackCreatorEvent(event: string, properties: Record<string, unknown> = {}) {
  if (import.meta.env.DEV) {
    console.debug('[analytics]', event, properties);
  }

  fetch(`${API_BASE}/api/analytics/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, properties: { source: 'creator_cms', ...properties } }),
  }).catch(() => {});
}