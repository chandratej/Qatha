/** PRD §9 + Strategy Part 2 — Reviewer marketplace */

export const REVIEWER_ROLES = [
  { id: 'beta_reader', label: 'Beta Reader' },
  { id: 'story_reviewer', label: 'Story Reviewer' },
  { id: 'grammar_reviewer', label: 'Grammar Reviewer' },
  { id: 'historical_reviewer', label: 'Historical Reviewer' },
  { id: 'mythology_reviewer', label: 'Mythology Reviewer' },
  { id: 'translation_reviewer', label: 'Translation Reviewer' },
  { id: 'editorial_reviewer', label: 'Editorial Reviewer' },
  { id: 'sensitivity_reviewer', label: 'Sensitivity Reviewer' },
  { id: 'romance_reviewer', label: 'Romance Reviewer' },
  { id: 'horror_reviewer', label: 'Horror Reviewer' },
] as const;

export type ReviewerRoleId = (typeof REVIEWER_ROLES)[number]['id'];

export const REVIEW_DECISIONS = [
  { id: 'accept', label: 'Accept' },
  { id: 'minor_revision', label: 'Minor Revision' },
  { id: 'major_revision', label: 'Major Revision' },
  { id: 'reject', label: 'Reject' },
] as const;

export type ReviewDecisionId = (typeof REVIEW_DECISIONS)[number]['id'];

export const REVIEWER_REPUTATION_TIERS = [
  { id: 'bronze', label: 'Bronze', minScore: 0 },
  { id: 'silver', label: 'Silver', minScore: 50 },
  { id: 'gold', label: 'Gold', minScore: 75 },
  { id: 'master', label: 'Master', minScore: 90 },
  { id: 'editorial_council', label: 'Editorial Council', minScore: 98, inviteOnly: true },
] as const;

export const REVIEWER_METRICS = [
  'agreement_score', 'accuracy', 'response_time_hours', 'helpfulness', 'appeal_accuracy',
] as const;

export const REVIEW_PACKAGE = {
  minFeeInr: 149,
  maxFeeInr: 199,
  reviewerCount: 3,
  platformCommissionPct: 20,
  reviewerSharePctEach: 26.67, // equal split of remainder
} as const;

export const BETA_READER_MODES = ['volunteer', 'paid'] as const;