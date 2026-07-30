import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { getRevenueConfig } from '../config/revenue.js';
import {
  getSeedDashboard,
  getSeedAnalytics,
  DEMO_CREATOR_ID,
  getCreatorSeedStories,
  getCreatorStoryChapters,
  mockCreatorStories,
  mockChapterStore,
  seedStories,
  deriveStoryModerationStatus,
  countDraftWords,
} from '../data/seed.js';
import { createAppError } from '../middleware/errorHandler.js';
import { getAuthenticatedUserId } from '../middleware/authenticate.js';
import { requireStoryRole } from '../middleware/requireStoryRole.js';

/** Creator-facing messages for common story insert failures (Format Spec / RLS). */
function formatStoryCreateError(error, genre) {
  const raw = error?.message || 'Could not create story';
  const msg = raw.toLowerCase();
  if (msg.includes('infinite recursion') && msg.includes('story_members')) {
    return 'Could not create story: database policy loop on story_members. Apply migration 045 in Supabase SQL editor.';
  }
  if (msg.includes('invalid input value for enum') || error?.code === '22P02') {
    if (msg.includes('genre') || genre) {
      return `Genre "${genre || 'selected'}" is not enabled on this database yet. Apply migration 045 (genre enum), or pick Romance for now.`;
    }
    if (msg.includes('content_type') || msg.includes('interactive')) {
      return 'That story format needs a database migration (038/046). Choose Serialized Story, or apply pending migrations.';
    }
    return 'Invalid story field for this database schema. Apply pending Supabase migrations (045–046).';
  }
  if (msg.includes('char_length') && msg.includes('title')) {
    return 'Story title must be between 3 and 100 characters.';
  }
  return raw;
}
import { moderateChapterForSchedule } from '../services/moderation/index.js';
import { generateUniqueStorySlug } from '../lib/slugify.js';
import { notifyChapterScheduled, notifyCollaborationTask } from '../services/notificationsStore.js';
import {
  listCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  listLoreEntries,
  createLoreEntry,
  updateLoreEntry,
  deleteLoreEntry,
  exportGlossary,
} from '../services/storyBibleStore.js';
import {
  listStoryMembers,
  listCollaborationTasks,
  createCollaborationTask,
  updateCollaborationTask,
  resolveTaskAssigneeUserId,
} from '../services/collaborationStore.js';
import {
  listSceneCharacterLinks,
  setSceneCharacters,
} from '../services/sceneCharacterStore.js';
import {
  listStoryInvites,
  listPendingInvitesForUser,
  createStoryInvite,
  acceptStoryInvite,
  declineStoryInvite,
} from '../services/memberInviteStore.js';
import { listMediaAssets, createMediaAsset, deleteMediaAsset } from '../services/mediaAssetStore.js';
import {
  listContributorAttributions,
  updateContributorAttribution,
} from '../services/attributionStore.js';
import {
  listAuthorComments,
  createAuthorComment,
  updateAuthorComment,
  deleteAuthorComment,
} from '../services/authorCommentStore.js';
import {
  listReaderFeedback,
  updateReaderFeedback,
  seedMockReaderFeedback,
  listPendingFeedbackForCreator,
} from '../services/readerFeedbackStore.js';
import { getCreatorReputationSummary } from '../services/creatorReputationStore.js';
import {
  getDebutProgress,
  graduateDebutStory,
} from '../services/debutSeasonStore.js';
import {
  listCommunityPosts,
  createCommunityPost,
  togglePostLove,
} from '../services/communityStore.js';

export const creatorsRouter = Router();

function buildCreatorFunnel(chapters, subscribersGained, story) {
  const totalReads = (chapters || []).reduce((s, c) => s + (c.total_views ?? 0), 0);
  const chaptersWithReads = (chapters || []).filter((c) => (c.total_views ?? 0) > 0).length;
  const avgCompletion = (chapters || []).length
    ? Math.round((chapters || []).reduce((s, c) => s + (c.completion_rate ?? 0), 0) / chapters.length)
    : 0;
  return {
    chapters_published: story?.chapter_count ?? (chapters || []).length,
    chapters_with_reads: chaptersWithReads,
    total_reads: totalReads,
    avg_completion_pct: avgCompletion,
    subscribers_gained: subscribersGained || 0,
    read_to_subscribe_pct: totalReads > 0
      ? Math.min(100, Math.round(((subscribersGained || 0) / totalReads) * 100))
      : 0,
  };
}

