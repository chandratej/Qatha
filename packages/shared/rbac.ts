/** RBAC — Events Platform + PRD roles */

export const PLATFORM_ROLES = [
  'reader', 'creator', 'reviewer', 'judge', 'organizer', 'sponsor', 'moderator', 'admin',
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const ROLE_PERMISSIONS: Record<PlatformRole, readonly string[]> = {
  reader: ['read', 'bookmark', 'follow', 'report', 'register_event', 'vote_community'],
  creator: ['read', 'publish', 'analytics', 'request_review', 'register_event', 'submit_event'],
  reviewer: ['anonymous_review', 'beta_read', 'earn_review_payout'],
  judge: ['blind_score', 'rubric_score'],
  organizer: ['create_event', 'manage_event', 'view_organizer_dashboard'],
  sponsor: ['sponsor_event', 'view_sponsor_analytics'],
  moderator: ['moderate_content', 'moderate_tags', 'triage_reports', 'moderate_events'],
  admin: ['*'],
} as const;

export function hasPermission(role: PlatformRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms.includes('*') || perms.includes(permission);
}

export function canHostPaidContest(organizerLevel: string): boolean {
  return organizerLevel !== 'new_organizer';
}