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
import { createInAppNotification, processReviewSlaEscalations, processAcceptSlaEscalations } from './notificationsStore.js';
import { bindAssignmentResolver, clearReviewDraft, hasDraftPayload } from './reviewDraftStore.js';
import {
  persistAnnotationsFromSubmit,
  resolveAnnotation,
  hydrateStructuredComments,
  addThreadReply,
  getAnnotationById,
  listAnnotationsForRequest,
  markAnnotationsStaleOnRevision,
} from './reviewAnnotationStore.js';
import { getReviewerOnboarding } from './reviewerProfileStore.js';
import { appendReputationEvent } from './reputationEventStore.js';
import { appendReviewAnalyticsEvent } from './reviewAnalyticsEventStore.js';

const MAX_REVISION_ROUNDS = 3;
const REVISION_DECISIONS = new Set(['minor_revision', 'major_revision', 'revise']);
const ACCEPT_DECISIONS = new Set(['accept', 'approve', 'approve_with_notes']);

function isRevisionDecision(decision) {
  return REVISION_DECISIONS.has(decision);
}

function isAcceptDecision(decision) {
  return ACCEPT_DECISIONS.has(decision);
}

const REVIEWERS_REQUIRED = REVIEWERS_ASSIGNED_COUNT;
const ACTIVE_ASSIGNMENT_STATUSES = new Set(['accepted', 'in_review', 'submitted', 'validated', 'paid_out']);

const REVIEW_SLA_DAYS = 7;
const ACCEPT_SLA_HOURS = 24;
const SUBMITTED_STATUSES = new Set(['submitted', 'validated', 'paid_out']);

const CANCELLABLE_REQUEST_STATUSES = new Set([
  'pending_payment',
  'matching',
  'awaiting_reviewers',
  'in_review',
  'decision_ready',
  'revision_requested',
  'resubmitted',
]);

const CANCELLABLE_ASSIGNMENT_STATUSES = new Set(['invited', 'accepted', 'in_review']);

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

