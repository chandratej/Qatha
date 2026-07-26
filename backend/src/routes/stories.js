import { Router } from 'express';
import { isMockMode } from '../lib/mockMode.js';
import {
  getPublicStoriesForReader,
  getPublicStoryById,
  getSeedChapters,
  getSeedDiscover,
} from '../data/seed.js';
import {
  listPublicStories,
  getPublicStoryDetail,
  listDiscoverByGenre,
} from '../services/publicCatalog.js';
import { createAppError } from '../middleware/errorHandler.js';
import { resolveFreeChapterCountForStory } from '../services/freeChapterThreshold.js';
import { listPublicPraise } from '../services/readerFeedbackStore.js';
import { createContentReport } from '../services/contentReportStore.js';
import { requireAuth, getAuthenticatedUserId } from '../middleware/authenticate.js';

// In-memory story cache (very hot path for browse/home)
const storyCache = new Map();

/** Call after mock create/publish so Creator Studio stories appear in the reader. */
export function invalidatePublicStoryCache() {
  storyCache.clear();
}

export const storiesRouter = Router();

/** Public search — Telugu + English title/description (pg_trgm / ILIKE). */
storiesRouter.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    if (!q || q.length < 1) {
      return res.json({ stories: [], q: '' });
    }

    if (isMockMode()) {
      const needle = q.toLowerCase();
      const stories = getPublicStoriesForReader()
        .filter((s) => {
          const hay = `${s.title || ''} ${s.description || ''}`.toLowerCase();
          return hay.includes(needle) || (s.title || '').includes(q);
        })
        .slice(0, limit);
      return res.json({ stories, q, mock: true });
    }

    const { searchPublicStories } = await import('../services/publicCatalog.js');
    const stories = await searchPublicStories(q, limit);
    res.json({ stories, q });
  } catch (err) {
    next(err);
  }
});

storiesRouter.get('/', async (req, res, next) => {
  try {
    const { genre, sort = 'trending', limit = 20, offset = 0 } = req.query;
    const cacheKey = `list:${genre || 'all'}:${sort}:${limit}:${offset}`;

    const hit = storyCache.get(cacheKey);
    const ttlMs = isMockMode() ? 5_000 : 15_000;
    if (hit && Date.now() - hit.ts < ttlMs) {
      res.setHeader('Cache-Control', isMockMode() ? 'no-store' : 'public, max-age=15, stale-while-revalidate=60');
      return res.json(hit.data);
    }

    let payload;
    if (isMockMode()) {
      let stories = getPublicStoriesForReader();
      if (genre) stories = stories.filter((s) => s.genre === genre);
      if (sort === 'trending') {
        stories.sort((a, b) => (b.views_this_week || 0) - (a.views_this_week || 0));
      } else if (sort === 'new') {
        stories.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      } else {
        stories.sort((a, b) => a.title.localeCompare(b.title));
      }
      payload = {
        stories: stories.slice(Number(offset), Number(offset) + Number(limit)),
        mock: true,
      };
    } else {
      payload = await listPublicStories({
        genre: genre || undefined,
        sort,
        limit: Number(limit) || 20,
        offset: Number(offset) || 0,
      });
    }

    storyCache.set(cacheKey, { data: payload, ts: Date.now() });
    res.setHeader('Cache-Control', isMockMode() ? 'no-store' : 'public, max-age=15');
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
    if (hit && Date.now() - hit.ts < 15_000) {
      res.setHeader('Cache-Control', 'public, max-age=15');
      return res.json(hit.data);
    }

    let payload;
    if (isMockMode()) {
      payload = { ...getSeedDiscover(genre), mock: true };
    } else {
      payload = await listDiscoverByGenre(genre);
    }

    storyCache.set(cacheKey, { data: payload, ts: Date.now() });
    res.setHeader('Cache-Control', isMockMode() ? 'no-store' : 'public, max-age=15');
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

storiesRouter.get('/:id', async (req, res, next) => {
  try {
    if (isMockMode()) {
      const story = getPublicStoryById(req.params.id);
      if (!story) throw createAppError('CHAPTER_NOT_FOUND', 'Story not found', 404);
      const chapters = getSeedChapters(story.id).map((c) => ({
        id: c.id,
        chapter_number: c.chapter_number,
        title: c.title,
        estimated_read_time_minutes: c.estimated_read_time_minutes,
        view_count: c.view_count,
        status: c.status,
      }));
      const { count: freeChapterCount, source: freeChapterSource } =
        await resolveFreeChapterCountForStory(story);
      const { discoveryFormatFromPublishedChapters } = await import(
        '../services/contentFormatDiscovery.js'
      );
      return res.json({
        story: {
          ...story,
          resolved_free_chapters: freeChapterCount,
          free_chapter_source: freeChapterSource,
          discovery_format: discoveryFormatFromPublishedChapters(
            chapters.length,
            story.content_type,
          ),
        },
        chapters,
        mock: true,
      });
    }

    const detail = await getPublicStoryDetail(req.params.id);
    if (!detail) throw createAppError('CHAPTER_NOT_FOUND', 'Story not found', 404);
    res.json(detail);
  } catch (err) {
    next(err);
  }
});

/** Author-curated public testimonials — never an aggregate score. */
storiesRouter.get('/:id/praise', async (req, res, next) => {
  try {
    const praise = await listPublicPraise(req.params.id);
    res.json({ praise });
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});

/**
 * Reader content report — requires the reporter to have actually opened the story
 * (checked server-side against reading_progress) and is rate-limited to one report
 * per story per account. See services/contentReportStore.js for the scaled
 * moderation-mode trigger this feeds into.
 */
storiesRouter.post('/:id/report', requireAuth(), async (req, res, next) => {
  try {
    const reporterId = getAuthenticatedUserId(req);
    const { category, reason } = req.body || {};
    const result = await createContentReport(req.params.id, reporterId, { category, reason });
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? createAppError('BAD_REQUEST', err.message, 400) : err);
  }
});
