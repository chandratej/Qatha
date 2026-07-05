import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { getSeedChapter, mockChapterStore, countDraftWords } from '../data/seed.js';
import { addToMockQueue } from '../data/moderationSeed.js';
import { createAppError } from '../middleware/errorHandler.js';
import { canAccessChapter, getAccessDenialMessage } from '../services/accessControl.js';
import { resolveMockUser } from '../services/launchOffer.js';
import { moderateChapter, scoreHeuristicToxicity, analyzeWithPerspective } from '../services/moderation.js';
import { notifyNewChapter } from '../services/notifications.js';
import { requireAuth, requireAuthOrMockLegacyUser, getAuthenticatedUserId } from '../middleware/authenticate.js';

// Lightweight in-memory hot cache for chapter responses (dramatically faster repeat reads)
const chapterCache = new Map(); // key -> {data, ts, etag}

export const chaptersRouter = Router();

chaptersRouter.get('/:storyId/:chapterNumber', requireAuth({ optional: true }), async (req, res, next) => {
  try {
    const { storyId, chapterNumber } = req.params;
    const userId = req.auth?.userId || (isMockMode() ? req.headers['x-user-id'] : null);

    let user = null;
    if (userId) {
      if (isMockMode() && !req.auth) {
        user = resolveMockUser(userId, req.headers);
      } else {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        user = data;
      }
    }

    const access = canAccessChapter(Number(chapterNumber), user);
    if (!access.allowed) {
      const custom = getAccessDenialMessage(access.reason, user);
      const err = createAppError(access.reason, custom?.user_message, 403);
      if (custom?.action) err.action = custom.action;
      throw err;
    }

    // === FAST PATH: Simple in-memory cache + headers for snappy repeated loads ===
    const cacheKey = `${storyId}:${chapterNumber}`;
    const cached = chapterCache.get(cacheKey);
    if (cached && (Date.now() - cached.ts) < 90_000) {  // 90s TTL for chapters (they rarely change)
      res.setHeader('Cache-Control', 'private, max-age=120, stale-while-revalidate=300');
      res.setHeader('ETag', cached.etag);
      return res.json({ chapter: cached.data, cached: true });
    }

    let chapterData;
    if (isMockMode()) {
      chapterData = getSeedChapter(storyId, Number(chapterNumber));
      if (!chapterData) throw createAppError('CHAPTER_NOT_FOUND', null, 404);
    } else {
      const { data, error } = await supabase.from('chapters')
        .select('id, story_id, chapter_number, title, content, estimated_read_time_minutes, view_count, status, content_hash')
        .eq('story_id', storyId).eq('chapter_number', chapterNumber).eq('status', 'published').single();

      if (error || !data) throw createAppError('CHAPTER_NOT_FOUND', null, 404);
      chapterData = data;
    }

    // Store in hot cache + strong headers
    const etag = `"${chapterData.id || chapterData.story_id + chapterData.chapter_number}"`;
    chapterCache.set(cacheKey, { data: chapterData, ts: Date.now(), etag });

    res.setHeader('Cache-Control', 'private, max-age=180');
    res.setHeader('ETag', etag);
    // Allow CDN/proxies to cache public published content longer in real prod (with auth consideration)
    res.json({ chapter: chapterData });
  } catch (err) {
    next(err);
  }
});

chaptersRouter.post('/:storyId/draft', requireAuth(), async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const creatorId = getAuthenticatedUserId(req);
    const { chapter_number, title, content, content_delta } = req.body;

    if (!chapter_number) {
      throw createAppError('INTERNAL_ERROR', 'chapter_number is required', 400);
    }

    if (isMockMode()) {
      const key = `${storyId}:${chapter_number}`;
      const word_count = countDraftWords({ content, content_delta });
      const scene_count = content_delta?.scenes?.length || 1;
      const draft = {
        id: `draft-${storyId}-${chapter_number}`,
        creator_id: creatorId,
        story_id: storyId,
        chapter_number,
        title: title || `Chapter ${chapter_number}`,
        content: content || '',
        content_delta: content_delta || null,
        status: 'draft',
        word_count,
        scene_count,
        last_saved_at: new Date().toISOString(),
      };
      mockChapterStore.set(key, draft);
      return res.json({ saved: true, draft, mock: true });
    }

    const { data: story } = await supabase.from('stories').select('author_id').eq('id', storyId).single();
    if (!story || story.author_id !== creatorId) throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);

    const word_count = countDraftWords({ content, content_delta });
    const scene_count = content_delta?.scenes?.length || 1;
    const enrichedDelta = content_delta
      ? { ...content_delta, word_count, scene_count }
      : { scenes: [], word_count, scene_count };

    const { data: draft, error } = await supabase.from('chapter_drafts').upsert({
      creator_id: creatorId,
      story_id: storyId,
      chapter_number,
      title,
      content,
      content_delta: enrichedDelta,
      last_saved_at: new Date().toISOString(),
    }, { onConflict: 'creator_id,story_id,chapter_number' }).select().single();

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({ saved: true, draft });
  } catch (err) {
    next(err);
  }
});

