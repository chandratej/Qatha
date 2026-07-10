/**
 * Creator Events Platform API — Master Prompt V2
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/authenticate.js';

export const eventsRouter = Router();

const EVENT_TYPES = [
  'writing_contest', 'first_chapter_challenge', 'short_story_challenge', 'novel_challenge',
  'flash_fiction_challenge', 'festival_challenge', 'genre_challenge', 'district_challenge',
  'prompt_challenge', 'writing_sprint', 'collaboration_challenge', 'beta_reader_event',
  'editing_challenge', 'translation_challenge', 'publishing_pitch_event',
];

eventsRouter.get('/catalog', (_req, res) => {
  res.json({
    event_types: EVENT_TYPES,
    entry_fee_tiers_inr: [0, 49, 99, 149, 199, 299, 499, 999],
    judging_models: ['blind', 'double_blind', 'community_voting', 'hybrid', 'weighted_rubric'],
    modules: [
      'event_management', 'registration', 'wallet', 'escrow', 'payments', 'leaderboards',
      'certificates', 'notifications', 'reporting', 'sponsor_management',
    ],
  });
});

eventsRouter.get('/', requireAuth, (_req, res) => {
  res.json({ events: [], message: 'Apply migration 014 for live events data.' });
});

eventsRouter.post('/', requireAuth, (req, res) => {
  const { title, event_type, entry_fee_inr = 0 } = req.body || {};
  if (!title || !event_type) {
    return res.status(400).json({ message: 'title and event_type required' });
  }
  res.status(201).json({
    event: { id: `evt-${Date.now()}`, title, event_type, entry_fee_inr, status: 'draft' },
  });
});