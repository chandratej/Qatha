/** Deno port of packages/shared/spi.ts — keep thresholds aligned. */

export type StoryTrustLevelId =
  | 'incubation'
  | 'foundation'
  | 'emerging'
  | 'performing'
  | 'catalyst'
  | 'anchor'
  | 'apex';

const TRUST_ORDER: StoryTrustLevelId[] = [
  'incubation',
  'foundation',
  'emerging',
  'performing',
  'catalyst',
  'anchor',
  'apex',
];

const SPI_WEIGHTS = [
  { id: 'reader_retention', weightPct: 35 },
  { id: 'completion_rate', weightPct: 25 },
  { id: 'reader_satisfaction', weightPct: 15 },
  { id: 'reader_growth', weightPct: 10 },
  { id: 'publishing_consistency', weightPct: 10 },
  { id: 'policy_quality', weightPct: 5 },
] as const;

export const STABILITY_WINDOW_DAYS = 7;

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function trustLevelForReaders(totalReaders: number): StoryTrustLevelId {
  if (totalReaders >= 200_000) return 'apex';
  if (totalReaders >= 50_000) return 'anchor';
  if (totalReaders >= 10_000) return 'catalyst';
  if (totalReaders >= 2_000) return 'performing';
  if (totalReaders >= 500) return 'emerging';
  if (totalReaders >= 100) return 'foundation';
  return 'incubation';
}

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

function readersToGrowthScore(totalReaders: number, priorReaders = 0): number {
  const base = Math.log10(Math.max(totalReaders, 1) + 9) * 25;
  const growth =
    priorReaders > 0
      ? clampPct(((totalReaders - priorReaders) / Math.max(priorReaders, 1)) * 100)
      : clampPct(totalReaders > 0 ? 40 : 0);
  return clampPct(base * 0.7 + growth * 0.3);
}

function consistencyScore(publishedChapterCount: number, daysSinceLastPublish: number | null): number {
  const depth = clampPct(publishedChapterCount * 12);
  if (daysSinceLastPublish == null) return clampPct(depth * 0.5);
  const recency =
    daysSinceLastPublish <= 7 ? 100 :
    daysSinceLastPublish <= 14 ? 80 :
    daysSinceLastPublish <= 30 ? 55 :
    daysSinceLastPublish <= 60 ? 30 : 10;
  return clampPct(depth * 0.55 + recency * 0.45);
}

export function computeSpi(input: {
  readerRetentionPct: number;
  completionRatePct: number;
  readerSatisfactionPct: number;
  totalReaders: number;
  publishedChapterCount: number;
  daysSinceLastPublish: number | null;
  policyQualityPct?: number;
  priorTotalReaders?: number;
}) {
  const components = {
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
  const order = (id: StoryTrustLevelId) => TRUST_ORDER.indexOf(id);
  const suggestedTrustLevel =
    order(spiLevel) >= order(readerHeuristicLevel) ? spiLevel : readerHeuristicLevel;

  return { score, components, suggestedTrustLevel, readerHeuristicLevel };
}

export function applyStabilityWindow(opts: {
  currentLevel: StoryTrustLevelId;
  suggestedLevel: StoryTrustLevelId;
  candidateLevel: StoryTrustLevelId | null;
  daysInCandidate: number;
  stabilityDays?: number;
}) {
  const stabilityDays = opts.stabilityDays ?? STABILITY_WINDOW_DAYS;
  const order = (id: StoryTrustLevelId) => TRUST_ORDER.indexOf(id);
  const cur = opts.currentLevel;
  const sug = opts.suggestedLevel;

  if (order(sug) === order(cur)) {
    return { action: 'hold' as const, nextLevel: cur, candidateLevel: null };
  }
  if (order(sug) > order(cur)) {
    if (opts.candidateLevel === sug && opts.daysInCandidate >= stabilityDays) {
      return { action: 'promote' as const, nextLevel: sug, candidateLevel: null };
    }
    return { action: 'set_candidate' as const, nextLevel: cur, candidateLevel: sug };
  }
  if (opts.candidateLevel === sug && opts.daysInCandidate >= stabilityDays) {
    return { action: 'demote' as const, nextLevel: sug, candidateLevel: null };
  }
  return { action: 'set_candidate' as const, nextLevel: cur, candidateLevel: sug };
}

export function daysBetween(iso: string | null | undefined, now = Date.now()): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 0;
  return Math.floor((now - t) / (24 * 60 * 60 * 1000));
}
