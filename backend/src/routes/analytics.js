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