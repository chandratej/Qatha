/**
 * Creator Events Platform API — registration + escrow revenue path.
 * In-memory store for API clients; CMS primarily uses local platformStore.
 * Aligns with migration 014 tables when Supabase is fully wired.
 */

import { Router } from 'express';
import { requireAuth, getAuthenticatedUserId } from '../middleware/authenticate.js';

export const eventsRouter = Router();

const EVENT_TYPES = [
  'writing_contest', 'first_chapter_challenge', 'short_story_challenge', 'novel_challenge',
  'flash_fiction_challenge', 'festival_challenge', 'genre_challenge', 'district_challenge',
  'prompt_challenge', 'writing_sprint', 'collaboration_challenge', 'beta_reader_event',
  'editing_challenge', 'translation_challenge', 'publishing_pitch_event',
];

const DEFAULT_SPLIT = { platformPct: 15, organizerPct: 10, taxPct: 18 };

/** @type {Map<string, object>} */
const eventsDb = new Map();
/** @type {Map<string, object>} */
const registrationsDb = new Map();

function seedIfEmpty() {
  if (eventsDb.size) return;
  const now = Date.now();
  const seed = [
    {
      id: 'evt-first-chapter',
      organizer_id: 'platform',
      title: 'First Chapter Challenge — Telugu New Voices',
      description: 'Submit your opening chapter. Free entry · acquisition funnel.',
      event_type: 'first_chapter_challenge',
      status: 'registration_open',
      judging_model: 'double_blind',
      entry_fee_inr: 0,
      prize_pool_inr: 25000,
      platform_commission_pct: 15,
      organizer_commission_pct: 0,
      registration_count: 0,
      submission_count: 0,
      registration_opens_at: new Date(now - 86400000).toISOString(),
      registration_closes_at: new Date(now + 30 * 86400000).toISOString(),
    },
    {
      id: 'evt-genre-paid',
      organizer_id: 'platform',
      title: 'Monthly Genre Contest — Paid',
      description: '₹99 entry · escrow prize pool · 15% platform commission.',
      event_type: 'genre_challenge',
      status: 'registration_open',
      judging_model: 'weighted_rubric',
      entry_fee_inr: 99,
      prize_pool_inr: 10000,
      platform_commission_pct: 15,
      organizer_commission_pct: 10,
      registration_count: 0,
      submission_count: 0,
      registration_opens_at: new Date(now - 86400000).toISOString(),
      registration_closes_at: new Date(now + 20 * 86400000).toISOString(),
    },
  ];
  for (const e of seed) eventsDb.set(e.id, e);
}

function escrowSplit(fee) {
  const platformInr = Math.round(fee * (DEFAULT_SPLIT.platformPct / 100) * 100) / 100;
  const organizerInr = Math.round(fee * (DEFAULT_SPLIT.organizerPct / 100) * 100) / 100;
  const taxInr = Math.round(fee * (DEFAULT_SPLIT.taxPct / 100) * 100) / 100;
  const prizePoolInr = Math.round((fee - platformInr - organizerInr - taxInr) * 100) / 100;
  return { platformInr, organizerInr, taxInr, prizePoolInr };
}

function acceptsRegistration(event) {
  if (!['registration_open', 'submissions_open', 'published'].includes(event.status)) return false;
  if (event.registration_closes_at && Date.parse(event.registration_closes_at) < Date.now()) return false;
  return true;
}

eventsRouter.get('/catalog', (_req, res) => {
  res.json({
    event_types: EVENT_TYPES,
    entry_fee_tiers_inr: [0, 49, 99, 149, 199, 299, 499, 999],
    judging_models: ['blind', 'double_blind', 'community_voting', 'hybrid', 'weighted_rubric'],
    modules: [
      'event_management', 'registration', 'wallet', 'escrow', 'payments', 'leaderboards',
      'certificates', 'notifications', 'reporting', 'sponsor_management',
    ],
    revenue_model: {
      platform_commission_pct: 15,
      organizer_commission_pct: 10,
      tax_pct: 18,
      free_events: 'acquisition + content supply',
      paid_events: 'escrow prize pools + platform fee',
    },
  });
});

eventsRouter.get('/', requireAuth(), (_req, res) => {
  seedIfEmpty();
  res.json({ events: [...eventsDb.values()] });
});

