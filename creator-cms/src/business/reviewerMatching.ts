import {
  GENRE_SPECIALIZATIONS,
  REVIEWERS_ASSIGNED_COUNT,
  type GenreSpecializationId,
} from '../../../packages/shared/literary-council';
import {
  REVIEW_PACKAGE,
  REVIEWER_REPUTATION_TIERS,
  REVIEWER_ROLES,
  type ReviewerRoleId,
} from '../../../packages/shared/reviewer-marketplace';
import type { StoryTrustLevelId } from '../../../packages/shared/story-trust';
import { computeReviewQualityIndex } from './reviewQualityIndex';
import { councilLevelForRqi } from './literaryCouncil';
import {
  rankAndAssignReviewers,
  type MatchableReviewer,
  type RankedReviewer,
} from './reviewMatchingEngine';

export interface ReviewerCandidate extends MatchableReviewer {
  specializations: string[];
  reputation_tier: string;
  agreement_score?: number;
  response_time_hours?: number;
  professional_role: string;
  council_level: string;
}

const ROLE_IDS = REVIEWER_ROLES.map((r) => r.id);
const GENRE_IDS = GENRE_SPECIALIZATIONS.map((g) => g.id);

const GENRE_ROTATION: GenreSpecializationId[][] = [
  ['romance', 'fantasy'],
  ['horror', 'thriller'],
  ['mythology', 'historical'],
  ['mystery', 'sci_fi'],
  ['comedy', 'children'],
  ['romance', 'mythology'],
  ['fantasy', 'horror'],
  ['thriller', 'mystery'],
  ['historical', 'romance'],
  ['sci_fi', 'fantasy'],
];

const PRO_ROLES = ['literary_reviewer', 'developmental_editor', 'copy_editor'] as const;

function tierForRqi(rqi: number): string {
  const tiers = [...REVIEWER_REPUTATION_TIERS].reverse();
  for (const t of tiers) {
    if (rqi >= t.minScore) return t.id;
  }
  return 'bronze';
}

const TRUST_LEVELS: StoryTrustLevelId[] = [
  'foundation', 'emerging', 'performing', 'catalyst', 'anchor',
];

/** Seed Literary Council reviewer pool — anonymous slots with RQI + genre expertise */
export function seedReviewerPool(): ReviewerCandidate[] {
  return GENRE_ROTATION.map((genres, i) => {
    const rqi = computeReviewQualityIndex({
      acceptedSuggestionsPct: 58 + (i * 4) % 38,
      storyImprovementScore: 55 + (i * 5) % 40,
      readerRetentionImprovementPct: 50 + (i * 3) % 45,
      editorialAgreementPct: 60 + (i * 2) % 35,
      authorSatisfactionPct: 65 + (i * 3) % 30,
      professionalConductPct: 75 + (i % 20),
    });
    const reviewCount = 2 + (i % 15);
    return {
      id: `rev-pool-${i + 1}`,
      specializations: ROLE_IDS.slice(i % 5, (i % 5) + 2) as string[],
      genre_expertise: genres,
      professional_role: PRO_ROLES[i % PRO_ROLES.length]!,
      council_level: councilLevelForRqi(rqi, reviewCount),
      reputation_tier: tierForRqi(rqi),
      is_available: i % 7 !== 0,
      agreement_score: Math.round(rqi),
      rqi,
      review_experience_count: reviewCount,
      story_trust_level: TRUST_LEVELS[i % TRUST_LEVELS.length]!,
      conduct_score: 72 + (i % 25),
      response_time_hours: 12 + (i % 5) * 8,
    };
  });
}

export function filterPoolByRoles(
  pool: ReviewerCandidate[],
  preferredRoles: string[],
): ReviewerCandidate[] {
  if (!preferredRoles.length) return pool;
  const wanted = new Set(preferredRoles);
  const matched = pool.filter((r) =>
    r.is_available && r.specializations.some((s) => wanted.has(s)),
  );
  return matched.length >= REVIEW_PACKAGE.reviewerCount ? matched : pool.filter((r) => r.is_available);
}

