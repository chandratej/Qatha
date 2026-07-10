import {
  REVIEW_PACKAGE,
  REVIEWER_REPUTATION_TIERS,
  REVIEWER_ROLES,
  type ReviewerRoleId,
} from '../../../packages/shared/reviewer-marketplace';

export interface ReviewerCandidate {
  id: string;
  specializations: string[];
  reputation_tier: string;
  is_available: boolean;
  agreement_score?: number;
  response_time_hours?: number;
}

const ROLE_IDS = REVIEWER_ROLES.map((r) => r.id);

function tierForScore(score: number): string {
  const tiers = [...REVIEWER_REPUTATION_TIERS].reverse();
  for (const t of tiers) {
    if (score >= t.minScore) return t.id;
  }
  return 'bronze';
}

/** Seed a realistic Telugu-literature reviewer pool for demo matching */
export function seedReviewerPool(): ReviewerCandidate[] {
  const combos: ReviewerRoleId[][] = [
    ['story_reviewer', 'grammar_reviewer'],
    ['beta_reader', 'romance_reviewer'],
    ['mythology_reviewer', 'historical_reviewer'],
    ['editorial_reviewer', 'sensitivity_reviewer'],
    ['grammar_reviewer', 'translation_reviewer'],
    ['horror_reviewer', 'story_reviewer'],
    ['beta_reader', 'grammar_reviewer'],
    ['romance_reviewer', 'editorial_reviewer'],
    ['mythology_reviewer', 'story_reviewer'],
    ['historical_reviewer', 'sensitivity_reviewer'],
    ['translation_reviewer', 'editorial_reviewer'],
    ['story_reviewer', 'beta_reader'],
    ['grammar_reviewer', 'romance_reviewer'],
    ['horror_reviewer', 'sensitivity_reviewer'],
    ['mythology_reviewer', 'historical_reviewer', 'story_reviewer'],
    ['beta_reader'],
    ['editorial_reviewer'],
    ['story_reviewer', 'horror_reviewer'],
    ['grammar_reviewer', 'translation_reviewer'],
    ['romance_reviewer', 'beta_reader'],
    ['sensitivity_reviewer', 'editorial_reviewer'],
    ['historical_reviewer', 'grammar_reviewer'],
    ['story_reviewer', 'mythology_reviewer'],
    ['beta_reader', 'horror_reviewer'],
  ];

  return combos.map((specs, i) => {
    const agreement = 62 + (i * 3) % 35;
    return {
      id: `rev-pool-${i + 1}`,
      specializations: specs,
      reputation_tier: tierForScore(agreement),
      is_available: i % 7 !== 0,
      agreement_score: agreement,
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

export function selectAnonymousReviewers(
  pool: ReviewerCandidate[],
  needed = REVIEW_PACKAGE.reviewerCount,
  preferredRoles: string[] = [],
): ReviewerCandidate[] {
  const filtered = filterPoolByRoles(pool, preferredRoles);
  const available = filtered.filter((r) => r.is_available);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, needed);
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
}

export function poolAvailabilitySummary(pool: ReviewerCandidate[]) {
  const available = pool.filter((r) => r.is_available);
  const byTier = new Map<string, number>();
  for (const r of available) {
    byTier.set(r.reputation_tier, (byTier.get(r.reputation_tier) ?? 0) + 1);
  }
  return {
    total: pool.length,
    available: available.length,
    byTier: Object.fromEntries(byTier),
    canFulfill: available.length >= REVIEW_PACKAGE.reviewerCount,
  };
}