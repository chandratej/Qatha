/**
 * Author-side contextual comments — Vol_04-CS-D1/D2 (separate from reviewer comments)
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';

/** @type {Map<string, object[]>} */
const commentsDb = new Map();

function chapterKey(storyId, chapterNumber) {
  return `${storyId}:${chapterNumber}`;
}

export async function listAuthorComments(storyId, chapterNumber) {
  const ch = Number(chapterNumber);
  if (!ch || ch < 1) throw new Error('chapter_number required');

  if (isMockMode()) {
    return (commentsDb.get(chapterKey(storyId, ch)) || []).slice();
  }

  const { data, error } = await supabase
    .from('story_author_comments')
    .select('*')
    .eq('story_id', storyId)
    .eq('chapter_number', ch)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createAuthorComment(storyId, chapterNumber, userId, body) {
  const ch = Number(chapterNumber);
  const sceneId = String(body?.scene_id || '').trim();
  const text = String(body?.body || '').trim();
  if (!ch || ch < 1) throw new Error('chapter_number required');
  if (!sceneId) throw new Error('scene_id required');
  if (!text) throw new Error('body required');

  const row = {
    story_id: storyId,
    chapter_number: ch,
    scene_id: sceneId,
    body: text,
    selected_text: body?.selected_text || null,
    start_offset: body?.start_offset ?? null,
    end_offset: body?.end_offset ?? null,
    status: 'open',
    created_by: userId,
  };

  if (isMockMode()) {
    const comment = {
      id: `ac-${randomUUID()}`,
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const list = commentsDb.get(chapterKey(storyId, ch)) || [];
    list.push(comment);
    commentsDb.set(chapterKey(storyId, ch), list);
    return comment;
  }

  const { data, error } = await supabase.from('story_author_comments').insert(row).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateAuthorComment(storyId, chapterNumber, commentId, body) {
  const ch = Number(chapterNumber);
  const patch = { updated_at: new Date().toISOString() };
  if (body?.body != null) patch.body = String(body.body).trim();
  if (body?.status === 'open' || body?.status === 'resolved') patch.status = body.status;

  if (isMockMode()) {
    const list = commentsDb.get(chapterKey(storyId, ch)) || [];
    const idx = list.findIndex((c) => c.id === commentId);
    if (idx < 0) throw new Error('Comment not found');
    list[idx] = { ...list[idx], ...patch };
    commentsDb.set(chapterKey(storyId, ch), list);
    return list[idx];
  }

  const { data, error } = await supabase
    .from('story_author_comments')
    .update(patch)
    .eq('id', commentId)
    .eq('story_id', storyId)
    .eq('chapter_number', ch)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAuthorComment(storyId, chapterNumber, commentId) {
  const ch = Number(chapterNumber);

  if (isMockMode()) {
    const list = commentsDb.get(chapterKey(storyId, ch)) || [];
    const next = list.filter((c) => c.id !== commentId);
    if (next.length === list.length) throw new Error('Comment not found');
    commentsDb.set(chapterKey(storyId, ch), next);
    return { deleted: true };
  }

  const { error } = await supabase
    .from('story_author_comments')
    .delete()
    .eq('id', commentId)
    .eq('story_id', storyId)
    .eq('chapter_number', ch);
  if (error) throw new Error(error.message);
  return { deleted: true };
}