import { councilLevelForRqi } from '../business/literaryCouncil';
import { computeReviewQualityIndex } from '../business/reviewQualityIndex';
import type { ReviewerPoolMember } from '../types/platform';
import { REVIEWER_BADGES } from './reviewerPoolConstants';

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

export function applyReputationToPoolMember(
  member: ReviewerPoolMember,
  gain: number,
): ReviewerPoolMember {
  const reviewCount = member.review_experience_count + 1;
  const nextRqi = Math.min(100, Math.round((member.rqi + gain) * 10) / 10);
  const rqiInputs = {
    acceptedSuggestionsPct: Math.min(100, 55 + reviewCount * 2),
    storyImprovementScore: Math.min(100, 50 + reviewCount * 2.5),
    readerRetentionImprovementPct: Math.min(100, 48 + reviewCount * 1.5),
    editorialAgreementPct: Math.min(100, 58 + reviewCount * 1.8),
    authorSatisfactionPct: Math.min(100, 62 + reviewCount * 1.2),
    professionalConductPct: member.conduct_score,
  };
  const rqi = Math.max(nextRqi, computeReviewQualityIndex(rqiInputs));
  return {
    ...member,
    rqi,
    review_experience_count: reviewCount,
    council_level: councilLevelForRqi(rqi, reviewCount),
    is_available: true,
  };
}

export function badgesForReviewer(reviewCount: number, rqi: number): string[] {
  const earned: string[] = REVIEWER_BADGES
    .filter((b) => reviewCount >= b.minReviews)
    .map((b) => b.label);
  if (rqi >= 90) earned.push('Master Craft');
  return earned;
}