chaptersRouter.post('/:storyId/publish', requireAuth(), async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const creatorId = getAuthenticatedUserId(req);
    const { chapter_number, title, content, content_delta, appeal_note } = req.body;

    if (!content || content.length > 50000) {
      throw createAppError('INTERNAL_ERROR', 'Chapter content invalid (max 50,000 chars)', 400);
    }

    if (isMockMode()) {
      let toxicityScore = 0;
      if (process.env.PERSPECTIVE_API_KEY) {
        try {
          toxicityScore = await analyzeWithPerspective(content);
        } catch {
          toxicityScore = scoreHeuristicToxicity(content);
        }
      } else {
        toxicityScore = scoreHeuristicToxicity(content);
      }

      const chapter = {
        id: `mock-ch-${chapter_number}`,
        story_id: storyId,
        chapter_number,
        title,
        content,
        status: toxicityScore > 0.7 ? 'pending_review' : 'published',
        moderation_status: toxicityScore > 0.7 ? 'pending' : 'approved',
        moderation_notes: appeal_note || null,
      };
      mockChapterStore.set(`${storyId}:${chapter_number}`, {
        ...chapter,
        creator_id: creatorId,
        last_saved_at: new Date().toISOString(),
      });

      const queueNote = appeal_note
        ? `Resubmitted: ${appeal_note}`
        : toxicityScore > 0.7
          ? `Auto-flagged (toxicity ${(toxicityScore * 100).toFixed(0)}%)`
          : 'Submitted for review';
      addToMockQueue(chapter, 'Creator', queueNote, toxicityScore);

      return res.json({
        chapter,
        moderation: {
          status: chapter.status,
          toxicity_score: toxicityScore,
          note: toxicityScore > 0.7
            ? 'Queued for manual review — high toxicity score'
            : 'Auto-approved (low toxicity score)',
        },
        mock: true,
      });
    }

    const { data: story } = await supabase.from('stories').select('author_id').eq('id', storyId).single();
    if (!story || story.author_id !== creatorId) throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);

    const { data: chapter, error } = await supabase.from('chapters').upsert({
      story_id: storyId,
      chapter_number,
      title,
      content,
      content_delta,
      status: 'pending_review',
      moderation_notes: appeal_note || null,
    }, { onConflict: 'story_id,chapter_number' }).select().single();

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    const moderation = await moderateChapter(chapter.id, content, creatorId);
    if (moderation.status === 'approved') await notifyNewChapter(storyId, chapter.id);
    res.json({ chapter, moderation });
  } catch (err) {
    next(err);
  }
});

chaptersRouter.post('/progress', requireAuthOrMockLegacyUser(), async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { story_id, chapter_id, scroll_position_pct, is_completed, last_read_char_offset } = req.body;

    if (isMockMode()) return res.json({ saved: true, mock: true });

    const payload = {
      user_id: userId,
      story_id,
      chapter_id,
      scroll_position_pct: scroll_position_pct ?? 0,
      is_completed: is_completed || (scroll_position_pct ?? 0) >= 95,
      last_read_at: new Date().toISOString(),
    };
    if (typeof last_read_char_offset === 'number') {
      payload.last_read_char_offset = last_read_char_offset;
    }

    const { error } = await supabase.from('reading_progress').upsert(payload, { onConflict: 'user_id,chapter_id' });

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({ saved: true });
  } catch (err) {
    next(err);
  }
});