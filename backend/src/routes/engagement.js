import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

export const engagementRouter = Router();

// Hooked Model: Action -> Reward
// Called by flutter app periodically when reading
engagementRouter.post('/ping-streak', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Get current streak
    const { data: streak, error: fetchError } = await supabase
      .from('reading_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is not found
      throw fetchError;
    }

    let newCurrent = 1;
    let newLongest = 1;
    let milestoneUnlocked = false;

    if (streak) {
      if (streak.last_read_date === today) {
        // Already read today, no streak increment needed, just return current
        return res.json({
          current_streak: streak.current_streak,
          longest_streak: streak.longest_streak,
          milestone_unlocked: false,
          message: 'Already read today'
        });
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (streak.last_read_date === yesterdayStr) {
        // Read yesterday, increment streak
        newCurrent = streak.current_streak + 1;
      } else {
        // Streak broken
        newCurrent = 1;
      }
      newLongest = Math.max(streak.longest_streak, newCurrent);

      // Check if a milestone was hit (e.g., 3 days, 7 days)
      if (newCurrent === 3 || newCurrent === 7 || newCurrent === 30) {
        milestoneUnlocked = true;
      }
    }

    // Upsert the streak
    const { data: updated, error: upsertError } = await supabase
      .from('reading_streaks')
      .upsert({
        user_id: userId,
        current_streak: newCurrent,
        longest_streak: newLongest,
        last_read_date: today,
        updated_at: now.toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (upsertError) throw upsertError;

    res.json({
      current_streak: updated.current_streak,
      longest_streak: updated.longest_streak,
      milestone_unlocked: milestoneUnlocked,
      message: milestoneUnlocked ? `You hit a ${newCurrent} day streak!` : 'Streak updated'
    });
  } catch (error) {
    next(error);
  }
});

// Hooked Model: Reward/Investment Trigger
// Called by the Creator CMS dashboard
engagementRouter.get('/creator-milestones', async (req, res, next) => {
  try {
    const creatorId = req.headers['x-creator-id'] || 'demo-creator-001';

    // Fetch unacknowledged milestones
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

// Acknowledge milestone (so it doesn't pop up again)
engagementRouter.post('/creator-milestones/:id/acknowledge', async (req, res, next) => {
  try {
    const creatorId = req.headers['x-creator-id'] || 'demo-creator-001';
    const milestoneId = req.params.id;

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
