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
      const stories = getCreatorSeedStories(creatorId).map((s) => ({
        id: s.id,
        title: s.title,
        genre: s.genre,
        chapter_count: s.chapter_count,
        total_readers: s.total_readers,
        cover_url: s.cover_url,
        is_published: s.is_published,
      }));
      return res.json({ stories, mock: true });
    }

    const { data, error } = await supabase.from('stories')
      .select('id, title, genre, chapter_count, total_readers, cover_url, is_published, created_at')
      .eq('author_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
    res.json({ stories: data || [] });
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

    res.json({ story, chapters: chapterStats || [], subscribers_gained: subscribersGained || 0 });
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