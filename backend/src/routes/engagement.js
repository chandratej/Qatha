import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { getSeedMilestones, acknowledgeSeedMilestone } from '../data/seed.js';
import { requireAuth, requireAuthOrMockLegacyUser, getAuthenticatedUserId } from '../middleware/authenticate.js';
import { createReaderFeedback } from '../services/readerFeedbackStore.js';
import { notifyReaderFeedbackReceived } from '../services/notificationsStore.js';
import { createAppError } from '../middleware/errorHandler.js';
import { seedStories, DEMO_CREATOR_ID } from '../data/seed.js';

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

/** Reader feedback submit — Vol_07-01 (reader-app → creator inbox) */
engagementRouter.post('/reader-feedback', requireAuth(), async (req, res, next) => {
  try {
    const readerId = getAuthenticatedUserId(req);
    const { story_id: storyId, chapter_number, body, feedback_type } = req.body || {};

    if (!storyId) {
      throw createAppError('BAD_REQUEST', 'story_id is required', 400);
    }

    if (!isMockMode()) {
      const { data: story } = await supabase.from('stories').select('id, is_published').eq('id', storyId).maybeSingle();
      if (!story) throw createAppError('NOT_FOUND', 'Story not found', 404);
      if (story.is_published !== true) {
        throw createAppError('BAD_REQUEST', 'Feedback is only accepted for published stories', 400);
      }
      if (chapter_number != null) {
        const { data: chapter } = await supabase.from('chapters')
          .select('status')
          .eq('story_id', storyId)
          .eq('chapter_number', Number(chapter_number))
          .maybeSingle();
        if (!chapter || chapter.status !== 'published') {
          throw createAppError('BAD_REQUEST', 'Chapter must be published to receive feedback', 400);
        }
      }
    }

    const feedback = await createReaderFeedback(storyId, readerId, {
      chapter_number,
      body,
      feedback_type,
    });

    let authorId = DEMO_CREATOR_ID;
    let storyTitle = 'your story';
    if (isMockMode()) {
      const story = seedStories.find((s) => s.id === storyId);
      authorId = story?.author_id || DEMO_CREATOR_ID;
      storyTitle = story?.title || storyTitle;
    } else {
      const { data: story } = await supabase.from('stories')
        .select('author_id, title')
        .eq('id', storyId)
        .maybeSingle();
      authorId = story?.author_id;
      storyTitle = story?.title || storyTitle;
    }
    if (authorId && authorId !== readerId) {
      await notifyReaderFeedbackReceived(authorId, {
        storyTitle,
        storyId,
        chapterNumber: chapter_number,
        preview: body,
      });
    }

    res.status(201).json({ feedback, mock: isMockMode() });
  } catch (err) {
    next(err instanceof Error && !err.code ? createAppError('BAD_REQUEST', err.message, 400) : err);
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