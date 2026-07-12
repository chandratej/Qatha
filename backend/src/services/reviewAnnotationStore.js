/**
 * Normalized review annotations + collaboration threads — LRC-06-D4, LRC-09-D3 Wave 2b
 * Literary Council: craft notes persist beyond JSONB; threads keep author-reviewer context.
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { createInAppNotification } from './notificationsStore.js';

/** @type {Map<string, object[]>} */
const annotationsDb = new Map();
/** @type {Map<string, object[]>} */
const threadsDb = new Map();

function requestKey(requestId) {
  return String(requestId);
}

function annotationToStructured(row, threads = []) {
  return {
    id: row.id,
    chapter_ref: row.chapter_ref,
    scene_ref: row.scene_ref,
    paragraph_ref: row.paragraph_ref,
    sentence_ref: row.sentence_ref,
    passage_ref: row.passage_ref,
    anchor_start: row.anchor_start ?? undefined,
    anchor_end: row.anchor_end ?? undefined,
    category: row.category,
    priority: row.priority,
    reason: row.reason,
    recommendation: row.recommendation,
    expected_impact: row.expected_impact,
    reviewer_confidence: row.reviewer_confidence,
    author_resolution: row.author_resolution,
    resolved_at: row.resolved_at ?? undefined,
    status: row.status,
    threads,
  };
}

