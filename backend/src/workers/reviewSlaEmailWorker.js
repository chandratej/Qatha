/**
 * Review SLA email worker — LRC-11-D7 (Wave 4 scaffold)
 * Operations Council: in-app SLA first; email channel queued here until MSG91/outbox ships.
 */

import { isMockMode } from '../lib/mockMode.js';
import { listAllAssignments, listPeerReviewRequests } from '../services/peerReviewStore.js';
import { findPoolMemberBySlot } from '../services/reviewerPoolStore.js';
import {
  processReviewSlaEscalations,
  processAcceptSlaEscalations,
} from '../services/notificationsStore.js';
import { resolveUserEmail, sendMsg91Email } from '../services/msg91Email.js';
import {
  applyEmailDeliveryTransition,
  EMAIL_DELIVERY_MAX_RETRIES,
} from '../services/emailDeliveryFsm.js';

/** @type {object[]} */
const emailQueue = [];

/**
 * Enqueue an email escalation (deduped by assignment + kind).
 * @param {{ assignmentId: string, userId: string, kind: 'review_due' | 'accept_due', body: string }} entry
 */
export function enqueueEmailEscalation(entry) {
  const dedupeKey = `${entry.assignmentId}:${entry.kind}`;
  if (emailQueue.some((q) => q.dedupe_key === dedupeKey)) return null;

  const row = {
    id: `email-${Date.now()}-${emailQueue.length}`,
    dedupe_key: dedupeKey,
    assignment_id: entry.assignmentId,
    user_id: entry.userId,
    kind: entry.kind,
    body: entry.body,
    channel: 'email',
    status: 'queued',
    retry_count: 0,
    created_at: new Date().toISOString(),
    sent_at: null,
    last_error: null,
  };
  emailQueue.unshift(row);
  if (emailQueue.length > 500) emailQueue.length = 500;
  return row;
}

export function getEmailEscalationQueue({ limit = 50, status } = {}) {
  return emailQueue
    .filter((q) => status === undefined || q.status === status)
    .slice(0, limit);
}

/** Re-queue failed deliveries when retries remain (LRC-11-D8). */
export function requeueRetryableEmails() {
  let requeued = 0;
  for (const row of emailQueue) {
    if (row.status !== 'failed') continue;
    if ((row.retry_count ?? 0) >= EMAIL_DELIVERY_MAX_RETRIES) continue;
    Object.assign(row, applyEmailDeliveryTransition(row, 'queued', {
      retry_count: (row.retry_count ?? 0) + 1,
    }));
    requeued += 1;
  }
  return requeued;
}

/** Deliver queued SLA emails via MSG91 (or mock log). */
export async function flushEmailEscalationQueue({ limit = 20 } = {}) {
  requeueRetryableEmails();
  const pending = emailQueue.filter((q) => q.status === 'queued').slice(0, limit);
  let sent = 0;
  let failed = 0;

  for (const row of pending) {
    Object.assign(row, applyEmailDeliveryTransition(row, 'sending'));
    const email = await resolveUserEmail(row.user_id);
    const subject = row.kind === 'accept_due'
      ? 'Katha · Review invitation expiring'
      : 'Katha · Manuscript review due soon';
    const result = await sendMsg91Email({ to: email, subject, body: row.body });
    if (result.ok) {
      const terminal = result.skipped ? 'mock_sent' : 'sent';
      Object.assign(row, applyEmailDeliveryTransition(row, terminal, {
        sent_at: new Date().toISOString(),
        message_id: result.messageId,
        last_error: null,
      }));
      sent += 1;
    } else {
      Object.assign(row, applyEmailDeliveryTransition(row, 'failed', {
        last_error: result.reason,
        error: result.reason,
      }));
      failed += 1;
    }
  }

  return { processed: pending.length, sent, failed };
}

export function summarizeEmailDeliveryFsm(rows) {
  const summary = {
    queued: 0,
    sending: 0,
    sent: 0,
    mock_sent: 0,
    failed: 0,
    retry_pending: 0,
    total: rows.length,
  };
  for (const row of rows) {
    if (row.status === 'queued') summary.queued += 1;
    else if (row.status === 'sending') summary.sending += 1;
    else if (row.status === 'sent') summary.sent += 1;
    else if (row.status === 'mock_sent') summary.mock_sent += 1;
    else if (row.status === 'failed') {
      summary.failed += 1;
      if ((row.retry_count ?? 0) < EMAIL_DELIVERY_MAX_RETRIES) summary.retry_pending += 1;
    }
  }
  return summary;
}

async function resolveUserIdForSlot(slot) {
  const member = await findPoolMemberBySlot(slot);
  return member?.user_id ?? null;
}

async function collectAssignments() {
  const [requests, assignments] = await Promise.all([
    listPeerReviewRequests(),
    listAllAssignments(),
  ]);
  const titleByRequest = new Map(requests.map((r) => [r.id, r.story_title]));
  return assignments.map((a) => ({
    ...a,
    manuscript_label: a.manuscript_label || titleByRequest.get(a.request_id) || '',
  }));
}

/**
 * Run SLA scan: in-app notifications + email queue scaffold.
 * Email delivery is logged only until outbox worker ships (Lean Playbook).
 */
export async function runReviewSlaEmailWorker() {
  const assignments = await collectAssignments();
  const reviewEscalated = await processReviewSlaEscalations(assignments, resolveUserIdForSlot);
  const acceptEscalated = await processAcceptSlaEscalations(assignments, resolveUserIdForSlot);

  let enqueued = 0;
  for (const assignmentId of reviewEscalated) {
    const a = assignments.find((row) => row.id === assignmentId);
    if (!a) continue;
    const userId = a.reviewer_id || await resolveUserIdForSlot(a.reviewer_slot);
    if (!userId) continue;
    const row = enqueueEmailEscalation({
      assignmentId: a.id,
      userId,
      kind: 'review_due',
      body: `SLA reminder: manuscript ${a.manuscript_label || ''} requires action.`,
    });
    if (row) enqueued += 1;
  }

  for (const assignmentId of acceptEscalated) {
    const a = assignments.find((row) => row.id === assignmentId);
    if (!a) continue;
    const userId = a.reviewer_id || await resolveUserIdForSlot(a.reviewer_slot);
    if (!userId) continue;
    const row = enqueueEmailEscalation({
      assignmentId: a.id,
      userId,
      kind: 'accept_due',
      body: `Accept SLA: invitation for ${a.manuscript_label || 'a manuscript'} requires response.`,
    });
    if (row) enqueued += 1;
  }

  const delivery = await flushEmailEscalationQueue();
  const mode = isMockMode() ? 'mock' : 'production';
  if (enqueued > 0 || delivery.sent > 0) {
    console.log(
      `[reviewSlaEmailWorker] ${mode}: queued ${enqueued}, delivered ${delivery.sent}, failed ${delivery.failed}`,
    );
  }

  return {
    review_escalated: reviewEscalated.length,
    accept_escalated: acceptEscalated.length,
    email_enqueued: enqueued,
    email_delivered: delivery.sent,
    email_failed: delivery.failed,
    queue_depth: emailQueue.filter((q) => q.status === 'queued').length,
  };
}