import { councilLevelForRqi } from '../business/literaryCouncil';
import { computeReviewQualityIndex } from '../business/reviewQualityIndex';
import type { ReviewerPoolMember } from '../types/platform';
import { REVIEWER_BADGES } from './reviewerPoolConstants';

export interface ReviewerBadgeStatus {
  id: string;
  label: string;
  earned: boolean;
  /** Human-readable unlock criteria when locked */
  unlockHint: string;
  minReviews: number;
}

export function reputationGainFromReview(opts: {
  commentsCount: number;
  submittedBeforeDue: boolean;
  hasSummary: boolean;
}): number {
  let gain = 2;
  gain += Math.min(6, opts.commentsCount * 0.6);
  if (opts.hasSummary) gain += 1.5;
  if (opts.submittedBeforeDue) gain += 2;
  return Math.round(gain * 10) / 10;
}

/** RQI is always a whole number when shown as a reputation fact. */
export function roundRqi(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function applyReputationToPoolMember(
  member: ReviewerPoolMember,
  gain: number,
): ReviewerPoolMember {
  const reviewCount = member.review_experience_count + 1;
  const nextRqi = Math.min(100, roundRqi(member.rqi + gain));
  const rqiInputs = {
    acceptedSuggestionsPct: Math.min(100, 55 + reviewCount * 2),
    storyImprovementScore: Math.min(100, 50 + reviewCount * 2.5),
    readerRetentionImprovementPct: Math.min(100, 48 + reviewCount * 1.5),
    editorialAgreementPct: Math.min(100, 58 + reviewCount * 1.8),
    authorSatisfactionPct: Math.min(100, 62 + reviewCount * 1.2),
    professionalConductPct: member.conduct_score,
  };
  const rqi = Math.max(nextRqi, roundRqi(computeReviewQualityIndex(rqiInputs)));
  return {
    ...member,
    rqi,
    review_experience_count: reviewCount,
    council_level: councilLevelForRqi(rqi, reviewCount),
    is_available: true,
  };
}

/**
 * Full badge catalog with earned/locked state from real track record.
 * Never defaults every badge to unlocked for new reviewers.
 */
export function badgeStatusesForReviewer(reviewCount: number, rqi: number): ReviewerBadgeStatus[] {
  const wholeRqi = roundRqi(rqi);
  const catalog: Array<{ id: string; label: string; minReviews: number; minRqi?: number }> = [
    ...REVIEWER_BADGES.map((b) => ({ id: b.id, label: b.label, minReviews: b.minReviews })),
    { id: 'master_craft', label: 'Master Craft', minReviews: 15, minRqi: 90 },
  ];

  return catalog.map((b) => {
    const earned =
      reviewCount >= b.minReviews
      && (b.minRqi == null || wholeRqi >= b.minRqi);
    let unlockHint = `at ${b.minReviews} reviews`;
    if (b.minRqi != null) {
      unlockHint = `at ${b.minReviews} reviews · RQI ${b.minRqi}+`;
    }
    return {
      id: b.id,
      label: b.label,
      earned,
      unlockHint,
      minReviews: b.minReviews,
    };
  });
}

/** @deprecated Prefer badgeStatusesForReviewer — kept for call sites that only need earned labels */
export function badgesForReviewer(reviewCount: number, rqi: number): string[] {
  return badgeStatusesForReviewer(reviewCount, rqi)
    .filter((b) => b.earned)
    .map((b) => b.label);
}
