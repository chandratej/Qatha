/**
 * Reader feedback inbox — Vol_07-01-D1
 * Distinct trust model from peer reviewer feedback (AuthorFeedbackInbox).
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { getCreatorSeedStories, DEMO_CREATOR_ID } from '../data/seed.js';

/** @type {Map<string, object[]>} */
const feedbackDb = new Map();

export async function listReaderFeedback(storyId, { status, limit = 50 } = {}) {
  if (!storyId) throw new Error('story_id required');

  if (isMockMode()) {
    let rows = (feedbackDb.get(storyId) || []).slice();
    if (status) rows = rows.filter((r) => r.status === status);
    return rows.slice(0, limit);
  }

  let query = supabase
    .from('reader_feedback')
    .select('*')
    .eq('story_id', storyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

const VALID_TYPES = new Set([
  'written_review', 'inline_chapter', 'reaction', 'content_issue',
  'accessibility', 'translation', 'spoiler_report', 'suggestion',
]);

export async function createReaderFeedback(storyId, readerId, body) {
  const chapterNumber = body?.chapter_number != null ? Number(body.chapter_number) : null;
  const text = String(body?.body || '').trim();
  const feedbackType = VALID_TYPES.has(body?.feedback_type) ? body.feedback_type : 'written_review';

  if (!storyId) throw new Error('story_id required');
  if (!text || text.length < 3) throw new Error('body required (min 3 chars)');
  if (text.length > 2000) throw new Error('body too long (max 2000 chars)');
  if (chapterNumber != null && (!Number.isFinite(chapterNumber) || chapterNumber < 1)) {
    throw new Error('invalid chapter_number');
  }

  const row = {
    story_id: storyId,
    chapter_number: chapterNumber,
    reader_id: readerId || null,
    feedback_type: feedbackType,
    body: text,
    status: 'pending',
  };

  if (isMockMode()) {
    const item = {
      id: `rf-${randomUUID()}`,
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const list = feedbackDb.get(storyId) || [];
    list.unshift(item);
    feedbackDb.set(storyId, list);
    return item;
  }

  const { data, error } = await supabase.from('reader_feedback').insert(row).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

const VALID_STATUSES = new Set(['pending', 'published', 'resolved', 'archived']);

export async function listPendingFeedbackForCreator(creatorId, { limit = 20 } = {}) {
  if (!creatorId) throw new Error('creator_id required');

  if (isMockMode()) {
    const ownedIds = new Set(getCreatorSeedStories(creatorId).map((s) => s.id));
    if (creatorId === DEMO_CREATOR_ID) {
      for (const [storyId] of feedbackDb) ownedIds.add(storyId);
    }
    const rows = [];
    for (const storyId of ownedIds) {
      seedMockReaderFeedback(storyId);
      for (const row of feedbackDb.get(storyId) || []) {
        if (row.status === 'pending') rows.push(row);
      }
    }
    return rows.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, limit);
  }

  const { data: stories, error: storyErr } = await supabase
    .from('stories')
    .select('id')
    .eq('author_id', creatorId);
  if (storyErr) throw new Error(storyErr.message);
  const storyIds = (stories || []).map((s) => s.id);
  if (!storyIds.length) return [];

  const { data, error } = await supabase
    .from('reader_feedback')
    .select('*')
    .in('story_id', storyIds)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateReaderFeedback(storyId, feedbackId, body) {
  const patch = { updated_at: new Date().toISOString() };
  if (body?.status) {
    if (!VALID_STATUSES.has(body.status)) throw new Error('invalid status');
    patch.status = body.status;
  }

  if (isMockMode()) {
    const list = feedbackDb.get(storyId) || [];
    const idx = list.findIndex((r) => r.id === feedbackId);
    if (idx < 0) throw new Error('feedback not found');
    list[idx] = { ...list[idx], ...patch };
    feedbackDb.set(storyId, list);
    return list[idx];
  }

  const { data, error } = await supabase
    .from('reader_feedback')
    .update(patch)
    .eq('id', feedbackId)
    .eq('story_id', storyId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Seed mock feedback for dev dashboards */
export function seedMockReaderFeedback(storyId) {
  if (!isMockMode() || feedbackDb.has(storyId)) return;
  feedbackDb.set(storyId, [
    {
      id: `rf-${randomUUID()}`,
      story_id: storyId,
      chapter_number: 1,
      feedback_type: 'written_review',
      body: 'The village opening felt vivid — would love more sensory detail in the monsoon scene.',
      status: 'published',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: `rf-${randomUUID()}`,
      story_id: storyId,
      chapter_number: 2,
      feedback_type: 'inline_chapter',
      body: 'Pacing slowed in the middle — consider tightening the council scene.',
      status: 'published',
      created_at: new Date(Date.now() - 43200000).toISOString(),
      updated_at: new Date(Date.now() - 43200000).toISOString(),
    },
  ]);
}