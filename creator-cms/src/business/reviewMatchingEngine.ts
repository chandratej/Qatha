import {
  INVITATION_BATCH_SIZE,
  MATCHING_ENGINE_WEIGHTS,
  REVIEWERS_ASSIGNED_COUNT,
  type GenreSpecializationId,
} from '../../../packages/shared/literary-council';
import type { StoryTrustLevelId } from '../../../packages/shared/story-trust';

export interface MatchableReviewer {
  id: string;
  genre_expertise: string[];
  rqi: number;
  review_experience_count: number;
  story_trust_level: StoryTrustLevelId;
  is_available: boolean;
  conduct_score: number;
}

export interface MatchingContext {
  storyGenre: GenreSpecializationId | string;
  authorTrustLevel: StoryTrustLevelId;
}

const TRUST_ORDER: StoryTrustLevelId[] = [
  'incubation', 'foundation', 'emerging', 'performing', 'catalyst', 'anchor', 'apex',
];

function trustAffinity(reviewerTrust: StoryTrustLevelId, authorTrust: StoryTrustLevelId): number {
  const r = TRUST_ORDER.indexOf(reviewerTrust);
  const a = TRUST_ORDER.indexOf(authorTrust);
  if (r < 0 || a < 0) return 50;
  const gap = Math.abs(r - a);
  return Math.max(20, 100 - gap * 15);
}

function domainExpertise(reviewer: MatchableReviewer, genre: string): number {
  if (!genre) return 60;
  if (reviewer.genre_expertise.includes(genre)) return 100;
  const partial = reviewer.genre_expertise.some((g) => genre.includes(g) || g.includes(genre));
  return partial ? 72 : 45;
}

function experienceScore(count: number): number {
  return Math.min(100, 30 + count * 8);
}

export function computeMatchingScore(
  reviewer: MatchableReviewer,
  ctx: MatchingContext,
): number {
  const w = MATCHING_ENGINE_WEIGHTS;
  const domain = domainExpertise(reviewer, ctx.storyGenre);
  const rqi = Math.min(100, reviewer.rqi);
  const trust = trustAffinity(reviewer.story_trust_level, ctx.authorTrustLevel);
  const exp = experienceScore(reviewer.review_experience_count);
  return Math.round(
    domain * (w.domainExpertisePct / 100)
    + rqi * (w.reviewQualityIndexPct / 100)
    + trust * (w.storyTrustLevelPct / 100)
    + exp * (w.reviewExperiencePct / 100),
  );
}

export interface RankedReviewer {
  reviewer: MatchableReviewer;
  matchingScore: number;
}

/** Top eligible receive invitations; first N accepting are assigned (demo: top N by score). */
export function rankAndAssignReviewers(
  pool: MatchableReviewer[],
  ctx: MatchingContext,
  assignCount = REVIEWERS_ASSIGNED_COUNT,
): { invited: RankedReviewer[]; assigned: RankedReviewer[] } {
  const available = pool.filter((r) => r.is_available && r.conduct_score >= 70);
  const ranked = available
    .map((reviewer) => ({
      reviewer,
      matchingScore: computeMatchingScore(reviewer, ctx),
    }))
    .sort((a, b) => b.matchingScore - a.matchingScore);

  const invited = ranked.slice(0, INVITATION_BATCH_SIZE);
  const assigned = invited.slice(0, assignCount);
  return { invited, assigned };
}