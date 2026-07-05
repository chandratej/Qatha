import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { getSeedChapter, DEMO_USER_ID } from '../data/seed.js';
import { addToMockQueue } from '../data/moderationSeed.js';
import { createAppError } from '../middleware/errorHandler.js';
import { canAccessChapter, getAccessDenialMessage } from '../services/accessControl.js';
import { resolveMockUser } from '../services/launchOffer.js';
import { moderateChapter } from '../services/moderation.js';
import { notifyNewChapter } from '../services/notifications.js';

// Lightweight in-memory hot cache for chapter responses (dramatically faster repeat reads)
const chapterCache = new Map(); // key -> {data, ts, etag}

export const chaptersRouter = Router();

chaptersRouter.get('/:storyId/:chapterNumber', async (req, res, next) => {
  try {
    const { storyId, chapterNumber } = req.params;
    const userId = req.headers['x-user-id'];

    let user = null;
    if (userId) {
      if (isMockMode()) {
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

chaptersRouter.post('/:storyId/publish', async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const creatorId = req.headers['x-creator-id'] || 'demo-creator-001';
    const { chapter_number, title, content, content_delta } = req.body;

    if (!content || content.length > 50000) {
      throw createAppError('INTERNAL_ERROR', 'Chapter content invalid (max 50,000 chars)', 400);
    }

    if (isMockMode()) {
      const chapter = { id: `mock-ch-${chapter_number}`, story_id: storyId, chapter_number, title, content: content?.slice(0, 500), status: 'pending_review' };
      addToMockQueue(chapter, 'Creator', 'Submitted for review');
      return res.json({
        chapter,
        moderation: { status: 'pending_review' },
        mock: true,
      });
    }

    const { data: story } = await supabase.from('stories').select('author_id').eq('id', storyId).single();
    if (!story || story.author_id !== creatorId) throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);

    const { data: chapter, error } = await supabase.from('chapters').upsert({
      story_id: storyId, chapter_number, title, content, content_delta, status: 'pending_review',
    }, { onConflict: 'story_id,chapter_number' }).select().single();

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    const moderation = await moderateChapter(chapter.id, content, creatorId);
    if (moderation.status === 'approved') await notifyNewChapter(storyId, chapter.id);
    res.json({ chapter, moderation });
  } catch (err) {
    next(err);
  }
});

chaptersRouter.post('/progress', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || DEMO_USER_ID;
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