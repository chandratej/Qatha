/**
 * Story Performance Index (SPI) — DEC-021 / BR-004
 * Weighted composite 0–100 → Story Trust level (with stability applied at persistence layer).
 */

import {
  SPI_WEIGHTS,
  STORY_TRUST_LEVELS,
  type StoryTrustLevelId,
  trustLevelForReaders,
} from './story-trust';

export type SpiComponentId = (typeof SPI_WEIGHTS)[number]['id'];

export type SpiComponents = Record<SpiComponentId, number>;

export interface SpiInput {
  /** 0–100 averages from chapter_analytics / reading_progress */
  readerRetentionPct: number;
  completionRatePct: number;
  /** Proxy until ratings exist — completion×0.7 + retention×0.3 recommended */
  readerSatisfactionPct: number;
  totalReaders: number;
  /** Published chapters */
  publishedChapterCount: number;
  /** Days since last published chapter (null if never) */
  daysSinceLastPublish: number | null;
  /** 0–100; default 100 when no policy flags */
  policyQualityPct?: number;
  /** Prior total readers for growth signal (optional) */
  priorTotalReaders?: number;
}

export interface SpiResult {
  score: number;
  components: SpiComponents;
  suggestedTrustLevel: StoryTrustLevelId;
  /** Reader-heuristic floor so early traction still maps */
  readerHeuristicLevel: StoryTrustLevelId;
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/** Map total readers to 0–100 growth/scale curve (log-ish). */
export function readersToGrowthScore(totalReaders: number, priorReaders = 0): number {
  const base = Math.log10(Math.max(totalReaders, 1) + 9) * 25; // ~25 at 1, ~50 at 100, ~75 at 10k
  const growth =
    priorReaders > 0
      ? clampPct(((totalReaders - priorReaders) / Math.max(priorReaders, 1)) * 100)
      : clampPct(totalReaders > 0 ? 40 : 0);
  return clampPct(base * 0.7 + growth * 0.3);
}

/** Consistency: chapters + recency. */
export function consistencyScore(publishedChapterCount: number, daysSinceLastPublish: number | null): number {
  const depth = clampPct(publishedChapterCount * 12); // ~8 chapters → ~96
  if (daysSinceLastPublish == null) return clampPct(depth * 0.5);
  const recency =
    daysSinceLastPublish <= 7 ? 100 :
    daysSinceLastPublish <= 14 ? 80 :
    daysSinceLastPublish <= 30 ? 55 :
    daysSinceLastPublish <= 60 ? 30 : 10;
  return clampPct(depth * 0.55 + recency * 0.45);
}

/** SPI score → trust ladder (primary path when signals exist). */
export function trustLevelFromSpiScore(score: number): StoryTrustLevelId {
  const s = clampPct(score);
  if (s >= 90) return 'apex';
  if (s >= 75) return 'anchor';
  if (s >= 65) return 'catalyst';
  if (s >= 50) return 'performing';
  if (s >= 35) return 'emerging';
  if (s >= 20) return 'foundation';
  return 'incubation';
}

/** Prefer the higher of SPI suggestion vs reader-count heuristic (never demote via heuristic alone). */
export function pickTrustLevel(
  spiLevel: StoryTrustLevelId,
  readerLevel: StoryTrustLevelId,
): StoryTrustLevelId {
  const order = (id: StoryTrustLevelId) => STORY_TRUST_LEVELS.find((t) => t.id === id)!.order;
  return order(spiLevel) >= order(readerLevel) ? spiLevel : readerLevel;
}

export function computeSpi(input: SpiInput): SpiResult {
  const components: SpiComponents = {
    reader_retention: clampPct(input.readerRetentionPct),
    completion_rate: clampPct(input.completionRatePct),
    reader_satisfaction: clampPct(input.readerSatisfactionPct),
    reader_growth: readersToGrowthScore(input.totalReaders, input.priorTotalReaders ?? 0),
    publishing_consistency: consistencyScore(input.publishedChapterCount, input.daysSinceLastPublish),
    policy_quality: clampPct(input.policyQualityPct ?? 100),
  };

  let score = 0;
  for (const w of SPI_WEIGHTS) {
    score += (components[w.id] * w.weightPct) / 100;
  }
  score = Math.round(clampPct(score) * 10) / 10;

  const readerHeuristicLevel = trustLevelForReaders(input.totalReaders);
  const spiLevel = trustLevelFromSpiScore(score);
  const suggestedTrustLevel = pickTrustLevel(spiLevel, readerHeuristicLevel);

  return {
    score,
    components,
    suggestedTrustLevel,
    readerHeuristicLevel,
  };
}

export interface StabilityDecision {
  action: 'hold' | 'promote' | 'demote' | 'set_candidate';
  currentLevel: StoryTrustLevelId;
  nextLevel: StoryTrustLevelId;
  candidateLevel: StoryTrustLevelId | null;
}

/**
 * Apply 7-day stability window for promotions; demotions require sustained decline
 * (caller passes daysInCandidate / daysBelow).
 */
export function applyStabilityWindow(opts: {
  currentLevel: StoryTrustLevelId;
  suggestedLevel: StoryTrustLevelId;
  candidateLevel: StoryTrustLevelId | null;
  /** Days since candidate was set */
  daysInCandidate: number;
  stabilityDays?: number;
}): StabilityDecision {
  const stabilityDays = opts.stabilityDays ?? 7;
  const order = (id: StoryTrustLevelId) => STORY_TRUST_LEVELS.find((t) => t.id === id)!.order;
  const cur = opts.currentLevel;
  const sug = opts.suggestedLevel;

  if (order(sug) === order(cur)) {
    return { action: 'hold', currentLevel: cur, nextLevel: cur, candidateLevel: null };
  }

  // Promotion path
  if (order(sug) > order(cur)) {
    if (opts.candidateLevel === sug && opts.daysInCandidate >= stabilityDays) {
      return { action: 'promote', currentLevel: cur, nextLevel: sug, candidateLevel: null };
    }
    return {
      action: 'set_candidate',
      currentLevel: cur,
      nextLevel: cur,
      candidateLevel: sug,
    };
  }

  // Demotion: require sustained decline — same window while suggested stays lower
  if (opts.candidateLevel === sug && opts.daysInCandidate >= stabilityDays) {
    return { action: 'demote', currentLevel: cur, nextLevel: sug, candidateLevel: null };
  }
  return {
    action: 'set_candidate',
    currentLevel: cur,
    nextLevel: cur,
    candidateLevel: sug,
  };
}