function acceptDueAt(fromIso = new Date().toISOString()) {
  const d = new Date(fromIso);
  d.setHours(d.getHours() + ACCEPT_SLA_HOURS);
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
    revision_round: row.revision_round ?? meta.revision_round ?? 0,
    revision_notes: row.revision_notes ?? meta.revision_notes ?? null,
    last_resubmitted_at: row.last_resubmitted_at ?? meta.last_resubmitted_at ?? null,
    author_satisfaction_rating: row.author_satisfaction_rating ?? meta.author_satisfaction_rating ?? null,
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
    accept_due_at: row.accept_due_at,
    priority: row.priority,
    review_summary: row.review_summary,
    draft_saved_at: row.draft_saved_at ?? undefined,
    has_draft: hasDraftPayload(row.draft_payload),
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
  await processAcceptSlaEscalations(assignments, resolveUserIdForReviewerSlot);
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
    revision_round: row.revision_round ?? meta.revision_round ?? 0,
    revision_notes: row.revision_notes ?? meta.revision_notes ?? null,
    last_resubmitted_at: row.last_resubmitted_at ?? meta.last_resubmitted_at ?? null,
    author_satisfaction_rating: row.author_satisfaction_rating ?? meta.author_satisfaction_rating ?? null,
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
    revision_round: merged.revision_round,
    revision_notes: merged.revision_notes,
    last_resubmitted_at: merged.last_resubmitted_at,
    author_satisfaction_rating: merged.author_satisfaction_rating,
  };
  const { data, error } = await supabase
    .from('peer_review_requests')
    .update({
      status: merged.status,
      majority_decision: merged.majority_decision,
      structured_comments: merged.structured_comments,
      revision_round: merged.revision_round,
      revision_notes: merged.revision_notes,
      last_resubmitted_at: merged.last_resubmitted_at,
      author_satisfaction_rating: merged.author_satisfaction_rating ?? null,
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

    if (patch.structured_comments?.length) {
      await persistAnnotationsFromSubmit({
        requestId: assignment.request_id,
        assignmentId: assignment.id,
        storyId: normalized.story_id,
        reviewerSlot: assignment.reviewer_slot,
        comments: tagStructuredComments(patch.structured_comments || []),
      });
    }

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
  if (event === 'submit' && from === 'submitted') {
    return assignment;
  }
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
    if (event === 'submit') await clearReviewDraft(assignmentId);
    await appendReviewAnalyticsEvent(`assignment_${event}`, {
      assignment_id: assignmentId,
      request_id: assignment.request_id,
      actor_id: reviewerSlot,
      metadata: { from, to },
    });
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
  if (event === 'submit') await clearReviewDraft(assignmentId);
  await appendReviewAnalyticsEvent(`assignment_${event}`, {
    assignment_id: assignmentId,
    request_id: assignment.request_id,
    actor_id: reviewerSlot,
    metadata: { from, to },
  });
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
  const hydrated = await Promise.all(requests.map((r) => hydrateStructuredComments(r)));
  return hydrated.map((request) => ({
    request,
    submissions: assignments
      .filter((a) => a.request_id === request.id && SUBMITTED_STATUSES.has(a.status))
      .sort((a, b) => (a.submitted_at ?? '').localeCompare(b.submitted_at ?? '')),
  }));
}

function parseThreadMentions(body) {
  const targets = new Set();
  const re = /@(Author|Reviewer)\b/gi;
  let match;
  const text = String(body || '');
  while ((match = re.exec(text)) !== null) {
    const token = match[1]?.toLowerCase();
    if (token === 'author') targets.add('author');
    if (token === 'reviewer') targets.add('reviewer');
  }
  return [...targets];
}

export async function getReviewerFeedbackBundles(reviewerSlot) {
  const assignments = (await listAssignmentsForSlot(reviewerSlot))
    .filter((a) => SUBMITTED_STATUSES.has(a.status))
    .sort((a, b) => (b.submitted_at ?? '').localeCompare(a.submitted_at ?? ''));

  const bundles = [];
  for (const assignment of assignments) {
    const comments = await listAnnotationsForRequest(assignment.request_id, {
      includeThreads: true,
      reviewerSlot,
    });
    if (!comments.length) continue;
    bundles.push({
      assignment,
      comments,
      request_id: assignment.request_id,
      manuscript_label: assignment.manuscript_label,
    });
  }
  return bundles;
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
        accept_due_at: acceptDueAt(now),
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
    accept_due_at: acceptDueAt(now),
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

export async function replyToReviewComment(requestId, userId, commentId, body, role = 'author') {
  const request = await getPeerReviewRequestById(requestId);
  if (!request) throw new Error('Review request not found');

  const annotation = await getAnnotationById(commentId);
  if (!annotation) throw new Error('Comment not found');
  if (annotation.request_id !== requestId) throw new Error('Comment not found on this request');

  if (role === 'author') {
    if (request.author_id !== userId) throw new Error('Not your review request');
  } else if (role === 'reviewer') {
    const onboarding = await getReviewerOnboarding(userId);
    const slot = onboarding.pool_slot;
    if (!slot || annotation.reviewer_slot !== slot) {
      throw new Error('Not your review note');
    }
  }

  const mentions = parseThreadMentions(body);
  const targets = mentions.length
    ? mentions
    : [role === 'author' ? 'reviewer' : 'author'];

  const notifyUserIds = [];
  if (targets.includes('author') && request.author_id) {
    notifyUserIds.push(request.author_id);
  }
  if (targets.includes('reviewer') && annotation.reviewer_slot) {
    const reviewerUserId = await resolveUserIdForReviewerSlot(annotation.reviewer_slot);
    if (reviewerUserId) notifyUserIds.push(reviewerUserId);
  }

  const recipients = [...new Set(notifyUserIds.filter((id) => id !== userId))];

  return addThreadReply({
    annotationId: commentId,
    authorId: userId,
    role,
    body,
    notifyUserIds: recipients,
    actionUrl: role === 'author' ? '/reviewers' : '/reviewers',
  });
}

async function resetAssignmentForRevisionRound(assignmentId) {
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) return null;

  const patch = {
    status: 'accepted',
    review_summary: null,
    submitted_at: null,
  };

  if (isMockMode()) {
    const merged = { ...assignment, ...patch };
    assignmentsDb.set(assignmentId, merged);
    await clearReviewDraft(assignmentId);
    return merged;
  }

  const { data, error } = await supabase
    .from('peer_review_assignments')
    .update(patch)
    .eq('id', assignmentId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  await clearReviewDraft(assignmentId);
  return rowToAssignment(data);
}

/** Test + admin helper — patch request fields without FSM transition */
export async function patchPeerReviewRequest(requestId, patch) {
  return persistRequestUpdate(requestId, patch);
}

export async function acknowledgePeerReviewDecision(requestId, authorId, opts = {}) {
  const request = await getPeerReviewRequestById(requestId);
  if (!request) throw new Error('Review request not found');
  if (request.author_id !== authorId) throw new Error('Not your review request');
  if (request.status !== 'decision_ready') {
    throw new Error('Council decision is not ready to acknowledge');
  }
  if (isRevisionDecision(request.majority_decision)) {
    throw new Error('Council requested revision — resubmit after editing your manuscript');
  }

  const rawRating = opts.satisfaction_rating ?? opts.satisfactionRating;
  let satisfactionRating = null;
  if (rawRating != null) {
    const n = Number(rawRating);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      throw new Error('satisfaction_rating must be an integer from 1 to 5');
    }
    satisfactionRating = n;
  }

  const updated = await persistRequestUpdate(requestId, {
    status: 'completed',
    author_satisfaction_rating: satisfactionRating,
  });
  await logStateTransition({
    entityType: 'peer_review_request',
    entityId: requestId,
    fromState: 'decision_ready',
    toState: 'completed',
    eventName: 'author_acknowledged',
    actorId: authorId,
    metadata: satisfactionRating != null ? { satisfaction_rating: satisfactionRating } : {},
  });
  await appendReputationEvent(authorId, 'review_completed', {
    reason: 'Author acknowledged council decision',
    metadata: { request_id: requestId, decision: request.majority_decision },
    delta_rqi: 1,
  });
  if (satisfactionRating != null) {
    await appendReviewAnalyticsEvent('author_satisfaction_submitted', {
      request_id: requestId,
      actor_id: authorId,
      metadata: {
        satisfaction_rating: satisfactionRating,
        decision: request.majority_decision,
      },
    });
  }
  return updated;
}

export async function resubmitPeerReviewForRevision(requestId, authorId, opts = {}) {
  const request = await getPeerReviewRequestById(requestId);
  if (!request) throw new Error('Review request not found');
  if (request.author_id !== authorId) throw new Error('Not your review request');
  if (request.status !== 'decision_ready') {
    throw new Error('Resubmit only when council decision is ready');
  }
  if (!isRevisionDecision(request.majority_decision)) {
    throw new Error('Resubmit applies when council requests minor or major revision');
  }

  const round = (request.revision_round ?? 0) + 1;
  if (round > MAX_REVISION_ROUNDS) {
    throw new Error(`Maximum ${MAX_REVISION_ROUNDS} revision rounds reached`);
  }

  const revisionNotes = String(opts.revision_notes || opts.revisionNotes || '').trim();
  const now = new Date().toISOString();
  await markAnnotationsStaleOnRevision(requestId, request.revision_round ?? 0);
  const assignments = await listAssignmentsForRequest(requestId);
  const submitted = assignments.filter((a) => SUBMITTED_STATUSES.has(a.status));

  for (const assignment of submitted) {
    await resetAssignmentForRevisionRound(assignment.id);
    const reviewerUserId = await resolveUserIdForReviewerSlot(assignment.reviewer_slot);
    if (reviewerUserId) {
      await createInAppNotification(reviewerUserId, 'review_resubmitted', {
        body: `The author resubmitted "${request.story_title}" for revision round ${round}.`,
        action_url: '/reviewers',
      });
    }
  }

  const archivedComments = {
    round: request.revision_round ?? 0,
    comments: request.structured_comments || [],
    archived_at: now,
  };

  const updated = await persistRequestUpdate(requestId, {
    status: 'in_review',
    revision_round: round,
    revision_notes: revisionNotes || request.revision_notes || null,
    last_resubmitted_at: now,
    reviews_received: 0,
    majority_decision: null,
    consensus_pct: undefined,
    structured_comments: [],
    metadata_archive: archivedComments,
  });

  await logStateTransition({
    entityType: 'peer_review_request',
    entityId: requestId,
    fromState: 'decision_ready',
    toState: 'in_review',
    eventName: 'resubmit',
    actorId: authorId,
    metadata: { revision_round: round },
  });

  await appendReputationEvent(authorId, 'revision_resubmitted', {
    reason: `Revision round ${round} submitted`,
    metadata: { request_id: requestId, round, decision: request.majority_decision },
    delta_rqi: 0.5,
  });

  return updated;
}

export async function resolveAuthorComment(requestId, authorId, commentId, resolution) {
  const request = await getPeerReviewRequestById(requestId);
  if (!request) throw new Error('Review request not found');
  if (request.author_id !== authorId) throw new Error('Not your review request');

  const dbAnnotation = await getAnnotationById(commentId);
  if (dbAnnotation) {
    await resolveAnnotation(commentId, resolution);
    const fresh = await getPeerReviewRequestById(requestId);
    return hydrateStructuredComments(fresh);
  }

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

/** LRC-12-D4 — mark request under independent appeal review */
export async function markPeerReviewAppealed(requestId) {
  const request = await getPeerReviewRequestById(requestId);
  if (!request) throw new Error('Request not found');
  if (request.audit_status === 'appealed') {
    throw new Error('An appeal is already open for this review');
  }
  return persistRequestUpdate(requestId, { audit_status: 'appealed' });
}

/**
 * LRC-12-D4 — close appeal with upheld (flagged) or dismissed (cleared) outcome.
 * @param {'upheld' | 'dismissed'} outcome
 */
export async function applyAppealOutcome(requestId, outcome) {
  const request = await getPeerReviewRequestById(requestId);
  if (!request) throw new Error('Request not found');
  const audit_status = outcome === 'upheld' ? 'flagged' : 'cleared';
  const patch = { audit_status };
  if (outcome === 'upheld' && request.status === 'completed') {
    patch.status = 'decision_ready';
  }
  return persistRequestUpdate(requestId, patch);
}

/**
 * LRC-19-D5 — author withdraws story; cancel active review cycle.
 * Operations: preserve audit history; notify assigned reviewers.
 */
export async function cancelPeerReviewForStoryWithdrawal(requestId, authorId, opts = {}) {
  const request = await getPeerReviewRequestById(requestId);
  if (!request) throw new Error('Review request not found');
  if (request.author_id !== authorId) throw new Error('Not your review request');
  if (request.status === 'cancelled') {
    return { request, cancelled_assignments: [] };
  }
  if (request.status === 'completed') {
    throw new Error('Cannot cancel a completed review');
  }
  if (!CANCELLABLE_REQUEST_STATUSES.has(request.status)) {
    throw new Error(`Cannot cancel request in status ${request.status}`);
  }

  const reason = String(opts.reason || opts.withdrawal_reason || 'story_withdrawn').trim();
  const fromStatus = request.status;
  const assignments = await listAssignmentsForRequest(requestId);
  const cancelledAssignments = [];

  for (const assignment of assignments) {
    if (!CANCELLABLE_ASSIGNMENT_STATUSES.has(assignment.status)) continue;

    const updated = { ...assignment, status: 'cancelled' };
    if (isMockMode()) {
      assignmentsDb.set(assignment.id, updated);
    } else {
      const { error } = await supabase
        .from('peer_review_assignments')
        .update({ status: 'cancelled' })
        .eq('id', assignment.id);
      if (error) throw new Error(error.message);
    }

    cancelledAssignments.push(updated);
    await clearReviewDraft(assignment.id);
    await logStateTransition({
      entityType: 'peer_review_assignment',
      entityId: assignment.id,
      fromState: assignment.status,
      toState: 'cancelled',
      eventName: 'cancel',
      actorId: authorId,
      metadata: { reason, request_id: requestId },
    });

    const reviewerUserId = await resolveUserIdForReviewerSlot(assignment.reviewer_slot);
    if (reviewerUserId) {
      await createInAppNotification(reviewerUserId, 'review_cancelled', {
        body: `Review for "${request.story_title}" was cancelled — the author withdrew the story.`,
        action_url: '/reviewers',
      });
    }
  }

  const updated = await persistRequestUpdate(requestId, {
    status: 'cancelled',
    cancellation_reason: reason,
    cancelled_at: new Date().toISOString(),
  });

  await logStateTransition({
    entityType: 'peer_review_request',
    entityId: requestId,
    fromState: fromStatus,
    toState: 'cancelled',
    eventName: 'cancel',
    actorId: authorId,
    metadata: { reason },
  });

  await appendReviewAnalyticsEvent('review_request_cancelled', {
    request_id: requestId,
    actor_id: authorId,
    metadata: {
      reason,
      assignments_cancelled: cancelledAssignments.length,
      from_status: fromStatus,
    },
  });

  return { request: updated, cancelled_assignments: cancelledAssignments };
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
    accept_due_at: acceptDueAt(now),
    priority: 'standard',
  });
}

bindAssignmentResolver(getAssignmentById);