eventsRouter.get('/:id', requireAuth(), (req, res) => {
  seedIfEmpty();
  const event = eventsDb.get(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const fee = event.entry_fee_inr || 0;
  res.json({
    event,
    escrowPreview: fee > 0 ? escrowSplit(fee) : null,
    acceptsRegistration: acceptsRegistration(event),
  });
});

eventsRouter.post('/', requireAuth(), (req, res) => {
  seedIfEmpty();
  const userId = getAuthenticatedUserId(req);
  const {
    title,
    event_type,
    entry_fee_inr = 0,
    description = '',
    prize_pool_inr = 0,
    judging_model = 'weighted_rubric',
    open_registration = true,
  } = req.body || {};
  if (!title || !event_type) {
    return res.status(400).json({ message: 'title and event_type required' });
  }
  if (!EVENT_TYPES.includes(event_type)) {
    return res.status(400).json({ message: 'invalid event_type' });
  }
  const id = `evt-${Date.now()}`;
  const event = {
    id,
    organizer_id: userId,
    title,
    description,
    event_type,
    status: open_registration ? 'registration_open' : 'draft',
    judging_model,
    entry_fee_inr: Number(entry_fee_inr) || 0,
    prize_pool_inr: Number(prize_pool_inr) || 0,
    platform_commission_pct: 15,
    organizer_commission_pct: 10,
    registration_count: 0,
    submission_count: 0,
    registration_opens_at: new Date().toISOString(),
    registration_closes_at: new Date(Date.now() + 30 * 86400000).toISOString(),
  };
  eventsDb.set(id, event);
  res.status(201).json({ event });
});

/** Author registration — the missing path that blocked creators */
eventsRouter.post('/:id/register', requireAuth(), (req, res) => {
  seedIfEmpty();
  const userId = getAuthenticatedUserId(req);
  const event = eventsDb.get(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (!acceptsRegistration(event)) {
    return res.status(400).json({ message: 'Registration is closed for this event' });
  }

  const regKey = `${event.id}:${userId}`;
  if (registrationsDb.has(regKey)) {
    return res.json({
      registration: registrationsDb.get(regKey),
      event,
      alreadyRegistered: true,
    });
  }

  const fee = event.entry_fee_inr || 0;
  const split = fee > 0 ? escrowSplit(fee) : { platformInr: 0, organizerInr: 0, taxInr: 0, prizePoolInr: 0 };
  const registration = {
    id: `ereg-${Date.now()}`,
    event_id: event.id,
    participant_id: userId,
    entry_fee_paid_inr: fee,
    payment_status: fee <= 0 ? 'waived' : 'paid',
    registered_at: new Date().toISOString(),
    platform_fee_inr: split.platformInr,
    prize_pool_contribution_inr: split.prizePoolInr,
  };
  registrationsDb.set(regKey, registration);

  event.registration_count = (event.registration_count || 0) + 1;
  if (fee > 0) {
    event.prize_pool_inr = Math.round((event.prize_pool_inr || 0) + split.prizePoolInr);
  }
  eventsDb.set(event.id, event);

  res.status(201).json({ registration, event, escrow: split });
});

eventsRouter.get('/:id/registration/me', requireAuth(), (req, res) => {
  seedIfEmpty();
  const userId = getAuthenticatedUserId(req);
  const reg = registrationsDb.get(`${req.params.id}:${userId}`) || null;
  res.json({ registration: reg });
});

eventsRouter.post('/:id/submit', requireAuth(), (req, res) => {
  seedIfEmpty();
  const userId = getAuthenticatedUserId(req);
  const event = eventsDb.get(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const reg = registrationsDb.get(`${event.id}:${userId}`);
  if (!reg) return res.status(400).json({ message: 'Register before submitting' });
  if (reg.payment_status === 'pending' || reg.payment_status === 'failed') {
    return res.status(400).json({ message: 'Complete entry payment first' });
  }
  const { story_id, story_title } = req.body || {};
  if (!story_id) return res.status(400).json({ message: 'story_id required' });

  reg.story_id = story_id;
  reg.story_title = story_title || null;
  registrationsDb.set(`${event.id}:${userId}`, reg);
  event.submission_count = (event.submission_count || 0) + 1;
  eventsDb.set(event.id, event);

  res.status(201).json({
    submission: {
      id: `esub-${Date.now()}`,
      event_id: event.id,
      registration_id: reg.id,
      story_id,
      story_title,
      validation_status: 'pending',
      submitted_at: new Date().toISOString(),
    },
    registration: reg,
  });
});