creatorsRouter.get('/dashboard', async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const revenue = getRevenueConfig();

    if (isMockMode()) {
      return res.json({ ...getSeedDashboard(), ...revenue, mock: true });
    }

    const { data: creator } = await supabase.from('creators').select('*').eq('id', creatorId).single();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: monthlyEarnings } = await supabase.from('earnings_ledger').select('amount, story_id')
      .eq('creator_id', creatorId).gte('month', monthStart.toISOString().split('T')[0]);

    const earningsThisMonth = (monthlyEarnings || []).reduce((s, e) => s + Number(e.amount), 0);
    const { data: stories } = await supabase.from('stories')
      .select('id, title, total_readers, views_this_week, chapter_count, trust_level, spi_score, monetization_eligible')
      .eq('author_id', creatorId);
    const { data: subscriberHistory } = await supabase.from('subscriptions').select('created_at, story_id_source')
      .eq('creator_id_source', creatorId).order('created_at');

    const earningsByStory = await buildEarningsByStory(creatorId, stories || [], monthlyEarnings || []);

    res.json({
      earnings_this_month: earningsThisMonth || creator?.earnings_this_month || 0,
      total_earnings: Number(creator?.total_earnings) || 0,
      total_subscribers: creator?.total_subscribers || 0,
      expected_payout_date: getNextPayoutDate(),
      expected_payout_amount: earningsThisMonth || creator?.earnings_this_month || 0,
      week_over_week_growth_pct: computeWeekOverWeekGrowth(subscriberHistory || []),
      ...revenue,
      earnings_by_story: earningsByStory,
      stories: (stories || []).map((s) => ({
        ...s,
        subscribers: earningsByStory.find((e) => e.story_id === s.id)?.subscribers ?? 0,
        earnings_this_month: earningsByStory.find((e) => e.story_id === s.id)?.earnings_this_month ?? 0,
      })),
      subscriber_history: buildSubscriberChart(subscriberHistory || []),
    });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.get('/stories', async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);

    if (isMockMode()) {
      const stories = getCreatorSeedStories(creatorId).map((s) => {
        const chapters = getCreatorStoryChapters(s.id, creatorId) || [];
        return {
          id: s.id,
          title: s.title,
          genre: s.genre,
          description: s.description,
          chapter_count: chapters.length || s.chapter_count,
          total_readers: s.total_readers,
          cover_url: s.cover_url,
          is_published: s.is_published,
          release_schedule: s.release_schedule,
          moderation_status: deriveStoryModerationStatus(chapters),
        };
      });
      return res.json({ stories, mock: true });
    }

    // All of the creator's stories (drafts + live). is_published=false shells must
    // appear so authors can finish writing and upload cover before first publish.
    const fullSelect =
      'id, title, genre, description, chapter_count, total_readers, cover_url, is_published, release_schedule, created_at, content_type, trust_level, contest_won_at, reader_tier';
    let { data, error } = await supabase.from('stories')
      .select(fullSelect)
      .eq('author_id', creatorId)
      .order('created_at', { ascending: false });

    if (error && /column|schema cache|does not exist/i.test(error.message || '')) {
      ({ data, error } = await supabase.from('stories')
        .select('id, title, genre, description, chapter_count, total_readers, cover_url, is_published, release_schedule, created_at')
        .eq('author_id', creatorId)
        .order('created_at', { ascending: false }));
    }

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);

    const rows = data || [];
    if (rows.length === 0) {
      return res.json({ stories: [] });
    }

    // Two queries total (not 2×N): batch chapter + draft status for all stories.
    const storyIds = rows.map((s) => s.id);
    const [{ data: chapterRows, error: chErr }, { data: draftRows, error: drErr }] = await Promise.all([
      supabase.from('chapters').select('story_id, status').in('story_id', storyIds),
      supabase
        .from('chapter_drafts')
        .select('story_id, chapter_number')
        .in('story_id', storyIds)
        .eq('creator_id', creatorId),
    ]);
    if (chErr) throw createAppError('INTERNAL_ERROR', chErr.message, 500);
    if (drErr) throw createAppError('INTERNAL_ERROR', drErr.message, 500);

    const chaptersByStory = new Map();
    for (const row of chapterRows || []) {
      const id = row.story_id;
      const list = chaptersByStory.get(id) || [];
      list.push({ status: row.status || 'draft' });
      chaptersByStory.set(id, list);
    }
    const draftsByStory = new Map();
    for (const row of draftRows || []) {
      const id = row.story_id;
      const list = draftsByStory.get(id) || [];
      list.push({ status: 'draft' });
      draftsByStory.set(id, list);
    }

    const storiesWithStatus = rows.map((s) => {
      const statuses = [
        ...(chaptersByStory.get(s.id) || []),
        ...(draftsByStory.get(s.id) || []),
      ];
      const observed = statuses.length;
      const chapter_count = Math.max(Number(s.chapter_count) || 0, observed);
      return {
        ...s,
        chapter_count,
        moderation_status: deriveStoryModerationStatus(statuses),
      };
    });

    res.json({ stories: storiesWithStatus });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.get('/stories/:storyId/chapters', requireStoryRole('story.read'), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const { storyId } = req.params;

    if (isMockMode()) {
      const chapters = getCreatorStoryChapters(storyId, creatorId);
      if (!chapters) throw createAppError('CHAPTER_NOT_FOUND', 'Story not found', 404);
      const story = [...seedStories, ...mockCreatorStories].find((s) => s.id === storyId);
      return res.json({
        story: {
          id: storyId,
          title: story?.title || 'My Story',
          slug: story?.slug || null,
          content_type: story?.content_type || null,
          language: story?.language || null,
        },
        chapters,
        mock: true,
      });
    }

    // content_type + language let the chapter editor skip getCreatorStories (N+1)
    let story = null;
    {
      const primary = await supabase
        .from('stories')
        .select('id, title, author_id, content_type, language, slug')
        .eq('id', storyId)
        .single();
      if (primary.error && /column|schema cache|does not exist/i.test(primary.error.message || '')) {
        const fb = await supabase
          .from('stories')
          .select('id, title, author_id')
          .eq('id', storyId)
          .single();
        story = fb.data
          ? { ...fb.data, content_type: null, language: null, slug: null }
          : null;
      } else {
        story = primary.data;
      }
    }
    if (!story || story.author_id !== creatorId) {
      throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);
    }

    const { data: chapters } = await supabase.from('chapters')
      .select('id, chapter_number, title, status, view_count, updated_at, content_delta')
      .eq('story_id', storyId)
      .order('chapter_number');

    const { data: drafts } = await supabase.from('chapter_drafts')
      .select('id, chapter_number, title, content, content_delta, last_saved_at')
      .eq('story_id', storyId)
      .eq('creator_id', creatorId);

    const byNum = new Map();
    for (const ch of chapters || []) {
      byNum.set(ch.chapter_number, {
        ...ch,
        word_count: ch.content_delta?.scenes
          ? ch.content_delta.scenes.reduce((s, sc) => s + (sc.content?.length || 0), 0)
          : 0,
        scene_count: ch.content_delta?.scenes?.length || 1,
      });
    }
    for (const d of drafts || []) {
      const existing = byNum.get(d.chapter_number);
      const draftIsNewer = !existing || new Date(d.last_saved_at) > new Date(existing.updated_at || 0);
      if (!draftIsNewer) continue;

      byNum.set(d.chapter_number, {
        id: existing?.id ?? d.id,
        chapter_number: d.chapter_number,
        title: d.title,
        status: existing?.status ?? 'draft',
        view_count: existing?.view_count,
        word_count: d.content?.length || 0,
        scene_count: d.content_delta?.scenes?.length || 1,
        updated_at: d.last_saved_at,
      });
    }

    res.json({
      story: {
        id: story.id,
        title: story.title,
        slug: story.slug ?? null,
        content_type: story.content_type ?? null,
        language: story.language ?? null,
      },
      chapters: Array.from(byNum.values()).sort((a, b) => a.chapter_number - b.chapter_number),
    });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.get('/stories/:storyId/chapters/:chapterNumber', requireStoryRole('story.read'), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const { storyId, chapterNumber } = req.params;
    const num = Number(chapterNumber);

    if (isMockMode()) {
      const chapters = getCreatorStoryChapters(storyId, creatorId);
      if (!chapters) throw createAppError('CHAPTER_NOT_FOUND', 'Story not found', 404);
      const chapter = chapters.find((c) => c.chapter_number === num);
      if (!chapter) {
        return res.json({
          chapter: {
            story_id: storyId,
            chapter_number: num,
            title: `Chapter ${num}`,
            content: '',
            content_delta: { scenes: [{ id: 'scene-1', title: 'Opening Scene', content: '<p>Start writing…</p>' }] },
            status: 'draft',
          },
          mock: true,
        });
      }
      return res.json({ chapter, mock: true });
    }

    const { data: story } = await supabase.from('stories').select('author_id').eq('id', storyId).single();
    if (!story || story.author_id !== creatorId) throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);

    const [{ data: draft }, { data: published }] = await Promise.all([
      supabase.from('chapter_drafts')
        .select('*')
        .eq('story_id', storyId)
        .eq('chapter_number', num)
        .eq('creator_id', creatorId)
        .maybeSingle(),
      supabase.from('chapters')
        .select('id, story_id, chapter_number, title, content, content_delta, status, moderation_status, moderation_reason')
        .eq('story_id', storyId)
        .eq('chapter_number', num)
        .maybeSingle(),
    ]);

    if (draft && published) {
      return res.json({
        chapter: {
          ...draft,
          status: published.status,
          moderation_status: published.moderation_status,
          moderation_reason: published.moderation_reason,
        },
      });
    }

    if (draft) return res.json({ chapter: { ...draft, status: 'draft' } });
    if (published) return res.json({ chapter: published });

    // No draft and no published row — return empty shell for first edit
    return res.json({
      chapter: {
        story_id: storyId,
        chapter_number: num,
        title: `Chapter ${num}`,
        content: '',
        content_delta: { scenes: [{ id: 'scene-1', title: 'Opening Scene', content: '<p>Start writing…</p>' }] },
        status: 'draft',
      },
    });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.patch('/stories/:storyId', requireStoryRole('story.edit'), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const { storyId } = req.params;
    const { title, description, genre, cover_url, release_schedule, free_chapter_count } = req.body;

    // Manual override for the auto-derived free-chapter sample size (Req 3.1) — null clears
    // the override back to auto-derivation from band data.
    let freeChapterUpdate;
    if (free_chapter_count !== undefined) {
      if (free_chapter_count === null) {
        freeChapterUpdate = { free_chapter_count: null, free_chapter_count_source: 'auto' };
      } else {
        const n = Number(free_chapter_count);
        if (!Number.isFinite(n) || n < 1 || n > 100) {
          throw createAppError('INTERNAL_ERROR', 'free_chapter_count must be between 1 and 100', 400);
        }
        freeChapterUpdate = { free_chapter_count: Math.floor(n), free_chapter_count_source: 'override' };
      }
    }

    if (isMockMode()) {
      const story = [...seedStories, ...mockCreatorStories].find((s) => s.id === storyId && s.author_id === creatorId);
      if (!story) throw createAppError('CHAPTER_NOT_FOUND', 'Story not found', 404);
      if (title !== undefined) story.title = title;
      if (description !== undefined) story.description = description;
      if (genre !== undefined) story.genre = genre;
      if (cover_url !== undefined) story.cover_url = cover_url;
      if (release_schedule !== undefined) story.release_schedule = release_schedule;
      if (freeChapterUpdate) Object.assign(story, freeChapterUpdate);
      return res.json({ story, mock: true });
    }

    const { data: existing } = await supabase.from('stories').select('author_id').eq('id', storyId).single();
    if (!existing || existing.author_id !== creatorId) throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (genre !== undefined) updates.genre = genre;
    if (cover_url !== undefined) updates.cover_url = cover_url;
    if (release_schedule !== undefined) updates.release_schedule = release_schedule;
    if (freeChapterUpdate) Object.assign(updates, freeChapterUpdate);

    const { data, error } = await supabase.from('stories').update(updates).eq('id', storyId).select().single();
    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({ story: data });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.delete('/stories/:storyId', requireStoryRole('story.delete'), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const { storyId } = req.params;

    if (isMockMode()) {
      const idx = mockCreatorStories.findIndex((s) => s.id === storyId && s.author_id === creatorId);
      if (idx >= 0) mockCreatorStories.splice(idx, 1);
      else {
        const seed = seedStories.find((s) => s.id === storyId && s.author_id === creatorId);
        if (seed) seed.is_published = false;
      }
      for (const key of [...mockChapterStore.keys()]) {
        if (key.startsWith(`${storyId}:`)) mockChapterStore.delete(key);
      }
      return res.json({ archived: true, mock: true });
    }

    const { data: existing } = await supabase.from('stories').select('author_id').eq('id', storyId).single();
    if (!existing || existing.author_id !== creatorId) throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);

    const { error } = await supabase.from('stories').update({ is_published: false }).eq('id', storyId);
    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({ archived: true });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.patch('/stories/:storyId/chapters/:chapterNumber', requireStoryRole('story.edit'), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const { storyId, chapterNumber } = req.params;
    const num = Number(chapterNumber);
    const { title } = req.body;

    if (isMockMode()) {
      const key = `${storyId}:${num}`;
      const draft = mockChapterStore.get(key);
      if (draft) {
        draft.title = title || draft.title;
        draft.last_saved_at = new Date().toISOString();
        mockChapterStore.set(key, draft);
        return res.json({ chapter: draft, mock: true });
      }
      throw createAppError('CHAPTER_NOT_FOUND', 'Chapter not found', 404);
    }

    const { data: story } = await supabase.from('stories').select('author_id').eq('id', storyId).single();
    if (!story || story.author_id !== creatorId) throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);

    const { data, error } = await supabase.from('chapter_drafts').update({ title, last_saved_at: new Date().toISOString() })
      .eq('story_id', storyId).eq('chapter_number', num).eq('creator_id', creatorId)
      .select().maybeSingle();

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    if (!data) {
      const { data: ch, error: chErr } = await supabase.from('chapters').update({ title })
        .eq('story_id', storyId).eq('chapter_number', num).select().maybeSingle();
      if (chErr) throw createAppError('INTERNAL_ERROR', chErr.message, 500);
      return res.json({ chapter: ch });
    }
    res.json({ chapter: data });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.delete('/stories/:storyId/chapters/:chapterNumber', requireStoryRole('story.delete'), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const { storyId, chapterNumber } = req.params;
    const num = Number(chapterNumber);

    if (isMockMode()) {
      mockChapterStore.delete(`${storyId}:${num}`);
      return res.json({ deleted: true, mock: true });
    }

    const { data: story } = await supabase.from('stories').select('author_id').eq('id', storyId).single();
    if (!story || story.author_id !== creatorId) throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);

    await supabase.from('chapter_drafts').delete()
      .eq('story_id', storyId).eq('chapter_number', num).eq('creator_id', creatorId);
    await supabase.from('chapters').delete()
      .eq('story_id', storyId).eq('chapter_number', num);

    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.post('/stories/:storyId/chapters/:chapterNumber/duplicate', requireStoryRole('story.edit'), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const { storyId, chapterNumber } = req.params;
    const num = Number(chapterNumber);

    if (isMockMode()) {
      const source = mockChapterStore.get(`${storyId}:${num}`);
      const chapters = getCreatorStoryChapters(storyId, creatorId) || [];
      const nextNum = chapters.length > 0 ? Math.max(...chapters.map((c) => c.chapter_number)) + 1 : num + 1;
      const dup = {
        id: `draft-${storyId}-${nextNum}`,
        creator_id: creatorId,
        story_id: storyId,
        chapter_number: nextNum,
        title: `${source?.title || `Chapter ${num}`} (Copy)`,
        content: source?.content || '',
        content_delta: source?.content_delta || null,
        status: 'draft',
        last_saved_at: new Date().toISOString(),
      };
      mockChapterStore.set(`${storyId}:${nextNum}`, dup);
      return res.json({ chapter: dup, mock: true });
    }

    const { data: story } = await supabase.from('stories').select('author_id').eq('id', storyId).single();
    if (!story || story.author_id !== creatorId) throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);

    const { data: source } = await supabase.from('chapter_drafts')
      .select('*').eq('story_id', storyId).eq('chapter_number', num).eq('creator_id', creatorId).maybeSingle();

    const { data: maxCh } = await supabase.from('chapter_drafts')
      .select('chapter_number').eq('story_id', storyId).order('chapter_number', { ascending: false }).limit(1).maybeSingle();

    const nextNum = (maxCh?.chapter_number || num) + 1;
    const { data: dup, error } = await supabase.from('chapter_drafts').insert({
      creator_id: creatorId,
      story_id: storyId,
      chapter_number: nextNum,
      title: `${source?.title || `Chapter ${num}`} (Copy)`,
      content: source?.content || '',
      content_delta: source?.content_delta,
      status: 'draft',
      last_saved_at: new Date().toISOString(),
    }).select().single();

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({ chapter: dup });
  } catch (err) {
    next(err);
  }
});

