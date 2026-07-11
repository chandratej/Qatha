/** Reviewer Pool — PRD-aligned constants & branding */

export const REVIEWER_POOL_BRAND = {
  name: 'Reviewer Pool',
  teluguEyebrow: 'సమీక్షకుల సమూహం',
  tagline: 'Trusted reviewers. Structured feedback. Stories that rise.',
  subtitle:
    'Katha\'s professional review marketplace — double-blind, evidence-based, and built for Telugu and regional-language craft.',
  assurance: 'Professional literary review · human judgment · AI-assisted productivity',
} as const;

/** PRD 11 — default SLA for community reviews (days) */
export const REVIEW_SLA_DAYS = 7;

/** PRD 04 — reviewers required for a decision package */
export const REVIEWERS_REQUIRED = 3;

export const REVIEWER_LEVELS = [
  { id: 'candidate', label: 'Candidate', minReviews: 0 },
  { id: 'trainee', label: 'Trainee', minReviews: 0 },
  { id: 'certified_reviewer', label: 'Certified Reviewer', minReviews: 3 },
  { id: 'senior_reviewer', label: 'Senior Reviewer', minReviews: 12 },
  { id: 'editorial_reviewer', label: 'Editorial Reviewer', minReviews: 25 },
  { id: 'distinguished_reviewer', label: 'Distinguished Reviewer', minReviews: 50 },
] as const;

export const REVIEWER_BADGES = [
  { id: 'first_review', label: 'First Review', minReviews: 1 },
  { id: 'plot_specialist', label: 'Plot Specialist', minReviews: 5 },
  { id: 'fast_reviewer', label: 'Fast Reviewer', minReviews: 3 },
  { id: 'mentor', label: 'Mentor', minReviews: 20 },
  { id: 'community_champion', label: 'Community Champion', minReviews: 30 },
] as const;