export async function persistAnnotationsFromSubmit({
  requestId,
  assignmentId,
  storyId,
  reviewerSlot,
  comments = [],
}) {
  if (!comments.length) return [];

  const rows = comments.map((c) => ({
    id: c.id && /^[0-9a-f-]{36}$/i.test(String(c.id)) ? c.id : randomUUID(),
    request_id: requestId,
    assignment_id: assignmentId,
    story_id: storyId,
    reviewer_slot: reviewerSlot,
    chapter_ref: c.chapter_ref || null,
    scene_ref: c.scene_ref || null,
    paragraph_ref: c.paragraph_ref || null,
    sentence_ref: c.sentence_ref || null,
    passage_ref: c.passage_ref || null,
    anchor_start: c.anchor_start ?? null,
    anchor_end: c.anchor_end ?? null,
    category: c.category || 'other',
    priority: c.priority === 'high' ? 'high' : c.priority === 'low' ? 'low' : 'medium',
    reason: c.reason || '',
    recommendation: c.recommendation || '',
    expected_impact: c.expected_impact || '',
    reviewer_confidence: c.reviewer_confidence ?? 75,
    status: 'published',
    author_resolution: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  if (isMockMode()) {
    const existing = annotationsDb.get(requestKey(requestId)) || [];
    const merged = [...existing];
    for (const row of rows) {
      const idx = merged.findIndex((r) => r.id === row.id);
      if (idx >= 0) merged[idx] = { ...merged[idx], ...row };
      else merged.push(row);
    }
    annotationsDb.set(requestKey(requestId), merged);
    return merged;
  }

  const { data, error } = await supabase
    .from('review_annotations')
    .upsert(rows, { onConflict: 'id' })
    .select('*');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function listAnnotationsForRequest(requestId, { includeThreads = true, reviewerSlot } = {}) {
  const slotFilter = reviewerSlot ? String(reviewerSlot) : null;

  if (isMockMode()) {
    let rows = (annotationsDb.get(requestKey(requestId)) || []).filter((r) => !r.is_deleted);
    if (slotFilter) rows = rows.filter((r) => r.reviewer_slot === slotFilter);
    if (!includeThreads) return rows.map((r) => annotationToStructured(r));
    return Promise.all(rows.map(async (r) => {
      const threads = await listThreadsForAnnotation(r.id);
      return annotationToStructured(r, threads);
    }));
  }

  let q = supabase
    .from('review_annotations')
    .select('*')
    .eq('request_id', requestId)
    .eq('is_deleted', false);
  if (slotFilter) q = q.eq('reviewer_slot', slotFilter);
  const { data, error } = await q.order('created_at', { ascending: true });
  if (error) throw new Error(error.message);

  const rows = data || [];
  if (!includeThreads) return rows.map((r) => annotationToStructured(r));

  return Promise.all(rows.map(async (r) => {
    const threads = await listThreadsForAnnotation(r.id);
    return annotationToStructured(r, threads);
  }));
}

export async function listThreadsForAnnotation(annotationId) {
  if (isMockMode()) {
    return (threadsDb.get(annotationId) || []).filter((t) => !t.is_deleted);
  }

  const { data, error } = await supabase
    .from('annotation_threads')
    .select('*')
    .eq('annotation_id', annotationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getAnnotationById(annotationId) {
  if (isMockMode()) {
    for (const rows of annotationsDb.values()) {
      const hit = rows.find((r) => r.id === annotationId && !r.is_deleted);
      if (hit) return hit;
    }
    return null;
  }

  const { data, error } = await supabase
    .from('review_annotations')
    .select('*')
    .eq('id', annotationId)
    .eq('is_deleted', false)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function resolveAnnotation(annotationId, resolution) {
  const row = await getAnnotationById(annotationId);
  if (!row) throw new Error('Annotation not found');

  const patch = {
    author_resolution: resolution ?? 'pending',
    resolved_at: new Date().toISOString(),
    status: resolution === 'accepted' ? 'addressed' : 'resolved',
    updated_at: new Date().toISOString(),
  };

  if (isMockMode()) {
    const list = annotationsDb.get(requestKey(row.request_id)) || [];
    const idx = list.findIndex((r) => r.id === annotationId);
    if (idx < 0) throw new Error('Annotation not found');
    list[idx] = { ...list[idx], ...patch };
    annotationsDb.set(requestKey(row.request_id), list);
    return list[idx];
  }

  const { data, error } = await supabase
    .from('review_annotations')
    .update(patch)
    .eq('id', annotationId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function addThreadReply({
  annotationId,
  authorId,
  role,
  body,
  notifyUserId,
  notifyUserIds = [],
  actionUrl,
}) {
  const text = String(body || '').trim();
  if (!text) throw new Error('Reply body required');
  if (!['author', 'reviewer', 'moderator'].includes(role)) {
    throw new Error('Invalid thread role');
  }

  const annotation = await getAnnotationById(annotationId);
  if (!annotation) throw new Error('Annotation not found');

  const row = {
    id: randomUUID(),
    annotation_id: annotationId,
    author_id: authorId,
    role,
    body: text,
    is_deleted: false,
    created_at: new Date().toISOString(),
  };

  if (isMockMode()) {
    const list = threadsDb.get(annotationId) || [];
    list.push(row);
    threadsDb.set(annotationId, list);
  } else {
    const { data, error } = await supabase
      .from('annotation_threads')
      .insert({
        annotation_id: annotationId,
        author_id: authorId,
        role,
        body: text,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    Object.assign(row, data);
  }

  const recipients = [...new Set(
    [...notifyUserIds, notifyUserId].filter((id) => id && String(id).length > 0),
  )];
  const notifyBody = role === 'author'
    ? 'The author replied to your review note.'
    : 'A reviewer replied to your feedback thread.';
  for (const recipientId of recipients) {
    await createInAppNotification(recipientId, 'review_thread_reply', {
      body: notifyBody,
      action_url: actionUrl || (role === 'author' ? '/reviewers' : '/reviewers'),
    });
  }

  return row;
}

/**
 * LRC-19-D6 — archive annotations when author resubmits a revision round.
 * Reviewers see prior notes as historical; new manuscript pass starts fresh.
 */
export async function markAnnotationsStaleOnRevision(requestId, revisionRound = 0) {
  const now = new Date().toISOString();
  const staleMeta = {
    stale_reason: 'version_mismatch',
    stale_revision_round: revisionRound,
    stale_at: now,
  };

  if (isMockMode()) {
    const list = annotationsDb.get(requestKey(requestId)) || [];
    let changed = 0;
    for (let i = 0; i < list.length; i += 1) {
      if (list[i].status === 'archived') continue;
      list[i] = {
        ...list[i],
        status: 'archived',
        updated_at: now,
        metadata: { ...(list[i].metadata || {}), ...staleMeta },
      };
      changed += 1;
    }
    if (changed > 0) annotationsDb.set(requestKey(requestId), list);
    return { archived: changed };
  }

  const { data, error } = await supabase
    .from('review_annotations')
    .update({
      status: 'archived',
      updated_at: now,
    })
    .eq('request_id', requestId)
    .neq('status', 'archived')
    .select('id');
  if (error) throw new Error(error.message);
  return { archived: (data || []).length };
}

/** Merge DB annotations into request structured_comments when rows exist. */
export async function hydrateStructuredComments(request) {
  if (!request?.id) return request;
  const dbComments = await listAnnotationsForRequest(request.id, { includeThreads: true });
  if (!dbComments.length) return request;
  return { ...request, structured_comments: dbComments };
}