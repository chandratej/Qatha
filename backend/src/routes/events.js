/**
 * Creator Events Platform API — delegates to eventsStore (migration 014).
 */

import { Router } from 'express';
import { requireAuth, getAuthenticatedUserId } from '../middleware/authenticate.js';
import {
  EVENT_TYPES,
  listEvents,
  getEventById,
  createEvent,
  registerForEvent,
  getRegistration,
  submitToEvent,
  acceptsRegistration,
  escrowSplit,
} from '../services/eventsStore.js';
import { createAppError } from '../middleware/errorHandler.js';

export const eventsRouter = Router();

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

eventsRouter.get('/', requireAuth(), async (req, res, next) => {
  try {
    const events = await listEvents();
    res.json({ events });
  } catch (err) {
    next(err instanceof Error ? createAppError('INTERNAL_ERROR', err.message, 500) : err);
  }
});

eventsRouter.get('/:id', requireAuth(), async (req, res, next) => {
  try {
    const event = await getEventById(req.params.id);
    if (!event) throw createAppError('NOT_FOUND', 'Event not found', 404);
    const fee = event.entry_fee_inr || 0;
    res.json({
      event,
      escrowPreview: fee > 0 ? escrowSplit(fee) : null,
      acceptsRegistration: acceptsRegistration(event),
    });
  } catch (err) {
    next(err instanceof Error && !err.status ? createAppError('INTERNAL_ERROR', err.message, 500) : err);
  }
});

eventsRouter.post('/', requireAuth(), async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const event = await createEvent(userId, req.body);
    res.status(201).json({ event });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

eventsRouter.post('/:id/register', requireAuth(), async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = await registerForEvent(userId, req.params.id);
    res.status(result.alreadyRegistered ? 200 : 201).json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

eventsRouter.get('/:id/registration/me', requireAuth(), async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const registration = await getRegistration(req.params.id, userId);
    res.json({ registration });
  } catch (err) {
    next(err);
  }
});

eventsRouter.post('/:id/submit', requireAuth(), async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = await submitToEvent(userId, req.params.id, req.body || {});
    res.status(201).json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});