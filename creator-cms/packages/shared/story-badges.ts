/**
 * Story Trust badges — aligned with Creator Economy & Story Trust Framework.
 * @deprecated Use STORY_TRUST_LEVELS from story-trust.ts for new code.
 */

import {
  STORY_TRUST_LEVELS,
  trustLevelForReaders,
  type StoryTrustLevelId,
} from './story-trust';

const READER_THRESHOLDS: Record<StoryTrustLevelId, number> = {
  incubation: 0,
  foundation: 100,
  emerging: 500,
  performing: 2_000,
  catalyst: 10_000,
  anchor: 50_000,
  apex: 200_000,
};

export const STORY_BADGES = STORY_TRUST_LEVELS.map((t) => ({
  id: t.id,
  label: t.label,
  glyph: t.glyph,
  order: t.order,
  minReaders: READER_THRESHOLDS[t.id],
  monetizationEligible: t.monetizationEligible,
  revenueSharePct: t.revenueSharePct,
}));

export type StoryBadgeId = StoryTrustLevelId;

export function badgeForReaders(totalReaders: number): StoryBadgeId {
  return trustLevelForReaders(totalReaders);
}