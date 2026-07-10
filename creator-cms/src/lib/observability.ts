/**
 * Optional Sentry + PostHog — only active when env keys are set (Cycle 7).
 * Safe no-ops in local/mock without DSN/key.
 */

import { trackCreatorEvent } from './analyticsEvents';

let sentryReady = false;
let posthogReady = false;

export async function initObservability(): Promise<void> {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  const posthogHost = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com';

  if (sentryDsn) {
    try {
      const Sentry = await import('@sentry/react');
      Sentry.init({
        dsn: sentryDsn,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.15,
        integrations: [],
      });
      sentryReady = true;
      if (import.meta.env.DEV) console.info('[observability] Sentry enabled');
    } catch (e) {
      console.warn('[observability] Sentry init failed', e);
    }
  }

  if (posthogKey) {
    try {
      const posthog = (await import('posthog-js')).default;
      posthog.init(posthogKey, {
        api_host: posthogHost,
        capture_pageview: true,
        persistence: 'localStorage',
      });
      posthogReady = true;
      if (import.meta.env.DEV) console.info('[observability] PostHog enabled');
    } catch (e) {
      console.warn('[observability] PostHog init failed', e);
    }
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (sentryReady) {
    import('@sentry/react').then((Sentry) => {
      Sentry.captureException(error, { extra: context });
    }).catch(() => {});
  }
  trackCreatorEvent('client_error', {
    message: error instanceof Error ? error.message : String(error),
    ...context,
  });
}

export function captureProductEvent(event: string, properties: Record<string, unknown> = {}) {
  trackCreatorEvent(event, properties);
  if (posthogReady) {
    import('posthog-js').then((m) => {
      m.default.capture(event, properties);
    }).catch(() => {});
  }
}

export function observabilityStatus() {
  return { sentryReady, posthogReady };
}
