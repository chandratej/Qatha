/**
 * Story-scoped RBAC — Vol_01-04 (Wave 1 server-side enforcement)
 * Security Council: enforce on API before UI gating.
 */

import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { createAppError } from './errorHandler.js';
import { getAuthenticatedUserId } from './authenticate.js';

const STORY_ROLE_PERMISSIONS = {
  owner: ['story.read', 'story.edit', 'story.publish', 'story.invite', 'story.comment', 'story.review', 'story.moderate', 'story.delete'],
  co_author: ['story.read', 'story.edit', 'story.comment', 'story.publish'],
  editor: ['story.read', 'story.edit', 'story.comment'],
  proofreader: ['story.read', 'story.comment'],
  beta_reader: ['story.read', 'story.review'],
  reviewer: ['story.read', 'story.review'],
  moderator_delegate: ['story.read', 'story.moderate'],
  viewer: ['story.read'],
};

function roleAllows(role, permission) {
  const perms = STORY_ROLE_PERMISSIONS[role];
  return Array.isArray(perms) && perms.includes(permission);
}

async function resolveStoryRole(storyId, userId) {
  if (isMockMode()) {
    return { role: 'owner', mock: true };
  }

  const { data, error } = await supabase
    .from('story_members')
    .select('role, expires_at')
    .eq('story_id', storyId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw createAppError('INTERNAL_ERROR', error.message, 500);

  if (data) {
    if (data.expires_at && Date.parse(data.expires_at) < Date.now()) return null;
    return { role: data.role };
  }

  // Legacy fallback until story_members backfill completes (migration 018)
  const { data: story, error: storyErr } = await supabase
    .from('stories')
    .select('author_id')
    .eq('id', storyId)
    .maybeSingle();
  if (storyErr) throw createAppError('INTERNAL_ERROR', storyErr.message, 500);
  if (story?.author_id === userId) return { role: 'owner', legacy: true };

  return null;
}

/**
 * @param {import('express').Request} req
 * @param {string} permission
 */
export async function assertStoryPermission(req, storyId, permission) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) throw createAppError('UNAUTHORIZED', 'Authentication required', 401);

  const membership = await resolveStoryRole(storyId, userId);
  if (!membership || !roleAllows(membership.role, permission)) {
    throw createAppError('FORBIDDEN', `Missing permission: ${permission}`, 403);
  }

  return { userId, role: membership.role, mock: membership.mock ?? false };
}

/**
 * Express middleware factory.
 * @param {string} permission
 * @param {{ param?: string, bodyField?: string }} [opts]
 */
export function requireStoryRole(permission, opts = {}) {
  const param = opts.param ?? 'storyId';
  const bodyField = opts.bodyField;
  return async (req, _res, next) => {
    try {
      const storyId = req.params[param] || (bodyField ? req.body?.[bodyField] : null) || req.params.storyId;
      if (!storyId) throw createAppError('BAD_REQUEST', 'storyId required', 400);
      req.storyAccess = await assertStoryPermission(req, storyId, permission);
      next();
    } catch (err) {
      next(err);
    }
  };
}