export function matchReviewersForRequest(
  pool: ReviewerCandidate[],
  ctx: {
    storyGenre: string;
    authorTrustLevel: StoryTrustLevelId;
    preferredRoles?: string[];
  },
): { assigned: RankedReviewer[]; invited: RankedReviewer[] } {
  let candidates = pool.filter((r) => r.is_available);
  if (ctx.preferredRoles?.length) {
    const filtered = filterPoolByRoles(pool, ctx.preferredRoles);
    if (filtered.filter((r) => r.is_available).length >= REVIEWERS_ASSIGNED_COUNT) {
      candidates = filtered.filter((r) => r.is_available);
    }
  }
  return rankAndAssignReviewers(candidates, {
    storyGenre: ctx.storyGenre,
    authorTrustLevel: ctx.authorTrustLevel,
  });
}

/** @deprecated use matchReviewersForRequest */
export function selectAnonymousReviewers(
  pool: ReviewerCandidate[],
  needed = REVIEW_PACKAGE.reviewerCount,
  preferredRoles: string[] = [],
): ReviewerCandidate[] {
  const { assigned } = matchReviewersForRequest(pool, {
    storyGenre: 'romance',
    authorTrustLevel: 'emerging',
    preferredRoles,
  });
  return assigned.slice(0, needed).map((r) => r.reviewer as ReviewerCandidate);
}

export function reviewerPayoutEach(packageFeeInr: number): number {
  if (packageFeeInr <= 0) return 0;
  const afterPlatform = packageFeeInr * (1 - REVIEW_PACKAGE.platformCommissionPct / 100);
  return Math.round((afterPlatform / REVIEW_PACKAGE.reviewerCount) * 100) / 100;
}

export function platformFeeFromReview(packageFeeInr: number): number {
  if (packageFeeInr <= 0) return 0;
  return Math.round(packageFeeInr * (REVIEW_PACKAGE.platformCommissionPct / 100) * 100) / 100;
}

export function validateReviewRequest(opts: {
  storyId: string;
  storyTitle: string;
  mode: 'volunteer' | 'paid';
  packageFeeInr: number;
  preferredRoles: string[];
  professionalRole?: string;
  storyGenre?: string;
}): void {
  if (!opts.storyId?.trim()) throw new Error('Choose a story from your library');
  if (!opts.storyTitle?.trim()) throw new Error('Story title is required');
  if (!opts.mode) throw new Error('Select volunteer or paid review');

  if (opts.mode === 'paid') {
    if (opts.packageFeeInr < REVIEW_PACKAGE.minFeeInr || opts.packageFeeInr > REVIEW_PACKAGE.maxFeeInr) {
      throw new Error(`Paid review fee must be ₹${REVIEW_PACKAGE.minFeeInr}–₹${REVIEW_PACKAGE.maxFeeInr}`);
    }
  } else if (opts.packageFeeInr !== 0) {
    throw new Error('Volunteer reviews are free');
  }

  const invalid = opts.preferredRoles.filter((r) => !ROLE_IDS.includes(r as ReviewerRoleId));
  if (invalid.length) throw new Error('Invalid reviewer specialization selected');

  if (opts.storyGenre && !GENRE_IDS.includes(opts.storyGenre as GenreSpecializationId)) {
    throw new Error('Select a valid genre specialization');
  }
}

export function poolAvailabilitySummary(pool: ReviewerCandidate[]) {
  const available = pool.filter((r) => r.is_available);
  const byTier = new Map<string, number>();
  const byCouncil = new Map<string, number>();
  for (const r of available) {
    byTier.set(r.reputation_tier, (byTier.get(r.reputation_tier) ?? 0) + 1);
    byCouncil.set(r.council_level, (byCouncil.get(r.council_level) ?? 0) + 1);
  }
  return {
    total: pool.length,
    available: available.length,
    byTier: Object.fromEntries(byTier),
    byCouncil: Object.fromEntries(byCouncil),
    avgRqi: available.length
      ? Math.round(available.reduce((s, r) => s + r.rqi, 0) / available.length)
      : 0,
    canFulfill: available.length >= REVIEW_PACKAGE.reviewerCount,
  };
}