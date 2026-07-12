/**
 * Review workspace draft persistence — LRC-ARC-01 Wave 2a
 * Literary Council: server drafts protect craft work across devices.
 * Security: only active assignments; immutable after submit.
 */

import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';

const EDITABLE_STATUSES = new Set(['accepted', 'in_review']);
const IMMUTABLE_STATUSES = new Set(['submitted', 'validated', 'paid_out']);

/** @type {Map<string, { payload: object, saved_at: string }>} */
const mockDrafts = new Map();

let getAssignmentByIdFn = null;

/** Avoid circular import with peerReviewStore */
export function bindAssignmentResolver(fn) {
  getAssignmentByIdFn = fn;
}

async function resolveAssignment(assignmentId) {
  if (!getAssignmentByIdFn) {
    throw new Error('Assignment resolver not initialized');
  }
  return getAssignmentByIdFn(assignmentId);
}

function assertEditable(assignment, reviewerSlot) {
  if (assignment.reviewer_slot !== reviewerSlot) {
    throw new Error('This invitation is assigned to a different reviewer slot');
  }
  if (IMMUTABLE_STATUSES.has(assignment.status)) {
    throw new Error('Submitted reviews cannot be edited');
  }
  if (!EDITABLE_STATUSES.has(assignment.status)) {
    throw new Error('Open the review workspace after accepting the invitation');
  }
}

export function hasDraftPayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  const comments = payload.comments;
  const summary = payload.summary;
  if (Array.isArray(comments) && comments.length > 0) return true;
  if (summary && typeof summary === 'object') {
    return Boolean(
      summary.overallReview?.trim()
      || summary.strengths?.trim()
      || summary.weaknesses?.trim()
      || summary.recommendation?.trim()
      || summary.decision,
    );
  }
  return false;
}

export async function getReviewDraft(assignmentId, reviewerSlot) {
  const assignment = await resolveAssignment(assignmentId);
  if (!assignment) throw new Error('Assignment not found');
  if (assignment.reviewer_slot !== reviewerSlot) {
    throw new Error('This invitation is assigned to a different reviewer slot');
  }

  if (isMockMode()) {
    const row = mockDrafts.get(assignmentId);
    return {
      draft: row?.payload ?? null,
      saved_at: row?.saved_at ?? null,
      assignment_status: assignment.status,
    };
  }

  const { data, error } = await supabase
    .from('peer_review_assignments')
    .select('draft_payload, draft_saved_at, status')
    .eq('id', assignmentId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  return {
    draft: data?.draft_payload ?? null,
    saved_at: data?.draft_saved_at ?? null,
    assignment_status: data?.status ?? assignment.status,
  };
}

export async function saveReviewDraft(assignmentId, reviewerSlot, payload) {
  const assignment = await resolveAssignment(assignmentId);
  if (!assignment) throw new Error('Assignment not found');
  assertEditable(assignment, reviewerSlot);

  const savedAt = new Date().toISOString();

  if (isMockMode()) {
    mockDrafts.set(assignmentId, { payload, saved_at: savedAt });
    return { saved_at: savedAt, has_draft: hasDraftPayload(payload) };
  }

  const { data, error } = await supabase
    .from('peer_review_assignments')
    .update({
      draft_payload: payload,
      draft_saved_at: savedAt,
    })
    .eq('id', assignmentId)
    .select('draft_saved_at')
    .single();
  if (error) throw new Error(error.message);

  return {
    saved_at: data.draft_saved_at,
    has_draft: hasDraftPayload(payload),
  };
}

export async function clearReviewDraft(assignmentId) {
  if (isMockMode()) {
    mockDrafts.delete(assignmentId);
    return;
  }
  await supabase
    .from('peer_review_assignments')
    .update({ draft_payload: null, draft_saved_at: null })
    .eq('id', assignmentId);
}

export function countDraftsInAssignments(assignments) {
  return assignments.filter((a) => {
    if (!EDITABLE_STATUSES.has(a.status)) return false;
    return a.has_draft === true;
  }).length;
}