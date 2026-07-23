import { Router } from 'express';
import { getRevenueConfig } from '../config/revenue.js';
import { getLaunchOfferConfig } from '../services/launchOffer.js';
import { getFounderOsConfig, getFounderOsIdeas } from '../services/founderOsStore.js';
import {
  PROVEN_FREE_CHAPTERS,
  getUnprovenFreeChapterDefault,
  UNPROVEN_FREE_CHAPTER_COHORTS,
} from '../services/freeChapterThreshold.js';
import { getPhase2TieringReadiness } from '../services/phase2TieringGate.js';
import { getFoundingAuthorProgramConfig } from '../services/foundingAuthorProgram.js';

export const configRouter = Router();

/** Public launch-offer config — clients adapt paywall UX without hardcoding (DEV-004). */
configRouter.get('/launch-offer', (_req, res) => {
  res.json(getLaunchOfferConfig());
});

/** Public revenue split — 60/40 per DEV-003 founder decision. */
configRouter.get('/revenue', (_req, res) => {
  res.json(getRevenueConfig());
});

/**
 * Free-chapter threshold config — proven stories/authors get 3, everyone else gets the
 * platform "unproven" default (env KATHA_UNPROVEN_FREE_CHAPTERS, changeable without a
 * deploy). Per-story values are always the source of truth on the story object itself
 * (resolved_free_chapters / free_chapter_source) — this endpoint just exposes the
 * platform-wide defaults for CMS admin screens.
 */
configRouter.get('/free-chapter-threshold', (_req, res) => {
  res.json({
    proven_free_chapters: PROVEN_FREE_CHAPTERS,
    unproven_default_free_chapters: getUnprovenFreeChapterDefault(),
    unproven_cohorts: UNPROVEN_FREE_CHAPTER_COHORTS,
  });
});

/** Phase-2 reader tiering readiness — hard-gated; see phase2TieringGate.js. */
configRouter.get('/phase2-tiering', async (_req, res, next) => {
  try {
    res.json(await getPhase2TieringReadiness());
  } catch (err) {
    next(err);
  }
});

/** Founding-author incentive program config — see foundingAuthorProgram.js. */
configRouter.get('/founding-author-program', (_req, res) => {
  res.json(getFoundingAuthorProgramConfig());
});

/** Founder OS — feature flags & idea backlog for founder review */
configRouter.get('/founder-os', (_req, res) => {
  res.json({
    config: getFounderOsConfig(),
    ideas: getFounderOsIdeas(),
  });
});