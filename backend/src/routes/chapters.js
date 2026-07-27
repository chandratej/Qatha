import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import {
  getSeedChapter,
  getPublicStoryById,
  mockChapterStore,
  countDraftWords,
  markMockStoryChapterPublished,
} from '../data/seed.js';
import { addToMockQueue } from '../data/moderationSeed.js';
import { createAppError } from '../middleware/errorHandler.js';
import { canAccessChapter, getAccessDenialMessage } from '../services/accessControl.js';
import { resolveMockUser } from '../services/launchOffer.js';
import { getOrLockSampleFreeChapterCountWithSource } from '../services/freeChapterThreshold.js';
import { moderateChapter, moderateContent, riskScoreFromResult } from '../services/moderation/index.js';
import { generateUniqueStorySlug } from '../lib/slugify.js';
import { notifyNewChapter } from '../services/notifications.js';
import {
  requireAuth,
  requireAuthOrMockLegacyUser,
  requireCreatorConsent,
  getAuthenticatedUserId,
} from '../middleware/authenticate.js';
import { requireStoryRole } from '../middleware/requireStoryRole.js';
import { assertChapterEditable } from '../services/chapterImmutability.js';
import { invalidatePublicStoryCache } from './stories.js';
import {
  sanitizePublishedContent,
  estimateReadTimeMinutes,
} from '../lib/publishContent.js';
import {
  softWordTargetForContentType,
  countWordsInContent,
} from '../services/contentFormatDiscovery.js';

// Lightweight in-memory hot cache for chapter responses (dramatically faster repeat reads)
const chapterCache = new Map(); // key -> {data, ts, etag}

function bustChapterCache(storyId, chapterNumber) {
  chapterCache.delete(`${storyId}:${chapterNumber}`);
  // Also clear list caches so the new story appears on Home/Browse
  invalidatePublicStoryCache();
}

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

    let storyForAccess;
    if (isMockMode()) {
      storyForAccess = getPublicStoryById(storyId);
    } else {
      // free_chapter_* may be absent until migration 042 — access control derives defaults without them.
      let storyRes = await supabase
        .from('stories')
        .select('id, author_id, total_readers, trust_level, free_chapter_count, free_chapter_cohort')
        .eq('id', storyId)
        .maybeSingle();
      if (storyRes.error && /free_chapter|column .* does not exist/i.test(storyRes.error.message || '')) {
        storyRes = await supabase
          .from('stories')
          .select('id, author_id, total_readers, trust_level')
          .eq('id', storyId)
          .maybeSingle();
      }
      storyForAccess = storyRes.data;
    }
    const { count: freeChapters, source: freeChapterSource } = await getOrLockSampleFreeChapterCountWithSource(userId, storyForAccess);

    const access = canAccessChapter(Number(chapterNumber), user, { freeChapters });
    if (!access.allowed) {
      const custom = getAccessDenialMessage(access.reason, user);
      const err = createAppError(access.reason, custom?.user_message, 403, { free_chapter_source: freeChapterSource });
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

    // Sanitize on read so legacy published HTML with editor highlights still renders cleanly.
    // Recompute read-time from body words so stub "1 min" rows correct themselves without republish.
    const cleanContent = sanitizePublishedContent(chapterData.content || '');
    const wordMinutes = estimateReadTimeMinutes(cleanContent);
    const storedMinutes = Number(chapterData.estimated_read_time_minutes) || 0;
    const chapterForClient = {
      ...chapterData,
      content: cleanContent,
      estimated_read_time_minutes: Math.max(storedMinutes, wordMinutes),
    };

    // Store in hot cache + strong headers
    const etag = `"${chapterForClient.id || chapterForClient.story_id + chapterForClient.chapter_number}"`;
    chapterCache.set(cacheKey, { data: chapterForClient, ts: Date.now(), etag });

    res.setHeader('Cache-Control', 'private, max-age=180');
    res.setHeader('ETag', etag);
    // Allow CDN/proxies to cache public published content longer in real prod (with auth consideration)
    res.json({ chapter: chapterForClient });
  } catch (err) {
    next(err);
  }
});

chaptersRouter.post('/:storyId/draft', requireAuth(), requireCreatorConsent(), requireStoryRole('story.edit'), async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const creatorId = getAuthenticatedUserId(req);
    const { chapter_number, title, content, content_delta } = req.body;

    if (!chapter_number) {
      throw createAppError('INTERNAL_ERROR', 'chapter_number is required', 400);
    }

    if (isMockMode()) {
      const key = `${storyId}:${chapter_number}`;
      const existing = mockChapterStore.get(key);
      if (existing?.status === 'published') {
        throw createAppError('CHAPTER_IMMUTABLE', 'Published chapters are immutable. Resubmit for review to publish edits.', 409);
      }
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

    const { data: existingChapter } = await supabase.from('chapters')
      .select('status')
      .eq('story_id', storyId)
      .eq('chapter_number', chapter_number)
      .maybeSingle();
    try {
      assertChapterEditable(existingChapter?.status);
    } catch (e) {
      throw createAppError('CHAPTER_IMMUTABLE', e.message, 409);
    }

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

    await supabase.from('chapters')
      .update({ status: 'draft', scheduled_publish_at: null, moderation_status: null })
      .eq('story_id', storyId)
      .eq('chapter_number', chapter_number)
      .eq('status', 'scheduled');

    res.json({ saved: true, draft });
  } catch (err) {
    next(err);
  }
});

