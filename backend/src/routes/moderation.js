import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { getMockModerationQueue, reviewMockItem } from '../data/moderationSeed.js';
import { createAppError } from '../middleware/errorHandler.js';
import { requireRole } from '../middleware/requireRole.js';

export const moderationRouter = Router();

moderationRouter.use(requireRole('admin', 'moderator'));

moderationRouter.get('/queue', async (req, res, next) => {
  try {
    if (isMockMode()) {
      return res.json({ queue: getMockModerationQueue(), mock: true });
    }

    const { data, error } = await supabase
      .from('moderation_queue')
      .select(`
        id, status, reason, toxicity_score, created_at,
        chapters(id, title, chapter_number, content),
        creators(pen_name)
      `)
      .eq('status', 'pending')
      .order('created_at');

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({ queue: data || [] });
  } catch (err) {
    next(err);
  }
});

moderationRouter.post('/:id/review', async (req, res, next) => {
  try {
    const { decision, notes } = req.body;
    const validDecisions = ['approved', 'needs_revision', 'rejected'];

    if (!validDecisions.includes(decision)) {
      throw createAppError('INTERNAL_ERROR', 'Invalid decision', 400);
    }

    if (isMockMode()) {
      const item = reviewMockItem(req.params.id, decision, notes);
      if (!item) throw createAppError('CHAPTER_NOT_FOUND', 'Item not found', 404);
      return res.json({ reviewed: true, decision, mock: true });
    }

    const { data: item } = await supabase
      .from('moderation_queue')
      .select('chapter_id, creator_id, chapters(title, chapter_number, story_id)')
      .eq('id', req.params.id)
      .single();

    await supabase.from('moderation_queue').update({
      status: decision === 'approved' ? 'approved' : decision,
      reviewer_notes: notes,
      reviewed_at: new Date().toISOString(),
    }).eq('id', req.params.id);

      if (item) {
      const ch = item.chapters;
      await supabase.from('chapters').update({
        status: decision === 'approved' ? 'published' : 'draft',
        moderation_status: decision,
        moderation_reason: notes || null,
        published_at: decision === 'approved' ? new Date().toISOString() : null,
      }).eq('id', item.chapter_id);

      if (decision === 'approved' && item.creator_id && ch?.story_id) {
        try {
          const { onChapterPublished } = await import('../services/debutSeasonStore.js');
          await onChapterPublished(item.creator_id, ch.story_id);
        } catch (debutErr) {
          console.warn('[Moderation] debut season hook failed:', debutErr?.message);
        }
      }

      // Cycle 7 — notify creator (milestone + console/push hook)
      try {
        const chTitle = ch?.title || `Chapter ${ch?.chapter_number || ''}`;
        const label =
          decision === 'approved'
            ? `Published: ${chTitle}`
            : decision === 'needs_revision'
              ? `Edits requested: ${chTitle}`
              : `Not approved: ${chTitle}`;

        if (item.creator_id) {
          await supabase.from('creator_milestones').insert({
            creator_id: item.creator_id,
            milestone_type: `MODERATION_${decision.toUpperCase()}`,
            metadata: {
              chapter_id: item.chapter_id,
              story_id: ch?.story_id || null,
              notes: notes || null,
              label,
            },
          }).then(() => {}).catch(() => {});

          // Log for ops; push delivery via existing notify channel when wired
          console.log(`[Moderation notify] creator=${item.creator_id} decision=${decision} ${label}`);
        }
      } catch (notifyErr) {
        console.warn('[Moderation] notify failed:', notifyErr?.message);
      }
    }

    res.json({ reviewed: true, decision, notified: Boolean(item?.creator_id) });
  } catch (err) {
    next(err);
  }
});