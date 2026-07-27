/**
 * Format Spec v1 / BR-002 — Monetization eligibility checklist for Story Trust.
 * Unit gate (50 chapters / 5 collection stories / non-monetized formats) sits
 * in front of SPI banding. DEC-022: only Performing+ stories earn after the gate.
 */

import {
  MONETIZATION_ELIGIBILITY,
  isMonetizationEligible,
  type StoryTrustLevelId,
} from '../../../packages/shared/story-trust';
import {
  clearsMonetizationUnitGate,
  formatEligibilityProfile,
  isFormatMonetizable,
  freeUnitsForContentType,
} from '../../../packages/shared/formatEligibility';
import { evaluateReaderTier } from '../../../packages/shared/readerTiers';

export interface EligibilityInput {
  trustLevel: StoryTrustLevelId;
  publishedChapterCount: number;
  contentTypeId?: string | null;
  freeChapterCount?: number;
  qualityChecksPassed?: boolean;
  hasReaderEngagement?: boolean;
  stabilityWindowMet?: boolean;
  isTopDecileApex?: boolean;
  avgWordsPerUnit?: number | null;
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
  readerTier: ReturnType<typeof evaluateReaderTier>;
} {
  const contentTypeId = input.contentTypeId || 'serialized_story';
  const profile = formatEligibilityProfile(contentTypeId);
  const unitGate = clearsMonetizationUnitGate(contentTypeId, input.publishedChapterCount);
  const formatOk = isFormatMonetizable(contentTypeId);

  const collectionFree = freeUnitsForContentType(contentTypeId);
  const freeCount =
    input.freeChapterCount
    ?? collectionFree
    ?? Math.min(input.publishedChapterCount, MONETIZATION_ELIGIBILITY.minFreeChapters);

  const quality = input.qualityChecksPassed ?? input.publishedChapterCount > 0;
  const engagement = input.hasReaderEngagement ?? false;
  const stability = input.stabilityWindowMet ?? false;
  const trustOk = isMonetizationEligible(input.trustLevel);

  const freeRequired =
    collectionFree != null ? collectionFree : MONETIZATION_ELIGIBILITY.minFreeChapters;

  const criteria: EligibilityCriterion[] = [
    {
      id: 'format',
      label: formatOk
        ? `Format allows monetization (${profile.monetizationMode})`
        : 'Format is non-monetized (acquisition/contest only)',
      met: formatOk,
      detail: profile.notes,
    },
    {
      id: 'unit_gate',
      label:
        unitGate.required != null
          ? `≥${unitGate.required} published units (have ${input.publishedChapterCount})`
          : 'Monetization unit gate',
      met: unitGate.met,
      detail: unitGate.reason,
    },
    {
      id: 'trust',
      label: `Story Trust at Performing or above (current: ${input.trustLevel})`,
      met: trustOk && unitGate.met,
      detail: MONETIZATION_ELIGIBILITY.minTrustLevel,
    },
    {
      id: 'free_chapters',
      label:
        collectionFree != null
          ? 'Story 1 permanently free for readers (collection rule)'
          : `At least ${freeRequired} free chapters for readers`,
      met: freeCount >= freeRequired,
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
      met: stability || (trustOk && unitGate.met),
    },
  ];

  const readerTier = evaluateReaderTier({
    contentTypeId,
    trustLevel: input.trustLevel,
    publishedUnits: input.publishedChapterCount,
    monetizationUnitGateMet: unitGate.met,
    isTopDecileApex: input.isTopDecileApex,
    avgWordsPerUnit: input.avgWordsPerUnit,
  });

  return {
    eligible: criteria.every((c) => c.met),
    criteria,
    readerTier,
  };
}
