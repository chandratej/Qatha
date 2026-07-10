import { REVIEW_PACKAGE } from '../../../packages/shared/reviewer-marketplace';

export interface ReviewerCandidate {
  id: string;
  specializations: string[];
  reputation_tier: string;
  is_available: boolean;
}

export function selectAnonymousReviewers(
  pool: ReviewerCandidate[],
  needed = REVIEW_PACKAGE.reviewerCount,
): ReviewerCandidate[] {
  const available = pool.filter((r) => r.is_available);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, needed);
}

export function reviewerPayoutEach(packageFeeInr: number): number {
  const afterPlatform = packageFeeInr * (1 - REVIEW_PACKAGE.platformCommissionPct / 100);
  return Math.round((afterPlatform / REVIEW_PACKAGE.reviewerCount) * 100) / 100;
}