/** PRD §4 — Community tags + mood tags + workflow */

export const MOOD_TAGS = [
  'psychological', 'slow_burn', 'emotional', 'cozy', 'dark', 'suspenseful',
  'heartwarming', 'bittersweet', 'wholesome',
] as const;

export const SEED_COMMUNITY_TAGS = [
  'found_family', 'enemies_to_lovers', 'time_travel', 'village', 'hyderabad',
  'haunted_house', 'dark_humor', 'second_chance', 'forbidden_love', 'revenge',
  'coming_of_age', 'political', 'supernatural', 'courtroom', 'medical',
] as const;

export const TAG_REQUEST_STATUSES = ['pending', 'approved', 'merged', 'rejected'] as const;

export type TagRequestStatus = (typeof TAG_REQUEST_STATUSES)[number];

export const TAG_WORKFLOW = {
  steps: ['search_existing', 'use_existing', 'request_new', 'moderator_review', 'approve_merge_reject'] as const,
  moderatorActions: ['approve', 'merge', 'reject'] as const,
} as const;