function plainTextLength(html = '') {
  return html.replace(/<[^>]+>/g, '').trim().length;
}

function buildMockScheduledList(creatorId) {
  const items = [];
  const stories = getCreatorSeedStories(creatorId);
  const storyTitles = new Map(stories.map((s) => [s.id, s.title]));

  for (const [key, entry] of mockChapterStore.entries()) {
    if (entry.status !== 'scheduled' || !entry.scheduled_publish_at) continue;
    if (entry.moderation_status && entry.moderation_status !== 'approved') continue;
    const [storyId, chapterNum] = key.split(':');
    if (!storyTitles.has(storyId) || entry.creator_id !== creatorId) continue;
    items.push({
      id: entry.id || `scheduled-${key}`,
      story_id: storyId,
      story_title: storyTitles.get(storyId),
      chapter_number: Number(chapterNum),
      chapter_title: entry.title,
      scheduled_publish_at: entry.scheduled_publish_at,
      status: 'scheduled',
    });
  }

  return items.sort((a, b) => new Date(a.scheduled_publish_at) - new Date(b.scheduled_publish_at));
}

creatorsRouter.get('/schedule', async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);

    if (isMockMode()) {
      return res.json({ items: buildMockScheduledList(creatorId), mock: true });
    }

    const { data: stories } = await supabase.from('stories')
      .select('id, title')
      .eq('author_id', creatorId)
      .eq('is_published', true);

    const storyIds = (stories || []).map((s) => s.id);
    if (!storyIds.length) return res.json({ items: [] });

    const { data, error } = await supabase.from('chapters')
      .select('id, story_id, chapter_number, title, status, scheduled_publish_at')
      .in('story_id', storyIds)
      .eq('status', 'scheduled')
      .eq('moderation_status', 'approved')
      .order('scheduled_publish_at');

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);

    const storyTitles = new Map((stories || []).map((s) => [s.id, s.title]));
    res.json({
      items: (data || []).map((ch) => ({
        id: ch.id,
        story_id: ch.story_id,
        story_title: storyTitles.get(ch.story_id) || 'Untitled',
        chapter_number: ch.chapter_number,
        chapter_title: ch.title,
        scheduled_publish_at: ch.scheduled_publish_at,
        status: ch.status,
      })),
    });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.post('/schedule', requireStoryRole('story.publish', { bodyField: 'story_id' }), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const { story_id, chapter_number, scheduled_publish_at } = req.body;

    if (!story_id || !chapter_number || !scheduled_publish_at) {
      throw createAppError('INTERNAL_ERROR', 'story_id, chapter_number, and scheduled_publish_at are required', 400);
    }

    const publishAt = new Date(scheduled_publish_at);
    if (Number.isNaN(publishAt.getTime()) || publishAt <= new Date()) {
      throw createAppError('INTERNAL_ERROR', 'Schedule time must be in the future', 400);
    }

    if (isMockMode()) {
      const chapters = getCreatorStoryChapters(story_id, creatorId);
      if (!chapters) throw createAppError('CHAPTER_NOT_FOUND', 'Story not found', 404);

      const source = chapters.find((c) => c.chapter_number === Number(chapter_number));
      const content = source?.content || '';
      if (plainTextLength(content) < 1) {
        throw createAppError('INTERNAL_ERROR', 'Write chapter content before scheduling', 400);
      }

      const key = `${story_id}:${chapter_number}`;
      const entry = {
        id: `scheduled-${story_id}-${chapter_number}`,
        creator_id: creatorId,
        story_id,
        chapter_number: Number(chapter_number),
        title: source?.title || `Chapter ${chapter_number}`,
        content,
        content_delta: source?.content_delta,
        status: 'scheduled',
        moderation_status: 'approved',
        scheduled_publish_at: publishAt.toISOString(),
        last_saved_at: new Date().toISOString(),
      };
      mockChapterStore.set(key, entry);
      const story = [...seedStories, ...mockCreatorStories].find((s) => s.id === story_id);
      await notifyChapterScheduled(creatorId, {
        storyId: story_id,
        storyTitle: story?.title,
        chapterNumber: entry.chapter_number,
        chapterTitle: entry.title,
        scheduledAt: entry.scheduled_publish_at,
      });
      return res.json({
        item: {
          id: entry.id,
          story_id,
          story_title: story?.title || 'My Story',
          chapter_number: entry.chapter_number,
          chapter_title: entry.title,
          scheduled_publish_at: entry.scheduled_publish_at,
          status: 'scheduled',
        },
        mock: true,
      });
    }

    const { data: story } = await supabase.from('stories').select('id, title, author_id')
      .eq('id', story_id).single();
    if (!story || story.author_id !== creatorId) {
      throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);
    }

    const { data: draft } = await supabase.from('chapter_drafts')
      .select('title, content, content_delta')
      .eq('story_id', story_id)
      .eq('chapter_number', chapter_number)
      .eq('creator_id', creatorId)
      .maybeSingle();

    let title = draft?.title;
    let content = draft?.content;
    let content_delta = draft?.content_delta;

    if (!content) {
      const { data: existing } = await supabase.from('chapters')
        .select('title, content, content_delta, status')
        .eq('story_id', story_id)
        .eq('chapter_number', chapter_number)
        .maybeSingle();
      if (existing?.status === 'published') {
        throw createAppError('INTERNAL_ERROR', 'Published chapters cannot be scheduled', 400);
      }
      title = existing?.title;
      content = existing?.content;
      content_delta = existing?.content_delta;
    }

    if (!content || plainTextLength(content) < 1) {
      throw createAppError('INTERNAL_ERROR', 'Write chapter content before scheduling', 400);
    }

    const { data: chapter, error } = await supabase.from('chapters').upsert({
      story_id,
      chapter_number,
      title: title || `Chapter ${chapter_number}`,
      content,
      content_delta,
      status: 'scheduled',
      moderation_status: 'pending',
      scheduled_publish_at: publishAt.toISOString(),
      published_at: null,
    }, { onConflict: 'story_id,chapter_number' }).select().single();

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);

    const moderation = await moderateChapterForSchedule(
      chapter.id,
      content,
      creatorId,
      publishAt.toISOString(),
    );

    if (moderation.userMessage) {
      throw createAppError('INTERNAL_ERROR', moderation.userMessage, 400);
    }

    const { data: ready } = await supabase.from('chapters')
      .select('id, chapter_number, title, status, scheduled_publish_at')
      .eq('id', chapter.id)
      .single();

    await notifyChapterScheduled(creatorId, {
      storyId: story_id,
      storyTitle: story.title,
      chapterNumber: ready.chapter_number,
      chapterTitle: ready.title,
      scheduledAt: ready.scheduled_publish_at,
    });

    res.json({
      item: {
        id: ready.id,
        story_id,
        story_title: story.title,
        chapter_number: ready.chapter_number,
        chapter_title: ready.title,
        scheduled_publish_at: ready.scheduled_publish_at,
        status: ready.status,
      },
    });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.patch('/schedule/:storyId/:chapterNumber', requireStoryRole('story.publish'), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const { storyId, chapterNumber } = req.params;
    const { scheduled_publish_at } = req.body;
    const num = Number(chapterNumber);

    if (!scheduled_publish_at) {
      throw createAppError('INTERNAL_ERROR', 'scheduled_publish_at is required', 400);
    }

    const publishAt = new Date(scheduled_publish_at);
    if (Number.isNaN(publishAt.getTime()) || publishAt <= new Date()) {
      throw createAppError('INTERNAL_ERROR', 'Schedule time must be in the future', 400);
    }

    if (isMockMode()) {
      const key = `${storyId}:${num}`;
      const entry = mockChapterStore.get(key);
      if (!entry || entry.creator_id !== creatorId || entry.status !== 'scheduled') {
        throw createAppError('CHAPTER_NOT_FOUND', 'Scheduled chapter not found', 404);
      }
      entry.scheduled_publish_at = publishAt.toISOString();
      mockChapterStore.set(key, entry);
      const story = [...seedStories, ...mockCreatorStories].find((s) => s.id === storyId);
      await notifyChapterScheduled(creatorId, {
        storyId,
        storyTitle: story?.title,
        chapterNumber: num,
        chapterTitle: entry.title,
        scheduledAt: entry.scheduled_publish_at,
      });
      return res.json({
        item: {
          id: entry.id,
          story_id: storyId,
          story_title: story?.title || 'My Story',
          chapter_number: num,
          chapter_title: entry.title,
          scheduled_publish_at: entry.scheduled_publish_at,
          status: 'scheduled',
        },
        mock: true,
      });
    }

    const { data: story } = await supabase.from('stories').select('id, title, author_id')
      .eq('id', storyId).single();
    if (!story || story.author_id !== creatorId) {
      throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);
    }

    const { data: chapter, error } = await supabase.from('chapters')
      .update({ scheduled_publish_at: publishAt.toISOString() })
      .eq('story_id', storyId)
      .eq('chapter_number', num)
      .eq('status', 'scheduled')
      .eq('moderation_status', 'approved')
      .select()
      .single();

    if (error || !chapter) throw createAppError('CHAPTER_NOT_FOUND', 'Scheduled chapter not found', 404);

    await notifyChapterScheduled(creatorId, {
      storyId,
      storyTitle: story.title,
      chapterNumber: chapter.chapter_number,
      chapterTitle: chapter.title,
      scheduledAt: chapter.scheduled_publish_at,
    });

    res.json({
      item: {
        id: chapter.id,
        story_id: storyId,
        story_title: story.title,
        chapter_number: chapter.chapter_number,
        chapter_title: chapter.title,
        scheduled_publish_at: chapter.scheduled_publish_at,
        status: chapter.status,
      },
    });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.delete('/schedule/:storyId/:chapterNumber', requireStoryRole('story.publish'), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const { storyId, chapterNumber } = req.params;
    const num = Number(chapterNumber);

    if (isMockMode()) {
      const key = `${storyId}:${num}`;
      const entry = mockChapterStore.get(key);
      if (!entry || entry.creator_id !== creatorId || entry.status !== 'scheduled') {
        throw createAppError('CHAPTER_NOT_FOUND', 'Scheduled chapter not found', 404);
      }
      entry.status = 'draft';
      entry.scheduled_publish_at = null;
      mockChapterStore.set(key, entry);
      return res.json({ cancelled: true, mock: true });
    }

    const { data: story } = await supabase.from('stories').select('author_id').eq('id', storyId).single();
    if (!story || story.author_id !== creatorId) {
      throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);
    }

    const { error } = await supabase.from('chapters')
      .update({ status: 'draft', scheduled_publish_at: null })
      .eq('story_id', storyId)
      .eq('chapter_number', num)
      .eq('status', 'scheduled');

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({ cancelled: true });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.post('/stories', async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const {
      title,
      description,
      genre,
      cover_url,
      release_schedule,
      release_day_of_week,
      release_time_of_day,
      content_type,
      age_rating,
      language,
      story_status,
      secondary_genres,
      setting,
      themes,
    } = req.body || {};

    if (!title || String(title).trim().length < 3) {
      throw createAppError('VALIDATION_ERROR', 'Story title must be at least 3 characters.', 400);
    }

    if (isMockMode()) {
      const { slugifyTitle } = await import('../lib/slugify.js');
      const story = {
        id: `story-${Date.now()}`,
        author_id: creatorId,
        title,
        description,
        genre: genre || 'romance',
        cover_url: cover_url || null,
        release_schedule: release_schedule || 'irregular',
        release_day_of_week,
        release_time_of_day,
        content_type: content_type || 'serialized_story',
        age_rating: age_rating || 'all_ages',
        language: language || 'te',
        story_status: story_status || 'draft',
        secondary_genres: secondary_genres || [],
        setting: setting || null,
        themes: themes || [],
        // Unpublished until first approved chapter (P1-06 — empty shells must not look live)
        is_published: false,
        chapter_count: 0,
        total_readers: 0,
        views_this_week: 0,
        created_at: new Date().toISOString(),
        slug: slugifyTitle(title) || `story-${Date.now()}`,
        creators: { pen_name: 'Creator', avatar_url: null },
      };
      mockCreatorStories.push(story);
      try {
        const { invalidatePublicStoryCache } = await import('./stories.js');
        invalidatePublicStoryCache();
      } catch { /* ignore */ }
      return res.json({ story, mock: true });
    }

    const slug = await generateUniqueStorySlug(supabase, title);

    const insertPayload = {
      author_id: creatorId,
      title: String(title).trim(),
      description: description ?? null,
      genre: genre || 'romance',
      cover_url: cover_url || null,
      release_schedule: release_schedule || 'irregular',
      release_day_of_week: release_day_of_week ?? null,
      release_time_of_day: release_time_of_day ?? null,
      slug,
      is_published: false,
      chapter_count: 0,
    };

    // Optional columns (migration 014+) — omit silently if schema lags
    if (content_type) insertPayload.content_type = content_type;
    if (age_rating) insertPayload.age_rating = age_rating;
    if (language) insertPayload.language = language;
    if (story_status) insertPayload.story_status = story_status;
    if (Array.isArray(secondary_genres) && secondary_genres.length) {
      insertPayload.secondary_genres = secondary_genres;
    }
    if (setting) insertPayload.setting = setting;
    if (Array.isArray(themes) && themes.length) insertPayload.themes = themes;

    let { data, error } = await supabase.from('stories').insert(insertPayload).select('id, title, slug, cover_url, genre').single();

    // Retry without optional columns if schema is partial
    if (error && /column|schema cache|does not exist/i.test(error.message || '')) {
      const base = {
        author_id: creatorId,
        title: insertPayload.title,
        description: insertPayload.description,
        genre: insertPayload.genre,
        cover_url: insertPayload.cover_url,
        release_schedule: insertPayload.release_schedule,
        slug: insertPayload.slug,
        is_published: false,
        chapter_count: 0,
      };
      ({ data, error } = await supabase.from('stories').insert(base).select('id, title, slug, cover_url, genre').single());
    }

    if (error) throw createAppError('INTERNAL_ERROR', formatStoryCreateError(error, genre), 500);

    // Ensure owner membership even if ensure_story_owner_member trigger is broken/missing.
    // Service role bypasses RLS — this is the durable create path for founders.
    try {
      await supabase.from('story_members').upsert(
        {
          story_id: data.id,
          user_id: creatorId,
          role: 'owner',
          granted_by: creatorId,
        },
        { onConflict: 'story_id,user_id' },
      );
    } catch {
      /* non-fatal — author_id still grants access via stories RLS */
    }

    res.json({ story: data });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.get('/analytics/:storyId', requireStoryRole('story.read'), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const { storyId } = req.params;

    if (isMockMode()) {
      const seed = getSeedAnalytics(storyId);
      return res.json({
        ...seed,
        funnel: buildCreatorFunnel(seed.chapters, seed.subscribers_gained, seed.story),
        mock: true,
      });
    }

    const { data: story } = await supabase.from('stories')
      .select('id, title, author_id, trust_level, spi_score, spi_components, monetization_eligible, trust_candidate_level, total_readers, chapter_count')
      .eq('id', storyId)
      .single();
    if (!story || story.author_id !== creatorId) throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);

    const { data: chapterStats } = await supabase.from('chapter_analytics').select('*')
      .eq('story_id', storyId).order('chapter_number');
    const { count: subscribersGained } = await supabase.from('subscriptions')
      .select('*', { count: 'exact', head: true }).eq('story_id_source', storyId);

    const chapters = (chapterStats || []).map((c) => ({
      chapter_number: c.chapter_number,
      total_views: c.total_views ?? 0,
      completion_rate: c.completion_rate ?? 0,
      avg_scroll_pct: c.avg_scroll_pct ?? 0,
    }));

    const drop_off_insights = buildDropOffInsights(chapters);

    res.json({
      story,
      chapters,
      subscribers_gained: subscribersGained || 0,
      drop_off_insights,
      funnel: buildCreatorFunnel(chapters, subscribersGained, story),
      story_trust: {
        trust_level: story.trust_level,
        spi_score: story.spi_score,
        spi_components: story.spi_components,
        monetization_eligible: story.monetization_eligible,
        trust_candidate_level: story.trust_candidate_level,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** DEC-021 — recompute Story Trust SPI for a story owned by the creator */
creatorsRouter.post('/stories/:storyId/recompute-trust', requireStoryRole('story.edit'), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const { storyId } = req.params;

    if (isMockMode()) {
      return res.json({
        mock: true,
        trust_level: 'incubation',
        spi_score: 0,
        effective_share_pct: 0,
        note: 'SPI recompute is a no-op in mock mode',
      });
    }

    const { data: story } = await supabase.from('stories').select('id, author_id').eq('id', storyId).single();
    if (!story || story.author_id !== creatorId) throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);

    const { recomputeStoryTrust } = await import('../services/storyTrust.js');
    const result = await recomputeStoryTrust(storyId);
    res.json(result || { error: 'recompute_failed' });
  } catch (err) {
    next(err);
  }
});

/** Cycle 7 — payout readiness (UPI + KYC fields) */
creatorsRouter.get('/me/payout', async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    if (isMockMode()) {
      return res.json({
        mock: true,
        payout_upi: null,
        legal_name: null,
        tax_id: null,
        payout_verified_at: null,
        payout_schedule: 'quarterly',
      });
    }
    const { data, error } = await supabase
      .from('creators')
      .select('payout_upi, legal_name, tax_id, payout_verified_at')
      .eq('id', creatorId)
      .maybeSingle();
    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({
      payout_upi: data?.payout_upi || null,
      legal_name: data?.legal_name || null,
      tax_id: data?.tax_id || null,
      payout_verified_at: data?.payout_verified_at || null,
      payout_schedule: 'quarterly',
    });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.patch('/me/payout', async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const { payout_upi, legal_name, tax_id } = req.body || {};

    if (payout_upi != null && payout_upi !== '') {
      const upi = String(payout_upi).trim();
      if (!/^[\w.-]{2,}@[\w]{2,}$/i.test(upi)) {
        throw createAppError('INTERNAL_ERROR', 'Invalid UPI ID format (e.g. name@upi)', 400);
      }
    }

    if (isMockMode()) {
      return res.json({
        mock: true,
        saved: true,
        payout_upi: payout_upi || null,
        legal_name: legal_name || null,
        tax_id: tax_id || null,
      });
    }

    const patch = { updated_at: new Date().toISOString() };
    if (payout_upi !== undefined) patch.payout_upi = payout_upi ? String(payout_upi).trim() : null;
    if (legal_name !== undefined) patch.legal_name = legal_name ? String(legal_name).trim() : null;
    if (tax_id !== undefined) patch.tax_id = tax_id ? String(tax_id).trim().toUpperCase() : null;

    const { data, error } = await supabase
      .from('creators')
      .update(patch)
      .eq('id', creatorId)
      .select('payout_upi, legal_name, tax_id, payout_verified_at')
      .maybeSingle();

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({ saved: true, ...data, payout_schedule: 'quarterly' });
  } catch (err) {
    next(err);
  }
});

