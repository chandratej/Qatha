import { Router } from 'express';
import { isMockMode } from '../lib/mockMode.js';
import { getSupabase } from '../lib/supabase.js';
import { createAppError } from '../middleware/errorHandler.js';

export const waitlistRouter = Router();

const mockWaitlist = [];

waitlistRouter.post('/', async (req, res, next) => {
  try {
    const { email, phone, source = 'landing' } = req.body;
    if (!email && !phone) {
      throw createAppError('INTERNAL_ERROR', 'Email or phone required', 400);
    }

    const entry = { email, phone, source, created_at: new Date().toISOString() };

    if (isMockMode()) {
      mockWaitlist.push(entry);
      console.log(`[Waitlist] +1 signup (${mockWaitlist.length} total)`, entry);
      return res.json({ joined: true, position: mockWaitlist.length, mock: true });
    }

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('waitlist').insert(entry);
    }

    res.json({ joined: true });
  } catch (err) {
    next(err);
  }
});

waitlistRouter.get('/count', async (_req, res) => {
  if (isMockMode()) {
    return res.json({ count: mockWaitlist.length, mock: true });
  }
  res.json({ count: 0 });
});