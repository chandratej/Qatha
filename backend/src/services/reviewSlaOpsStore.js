/**
 * Operations SLA dashboard — LRC-17-D4 / LRC-11-D8
 * Surfaces assignment SLA breaches and email delivery queue for council admins.
 */

import { listAllAssignments, listPeerReviewRequests } from './peerReviewStore.js';
import {
  getEmailEscalationQueue,
  summarizeEmailDeliveryFsm,
} from '../workers/reviewSlaEmailWorker.js';
import { getReviewAnalyticsSummary } from './reviewAnalyticsEventStore.js';

const REVIEW_WARN_MS = 24 * 60 * 60 * 1000;
const ACCEPT_WARN_MS = 6 * 60 * 60 * 1000;

function classifyAssignment(a, now) {
  const row = {
    assignment_id: a.id,
    request_id: a.request_id,
    reviewer_slot: a.reviewer_slot,
    status: a.status,
    manuscript_label: a.manuscript_label,
    kind: null,
    severity: null,
    due_at: null,
  };

  if (['accepted', 'in_review'].includes(a.status) && a.due_at) {
    const dueMs = Date.parse(a.due_at);
    if (Number.isNaN(dueMs)) return null;
    row.kind = 'review_due';
    row.due_at = a.due_at;
    if (now > dueMs) row.severity = 'overdue';
    else if (dueMs - now <= REVIEW_WARN_MS) row.severity = 'due_soon';
    else return null;
    return row;
  }

  if (a.status === 'invited' && a.accept_due_at) {
    const dueMs = Date.parse(a.accept_due_at);
    if (Number.isNaN(dueMs)) return null;
    row.kind = 'accept_due';
    row.due_at = a.accept_due_at;
    if (now > dueMs) row.severity = 'overdue';
    else if (dueMs - now <= ACCEPT_WARN_MS) row.severity = 'due_soon';
    else return null;
    return row;
  }

  return null;
}

function summarizeEmailQueue(rows) {
  return summarizeEmailDeliveryFsm(rows);
}

export async function getReviewSlaOpsDashboard({ escalationLimit = 30 } = {}) {
  const [requests, assignments] = await Promise.all([
    listPeerReviewRequests(),
    listAllAssignments(),
  ]);
  const titleByRequest = new Map(requests.map((r) => [r.id, r.story_title]));
  const enriched = assignments.map((a) => ({
    ...a,
    manuscript_label: a.manuscript_label || titleByRequest.get(a.request_id) || '',
  }));

  const now = Date.now();
  const escalations = [];
  let reviewOverdue = 0;
  let reviewDueSoon = 0;
  let acceptOverdue = 0;
  let acceptDueSoon = 0;

  for (const a of enriched) {
    const row = classifyAssignment(a, now);
    if (!row) continue;
    if (row.kind === 'review_due') {
      if (row.severity === 'overdue') reviewOverdue += 1;
      else reviewDueSoon += 1;
    } else {
      if (row.severity === 'overdue') acceptOverdue += 1;
      else acceptDueSoon += 1;
    }
    escalations.push(row);
  }

  escalations.sort((x, y) => {
    if (x.severity === y.severity) return Date.parse(x.due_at) - Date.parse(y.due_at);
    return x.severity === 'overdue' ? -1 : 1;
  });

  const activeAssignments = enriched.filter((a) =>
    ['invited', 'accepted', 'in_review'].includes(a.status),
  ).length;
  const breachCount = reviewOverdue + acceptOverdue;
  const breachPct = activeAssignments > 0
    ? Math.round((breachCount / activeAssignments) * 1000) / 10
    : 0;

  const emailRows = getEmailEscalationQueue({ limit: 100 });
  const email_delivery = summarizeEmailQueue(emailRows);
  const analytics = await getReviewAnalyticsSummary({ days: 30 });

  return {
    generated_at: new Date().toISOString(),
    active_assignments: activeAssignments,
    breach_count: breachCount,
    breach_pct: breachPct,
    review_overdue: reviewOverdue,
    review_due_soon: reviewDueSoon,
    accept_overdue: acceptOverdue,
    accept_due_soon: acceptDueSoon,
    email_delivery,
    analytics_summary: analytics,
    escalations: escalations.slice(0, escalationLimit),
  };
}