/**
 * Katha Literary Council & Professional Review Ecosystem
 * @see Decisions/Lierary_Council/Katha_Literary_Council_Professional_Review_Ecosystem.md
 */

export const LITERARY_COUNCIL_PHILOSOPHY = {
  headline: 'Katha does not sell reviews. Katha builds trust.',
  subline: 'Professional literary services that improve intellectual property, reward expertise, and elevate ecosystem quality.',
  principles: [
    'Reviews improve stories, not reject them.',
    'Reviews are anonymous, unbiased, and evidence-based.',
    'Reviewer reputation is earned through measurable impact.',
    'Authors purchase professional literary feedback.',
    'Every review improves the quality of Katha.',
  ],
} as const;

/** Writer → Author → Certified Reviewer → Senior → Council → Master */
export const COUNCIL_CAREER_LEVELS = [
  { id: 'writer', label: 'Writer', order: 0 },
  { id: 'author', label: 'Author', order: 1 },
  { id: 'certified_reviewer', label: 'Certified Reviewer', order: 2 },
  { id: 'senior_reviewer', label: 'Senior Reviewer', order: 3 },
  { id: 'council_member', label: 'Literary Council Member', order: 4 },
  { id: 'master_reviewer', label: 'Master Reviewer', order: 5 },
] as const;

export type CouncilCareerLevelId = (typeof COUNCIL_CAREER_LEVELS)[number]['id'];

export const PROFESSIONAL_REVIEW_ROLES = [
  {
    id: 'literary_reviewer',
    label: 'Literary Reviewer',
    dimensions: ['plot', 'characters', 'dialogue', 'emotion', 'pacing', 'world_building'],
  },
  {
    id: 'developmental_editor',
    label: 'Developmental Editor',
    dimensions: ['story_structure', 'character_arcs', 'chapter_flow', 'narrative_consistency'],
  },
  {
    id: 'copy_editor',
    label: 'Copy Editor',
    dimensions: ['grammar', 'formatting', 'language', 'continuity', 'spelling'],
  },
] as const;

export type ProfessionalReviewRoleId = (typeof PROFESSIONAL_REVIEW_ROLES)[number]['id'];

/** Genre expertise specializations for matching */
export const GENRE_SPECIALIZATIONS = [
  { id: 'horror', label: 'Horror' },
  { id: 'romance', label: 'Romance' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'thriller', label: 'Thriller' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'children', label: 'Children' },
  { id: 'historical', label: 'Historical' },
  { id: 'sci_fi', label: 'Sci-Fi' },
  { id: 'mystery', label: 'Mystery' },
  { id: 'mythology', label: 'Mythology' },
] as const;

export type GenreSpecializationId = (typeof GENRE_SPECIALIZATIONS)[number]['id'];

/** Reviewer matching engine weights (must sum to 100) */
export const MATCHING_ENGINE_WEIGHTS = {
  domainExpertisePct: 30,
  reviewQualityIndexPct: 30,
  storyTrustLevelPct: 20,
  reviewExperiencePct: 20,
} as const;

export const INVITATION_BATCH_SIZE = 6;
export const REVIEWERS_ASSIGNED_COUNT = 3;

/** Review Quality Index (RQI) component weights */
export const RQI_WEIGHTS = {
  acceptedSuggestionsPct: 35,
  storyImprovementScorePct: 25,
  readerRetentionImprovementPct: 20,
  editorialAgreementPct: 10,
  authorSatisfactionPct: 5,
  professionalConductPct: 5,
} as const;

/** Story Quality Index (SQI) dimensions */
export const SQI_DIMENSIONS = [
  'plot', 'characters', 'dialogue', 'pacing', 'grammar',
  'formatting', 'continuity', 'emotion', 'reader_retention',
] as const;

export type SqiDimensionId = (typeof SQI_DIMENSIONS)[number];

/** Story Improvement Score (SIS) signals */
export const SIS_SIGNALS = [
  'completion_rate', 'reader_retention', 'ratings', 'bookmarks', 'engagement_growth',
] as const;

export const STRUCTURED_REVIEW_FIELDS = [
  'chapter_ref', 'paragraph_ref', 'sentence_ref', 'category', 'priority',
  'reason', 'recommendation', 'expected_impact', 'reviewer_confidence',
] as const;

export const STRUCTURED_REVIEW_SUPPORT = [
  'track_changes', 'side_by_side_comparison', 'resolution_workflow', 'version_history',
] as const;

export const PAID_REVIEWER_ELIGIBILITY = {
  minStoryTrustLevel: 'emerging' as const,
  minRqi: 55,
  minConductScore: 70,
  requiresVerifiedAuthor: true,
} as const;

export const REVIEW_PAYMENT_WORKFLOW = [
  'author_requests_review',
  'escrow',
  'anonymous_review',
  'quality_validation',
  'review_acceptance',
  'quarterly_reviewer_payout',
] as const;

export const ANTI_FRAUD_MEASURES = [
  'double_blind_review',
  'conflict_detection',
  'duplicate_detection',
  'copy_paste_detection',
  'random_audits',
  'appeals',
  'reputation_penalties',
] as const;

export const DOUBLE_BLIND_POLICY = {
  hiddenUntilComplete: [
    'author_identity', 'reviewer_identity', 'follower_counts', 'awards', 'popularity_metrics',
  ],
} as const;