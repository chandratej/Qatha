import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { seedStories, getSeedChapters, getSeedDiscover } from '../data/seed.js';
import { createAppError } from '../middleware/errorHandler.js';

// In-memory story cache (very hot path for browse/home)
const storyCache = new Map();

export const storiesRouter = Router();

storiesRouter.get('/', async (req, res, next) => {
  try {
    const { genre, sort = 'trending', limit = 20, offset = 0 } = req.query;
    const cacheKey = `list:${genre || 'all'}:${sort}:${limit}:${offset}`;

    // Fast cache hit
    const hit = storyCache.get(cacheKey);
    if (hit && Date.now() - hit.ts < 45_000) {
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
      return res.json(hit.data);
    }

    let payload;
    if (isMockMode()) {
      let stories = [...seedStories];
      if (genre) stories = stories.filter((s) => s.genre === genre);
      if (sort === 'trending') stories.sort((a, b) => b.views_this_week - a.views_this_week);
      else if (sort === 'new') stories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      else stories.sort((a, b) => a.title.localeCompare(b.title));
      payload = { stories: stories.slice(Number(offset), Number(offset) + Number(limit)), mock: true };
    } else {
      let query = supabase
        .from('stories')
        .select(`
          id, title, description, genre, cover_url, chapter_count,
          total_readers, views_this_week, release_schedule,
          release_day_of_week, release_time_of_day, created_at,
          creators!inner(pen_name, avatar_url)
        `)
        .eq('is_published', true);

      if (genre) query = query.eq('genre', genre);
      if (sort === 'trending') query = query.order('views_this_week', { ascending: false });
      else if (sort === 'new') query = query.order('created_at', { ascending: false });
      else query = query.order('title', { ascending: true });

      query = query.range(Number(offset), Number(offset) + Number(limit) - 1);
      const { data, error } = await query;
      if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);
      payload = { stories: data };
    }

    storyCache.set(cacheKey, { data: payload, ts: Date.now() });
    res.setHeader('Cache-Control', 'public, max-age=25');
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

storiesRouter.get('/discover/:genre', async (req, res, next) => {
  try {
    const { genre } = req.params;
    const cacheKey = `discover:${genre}`;

    const hit = storyCache.get(cacheKey);
    if (hit && Date.now() - hit.ts < 30_000) {
      res.setHeader('Cache-Control', 'public, max-age=20');
      return res.json(hit.data);
    }

    let payload;
    if (isMockMode()) {
      payload = { ...getSeedDiscover(genre), mock: true };
    } else {
      const [trending, newest] = await Promise.all([
        supabase.from('stories').select('id, title, cover_url, genre, chapter_count, total_readers, views_this_week, creators(pen_name)')
          .eq('is_published', true).eq('genre', genre).order('views_this_week', { ascending: false }).limit(10),
        supabase.from('stories').select('id, title, cover_url, genre, chapter_count, total_readers, creators(pen_name)')
          .eq('is_published', true).eq('genre', genre).order('created_at', { ascending: false }).limit(10),
      ]);
      payload = { genre, trending: trending.data || [], new_releases: newest.data || [] };
    }

    storyCache.set(cacheKey, { data: payload, ts: Date.now() });
    res.setHeader('Cache-Control', 'public, max-age=20');
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

storiesRouter.get('/:id', async (req, res, next) => {
  try {
    if (isMockMode()) {
      const story = seedStories.find((s) => s.id === req.params.id);
      if (!story) throw createAppError('CHAPTER_NOT_FOUND', 'Story not found', 404);
      const chapters = getSeedChapters(story.id).map((c) => ({
        id: c.id, chapter_number: c.chapter_number, title: c.title,
        estimated_read_time_minutes: c.estimated_read_time_minutes, view_count: c.view_count, status: c.status,
      }));
      return res.json({ story, chapters, mock: true });
    }

    const { data, error } = await supabase.from('stories').select('*, creators(pen_name, avatar_url, bio)')
      .eq('id', req.params.id).single();
    if (error || !data) throw createAppError('CHAPTER_NOT_FOUND', 'Story not found', 404);

    const { data: chapters } = await supabase.from('chapters')
      .select('id, chapter_number, title, estimated_read_time_minutes, view_count, status')
      .eq('story_id', req.params.id).eq('status', 'published').order('chapter_number');

    res.json({ story: data, chapters: chapters || [] });
  } catch (err) {
    next(err);
  }
});