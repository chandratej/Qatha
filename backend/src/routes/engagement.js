import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { getSeedMilestones, acknowledgeSeedMilestone } from '../data/seed.js';
import { requireAuth, requireAuthOrMockLegacyUser, getAuthenticatedUserId } from '../middleware/authenticate.js';

export const engagementRouter = Router();

// @deprecated Architecture V2 §11 — breakable streaks rejected. Retained for reader backward compat; no gamification.
engagementRouter.post('/ping-streak', requireAuthOrMockLegacyUser(), async (req, res, next) => {
  try {
    res.setHeader('Deprecation', 'true');
    res.setHeader('X-Katha-Architecture', 'V2 §11 — streak gamification disabled');
    res.json({
      current_streak: 0,
      longest_streak: 0,
      milestone_unlocked: false,
      message: 'Reading streak tracking is deprecated per architecture V2',
      deprecated: true,
    });
  } catch (error) {
    next(error);
  }
});

engagementRouter.get('/creator-milestones', requireAuth(), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);

    if (isMockMode()) {
      return res.json({ milestones: getSeedMilestones(creatorId), mock: true });
    }

    const { data: milestones, error } = await supabase
      .from('creator_milestones')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('acknowledged', false)
      .order('achieved_at', { ascending: true });

    if (error) throw error;

    res.json({ milestones: milestones || [] });
  } catch (error) {
    next(error);
  }
});

engagementRouter.post('/creator-milestones/:id/acknowledge', requireAuth(), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const milestoneId = req.params.id;

    if (isMockMode()) {
      const ok = acknowledgeSeedMilestone(milestoneId, creatorId);
      if (!ok) return res.status(404).json({ error: 'Milestone not found' });
      return res.json({ success: true, mock: true });
    }

    const { error } = await supabase
      .from('creator_milestones')
      .update({ acknowledged: true })
      .eq('id', milestoneId)
      .eq('creator_id', creatorId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});