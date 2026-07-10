/**
 * BR-002 / BR-009 — Monetization eligibility checklist for Story Trust.
 * DEC-022: only Performing+ stories earn; criteria must be legible to creators.
 */

import {
  MONETIZATION_ELIGIBILITY,
  isMonetizationEligible,
  type StoryTrustLevelId,
} from '../../../packages/shared/story-trust';

export interface EligibilityInput {
  trustLevel: StoryTrustLevelId;
  publishedChapterCount: number;
  freeChapterCount?: number;
  qualityChecksPassed?: boolean;
  hasReaderEngagement?: boolean;
  stabilityWindowMet?: boolean;
}

export interface EligibilityCriterion {
  id: string;
  label: string;
  met: boolean;
  detail?: string;
}

export function monetizationEligibilityChecklist(input: EligibilityInput): {
  eligible: boolean;
  criteria: EligibilityCriterion[];
} {
  const freeCount = input.freeChapterCount ?? Math.min(
    input.publishedChapterCount,
    MONETIZATION_ELIGIBILITY.minFreeChapters,
  );
  const quality = input.qualityChecksPassed ?? input.publishedChapterCount > 0;
  const engagement = input.hasReaderEngagement ?? false;
  const stability = input.stabilityWindowMet ?? false;
  const trustOk = isMonetizationEligible(input.trustLevel);

  const criteria: EligibilityCriterion[] = [
    {
      id: 'trust',
      label: `Story Trust at Performing or above (current: ${input.trustLevel})`,
      met: trustOk,
      detail: MONETIZATION_ELIGIBILITY.minTrustLevel,
    },
    {
      id: 'free_chapters',
      label: `At least ${MONETIZATION_ELIGIBILITY.minFreeChapters} free chapters for readers`,
      met: freeCount >= MONETIZATION_ELIGIBILITY.minFreeChapters,
    },
    {
      id: 'length',
      label: 'Minimum published chapter depth',
      met: input.publishedChapterCount >= MONETIZATION_ELIGIBILITY.minFreeChapters,
    },
    {
      id: 'quality',
      label: 'Quality / policy checks',
      met: quality,
    },
    {
      id: 'engagement',
      label: 'Reader engagement signals',
      met: engagement,
    },
    {
      id: 'stability',
      label: `${MONETIZATION_ELIGIBILITY.stabilityWindowDays}-day stability window`,
      met: stability || trustOk,
    },
  ];

  return {
    eligible: criteria.every((c) => c.met),
    criteria,
  };
}
