import { Router } from 'express';
import { isMockMode } from '../lib/mockMode.js';

export const analyticsRouter = Router();

const VALID_EVENTS = new Set([
  'app_install', 'homepage_view', 'chapter_opened', 'chapter_completed',
  'chapter_3_completed', 'otp_gate_shown', 'otp_completed', 'paywall_shown',
  'subscription_page_opened', 'payment_attempted', 'subscription_confirmed',
  'creator_dashboard_view', 'chapter_published', 'moderation_reviewed',
]);

const eventLog = [];

analyticsRouter.post('/events', async (req, res) => {
  const { event, properties, user_id } = req.body;

  if (!event || !VALID_EVENTS.has(event)) {
    return res.status(400).json({ tracked: false, reason: 'invalid_event' });
  }

  const entry = {
    event,
    user_id: user_id || 'anonymous',
    properties: properties || {},
    timestamp: new Date().toISOString(),
  };

  eventLog.push(entry);
  if (eventLog.length > 10000) eventLog.shift();

  if (isMockMode()) {
    console.log(`[Analytics] ${event}`, JSON.stringify(properties || {}));
  }

  res.json({ tracked: true });
});

analyticsRouter.get('/funnel', (_req, res) => {
  const counts = {};
  for (const e of eventLog) {
    counts[e.event] = (counts[e.event] || 0) + 1;
  }
  res.json({ funnel: counts, total_events: eventLog.length, mock: isMockMode() });
});

/**
 * Conversion rate by free-chapter-count cohort (Req 3.3/3.4 of the free-chapter-threshold
 * redesign) — groups paywall_shown / subscription_confirmed by whatever cohort tag the
 * caller attached in `properties.free_chapter_source` (e.g. "proven_story", "cohort:control_5",
 * "unproven_default"). This is the lightweight MVP version the doc explicitly allows —
 * not a full experimentation platform.
 */
analyticsRouter.get('/funnel/cohorts', (_req, res) => {
  const cohorts = {};
  const ensure = (key) => {
    if (!cohorts[key]) {
      cohorts[key] = { paywall_shown: 0, subscription_confirmed: 0, chapter_3_completed: 0 };
    }
    return cohorts[key];
  };

  for (const e of eventLog) {
    if (!['paywall_shown', 'subscription_confirmed', 'chapter_3_completed'].includes(e.event)) continue;
    const key = e.properties?.free_chapter_source || e.properties?.free_chapter_cohort || 'unknown';
    const bucket = ensure(key);
    bucket[e.event] += 1;
  }

  const summary = Object.fromEntries(
    Object.entries(cohorts).map(([key, bucket]) => [
      key,
      {
        ...bucket,
        conversion_rate: bucket.paywall_shown > 0
          ? Math.round((bucket.subscription_confirmed / bucket.paywall_shown) * 1000) / 10
          : null,
      },
    ]),
  );

  res.json({ cohorts: summary, mock: isMockMode() });
});