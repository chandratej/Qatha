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

/** Mirrors creator-cms REVIEWER_BADGES + Master Craft */
const REVIEWER_BADGES = [
  { id: 'first_review', label: 'First Review', minReviews: 1 },
  { id: 'plot_specialist', label: 'Plot Specialist', minReviews: 5 },
  { id: 'fast_reviewer', label: 'Fast Reviewer', minReviews: 3 },
  { id: 'mentor', label: 'Mentor', minReviews: 20 },
  { id: 'community_champion', label: 'Community Champion', minReviews: 30 },
  { id: 'master_craft', label: 'Master Craft', minReviews: 15, minRqi: 90 },
];

const COMPLETED_STATUSES = new Set(['submitted', 'validated', 'paid_out']);
const IN_PROGRESS_STATUSES = new Set(['accepted', 'in_review']);

function roundRqi(value) {
  return Math.round(Math.min(100, Math.max(0, Number(value) || 0)));
}

/** Full catalog with earned/locked — never all-unlocked by default */
function badgeStatusesForReviewer(reviewCount, rqi) {
  const wholeRqi = roundRqi(rqi);
  return REVIEWER_BADGES.map((b) => {
    const earned =
      reviewCount >= b.minReviews
      && (b.minRqi == null || wholeRqi >= b.minRqi);
    let unlockHint = `at ${b.minReviews} reviews`;
    if (b.minRqi != null) unlockHint = `at ${b.minReviews} reviews · RQI ${b.minRqi}+`;
    return {
      id: b.id,
      label: b.label,
      earned,
      unlockHint,
      minReviews: b.minReviews,
    };
  });
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

  const poolCount = member?.review_experience_count ?? 0;
  const reviewCount = Math.max(poolCount, completed.length);
  const rqi = roundRqi(member?.rqi ?? 0);

  return {
    slot: reviewerSlot,
    rqi,
    councilLevel: member?.council_level ?? 'candidate',
    reputationTier: member?.reputation_tier ?? 'bronze',
    reviewsCompleted: completed.length,
    reviewsInProgress: inProgress.length,
    invitationsPending: pending.length,
    avgTurnaroundHours,
    acceptanceRate,
    badges: badgeStatusesForReviewer(reviewCount, rqi),
    reviewExperienceCount: reviewCount,
    draftCount: countDraftsInAssignments(assignments),
    overdueCount: overdue.length,
    isAvailable: availability.is_available,
  };
}
