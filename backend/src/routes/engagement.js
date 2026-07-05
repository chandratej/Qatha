import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { getSeedMilestones, acknowledgeSeedMilestone } from '../data/seed.js';

export const engagementRouter = Router();

engagementRouter.post('/ping-streak', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const { data: streak, error: fetchError } = await supabase
      .from('reading_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    let newCurrent = 1;
    let newLongest = 1;
    let milestoneUnlocked = false;

    if (streak) {
      if (streak.last_read_date === today) {
        return res.json({
          current_streak: streak.current_streak,
          longest_streak: streak.longest_streak,
          milestone_unlocked: false,
          message: 'Already read today',
        });
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (streak.last_read_date === yesterdayStr) {
        newCurrent = streak.current_streak + 1;
      } else {
        newCurrent = 1;
      }
      newLongest = Math.max(streak.longest_streak, newCurrent);

      if (newCurrent === 3 || newCurrent === 7 || newCurrent === 30) {
        milestoneUnlocked = true;
      }
    }

    const { data: updated, error: upsertError } = await supabase
      .from('reading_streaks')
      .upsert({
        user_id: userId,
        current_streak: newCurrent,
        longest_streak: newLongest,
        last_read_date: today,
        updated_at: now.toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (upsertError) throw upsertError;

    res.json({
      current_streak: updated.current_streak,
      longest_streak: updated.longest_streak,
      milestone_unlocked: milestoneUnlocked,
      message: milestoneUnlocked ? `You hit a ${newCurrent} day streak!` : 'Streak updated',
    });
  } catch (error) {
    next(error);
  }
});

engagementRouter.get('/creator-milestones', async (req, res, next) => {
  try {
    const creatorId = req.headers['x-creator-id'] || 'demo-creator-001';

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

engagementRouter.post('/creator-milestones/:id/acknowledge', async (req, res, next) => {
  try {
    const creatorId = req.headers['x-creator-id'] || 'demo-creator-001';
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