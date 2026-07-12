/**
 * Moderation case intake — LRC-12-D3/D4 (Wave 3 intake, Wave 4 appeals lifecycle)
 * Legal & Trust: appeals and review disputes require auditable intake.
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import {
  getPeerReviewRequestById,
  markPeerReviewAppealed,
  applyAppealOutcome,
} from './peerReviewStore.js';
import { notifyAppealSubmitted, notifyAppealResolved } from './notificationsStore.js';

const VALID_TYPES = new Set(['review_dispute', 'reviewer_conduct', 'appeal', 'fraud_flag']);
const VALID_STATUSES = new Set(['open', 'investigating', 'resolved', 'dismissed']);
const OPEN_STATUSES = new Set(['open', 'investigating']);

/** @type {object[]} */
const casesDb = [];

function findCase(caseId) {
  return casesDb.find((c) => c.id === caseId) ?? null;
}

export async function createModerationCase(payload = {}) {
  const caseType = String(payload.case_type || payload.caseType || '').trim();
  if (!VALID_TYPES.has(caseType)) {
    throw new Error('case_type must be review_dispute, reviewer_conduct, appeal, or fraud_flag');
  }
  const reason = String(payload.reason || '').trim();
  if (reason.length < 10) throw new Error('Provide a reason (10+ characters)');

  const row = {
    id: randomUUID(),
    case_type: caseType,
    status: 'open',
    reporter_id: payload.reporter_id || payload.reporterId || null,
    subject_id: payload.subject_id || payload.subjectId || null,
    request_id: payload.request_id || payload.requestId || null,
    reason,
    metadata: payload.metadata || {},
    created_at: new Date().toISOString(),
    resolved_at: null,
  };

  if (isMockMode()) {
    casesDb.push(row);
    return row;
  }

  const { data, error } = await supabase
    .from('moderation_cases')
    .insert({
      case_type: row.case_type,
      status: row.status,
      reporter_id: row.reporter_id,
      subject_id: row.subject_id,
      request_id: row.request_id,
      reason: row.reason,
      metadata: row.metadata,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * LRC-12-D4 — author submits appeal against council decision.
 */
export async function submitAppeal({ reporter_id: reporterId, request_id: requestId, reason }) {
  const trimmed = String(reason || '').trim();
  if (trimmed.length < 10) throw new Error('Provide an appeal reason (10+ characters)');

  const request = await getPeerReviewRequestById(requestId);
  if (!request) throw new Error('Review request not found');
  if (request.author_id !== reporterId) throw new Error('Not your review request');
  if (!['decision_ready', 'completed'].includes(request.status)) {
    throw new Error('Appeals are available after the council decision is ready');
  }

  const existing = await listModerationCases({ case_type: 'appeal', request_id: requestId, open_only: true });
  if (existing.length > 0) throw new Error('An appeal is already open for this review');

  const caseRow = await createModerationCase({
    case_type: 'appeal',
    reporter_id: reporterId,
    request_id: requestId,
    reason: trimmed,
    metadata: {
      story_title: request.story_title,
      majority_decision: request.majority_decision ?? null,
    },
  });

  await markPeerReviewAppealed(requestId);
  await notifyAppealSubmitted(reporterId, {
    requestId,
    storyTitle: request.story_title,
    caseId: caseRow.id,
  });

  return caseRow;
}

export async function getModerationCaseById(caseId) {
  if (isMockMode()) {
    const row = findCase(caseId);
    if (!row) throw new Error('Case not found');
    return row;
  }

  const { data, error } = await supabase
    .from('moderation_cases')
    .select('*')
    .eq('id', caseId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Case not found');
  return data;
}

export async function listModerationCases({
  status,
  case_type: caseType,
  request_id: requestId,
  open_only: openOnly = false,
  limit = 50,
} = {}) {
  if (isMockMode()) {
    return casesDb
      .filter((c) => {
        if (openOnly && !OPEN_STATUSES.has(c.status)) return false;
        if (status && c.status !== status) return false;
        if (caseType && c.case_type !== caseType) return false;
        if (requestId && c.request_id !== requestId) return false;
        return true;
      })
      .slice(-limit)
      .reverse();
  }

  let q = supabase
    .from('moderation_cases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (status) q = q.eq('status', status);
  if (caseType) q = q.eq('case_type', caseType);
  if (requestId) q = q.eq('request_id', requestId);
  if (openOnly) q = q.in('status', [...OPEN_STATUSES]);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function assignModerationCase(caseId, moderatorId) {
  if (!moderatorId) throw new Error('moderator_id required');

  if (isMockMode()) {
    const idx = casesDb.findIndex((c) => c.id === caseId);
    if (idx < 0) throw new Error('Case not found');
    if (!OPEN_STATUSES.has(casesDb[idx].status)) {
      throw new Error('Case is already closed');
    }
    casesDb[idx] = {
      ...casesDb[idx],
      status: 'investigating',
      metadata: {
        ...casesDb[idx].metadata,
        assigned_moderator_id: moderatorId,
        assigned_at: new Date().toISOString(),
      },
    };
    return casesDb[idx];
  }

  const existing = await getModerationCaseById(caseId);
  if (!OPEN_STATUSES.has(existing.status)) throw new Error('Case is already closed');

  const { data, error } = await supabase
    .from('moderation_cases')
    .update({
      status: 'investigating',
      metadata: {
        ...(existing.metadata || {}),
        assigned_moderator_id: moderatorId,
        assigned_at: new Date().toISOString(),
      },
    })
    .eq('id', caseId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function resolveModerationCase(caseId, status, notes, moderatorId) {
  if (!['resolved', 'dismissed'].includes(status)) {
    throw new Error('status must be resolved or dismissed');
  }

  const existing = await getModerationCaseById(caseId);
  if (!OPEN_STATUSES.has(existing.status) && existing.status !== 'investigating') {
    throw new Error('Case is already closed');
  }

  const resolutionNotes = notes ? String(notes).trim() : null;
  const metadata = {
    ...(existing.metadata || {}),
    resolution_notes: resolutionNotes,
    resolved_by: moderatorId || null,
  };

  if (isMockMode()) {
    const idx = casesDb.findIndex((c) => c.id === caseId);
    if (idx < 0) throw new Error('Case not found');
    casesDb[idx] = {
      ...casesDb[idx],
      status,
      metadata,
      resolved_at: new Date().toISOString(),
    };
    await applyAppealSideEffects(casesDb[idx], status);
    return casesDb[idx];
  }

  const { data, error } = await supabase
    .from('moderation_cases')
    .update({
      status,
      metadata,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', caseId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  await applyAppealSideEffects(data, status);
  return data;
}

async function applyAppealSideEffects(caseRow, status) {
  if (caseRow.case_type !== 'appeal' || !caseRow.request_id) return;

  const outcome = status === 'resolved' ? 'upheld' : 'dismissed';
  await applyAppealOutcome(caseRow.request_id, outcome);

  if (caseRow.reporter_id) {
    const request = await getPeerReviewRequestById(caseRow.request_id);
    await notifyAppealResolved(caseRow.reporter_id, {
      requestId: caseRow.request_id,
      storyTitle: request?.story_title || caseRow.metadata?.story_title,
      caseId: caseRow.id,
      outcome,
    });
  }
}