/**
 * Reviewer dashboard stats — Wave 1g
 * Literary Council: RQI + council level surface craft standing.
 * Operations Council: overdueCount drives SLA prioritization.
 * Data Council: acceptance rate + turnaround from persisted assignments only.
 * Lean Playbook: draftCount is client-local (workspace drafts) — server returns 0.
 */

import { listAssignmentsForSlot } from './peerReviewStore.js';
import { findPoolMemberBySlot } from './reviewerPoolStore.js';
import { countDraftsInAssignments } from './reviewDraftStore.js';
import { getReviewerAvailabilityBySlot } from './reviewerProfileStore.js';

/** Mirrors creator-cms/lib/reviewerPoolConstants.ts REVIEWER_BADGES */
const REVIEWER_BADGES = [
  { label: 'First Review', minReviews: 1 },
  { label: 'Plot Specialist', minReviews: 5 },
  { label: 'Fast Reviewer', minReviews: 3 },
  { label: 'Mentor', minReviews: 20 },
  { label: 'Community Champion', minReviews: 30 },
];

const COMPLETED_STATUSES = new Set(['submitted', 'validated', 'paid_out']);
const IN_PROGRESS_STATUSES = new Set(['accepted', 'in_review']);

function badgesForReviewer(reviewCount, rqi) {
  const earned = REVIEWER_BADGES
    .filter((b) => reviewCount >= b.minReviews)
    .map((b) => b.label);
  if (rqi >= 90) earned.push('Master Craft');
  return earned;
}

export async function getReviewerDashboardStats(reviewerSlot) {
  const member = await findPoolMemberBySlot(reviewerSlot);
  const availability = await getReviewerAvailabilityBySlot(reviewerSlot);
  const assignments = await listAssignmentsForSlot(reviewerSlot);

  const completed = assignments.filter((a) => COMPLETED_STATUSES.has(a.status));
  const inProgress = assignments.filter((a) => IN_PROGRESS_STATUSES.has(a.status));
  const pending = assignments.filter((a) => a.status === 'invited');
  const overdue = inProgress.filter((a) => a.due_at && Date.parse(a.due_at) < Date.now());

  const accepted = assignments.filter((a) => a.status !== 'invited' && a.status !== 'declined').length;
  const offered = assignments.filter((a) => a.status !== 'cancelled').length;
  const acceptanceRate = offered > 0 ? Math.round((accepted / offered) * 100) : 0;

  const turnaroundSamples = completed
    .filter((a) => a.accepted_at && a.submitted_at)
    .map((a) => (Date.parse(a.submitted_at) - Date.parse(a.accepted_at)) / 3600000);
  const avgTurnaroundHours = turnaroundSamples.length
    ? Math.round(turnaroundSamples.reduce((s, h) => s + h, 0) / turnaroundSamples.length)
    : 0;

  const rqi = member?.rqi ?? 62;
  const reviewCount = member?.review_experience_count ?? completed.length;

  return {
    slot: reviewerSlot,
    rqi,
    councilLevel: member?.council_level ?? 'certified_reviewer',
    reputationTier: member?.reputation_tier ?? 'bronze',
    reviewsCompleted: completed.length,
    reviewsInProgress: inProgress.length,
    invitationsPending: pending.length,
    avgTurnaroundHours,
    acceptanceRate,
    badges: badgesForReviewer(reviewCount, rqi),
    draftCount: countDraftsInAssignments(assignments),
    overdueCount: overdue.length,
    isAvailable: availability.is_available,
  };
}