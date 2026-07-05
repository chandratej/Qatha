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

export const creatorsRouter = Router();

creatorsRouter.get('/dashboard', async (req, res, next) => {
  try {
    const creatorId = req.headers['x-creator-id'] || DEMO_CREATOR_ID;
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
      .select('id, title, total_readers, views_this_week, chapter_count').eq('author_id', creatorId);
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
    const creatorId = req.headers['x-creator-id'] || DEMO_CREATOR_ID;

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

    const { data, error } = await supabase.from('stories')
      .select('id, title, genre, description, chapter_count, total_readers, cover_url, is_published, release_schedule, created_at')
      .eq('author_id', creatorId)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);

    const storiesWithStatus = await Promise.all((data || []).map(async (s) => {
      const { data: chapters } = await supabase.from('chapters')
        .select('status').eq('story_id', s.id);
      const { data: drafts } = await supabase.from('chapter_drafts')
        .select('status').eq('story_id', s.id).eq('creator_id', creatorId);
      const statuses = [...(chapters || []), ...(drafts || [])];
      return { ...s, moderation_status: deriveStoryModerationStatus(statuses) };
    }));

    res.json({ stories: storiesWithStatus });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.get('/stories/:storyId/chapters', async (req, res, next) => {
  try {
    const creatorId = req.headers['x-creator-id'] || DEMO_CREATOR_ID;
    const { storyId } = req.params;

    if (isMockMode()) {
      const chapters = getCreatorStoryChapters(storyId, creatorId);
      if (!chapters) throw createAppError('CHAPTER_NOT_FOUND', 'Story not found', 404);
      return res.json({ chapters, mock: true });
    }

    const { data: story } = await supabase.from('stories').select('id, title, author_id')
      .eq('id', storyId).single();
    if (!story || story.author_id !== creatorId) {
      throw createAppError('INTERNAL_ERROR', 'Unauthorized', 403);
    }

    const { data: chapters } = await supabase.from('chapters')
      .select('id, chapter_number, title, status, view_count, updated_at, content_delta')
      .eq('story_id', storyId)
      .order('chapter_number');

    const { data: drafts } = await supabase.from('chapter_drafts')
      .select('id, chapter_number, title, content, content_delta, last_saved_at, status')
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
      if (!existing || new Date(d.last_saved_at) > new Date(existing.updated_at || 0)) {
        byNum.set(d.chapter_number, {
          id: d.id,
          chapter_number: d.chapter_number,
          title: d.title,
          status: d.status || 'draft',
          word_count: d.content?.length || 0,
          scene_count: d.content_delta?.scenes?.length || 1,
          updated_at: d.last_saved_at,
        });
      }
    }

    res.json({ story: { id: story.id, title: story.title }, chapters: Array.from(byNum.values()).sort((a, b) => a.chapter_number - b.chapter_number) });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.get('/stories/:storyId/chapters/:chapterNumber', async (req, res, next) => {
  try {
    const creatorId = req.headers['x-creator-id'] || DEMO_CREATOR_ID;
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

    const { data: draft } = await supabase.from('chapter_drafts')
      .select('*')
      .eq('story_id', storyId)
      .eq('chapter_number', num)
      .eq('creator_id', creatorId)
      .maybeSingle();

    if (draft) return res.json({ chapter: draft });

    const { data: chapter } = await supabase.from('chapters')
      .select('id, story_id, chapter_number, title, content, content_delta, status, moderation_status')
      .eq('story_id', storyId)
      .eq('chapter_number', num)
      .maybeSingle();

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
      });
    }

    res.json({ chapter });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.patch('/stories/:storyId', async (req, res, next) => {
  try {
    const creatorId = req.headers['x-creator-id'] || DEMO_CREATOR_ID;
    const { storyId } = req.params;
    const { title, description, genre, cover_url, release_schedule } = req.body;

    if (isMockMode()) {
      const story = [...seedStories, ...mockCreatorStories].find((s) => s.id === storyId && s.author_id === creatorId);
      if (!story) throw createAppError('CHAPTER_NOT_FOUND', 'Story not found', 404);
      if (title !== undefined) story.title = title;
      if (description !== undefined) story.description = description;
      if (genre !== undefined) story.genre = genre;
      if (cover_url !== undefined) story.cover_url = cover_url;
      if (release_schedule !== undefined) story.release_schedule = release_schedule;
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

    const { data, error } = await supabase.from('stories').update(updates).eq('id', storyId).select().single();
    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({ story: data });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.delete('/stories/:storyId', async (req, res, next) => {
  try {
    const creatorId = req.headers['x-creator-id'] || DEMO_CREATOR_ID;
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

creatorsRouter.patch('/stories/:storyId/chapters/:chapterNumber', async (req, res, next) => {
  try {
    const creatorId = req.headers['x-creator-id'] || DEMO_CREATOR_ID;
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

creatorsRouter.delete('/stories/:storyId/chapters/:chapterNumber', async (req, res, next) => {
  try {
    const creatorId = req.headers['x-creator-id'] || DEMO_CREATOR_ID;
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

creatorsRouter.post('/stories/:storyId/chapters/:chapterNumber/duplicate', async (req, res, next) => {
  try {
    const creatorId = req.headers['x-creator-id'] || DEMO_CREATOR_ID;
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

creatorsRouter.post('/stories', async (req, res, next) => {
  try {
    const creatorId = req.headers['x-creator-id'] || DEMO_CREATOR_ID;
    const { title, description, genre, cover_url, release_schedule, release_day_of_week, release_time_of_day } = req.body;

    if (isMockMode()) {
      const story = {
        id: `story-${Date.now()}`, author_id: creatorId, title, description, genre,
        cover_url, release_schedule: release_schedule || 'irregular',
        release_day_of_week, release_time_of_day, is_published: true,
        chapter_count: 0, total_readers: 0, views_this_week: 0,
      };
      mockCreatorStories.push(story);
      return res.json({ story, mock: true });
    }

    const { data, error } = await supabase.from('stories').insert({
      author_id: creatorId, title, description, genre, cover_url,
      release_schedule: release_schedule || 'irregular',
      release_day_of_week, release_time_of_day, is_published: true,
    }).select().single();

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({ story: data });
  } catch (err) {
    next(err);
  }
});

creatorsRouter.get('/analytics/:storyId', async (req, res, next) => {
  try {
    const creatorId = req.headers['x-creator-id'] || DEMO_CREATOR_ID;
    const { storyId } = req.params;

    if (isMockMode()) {
      return res.json({ ...getSeedAnalytics(storyId), mock: true });
    }

    const { data: story } = await supabase.from('stories').select('id, title, author_id').eq('id', storyId).single();
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
    });
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