/** Cycle 7 — cloud chapter version snapshots */
creatorsRouter.post('/versions/snapshot', requireStoryRole('story.edit', { bodyField: 'story_id' }), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const {
      story_id,
      chapter_number,
      scene_id,
      scene_title,
      content,
      source = 'autosave',
    } = req.body || {};

    if (!story_id || !chapter_number || !scene_id || content == null) {
      throw createAppError('INTERNAL_ERROR', 'story_id, chapter_number, scene_id, content required', 400);
    }

    if (isMockMode()) {
      return res.json({ mock: true, saved: true, id: `mock-v-${Date.now()}` });
    }

    const { data: story } = await supabase
      .from('stories')
      .select('id, author_id')
      .eq('id', story_id)
      .maybeSingle();
    if (!story || story.author_id !== creatorId) {
      throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);
    }

    const { data, error } = await supabase
      .from('chapter_version_snapshots')
      .insert({
        creator_id: creatorId,
        story_id,
        chapter_number: Number(chapter_number),
        scene_id: String(scene_id),
        scene_title: scene_title || null,
        content: String(content),
        source: String(source).slice(0, 32),
      })
      .select('id, created_at')
      .maybeSingle();

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);

    // Best-effort prune
    try {
      await supabase.rpc('prune_chapter_versions', {
        p_creator_id: creatorId,
        p_story_id: story_id,
        p_chapter_number: Number(chapter_number),
        p_scene_id: String(scene_id),
        p_keep: 50,
      });
    } catch { /* ignore if RPC missing until migration 016 */ }

    res.json({ saved: true, id: data?.id, created_at: data?.created_at });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.get('/versions/:storyId/:chapterNumber', requireStoryRole('story.read'), async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const { storyId, chapterNumber } = req.params;
    if (isMockMode()) return res.json({ mock: true, versions: [] });

    const { data: story } = await supabase
      .from('stories')
      .select('id, author_id')
      .eq('id', storyId)
      .maybeSingle();
    if (!story || story.author_id !== creatorId) {
      throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);
    }

    const { data, error } = await supabase
      .from('chapter_version_snapshots')
      .select('id, scene_id, scene_title, content, source, created_at')
      .eq('creator_id', creatorId)
      .eq('story_id', storyId)
      .eq('chapter_number', Number(chapterNumber))
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({ versions: data || [] });
  } catch (err) {
    next(err);
  }
});

