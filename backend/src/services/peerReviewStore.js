/**
 * Peer review persistence — ARC-01 Wave 1
 * Mock: in-memory; Production: Supabase migration 014 + 017
 */

import { randomUUID } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { isMockMode } from '../lib/mockMode.js';
import { logStateTransition } from './transitionLog.js';
import {
  REVIEWERS_ASSIGNED_COUNT,
  matchReviewersForRequest,
  normalizeStoryGenre,
  platformFeeFromReview,
  poolAvailabilitySummary,
  reviewerPayoutEach,
  validateReviewRequest,
} from './reviewerMatching.js';
import { computeReviewConsensus } from './reviewConsensus.js';
import { loadReviewerPool, findPoolMemberBySlot } from './reviewerPoolStore.js';
import { createInAppNotification, processReviewSlaEscalations } from './notificationsStore.js';

const REVIEWERS_REQUIRED = REVIEWERS_ASSIGNED_COUNT;
const ACTIVE_ASSIGNMENT_STATUSES = new Set(['accepted', 'in_review', 'submitted', 'validated', 'paid_out']);

const REVIEW_SLA_DAYS = 7;
const SUBMITTED_STATUSES = new Set(['submitted', 'validated', 'paid_out']);

function blindManuscriptLabel(requestId) {
  return `Manuscript #${String(requestId).slice(-6).toUpperCase()}`;
}

async function assertAuthorOwnsStory(authorId, storyId) {
  if (isMockMode()) return true;
  const { data, error } = await supabase.from('stories').select('author_id').eq('id', storyId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.author_id !== authorId) throw new Error('Unauthorized for this story');
  return true;
}

/** Mirrors packages/shared/fsm/reviewerAssignment.ts — keep in sync */
const ASSIGNMENT_TRANSITIONS = {
  invited: { accept: 'accepted', decline: 'declined', cancel: 'cancelled' },
  accepted: { open_workspace: 'in_review', cancel: 'cancelled' },
  in_review: { submit: 'submitted', cancel: 'cancelled' },
  submitted: { validate: 'validated' },
  validated: { pay_out: 'paid_out' },
};

function canTransitionAssignment(from, event) {
  return Boolean(ASSIGNMENT_TRANSITIONS[from]?.[event]);
}

function transitionAssignmentStatus(from, event) {
  const next = ASSIGNMENT_TRANSITIONS[from]?.[event];
  if (!next) throw new Error(`Invalid transition: ${from} + ${event}`);
  return next;
}

/** @type {Map<string, object>} */
const requestsDb = new Map();
/** @type {Map<string, object>} */
const assignmentsDb = new Map();

function slaDueAt(fromIso = new Date().toISOString()) {
  const d = new Date(fromIso);
  d.setDate(d.getDate() + REVIEW_SLA_DAYS);
  return d.toISOString();
}

function rowToRequest(row) {
  const meta = row.metadata || {};
  return {
    id: row.id,
    author_id: row.author_id,
    story_id: row.story_id,
    story_title: row.story_title || meta.story_title || 'Untitled',
    package_fee_inr: row.package_fee_inr,
    mode: row.mode,
    status: row.status,
    professional_role: meta.professional_role || 'community_reviewer',
    story_genre: row.story_genre || meta.story_genre || 'general',
    preferred_roles: meta.preferred_roles || [],
    double_blind: meta.double_blind !== false,
    escrow_status: meta.escrow_status || 'none',
    majority_decision: row.majority_decision,
    reviews_received: meta.reviews_received || 0,
    reviewers_matched: meta.reviewers_matched || 0,
    structured_comments: row.structured_comments || [],
    created_at: row.created_at,
    payment_status: meta.payment_status || 'waived',
  };
}

