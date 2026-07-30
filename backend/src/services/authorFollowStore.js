/**
 * Author follows — network-effect moat (readers who follow a creator for updates).
 * Mock in-memory + Supabase author_follows when available.
 */

import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { isTableMissingError, toSafeStoreError } from '../lib/schemaHealth.js';

/** @type {Map<string, Set<string>>} authorId → Set of followerIds */
const followsByAuthor = new Map();
/** @type {Map<string, Set<string>>} followerId → Set of authorIds */
const followingByReader = new Map();

function addMock(followerId, authorId) {
  if (!followsByAuthor.has(authorId)) followsByAuthor.set(authorId, new Set());
  if (!followingByReader.has(followerId)) followingByReader.set(followerId, new Set());
  followsByAuthor.get(authorId).add(followerId);
  followingByReader.get(followerId).add(authorId);
}

function removeMock(followerId, authorId) {
  followsByAuthor.get(authorId)?.delete(followerId);
  followingByReader.get(followerId)?.delete(authorId);
}

export async function followAuthor(followerId, authorId) {
  if (!followerId || !authorId) throw new Error('follower and author required');
  if (followerId === authorId) throw new Error('cannot follow yourself');

  if (isMockMode()) {
    addMock(followerId, authorId);
    return { following: true, author_id: authorId };
  }

  const { error } = await supabase.from('author_follows').upsert({
    follower_id: followerId,
    author_id: authorId,
    created_at: new Date().toISOString(),
  }, { onConflict: 'follower_id,author_id' });
  if (error) {
    if (isTableMissingError(error)) {
      addMock(followerId, authorId);
      return { following: true, author_id: authorId, mock_fallback: true };
    }
    throw toSafeStoreError(error, 'Could not follow author');
  }
  return { following: true, author_id: authorId };
}

export async function unfollowAuthor(followerId, authorId) {
  if (isMockMode()) {
    removeMock(followerId, authorId);
    return { following: false, author_id: authorId };
  }
  const { error } = await supabase
    .from('author_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('author_id', authorId);
  if (error) {
    if (isTableMissingError(error)) {
      removeMock(followerId, authorId);
      return { following: false, author_id: authorId, mock_fallback: true };
    }
    throw toSafeStoreError(error, 'Could not unfollow');
  }
  return { following: false, author_id: authorId };
}

export async function listAuthorFollowers(authorId) {
  if (isMockMode()) {
    const set = followsByAuthor.get(authorId) || new Set();
    return {
      author_id: authorId,
      count: set.size,
      follower_ids: [...set],
    };
  }
  const { data, error, count } = await supabase
    .from('author_follows')
    .select('follower_id, created_at', { count: 'exact' })
    .eq('author_id', authorId);
  if (error) {
    if (isTableMissingError(error)) {
      const set = followsByAuthor.get(authorId) || new Set();
      return { author_id: authorId, count: set.size, follower_ids: [...set], mock_fallback: true };
    }
    throw toSafeStoreError(error, 'Could not list followers');
  }
  return {
    author_id: authorId,
    count: count ?? (data || []).length,
    follower_ids: (data || []).map((r) => r.follower_id),
    rows: data || [],
  };
}

export async function listFollowing(followerId) {
  if (isMockMode()) {
    const set = followingByReader.get(followerId) || new Set();
    return { follower_id: followerId, author_ids: [...set], count: set.size };
  }
  const { data, error } = await supabase
    .from('author_follows')
    .select('author_id, created_at')
    .eq('follower_id', followerId);
  if (error) {
    if (isTableMissingError(error)) {
      const set = followingByReader.get(followerId) || new Set();
      return { follower_id: followerId, author_ids: [...set], count: set.size, mock_fallback: true };
    }
    throw toSafeStoreError(error, 'Could not list following');
  }
  return {
    follower_id: followerId,
    author_ids: (data || []).map((r) => r.author_id),
    count: (data || []).length,
    rows: data || [],
  };
}

export async function isFollowing(followerId, authorId) {
  if (isMockMode()) {
    return Boolean(followingByReader.get(followerId)?.has(authorId));
  }
  const { data, error } = await supabase
    .from('author_follows')
    .select('author_id')
    .eq('follower_id', followerId)
    .eq('author_id', authorId)
    .maybeSingle();
  if (error) {
    if (isTableMissingError(error)) return Boolean(followingByReader.get(followerId)?.has(authorId));
    return false;
  }
  return Boolean(data);
}