async function buildEarningsByStory(creatorId, stories, monthlyEarnings) {
  const { data: subs } = await supabase.from('subscriptions')
    .select('story_id_source')
    .eq('creator_id_source', creatorId)
    .eq('status', 'active');

  return stories.map((s) => {
    const subscribers = (subs || []).filter((sub) => sub.story_id_source === s.id).length;
    const earnings = monthlyEarnings
      .filter((e) => e.story_id === s.id)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return {
      story_id: s.id,
      title: s.title,
      total_readers: s.total_readers,
      subscribers,
      earnings_this_month: earnings,
    };
  });
}

function buildDropOffInsights(chapterStats) {
  const insights = [];
  for (let i = 1; i < chapterStats.length; i++) {
    const prev = chapterStats[i - 1];
    const curr = chapterStats[i];
    const viewDrop = prev.total_views > 0
      ? Math.round(100 * (prev.total_views - curr.total_views) / prev.total_views)
      : 0;
    const completionDrop = prev.completion_rate - curr.completion_rate;
    if (viewDrop >= 15 || completionDrop >= 12) {
      insights.push({
        chapter_number: curr.chapter_number,
        view_drop_pct: viewDrop,
        completion_drop_pct: completionDrop,
        avg_scroll_pct: curr.avg_scroll_pct,
        suggestion: curr.avg_scroll_pct < 70
          ? `Most readers stopped around ${100 - curr.avg_scroll_pct}% into Chapter ${curr.chapter_number}. Consider shorter paragraphs or a stronger hook.`
          : `Chapter ${curr.chapter_number} loses ${viewDrop}% of readers vs. the previous chapter. Review pacing and cliffhanger strength.`,
      });
    }
  }
  return insights;
}