function rowToAssignment(row) {
  return {
    id: row.id,
    request_id: row.request_id,
    reviewer_pool_id: row.reviewer_id || row.reviewer_slot,
    reviewer_id: row.reviewer_id ?? undefined,
    reviewer_slot: row.reviewer_slot,
    matching_score: Number(row.matching_score) || 0,
    status: row.status,
    manuscript_label: row.manuscript_label,
    professional_role: row.professional_role,
    story_genre: row.story_genre,
    mode: row.mode,
    payout_inr: Number(row.payout_inr) || 0,
    invited_at: row.invited_at,
    accepted_at: row.accepted_at,
    submitted_at: row.submitted_at,
    due_at: row.due_at,
    priority: row.priority,
    review_summary: row.review_summary,
  };
}

export async function getPeerReviewRequestById(requestId) {
  if (isMockMode()) {
    return requestsDb.get(requestId) || null;
  }
  const { data, error } = await supabase.from('peer_review_requests').select('*').eq('id', requestId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToRequest(data) : null;
}

export async function listPeerReviewRequests(authorId) {
  if (isMockMode()) {
    const rows = [...requestsDb.values()];
    return authorId ? rows.filter((r) => r.author_id === authorId) : rows;
  }

  let q = supabase.from('peer_review_requests').select('*').order('created_at', { ascending: false });
  if (authorId) q = q.eq('author_id', authorId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data || []).map(rowToRequest);
}

async function resolveUserIdForReviewerSlot(slot) {
  const member = await findPoolMemberBySlot(slot);
  if (!member?.id) return null;
  const id = String(member.id);
  return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

export async function listAssignmentsForSlot(reviewerSlot) {
  let assignments;
  if (isMockMode()) {
    assignments = [...assignmentsDb.values()].filter((a) => a.reviewer_slot === reviewerSlot);
  } else {
    const { data, error } = await supabase
      .from('peer_review_assignments')
      .select('*')
      .eq('reviewer_slot', reviewerSlot)
      .order('invited_at', { ascending: false });
    if (error) throw new Error(error.message);
    assignments = (data || []).map(rowToAssignment);
  }

  await processReviewSlaEscalations(assignments, resolveUserIdForReviewerSlot);
  return assignments;
}

export async function getAssignmentById(assignmentId) {
  if (isMockMode()) {
    return assignmentsDb.get(assignmentId) || null;
  }
  const { data, error } = await supabase
    .from('peer_review_assignments')
    .select('*')
    .eq('id', assignmentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToAssignment(data) : null;
}

async function listAssignmentsForRequest(requestId) {
  if (isMockMode()) {
    return [...assignmentsDb.values()].filter((a) => a.request_id === requestId);
  }
  const { data, error } = await supabase
    .from('peer_review_assignments')
    .select('*')
    .eq('request_id', requestId);
  if (error) throw new Error(error.message);
  return (data || []).map(rowToAssignment);
}

function tagStructuredComments(comments = []) {
  return comments.map((c, i) => ({
    ...c,
    id: c.id ?? `cmt-${Date.now()}-${i}`,
    author_resolution: c.author_resolution ?? 'pending',
  }));
}

function normalizeMockRequest(row) {
  const meta = row.metadata || {};
  return {
    ...row,
    story_title: row.story_title || meta.story_title || 'Untitled',
    professional_role: row.professional_role || meta.professional_role || 'community_reviewer',
    story_genre: row.story_genre || meta.story_genre || 'general',
    preferred_roles: row.preferred_roles || meta.preferred_roles || [],
    double_blind: row.double_blind ?? meta.double_blind !== false,
    escrow_status: row.escrow_status || meta.escrow_status || 'none',
    reviews_received: row.reviews_received ?? meta.reviews_received ?? 0,
    reviewers_matched: row.reviewers_matched ?? meta.reviewers_matched ?? 0,
    payment_status: row.payment_status || meta.payment_status || 'waived',
    consensus_pct: row.consensus_pct ?? meta.consensus_pct,
  };
}

async function persistRequestUpdate(requestId, updates) {
  const request = await getPeerReviewRequestById(requestId);
  if (!request) return null;

  const normalized = isMockMode() ? normalizeMockRequest(request) : request;
  const merged = { ...normalized, ...updates };

  if (isMockMode()) {
    requestsDb.set(requestId, merged);
    return merged;
  }

  const { data: existing, error: fetchErr } = await supabase
    .from('peer_review_requests')
    .select('metadata')
    .eq('id', requestId)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);

  const meta = {
    ...(existing?.metadata || {}),
    reviews_received: merged.reviews_received,
    consensus_pct: merged.consensus_pct,
  };
  const { data, error } = await supabase
    .from('peer_review_requests')
    .update({
      status: merged.status,
      majority_decision: merged.majority_decision,
      structured_comments: merged.structured_comments,
      metadata: meta,
    })
    .eq('id', requestId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return rowToRequest(data);
}

async function syncRequestAfterTransition(assignment, event, patch = {}) {
  const request = await getPeerReviewRequestById(assignment.request_id);
  if (!request) return;

  const rows = await listAssignmentsForRequest(assignment.request_id);
  const normalized = isMockMode() ? normalizeMockRequest(request) : request;

  if (event === 'accept') {
    const active = rows.filter((a) => ACTIVE_ASSIGNMENT_STATUSES.has(a.status)).length;
    if (active >= 1 && normalized.status === 'awaiting_reviewers') {
      await persistRequestUpdate(assignment.request_id, { status: 'in_review' });
    }
    if (normalized.author_id) {
      await createInAppNotification(normalized.author_id, 'review_assigned', {
        body: `A council reviewer accepted your manuscript "${normalized.story_title}".`,
        action_url: `/reviewers/feedback`,
      });
    }
    return;
  }

  if (event === 'submit') {
    const submittedRows = rows.filter((a) => a.status === 'submitted');
    const submitted = submittedRows.length;
    const mergedComments = tagStructuredComments([
      ...(normalized.structured_comments ?? []),
      ...(patch.structured_comments ?? []),
    ]);
    const opinions = submittedRows
      .filter((a) => a.review_summary?.majority_decision)
      .map((a) => ({
        reviewer_slot: a.reviewer_slot,
        decision: a.review_summary.majority_decision,
        confidence: 80,
        summary: a.review_summary.overall_review,
      }));
    const consensus = computeReviewConsensus(opinions);
    const majorityFromPatch = patch.review_summary?.majority_decision
      || patch.majority_decision;

    const updates = {
      structured_comments: mergedComments,
      majority_decision: submitted >= REVIEWERS_REQUIRED
        ? (consensus.majorityDecision ?? majorityFromPatch ?? normalized.majority_decision)
        : (majorityFromPatch ?? normalized.majority_decision),
      reviews_received: submitted,
      status: submitted >= REVIEWERS_REQUIRED ? 'decision_ready' : 'in_review',
      consensus_pct: submitted >= REVIEWERS_REQUIRED ? consensus.consensusPct : undefined,
    };
    await persistRequestUpdate(assignment.request_id, updates);

    if (submitted >= REVIEWERS_REQUIRED && normalized.author_id) {
      await createInAppNotification(normalized.author_id, 'review_consensus_ready', {
        body: `Your manuscript "${normalized.story_title}" has a council decision ready.`,
        action_url: `/reviewers/feedback`,
      });
    }
  }
}

export async function transitionAssignment(assignmentId, reviewerSlot, event, patch = {}) {
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) throw new Error('Assignment not found');
  if (assignment.reviewer_slot !== reviewerSlot) {
    throw new Error('This invitation is assigned to a different reviewer slot');
  }

  const from = assignment.status;
  if (!canTransitionAssignment(from, event)) {
    throw new Error(`Cannot ${event} from status ${from}`);
  }
  const to = transitionAssignmentStatus(from, event);

  const reviewSummary = patch.review_summary
    ?? (patch.majority_decision ? { majority_decision: patch.majority_decision } : assignment.review_summary);

  const updated = {
    ...assignment,
    status: to,
    review_summary: reviewSummary,
    accepted_at: event === 'accept' ? new Date().toISOString() : assignment.accepted_at,
    submitted_at: event === 'submit' ? new Date().toISOString() : assignment.submitted_at,
  };

  if (isMockMode()) {
    assignmentsDb.set(assignmentId, updated);
    await logStateTransition({
      entityType: 'peer_review_assignment',
      entityId: assignmentId,
      fromState: from,
      toState: to,
      eventName: event,
      actorId: reviewerSlot,
    });
    await syncRequestAfterTransition(updated, event, { ...patch, review_summary: reviewSummary });
    return updated;
  }

  const { data, error } = await supabase
    .from('peer_review_assignments')
    .update({
      status: updated.status,
      accepted_at: updated.accepted_at,
      submitted_at: updated.submitted_at,
      review_summary: updated.review_summary,
    })
    .eq('id', assignmentId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  await logStateTransition({
    entityType: 'peer_review_assignment',
    entityId: assignmentId,
    fromState: from,
    toState: to,
    eventName: event,
    metadata: { reviewer_slot: reviewerSlot },
  });
  const result = rowToAssignment(data);
  await syncRequestAfterTransition(result, event, { ...patch, review_summary: reviewSummary });
  return result;
}

export async function listAllAssignments() {
  if (isMockMode()) return [...assignmentsDb.values()];
  const { data, error } = await supabase.from('peer_review_assignments').select('*');
  if (error) throw new Error(error.message);
  return (data || []).map(rowToAssignment);
}

export async function getAuthorReviewFeedback(authorId) {
  const requests = await listPeerReviewRequests(authorId);
  const assignments = await listAllAssignments();
  return requests.map((request) => ({
    request,
    submissions: assignments
      .filter((a) => a.request_id === request.id && SUBMITTED_STATUSES.has(a.status))
      .sort((a, b) => (a.submitted_at ?? '').localeCompare(b.submitted_at ?? '')),
  }));
}

export async function createPeerReviewRequest(authorId, opts) {
  const {
    storyId,
    storyTitle,
    mode,
    packageFeeInr = 0,
    preferredRoles = [],
    professionalRole = 'literary_reviewer',
    storyGenre,
    authorTrustLevel = 'emerging',
    markPaid = true,
  } = opts;

  const fee = mode === 'volunteer' ? 0 : packageFeeInr;
  const genre = normalizeStoryGenre(storyGenre);

  await assertAuthorOwnsStory(authorId, storyId);

  validateReviewRequest({
    storyId,
    storyTitle,
    mode,
    packageFeeInr: fee,
    preferredRoles,
    professionalRole,
    storyGenre: genre,
  });

  const existing = (await listPeerReviewRequests(authorId)).find(
    (r) => r.story_id === storyId && !['completed', 'cancelled'].includes(r.status),
  );
  if (existing) throw new Error('You already have an active review request for this story');

  const pool = await loadReviewerPool();
  const summary = poolAvailabilitySummary(pool);
  if (!summary.canFulfill) {
    throw new Error('Reviewer pool is temporarily thin — try again later or broaden specializations');
  }

  const { assigned, invited } = matchReviewersForRequest(pool, {
    storyGenre: genre,
    authorTrustLevel,
    preferredRoles,
  });
  if (assigned.length < REVIEWERS_ASSIGNED_COUNT) {
    throw new Error('Not enough reviewers match your preferences — try fewer specializations');
  }

  const matchingAvg = Math.round(
    assigned.reduce((s, r) => s + r.matchingScore, 0) / assigned.length,
  );
  const payoutEachInr = reviewerPayoutEach(fee);
  const paid = mode === 'paid' && markPaid;
  const now = new Date().toISOString();

  const requestPayload = {
    author_id: authorId,
    story_id: storyId,
    story_title: storyTitle,
    package_fee_inr: fee,
    mode,
    status: 'awaiting_reviewers',
    story_genre: genre,
    majority_decision: null,
    structured_comments: [],
    metadata: {
      professional_role: professionalRole,
      preferred_roles: preferredRoles,
      double_blind: true,
      escrow_status: paid ? 'held' : 'none',
      reviews_received: 0,
      reviewers_matched: REVIEWERS_ASSIGNED_COUNT,
      matching_avg_score: matchingAvg,
      platform_fee_inr: paid ? platformFeeFromReview(fee) : 0,
      payment_status: mode === 'volunteer' ? 'waived' : paid ? 'paid' : 'pending',
    },
    created_at: now,
  };

  if (isMockMode()) {
    const requestId = randomUUID();
    const request = { id: requestId, ...requestPayload };
    requestsDb.set(requestId, request);

    for (let i = 0; i < invited.length; i++) {
      const inv = invited[i];
      const assignmentId = randomUUID();
      assignmentsDb.set(assignmentId, {
        id: assignmentId,
        request_id: requestId,
        reviewer_pool_id: inv.reviewer.id,
        reviewer_id: /^[0-9a-f-]{36}$/i.test(String(inv.reviewer.id)) ? inv.reviewer.id : null,
        reviewer_slot: inv.reviewer.pool_slot || `slot-${(i % 6) + 1}`,
        matching_score: inv.matchingScore,
        status: 'invited',
        manuscript_label: blindManuscriptLabel(requestId),
        professional_role: professionalRole,
        story_genre: genre,
        mode,
        payout_inr: payoutEachInr,
        invited_at: now,
        due_at: slaDueAt(now),
        priority: mode === 'paid' ? 'premium' : 'standard',
      });
    }

    await logStateTransition({
      entityType: 'peer_review_request',
      entityId: requestId,
      fromState: 'pending_payment',
      toState: 'awaiting_reviewers',
      eventName: 'match_complete',
      actorId: authorId,
    });

    return { request, payoutEach: payoutEachInr, matchingAvgScore: matchingAvg };
  }

  const { data: row, error } = await supabase.from('peer_review_requests').insert({
    author_id: authorId,
    story_id: storyId,
    story_title: storyTitle,
    package_fee_inr: fee,
    mode,
    status: 'awaiting_reviewers',
    story_genre: genre,
    structured_comments: [],
    metadata: requestPayload.metadata,
  }).select('*').single();
  if (error) throw new Error(error.message);

  const requestId = row.id;
  const assignmentRows = invited.map((inv, i) => ({
    request_id: requestId,
    reviewer_id: /^[0-9a-f-]{36}$/i.test(String(inv.reviewer.id)) ? inv.reviewer.id : null,
    reviewer_slot: inv.reviewer.pool_slot || `slot-${(i % 6) + 1}`,
    matching_score: inv.matchingScore,
    status: 'invited',
    manuscript_label: blindManuscriptLabel(requestId),
    professional_role: professionalRole,
    story_genre: genre,
    mode,
    payout_inr: payoutEachInr,
    invited_at: now,
    due_at: slaDueAt(now),
    priority: mode === 'paid' ? 'premium' : 'standard',
  }));

  const { error: aErr } = await supabase.from('peer_review_assignments').insert(assignmentRows);
  if (aErr) throw new Error(aErr.message);

  await logStateTransition({
    entityType: 'peer_review_request',
    entityId: requestId,
    fromState: 'pending_payment',
    toState: 'awaiting_reviewers',
    eventName: 'match_complete',
    actorId: authorId,
  });

  return {
    request: rowToRequest(row),
    payoutEach: payoutEachInr,
    matchingAvgScore: matchingAvg,
  };
}

export async function resolveAuthorComment(requestId, authorId, commentId, resolution) {
  const request = await getPeerReviewRequestById(requestId);
  if (!request) throw new Error('Review request not found');
  if (request.author_id !== authorId) throw new Error('Not your review request');

  const comments = [...(request.structured_comments || [])];
  const idx = comments.findIndex((c) => c.id === commentId);
  if (idx < 0) throw new Error('Comment not found');

  comments[idx] = {
    ...comments[idx],
    author_resolution: resolution ?? 'pending',
    resolved_at: new Date().toISOString(),
  };

  if (isMockMode()) {
    const updated = { ...request, structured_comments: comments };
    requestsDb.set(requestId, updated);
    return updated;
  }

  const { data, error } = await supabase.from('peer_review_requests').update({
    structured_comments: comments,
  }).eq('id', requestId).select('*').single();
  if (error) throw new Error(error.message);
  return rowToRequest(data);
}

/** Seed demo assignments when mock store empty (dev parity with CMS). */
function computeFraudRiskScore(request) {
  let risk = 8;
  if (request.mode === 'paid' && request.package_fee_inr >= 199) risk += 5;
  if ((request.reviewers_matched ?? 0) < 3) risk += 15;
  return Math.min(100, risk);
}

function buildAuditFlags(request) {
  const flags = [];
  if (request.fraud_risk_score && request.fraud_risk_score > 20) flags.push('elevated_risk');
  if (request.escrow_status === 'held' && (request.reviews_received ?? 0) >= 3) {
    flags.push('ready_for_escrow_release');
  }
  if (request.double_blind) flags.push('double_blind_active');
  if (request.mode === 'volunteer') flags.push('community_review');
  return flags;
}

export async function getCouncilAuditQueue() {
  const requests = await listPeerReviewRequests();
  return requests.map((r) => {
    const normalized = isMockMode() ? normalizeMockRequest(r) : r;
    return {
      request_id: normalized.id,
      story_title: normalized.story_title,
      author_id: normalized.author_id,
      status: normalized.status,
      audit_status: normalized.audit_status ?? 'pending',
      fraud_risk_score: normalized.fraud_risk_score ?? computeFraudRiskScore(normalized),
      escrow_status: normalized.escrow_status,
      escrow_inr: normalized.package_fee_inr,
      reviewers_matched: normalized.reviewers_matched,
      reviews_received: normalized.reviews_received,
      double_blind: normalized.double_blind,
      created_at: normalized.created_at,
      flags: buildAuditFlags(normalized),
    };
  });
}

export async function clearCouncilAudit(requestId) {
  const request = await getPeerReviewRequestById(requestId);
  if (!request) throw new Error('Request not found');
  const normalized = isMockMode() ? normalizeMockRequest(request) : request;

  const updates = {
    audit_status: 'cleared',
    fraud_risk_score: Math.max(0, (normalized.fraud_risk_score ?? 10) - 10),
  };
  if (normalized.status === 'decision_ready') {
    updates.status = 'completed';
    updates.escrow_status = normalized.escrow_status === 'held' ? 'released' : normalized.escrow_status;
  }

  if (isMockMode()) {
    const merged = { ...normalized, ...updates };
    requestsDb.set(requestId, merged);
    return merged;
  }

  const { data: existing } = await supabase
    .from('peer_review_requests')
    .select('metadata')
    .eq('id', requestId)
    .maybeSingle();

  const meta = {
    ...(existing?.metadata || {}),
    audit_status: updates.audit_status,
    fraud_risk_score: updates.fraud_risk_score,
    escrow_status: updates.escrow_status,
  };

  const { data, error } = await supabase.from('peer_review_requests').update({
    status: updates.status ?? normalized.status,
    metadata: meta,
  }).eq('id', requestId).select('*').single();
  if (error) throw new Error(error.message);
  return rowToRequest(data);
}

export function seedPeerReviewMockIfEmpty() {
  if (!isMockMode() || requestsDb.size) return;
  const requestId = randomUUID();
  const now = new Date().toISOString();
  const request = {
    id: requestId,
    author_id: 'demo-author',
    story_id: 'demo-story',
    story_title: 'Demo Story',
    package_fee_inr: 149,
    mode: 'volunteer',
    status: 'in_review',
    professional_role: 'community_reviewer',
    story_genre: 'literary',
    preferred_roles: [],
    double_blind: true,
    escrow_status: 'none',
    reviews_received: 0,
    reviewers_matched: 1,
    structured_comments: [],
    created_at: now,
    payment_status: 'waived',
  };
  requestsDb.set(requestId, request);

  const assignmentId = randomUUID();
  assignmentsDb.set(assignmentId, {
    id: assignmentId,
    request_id: requestId,
    reviewer_pool_id: 'pool-1',
    reviewer_slot: 'slot-1',
    matching_score: 82,
    status: 'invited',
    manuscript_label: `Manuscript #${requestId.slice(-6).toUpperCase()}`,
    professional_role: 'community_reviewer',
    story_genre: 'literary',
    mode: 'volunteer',
    payout_inr: 0,
    invited_at: now,
    due_at: slaDueAt(now),
    priority: 'standard',
  });
}