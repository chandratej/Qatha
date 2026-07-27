/** Story-scoped RBAC — Vol_01-04 + Vol_04-Team_Permissions */

export const STORY_ROLES = [
  'owner',
  'co_author',
  'editor',
  'proofreader',
  'beta_reader',
  'reviewer',
  'moderator_delegate',
  'viewer',
] as const;

export type StoryRole = (typeof STORY_ROLES)[number];

export const STORY_PERMISSIONS = [
  'story.read',
  'story.edit',
  'story.publish',
  'story.invite',
  'story.comment',
  'story.review',
  'story.moderate',
  'story.delete',
] as const;

export type StoryPermission = (typeof STORY_PERMISSIONS)[number];

export const STORY_ROLE_PERMISSIONS: Record<StoryRole, readonly StoryPermission[]> = {
  owner: [
    'story.read', 'story.edit', 'story.publish', 'story.invite',
    'story.comment', 'story.review', 'story.moderate', 'story.delete',
  ],
  co_author: ['story.read', 'story.edit', 'story.comment', 'story.publish'],
  editor: ['story.read', 'story.edit', 'story.comment'],
  proofreader: ['story.read', 'story.comment'],
  beta_reader: ['story.read', 'story.review'],
  reviewer: ['story.read', 'story.review'],
  moderator_delegate: ['story.read', 'story.moderate'],
  viewer: ['story.read'],
} as const;

export function hasStoryPermission(role: StoryRole, permission: StoryPermission): boolean {
  return STORY_ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Owner always wins; least-privilege check for middleware. */
export function canPerformStoryAction(
  role: StoryRole | null | undefined,
  permission: StoryPermission,
): boolean {
  if (!role) return false;
  return hasStoryPermission(role, permission);
}