/** Story bible — Vol_03-05/06 */
creatorsRouter.get('/stories/:storyId/characters', requireStoryRole('story.read'), async (req, res, next) => {
  try {
    const characters = await listCharacters(req.params.storyId);
    res.json({ characters });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.post('/stories/:storyId/characters', requireStoryRole('story.edit'), async (req, res, next) => {
  try {
    const character = await createCharacter(req.params.storyId, req.body || {});
    res.status(201).json({ character });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.patch('/stories/:storyId/characters/:characterId', requireStoryRole('story.edit'), async (req, res, next) => {
  try {
    const character = await updateCharacter(req.params.storyId, req.params.characterId, req.body || {});
    res.json({ character });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.delete('/stories/:storyId/characters/:characterId', requireStoryRole('story.edit'), async (req, res, next) => {
  try {
    const result = await deleteCharacter(req.params.storyId, req.params.characterId);
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.get(
  '/stories/:storyId/chapters/:chapterNum/scene-characters',
  requireStoryRole('story.read'),
  async (req, res, next) => {
    try {
      const links = await listSceneCharacterLinks(req.params.storyId, req.params.chapterNum);
      res.json({ links });
    } catch (err) {
      next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
    }
  },
);

creatorsRouter.put(
  '/stories/:storyId/chapters/:chapterNum/scenes/:sceneId/characters',
  requireStoryRole('story.edit'),
  async (req, res, next) => {
    try {
      const result = await setSceneCharacters(
        req.params.storyId,
        req.params.chapterNum,
        req.params.sceneId,
        req.body?.character_ids,
      );
      res.json(result);
    } catch (err) {
      next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
    }
  },
);

creatorsRouter.get('/stories/:storyId/lore', requireStoryRole('story.read'), async (req, res, next) => {
  try {
    const entries = await listLoreEntries(req.params.storyId);
    res.json({ entries });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.get('/stories/:storyId/lore/glossary', requireStoryRole('story.read'), async (req, res, next) => {
  try {
    const glossary = await exportGlossary(req.params.storyId);
    res.json({ glossary });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.post('/stories/:storyId/lore', requireStoryRole('story.edit'), async (req, res, next) => {
  try {
    const entry = await createLoreEntry(req.params.storyId, req.body || {});
    res.status(201).json({ entry });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.patch('/stories/:storyId/lore/:entryId', requireStoryRole('story.edit'), async (req, res, next) => {
  try {
    const entry = await updateLoreEntry(req.params.storyId, req.params.entryId, req.body || {});
    res.json({ entry });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.delete('/stories/:storyId/lore/:entryId', requireStoryRole('story.edit'), async (req, res, next) => {
  try {
    const result = await deleteLoreEntry(req.params.storyId, req.params.entryId);
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

/** Collaboration scaffold — Vol_04-CW-D2 */
creatorsRouter.get('/stories/:storyId/members', requireStoryRole('story.read'), async (req, res, next) => {
  try {
    const members = await listStoryMembers(req.params.storyId);
    res.json({ members });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.get('/stories/:storyId/tasks', requireStoryRole('story.read'), async (req, res, next) => {
  try {
    const tasks = await listCollaborationTasks(req.params.storyId);
    res.json({ tasks });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.post('/stories/:storyId/tasks', requireStoryRole('story.edit'), async (req, res, next) => {
  try {
    const storyId = req.params.storyId;
    const userId = getAuthenticatedUserId(req);
    const body = req.body || {};
    const task = await createCollaborationTask(storyId, userId, body);

    const assigneeUserId = await resolveTaskAssigneeUserId(storyId, body);
    if (assigneeUserId && assigneeUserId !== userId) {
      const members = await listStoryMembers(storyId);
      const member = members.find((m) => m.user_id === assigneeUserId);
      const { data: story } = await supabase.from('stories').select('title').eq('id', storyId).maybeSingle();
      await notifyCollaborationTask(assigneeUserId, {
        storyTitle: story?.title,
        storyId,
        taskTitle: task.title,
        role: member?.role || body.assignee_label || null,
      });
    }

    res.status(201).json({ task });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.patch('/stories/:storyId/tasks/:taskId', requireStoryRole('story.edit'), async (req, res, next) => {
  try {
    const task = await updateCollaborationTask(req.params.storyId, req.params.taskId, req.body || {});
    res.json({ task });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

/** Co-author invites — Vol_04-CA */
creatorsRouter.get('/stories/:storyId/invites', requireStoryRole('story.invite'), async (req, res, next) => {
  try {
    const invites = await listStoryInvites(req.params.storyId);
    res.json({ invites });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.post('/stories/:storyId/invites', requireStoryRole('story.invite'), async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const invite = await createStoryInvite(req.params.storyId, userId, req.body || {});
    res.status(201).json({ invite });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.post('/invites/:inviteId/accept', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const userEmail = req.body?.email || null;
    const result = await acceptStoryInvite(req.params.inviteId, userId, userEmail);
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.post('/invites/:inviteId/decline', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const userEmail = req.body?.email || null;
    const invite = await declineStoryInvite(req.params.inviteId, userId, userEmail);
    res.json({ invite });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.get('/invites/pending', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const userEmail = req.query?.email || req.body?.email || null;
    const invites = await listPendingInvitesForUser(userId, userEmail);
    res.json({ invites });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

/** Media library — Vol_03-08 */
creatorsRouter.get('/stories/:storyId/media', requireStoryRole('story.read'), async (req, res, next) => {
  try {
    const assets = await listMediaAssets(req.params.storyId);
    res.json({ assets });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.post('/stories/:storyId/media', requireStoryRole('story.edit'), async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const asset = await createMediaAsset(req.params.storyId, userId, req.body || {});
    res.status(201).json({ asset });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.delete('/stories/:storyId/media/:assetId', requireStoryRole('story.edit'), async (req, res, next) => {
  try {
    const result = await deleteMediaAsset(req.params.storyId, req.params.assetId);
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

/** Contributor attribution — Vol_04-CA-D1 */
creatorsRouter.get('/stories/:storyId/attributions', requireStoryRole('story.read'), async (req, res, next) => {
  try {
    const attributions = await listContributorAttributions(req.params.storyId);
    res.json({ attributions });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.patch('/stories/:storyId/attributions/:attributionId', requireStoryRole('story.invite'), async (req, res, next) => {
  try {
    const attribution = await updateContributorAttribution(
      req.params.storyId,
      req.params.attributionId,
      req.body || {},
    );
    res.json({ attribution });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

/** Author comments — Vol_04-CS */
creatorsRouter.get(
  '/stories/:storyId/chapters/:chapterNum/author-comments',
  requireStoryRole('story.read'),
  async (req, res, next) => {
    try {
      const comments = await listAuthorComments(req.params.storyId, req.params.chapterNum);
      res.json({ comments });
    } catch (err) {
      next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
    }
  },
);

creatorsRouter.post(
  '/stories/:storyId/chapters/:chapterNum/author-comments',
  requireStoryRole('story.comment'),
  async (req, res, next) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const comment = await createAuthorComment(
        req.params.storyId,
        req.params.chapterNum,
        userId,
        req.body || {},
      );
      res.status(201).json({ comment });
    } catch (err) {
      next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
    }
  },
);

creatorsRouter.patch(
  '/stories/:storyId/chapters/:chapterNum/author-comments/:commentId',
  requireStoryRole('story.comment'),
  async (req, res, next) => {
    try {
      const comment = await updateAuthorComment(
        req.params.storyId,
        req.params.chapterNum,
        req.params.commentId,
        req.body || {},
      );
      res.json({ comment });
    } catch (err) {
      next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
    }
  },
);

creatorsRouter.delete(
  '/stories/:storyId/chapters/:chapterNum/author-comments/:commentId',
  requireStoryRole('story.comment'),
  async (req, res, next) => {
    try {
      const result = await deleteAuthorComment(
        req.params.storyId,
        req.params.chapterNum,
        req.params.commentId,
      );
      res.json(result);
    } catch (err) {
      next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
    }
  },
);

/** Pending reader feedback queue — Vol_07-01 moderation triage */
creatorsRouter.get('/reader-feedback/pending', async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const feedback = await listPendingFeedbackForCreator(creatorId);
    res.json({ feedback, count: feedback.length });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

/** Creator community feed — Wave 10 */
creatorsRouter.get('/community/posts', async (req, res, next) => {
  try {
    const viewerId = getAuthenticatedUserId(req);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const posts = await listCommunityPosts(viewerId, { limit });
    res.json({ posts });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.post('/community/posts', async (req, res, next) => {
  try {
    const authorId = getAuthenticatedUserId(req);
    const post = await createCommunityPost(authorId, req.body || {});
    res.status(201).json({ post });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.post('/community/posts/:postId/love', async (req, res, next) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const post = await togglePostLove(req.params.postId, userId);
    if (!post) throw createAppError('NOT_FOUND', 'Post not found', 404);
    res.json({ post });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

/** Debut Season progress — Wave 9 */
creatorsRouter.get('/debut-season/progress', async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const progress = await getDebutProgress(creatorId);
    res.json({ progress });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

creatorsRouter.post('/debut-season/graduate', async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const storyId = req.body?.story_id;
    let targetStoryId = storyId;

    if (!targetStoryId) {
      const progress = await getDebutProgress(creatorId);
      if (!progress.enrolled || !progress.story_id) {
        throw createAppError('BAD_REQUEST', 'No enrolled debut story found', 400);
      }
      targetStoryId = progress.story_id;
    }

    const result = await graduateDebutStory(creatorId, targetStoryId);
    res.json({ graduation: result });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

/** Interim reputation read model — Vol_01-05-D2 */
creatorsRouter.get('/reputation', async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const reputation = await getCreatorReputationSummary(creatorId);
    res.json({ reputation });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

/** Reader feedback — Vol_07-01-D1 */
creatorsRouter.get(
  '/stories/:storyId/reader-feedback',
  requireStoryRole('story.read'),
  async (req, res, next) => {
    try {
      const { storyId } = req.params;
      if (isMockMode()) seedMockReaderFeedback(storyId);
      const feedback = await listReaderFeedback(storyId);
      res.json({ feedback });
    } catch (err) {
      next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
    }
  },
);

creatorsRouter.patch(
  '/stories/:storyId/reader-feedback/:feedbackId',
  requireStoryRole('story.edit'),
  async (req, res, next) => {
    try {
      const item = await updateReaderFeedback(
        req.params.storyId,
        req.params.feedbackId,
        req.body || {},
      );
      res.json({ feedback: item });
    } catch (err) {
      next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
    }
  },
);

/** Creator lifecycle — Vol_01-03 (migration 017) */
creatorsRouter.get('/lifecycle', async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    if (isMockMode()) {
      return res.json({
        lifecycle_stage: 'active',
        creator_persona: 'solo_author',
        mock: true,
      });
    }
    const { data, error } = await supabase
      .from('creators')
      .select('lifecycle_stage, creator_persona, is_verified')
      .eq('id', creatorId)
      .single();
    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({
      lifecycle_stage: data?.lifecycle_stage || 'registered',
      creator_persona: data?.creator_persona || 'solo_author',
      is_verified: data?.is_verified ?? false,
    });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.patch('/lifecycle', async (req, res, next) => {
  try {
    const creatorId = getAuthenticatedUserId(req);
    const { lifecycle_stage, creator_persona } = req.body || {};
    if (isMockMode()) {
      return res.json({
        lifecycle_stage: lifecycle_stage || 'active',
        creator_persona: creator_persona || 'solo_author',
        mock: true,
      });
    }
    const patch = {};
    if (lifecycle_stage) patch.lifecycle_stage = lifecycle_stage;
    if (creator_persona) patch.creator_persona = creator_persona;
    const { data, error } = await supabase
      .from('creators')
      .update(patch)
      .eq('id', creatorId)
      .select('lifecycle_stage, creator_persona')
      .single();
    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

function getNextPayoutDate() {
  const now = new Date();
  const payout = new Date(now.getFullYear(), now.getMonth(), 15);
  if (now.getDate() >= 15) payout.setMonth(payout.getMonth() + 1);
  return payout.toISOString().split('T')[0];
}

function buildSubscriberChart(history) {
  const byMonth = {};
  for (const sub of history) {
    const month = sub.created_at.slice(0, 7);
    byMonth[month] = (byMonth[month] || 0) + 1;
  }
  return Object.entries(byMonth).map(([month, count]) => ({ month, count }));
}

function computeWeekOverWeekGrowth(history) {
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeek = history.filter((s) => now - new Date(s.created_at).getTime() < oneWeekMs).length;
  const lastWeek = history.filter((s) => {
    const age = now - new Date(s.created_at).getTime();
    return age >= oneWeekMs && age < 2 * oneWeekMs;
  }).length;
  if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
  return Math.round(100 * (thisWeek - lastWeek) / lastWeek);
}