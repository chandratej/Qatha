/**
 * Story Trust / SPI service — DEC-021, BR-004
 * Mirrors packages/shared/spi.ts + story-trust.ts (keep thresholds in sync).
 */

import { getSupabase } from '../lib/supabase.js';
import { BASE_CREATOR_SHARE_PCT } from '../config/storyTrustConstants.js';

export const STABILITY_WINDOW_DAYS = 7;

export const SPI_WEIGHTS = [
  { id: 'reader_retention', weightPct: 35 },
  { id: 'completion_rate', weightPct: 25 },
  { id: 'reader_satisfaction', weightPct: 15 },
  { id: 'reader_growth', weightPct: 10 },
  { id: 'publishing_consistency', weightPct: 10 },
  { id: 'policy_quality', weightPct: 5 },
];

export const TRUST_ORDER = [
  'incubation',
  'foundation',
  'emerging',
  'performing',
  'catalyst',
  'anchor',
  'apex',
];

const MULTIPLIER = {
  incubation: 0,
  foundation: 0,
  emerging: 0,
  performing: 1,
  catalyst: 1.1,
  anchor: 1.25,
  apex: 1.5,
};

function clampPct(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function trustLevelForReaders(totalReaders) {
  if (totalReaders >= 200_000) return 'apex';
  if (totalReaders >= 50_000) return 'anchor';
  if (totalReaders >= 10_000) return 'catalyst';
  if (totalReaders >= 2_000) return 'performing';
  if (totalReaders >= 500) return 'emerging';
  if (totalReaders >= 100) return 'foundation';
  return 'incubation';
}

export function trustLevelFromSpiScore(score) {
  const s = clampPct(score);
  if (s >= 90) return 'apex';
  if (s >= 75) return 'anchor';
  if (s >= 65) return 'catalyst';
  if (s >= 50) return 'performing';
  if (s >= 35) return 'emerging';
  if (s >= 20) return 'foundation';
  return 'incubation';
}

export function effectiveCreatorSharePct(trustLevel) {
  const m = MULTIPLIER[trustLevel] ?? 0;
  if (!m) return 0;
  return Math.round(BASE_CREATOR_SHARE_PCT * m);
}

export function readersToGrowthScore(totalReaders, priorReaders = 0) {
  const base = Math.log10(Math.max(totalReaders, 1) + 9) * 25;
  const growth =
    priorReaders > 0
      ? clampPct(((totalReaders - priorReaders) / Math.max(priorReaders, 1)) * 100)
      : clampPct(totalReaders > 0 ? 40 : 0);
  return clampPct(base * 0.7 + growth * 0.3);
}

export function consistencyScore(publishedChapterCount, daysSinceLastPublish) {
  const depth = clampPct(publishedChapterCount * 12);
  if (daysSinceLastPublish == null) return clampPct(depth * 0.5);
  const recency =
    daysSinceLastPublish <= 7 ? 100 :
    daysSinceLastPublish <= 14 ? 80 :
    daysSinceLastPublish <= 30 ? 55 :
    daysSinceLastPublish <= 60 ? 30 : 10;
  return clampPct(depth * 0.55 + recency * 0.45);
}

export function computeSpi(input) {
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
  const order = (id) => TRUST_ORDER.indexOf(id);
  const suggestedTrustLevel =
    order(spiLevel) >= order(readerHeuristicLevel) ? spiLevel : readerHeuristicLevel;

  return { score, components, suggestedTrustLevel, readerHeuristicLevel };
}

export function applyStabilityWindow({
  currentLevel,
  suggestedLevel,
  candidateLevel,
  daysInCandidate,
  stabilityDays = STABILITY_WINDOW_DAYS,
}) {
  const order = (id) => TRUST_ORDER.indexOf(id);
  if (order(suggestedLevel) === order(currentLevel)) {
    return { action: 'hold', nextLevel: currentLevel, candidateLevel: null };
  }
  if (order(suggestedLevel) > order(currentLevel)) {
    if (candidateLevel === suggestedLevel && daysInCandidate >= stabilityDays) {
      return { action: 'promote', nextLevel: suggestedLevel, candidateLevel: null };
    }
    return { action: 'set_candidate', nextLevel: currentLevel, candidateLevel: suggestedLevel };
  }
  if (candidateLevel === suggestedLevel && daysInCandidate >= stabilityDays) {
    return { action: 'demote', nextLevel: suggestedLevel, candidateLevel: null };
  }
  return { action: 'set_candidate', nextLevel: currentLevel, candidateLevel: suggestedLevel };
}

function daysBetween(iso, now = Date.now()) {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 0;
  return Math.floor((now - t) / (24 * 60 * 60 * 1000));
}

/**
 * Recompute SPI + apply stability for one story. No-op without Supabase.
 */
export async function recomputeStoryTrust(storyId) {
  const sb = getSupabase();
  if (!sb || !storyId) return null;

  const { data: story, error: storyErr } = await sb
    .from('stories')
    .select('id, total_readers, chapter_count, trust_level, trust_candidate_level, trust_stable_since, spi_score')
    .eq('id', storyId)
    .maybeSingle();

  if (storyErr || !story) return null;

  const { data: analytics } = await sb
    .from('chapter_analytics')
    .select('completion_rate, avg_scroll_pct, total_views')
    .eq('story_id', storyId);

  const rows = analytics || [];
  // completion_rate may be 0–1 or 0–100 depending on view; normalize
  const completionNorm = clampPct(
    rows.length
      ? rows.reduce((s, r) => {
          const v = Number(r.completion_rate) || 0;
          return s + (v <= 1 ? v * 100 : v);
        }, 0) / rows.length
      : 0,
  );
  const retentionNorm = clampPct(
    rows.length
      ? rows.reduce((s, r) => s + (Number(r.avg_scroll_pct) || 0), 0) / rows.length
      : 0,
  );

  const { data: lastChapter } = await sb
    .from('chapters')
    .select('published_at')
    .eq('story_id', storyId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let daysSinceLastPublish = null;
  if (lastChapter?.published_at) {
    daysSinceLastPublish = daysBetween(lastChapter.published_at);
  }

  let policyQualityPct = 100;
  const { data: chapterIds } = await sb.from('chapters').select('id').eq('story_id', storyId);
  const ids = (chapterIds || []).map((c) => c.id);
  if (ids.length) {
    const { count: rejectCount } = await sb
      .from('moderation_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'needs_revision')
      .in('chapter_id', ids);
    if (rejectCount && rejectCount > 0) {
      policyQualityPct = clampPct(100 - rejectCount * 15);
    }
  }

  const spi = computeSpi({
    readerRetentionPct: retentionNorm,
    completionRatePct: completionNorm,
    readerSatisfactionPct: clampPct(completionNorm * 0.7 + retentionNorm * 0.3),
    totalReaders: story.total_readers || 0,
    publishedChapterCount: story.chapter_count || 0,
    daysSinceLastPublish,
    policyQualityPct,
  });

  const currentLevel = story.trust_level || 'incubation';
  const daysInCandidate = daysBetween(story.trust_stable_since);
  const decision = applyStabilityWindow({
    currentLevel,
    suggestedLevel: spi.suggestedTrustLevel,
    candidateLevel: story.trust_candidate_level,
    daysInCandidate,
  });

  const nowIso = new Date().toISOString();
  const patch = {
    spi_score: spi.score,
    spi_components: spi.components,
    spi_computed_at: nowIso,
    updated_at: nowIso,
  };

  if (decision.action === 'promote' || decision.action === 'demote') {
    patch.trust_level = decision.nextLevel;
    patch.trust_candidate_level = null;
    patch.trust_stable_since = null;
  } else if (decision.action === 'set_candidate') {
    patch.trust_candidate_level = decision.candidateLevel;
    if (story.trust_candidate_level !== decision.candidateLevel) {
      patch.trust_stable_since = nowIso;
    }
  } else {
    patch.trust_candidate_level = null;
    patch.trust_stable_since = null;
  }

  // Bootstrap: if still incubation and suggestion already performing+, promote immediately on first compute
  if (
    currentLevel === 'incubation' &&
    TRUST_ORDER.indexOf(spi.suggestedTrustLevel) >= TRUST_ORDER.indexOf('foundation') &&
    !story.spi_score
  ) {
    // Keep stability for performing+ only; foundation/emerging can set immediately for cold start
    if (TRUST_ORDER.indexOf(spi.suggestedTrustLevel) < TRUST_ORDER.indexOf('performing')) {
      patch.trust_level = spi.suggestedTrustLevel;
      patch.trust_candidate_level = null;
      patch.trust_stable_since = null;
    }
  }

  const { data: updated, error: upErr } = await sb
    .from('stories')
    .update(patch)
    .eq('id', storyId)
    .select('id, trust_level, spi_score, spi_components, monetization_eligible, trust_candidate_level')
    .maybeSingle();

  if (upErr) {
    console.warn('[storyTrust] update failed', upErr.message);
    return { ...spi, decision, error: upErr.message };
  }

  return {
    story_id: storyId,
    ...spi,
    decision,
    persisted: updated,
    effective_share_pct: effectiveCreatorSharePct(updated?.trust_level || currentLevel),
  };
}

export async function effectiveShareForStory(storyId) {
  const sb = getSupabase();
  if (!sb || !storyId) return { trust_level: 'incubation', effective_share_pct: 0 };

  const { data } = await sb
    .from('stories')
    .select('trust_level, total_readers')
    .eq('id', storyId)
    .maybeSingle();

  if (!data) return { trust_level: 'incubation', effective_share_pct: 0 };
  const level = data.trust_level || trustLevelForReaders(data.total_readers || 0);
  return { trust_level: level, effective_share_pct: effectiveCreatorSharePct(level) };
}