chaptersRouter.post('/:storyId/publish', requireAuth(), requireCreatorConsent(), requireStoryRole('story.publish'), async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const creatorId = getAuthenticatedUserId(req);
    const { chapter_number, title, content: rawContent, content_delta, appeal_note } = req.body;

    if (!rawContent || !String(rawContent).trim()) {
      throw createAppError('INTERNAL_ERROR', 'Chapter content is required', 400);
    }

    // Always strip editor-only formatting before any publish path.
    const content = sanitizePublishedContent(rawContent);
    const estimated_read_time_minutes = estimateReadTimeMinutes(content);

    // Serialized word band only: soft 1,500–2,500 · hard max 3,000 words (no character ceiling).
    let storyContentType = 'serialized_story';
    if (!isMockMode()) {
      const { data: storyMeta } = await supabase
        .from('stories')
        .select('content_type')
        .eq('id', storyId)
        .maybeSingle();
      if (storyMeta?.content_type) storyContentType = storyMeta.content_type;
    }
    const softWords = softWordTargetForContentType(storyContentType);
    if (softWords) {
      const wordCount = countWordsInContent(content);
      if (wordCount < softWords.min) {
        throw createAppError(
          'CHAPTER_TOO_SHORT',
          `Serialized chapters need at least ${softWords.min.toLocaleString()} words ` +
            `(recommended ${softWords.min.toLocaleString()}–${softWords.max.toLocaleString()}, ` +
            `hard max ${softWords.hardMax.toLocaleString()}). You have ${wordCount}.`,
          400,
        );
      }
      if (wordCount > softWords.hardMax) {
        throw createAppError(
          'CHAPTER_TOO_LONG',
          `Serialized chapters cannot exceed ${softWords.hardMax.toLocaleString()} words ` +
            `(recommended ${softWords.min.toLocaleString()}–${softWords.max.toLocaleString()}). ` +
            `You have ${wordCount}.`,
          400,
        );
      }
    }

    if (isMockMode()) {
      const moderation = await moderateContent(content);
      const riskScore = riskScoreFromResult(moderation);
      const flagged = !moderation.isSafe;

      const chapter = {
        id: `mock-ch-${chapter_number}`,
        story_id: storyId,
        chapter_number,
        title,
        content,
        estimated_read_time_minutes,
        status: flagged ? 'pending_review' : 'published',
        moderation_status: flagged ? 'pending' : 'approved',
        moderation_reason: appeal_note || null,
      };
      mockChapterStore.set(`${storyId}:${chapter_number}`, {
        ...chapter,
        creator_id: creatorId,
        content_delta: content_delta || null,
        last_saved_at: new Date().toISOString(),
      });

      const queueNote = appeal_note
        ? `Resubmitted: ${appeal_note}`
        : flagged
          ? `Auto-flagged: ${moderation.flaggedReason}`
          : 'Submitted for review';
      if (flagged) addToMockQueue(chapter, 'Creator', queueNote, riskScore);

      if (!flagged) {
        // Promote into public reader catalog (seedStories / mockCreatorStories)
        markMockStoryChapterPublished(storyId, chapter_number, { creatorId });
        bustChapterCache(storyId, chapter_number);
        try {
          const { onChapterPublished } = await import('../services/debutSeasonStore.js');
          await onChapterPublished(creatorId, storyId);
        } catch (debutErr) {
          console.warn('[publish mock] debut season hook failed:', debutErr?.message);
        }
      }

      return res.json({
        chapter,
        moderation: {
          status: chapter.status,
          risk_score: riskScore,
          flagged_reason: moderation.flaggedReason,
          source: moderation.source,
          note: flagged
            ? 'Queued for manual review — content flagged'
            : 'Auto-approved — visible in reader app',
        },
        mock: true,
      });
    }

    const { data: story } = await supabase.from('stories').select('author_id, title, slug, is_published').eq('id', storyId).single();
    if (!story) throw createAppError('INTERNAL_ERROR', 'Story not found', 404);
    const isStoryDebut = !story.is_published; // this story's first-ever chapter going live

    if (!story.slug) {
      const slug = await generateUniqueStorySlug(supabase, story.title, storyId);
      await supabase.from('stories').update({ slug, is_published: true }).eq('id', storyId);
    } else if (!story.is_published) {
      await supabase.from('stories').update({ is_published: true }).eq('id', storyId);
    }

    const { data: chapter, error } = await supabase.from('chapters').upsert({
      story_id: storyId,
      chapter_number,
      title,
      content,
      content_delta,
      estimated_read_time_minutes,
      status: 'pending_review',
      moderation_reason: appeal_note || null,
    }, { onConflict: 'story_id,chapter_number' }).select().single();

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    const moderation = await moderateChapter(chapter.id, content, creatorId);
    if (moderation.status === 'approved') await notifyNewChapter(storyId, chapter.id);

    // Founding-author cohort (Req 4, DEC-028) — a story's debut going live is the "commits
    // pre-launch/early" signal the program is meant to catch. No-op while the program is
    // unconfigured, already full, or the window's closed; never blocks the publish response.
    if (isStoryDebut && moderation.status === 'approved') {
      try {
        const { tryEnrollFoundingAuthor } = await import('../services/foundingAuthorProgram.js');
        await tryEnrollFoundingAuthor(creatorId);
      } catch (e) {
        console.warn('[publish] founding-author enrollment skipped:', e?.message);
      }
    }

    // DEC-021: refresh Story Trust SPI after publish (non-blocking failure)
    let story_trust = null;
    try {
      const { recomputeStoryTrust } = await import('../services/storyTrust.js');
      story_trust = await recomputeStoryTrust(storyId);
    } catch (e) {
      console.warn('[publish] story trust recompute skipped:', e?.message);
    }

    res.json({ chapter, moderation, story_trust });
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