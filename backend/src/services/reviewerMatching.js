/**
 * Reviewer matching engine — mirrors creator-cms/business/reviewerMatching.ts
 * Keep weights in sync with packages/shared/literary-council.ts
 */

export const INVITATION_BATCH_SIZE = 6;
export const REVIEWERS_ASSIGNED_COUNT = 3;
export const REVIEW_PACKAGE = {
  minFeeInr: 149,
  maxFeeInr: 199,
  reviewerCount: 3,
  platformCommissionPct: 15,
};

const MATCHING_WEIGHTS = {
  domainExpertisePct: 35,
  reviewQualityIndexPct: 30,
  storyTrustLevelPct: 20,
  reviewExperiencePct: 15,
};

const ROLE_IDS = [
  'beta_reader', 'story_reviewer', 'grammar_reviewer', 'historical_reviewer',
  'mythology_reviewer', 'translation_reviewer', 'editorial_reviewer',
  'sensitivity_reviewer', 'romance_reviewer', 'horror_reviewer',
];

const GENRE_IDS = [
  'romance', 'fantasy', 'horror', 'thriller', 'mystery', 'comedy', 'children',
  'mythology', 'historical', 'sci_fi',
];

const GENRE_ROTATION = [
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

const PRO_ROLES = ['literary_reviewer', 'developmental_editor', 'copy_editor'];
const TRUST_LEVELS = ['foundation', 'emerging', 'performing', 'catalyst', 'anchor'];
const TRUST_ORDER = ['incubation', 'foundation', 'emerging', 'performing', 'catalyst', 'anchor', 'apex'];

function trustAffinity(reviewerTrust, authorTrust) {
  const r = TRUST_ORDER.indexOf(reviewerTrust);
  const a = TRUST_ORDER.indexOf(authorTrust);
  if (r < 0 || a < 0) return 50;
  return Math.max(20, 100 - Math.abs(r - a) * 15);
}

function domainExpertise(reviewer, genre) {
  if (!genre) return 60;
  if (reviewer.genre_expertise?.includes(genre)) return 100;
  const partial = reviewer.genre_expertise?.some((g) => genre.includes(g) || g.includes(genre));
  return partial ? 72 : 45;
}

function experienceScore(count) {
  return Math.min(100, 30 + count * 8);
}

export function computeMatchingScore(reviewer, ctx) {
  const domain = domainExpertise(reviewer, ctx.storyGenre);
  const rqi = Math.min(100, reviewer.rqi ?? 60);
  const trust = trustAffinity(reviewer.story_trust_level, ctx.authorTrustLevel);
  const exp = experienceScore(reviewer.review_experience_count ?? 0);
  return Math.round(
    domain * (MATCHING_WEIGHTS.domainExpertisePct / 100)
    + rqi * (MATCHING_WEIGHTS.reviewQualityIndexPct / 100)
    + trust * (MATCHING_WEIGHTS.storyTrustLevelPct / 100)
    + exp * (MATCHING_WEIGHTS.reviewExperiencePct / 100),
  );
}

export function rankAndAssignReviewers(pool, ctx, assignCount = REVIEWERS_ASSIGNED_COUNT) {
  const available = pool.filter((r) => r.is_available && (r.conduct_score ?? 80) >= 70);
  const ranked = available
    .map((reviewer) => ({ reviewer, matchingScore: computeMatchingScore(reviewer, ctx) }))
    .sort((a, b) => b.matchingScore - a.matchingScore);
  const invited = ranked.slice(0, INVITATION_BATCH_SIZE);
  const assigned = invited.slice(0, assignCount);
  return { invited, assigned };
}

export function seedReviewerPool() {
  return GENRE_ROTATION.map((genres, i) => {
    const rqi = 58 + (i * 4) % 38;
    const reviewCount = 2 + (i % 15);
    return {
      id: `rev-pool-${i + 1}`,
      pool_slot: `slot-${(i % 6) + 1}`,
      specializations: ROLE_IDS.slice(i % 5, (i % 5) + 2),
      genre_expertise: genres,
      professional_role: PRO_ROLES[i % PRO_ROLES.length],
      council_level: rqi >= 85 ? 'senior_reviewer' : 'certified_reviewer',
      reputation_tier: rqi >= 75 ? 'gold' : rqi >= 50 ? 'silver' : 'bronze',
      is_available: i % 7 !== 0,
      agreement_score: Math.round(rqi),
      rqi,
      review_experience_count: reviewCount,
      story_trust_level: TRUST_LEVELS[i % TRUST_LEVELS.length],
      conduct_score: 72 + (i % 25),
      response_time_hours: 12 + (i % 5) * 8,
    };
  });
}

export function matchReviewersForRequest(pool, ctx) {
  let candidates = pool.filter((r) => r.is_available);
  if (ctx.preferredRoles?.length) {
    const wanted = new Set(ctx.preferredRoles);
    const filtered = pool.filter(
      (r) => r.is_available && r.specializations?.some((s) => wanted.has(s)),
    );
    if (filtered.length >= REVIEWERS_ASSIGNED_COUNT) candidates = filtered;
  }
  return rankAndAssignReviewers(candidates, {
    storyGenre: ctx.storyGenre,
    authorTrustLevel: ctx.authorTrustLevel,
  });
}

export function reviewerPayoutEach(packageFeeInr) {
  if (packageFeeInr <= 0) return 0;
  const afterPlatform = packageFeeInr * (1 - REVIEW_PACKAGE.platformCommissionPct / 100);
  return Math.round((afterPlatform / REVIEW_PACKAGE.reviewerCount) * 100) / 100;
}

export function platformFeeFromReview(packageFeeInr) {
  if (packageFeeInr <= 0) return 0;
  return Math.round(packageFeeInr * (REVIEW_PACKAGE.platformCommissionPct / 100) * 100) / 100;
}

export function validateReviewRequest(opts) {
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

  const invalid = (opts.preferredRoles || []).filter((r) => !ROLE_IDS.includes(r));
  if (invalid.length) throw new Error('Invalid reviewer specialization selected');

  if (opts.storyGenre && !GENRE_IDS.includes(opts.storyGenre)) {
    throw new Error('Select a valid genre specialization');
  }
}

export function poolAvailabilitySummary(pool) {
  const available = pool.filter((r) => r.is_available);
  return {
    total: pool.length,
    available: available.length,
    canFulfill: available.length >= REVIEW_PACKAGE.reviewerCount,
  };
}

export function normalizeStoryGenre(genre) {
  if (!genre) return 'romance';
  const g = String(genre).toLowerCase().replace(/\s+/g, '_');
  return GENRE_IDS.includes(g) ? g : 'romance';
}