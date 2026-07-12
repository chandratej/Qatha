/**
 * Creator community feed — posts & love reactions (Wave 10)
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';

const VALID_TYPES = new Set(['chapter_share', 'milestone', 'discussion']);

/** @type {object[]} */
let mockPosts = [];
/** @type {Map<string, Set<string>>} postId -> userIds who loved */
const mockLovesDb = new Map();

function mapPost(row, viewerId, loveCount, viewerLoved) {
  return {
    id: row.id,
    author_id: row.author_id,
    author_name: row.author_name,
    type: row.post_type,
    body: row.body,
    story_id: row.story_id ?? undefined,
    story_title: row.story_title ?? undefined,
    chapter_number: row.chapter_number ?? undefined,
    created_at: row.created_at,
    reactions: { love: loveCount, comment: 0 },
    viewer_loved: viewerLoved,
  };
}

export function __resetMockCommunityForTests() {
  mockPosts = [];
  mockLovesDb.clear();
}

export async function listCommunityPosts(viewerId, { limit = 50 } = {}) {
  if (isMockMode()) {
    const sorted = [...mockPosts].sort(
      (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
    );
    return sorted.slice(0, limit).map((row) => {
      const lovers = mockLovesDb.get(row.id) || new Set();
      return mapPost(row, viewerId, lovers.size, viewerId ? lovers.has(viewerId) : false);
    });
  }

  const { data: posts, error } = await supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  if (!posts?.length) return [];

  const postIds = posts.map((p) => p.id);
  const { data: reactions, error: rxErr } = await supabase
    .from('community_post_reactions')
    .select('post_id, user_id')
    .in('post_id', postIds)
    .eq('reaction_type', 'love');
  if (rxErr) throw new Error(rxErr.message);

  const loveCounts = new Map();
  const viewerLovedSet = new Set();
  for (const r of reactions || []) {
    loveCounts.set(r.post_id, (loveCounts.get(r.post_id) || 0) + 1);
    if (viewerId && r.user_id === viewerId) viewerLovedSet.add(r.post_id);
  }

  return posts.map((row) => mapPost(
    row,
    viewerId,
    loveCounts.get(row.id) || 0,
    viewerLovedSet.has(row.id),
  ));
}

export async function createCommunityPost(authorId, input) {
  const body = String(input?.body || '').trim();
  const authorName = String(input?.author_name || 'Creator').trim().slice(0, 80);
  const postType = VALID_TYPES.has(input?.type) ? input.type : 'chapter_share';
  const storyId = input?.story_id || null;
  const storyTitle = input?.story_title ? String(input.story_title).slice(0, 200) : null;
  const chapterNumber = input?.chapter_number != null ? Number(input.chapter_number) : null;

  if (!authorId) throw new Error('author_id required');
  if (!body || body.length < 1) throw new Error('body required');
  if (body.length > 500) throw new Error('body too long (max 500 chars)');
  if (chapterNumber != null && (!Number.isFinite(chapterNumber) || chapterNumber < 1)) {
    throw new Error('invalid chapter_number');
  }

  const row = {
    author_id: authorId,
    author_name: authorName,
    post_type: postType,
    body,
    story_id: storyId,
    story_title: storyTitle,
    chapter_number: chapterNumber,
  };

  if (isMockMode()) {
    const item = {
      id: `cp-${randomUUID()}`,
      ...row,
      created_at: new Date().toISOString(),
    };
    mockPosts.unshift(item);
    return mapPost(item, authorId, 0, false);
  }

  const { data, error } = await supabase
    .from('community_posts')
    .insert(row)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return mapPost(data, authorId, 0, false);
}

export async function togglePostLove(postId, userId) {
  if (!postId) throw new Error('post_id required');
  if (!userId) throw new Error('user_id required');

  if (isMockMode()) {
    const post = mockPosts.find((p) => p.id === postId);
    if (!post) return null;
    const lovers = mockLovesDb.get(postId) || new Set();
    const loved = lovers.has(userId);
    if (loved) lovers.delete(userId);
    else lovers.add(userId);
    mockLovesDb.set(postId, lovers);
    return mapPost(post, userId, lovers.size, !loved);
  }

  const { data: existing } = await supabase
    .from('community_post_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('reaction_type', 'love')
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('community_post_reactions')
      .delete()
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('community_post_reactions')
      .insert({ post_id: postId, user_id: userId, reaction_type: 'love' });
    if (error) throw new Error(error.message);
  }

  const { data: post, error: postErr } = await supabase
    .from('community_posts')
    .select('*')
    .eq('id', postId)
    .maybeSingle();
  if (postErr) throw new Error(postErr.message);
  if (!post) return null;

  const { count, error: countErr } = await supabase
    .from('community_post_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('reaction_type', 'love');
  if (countErr) throw new Error(countErr.message);

  const { data: viewerRx } = await supabase
    .from('community_post_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('reaction_type', 'love')
    .maybeSingle();

  return mapPost(post, userId, count || 0, Boolean(viewerRx));
}