import type { PeerReviewRequest, ReviewerAssignment } from '../types/platform';
import { REVIEW_PACKAGE } from '../../../packages/shared/reviewer-marketplace';
import { computeStoryQualityIndex, demoSqiFromTrust } from '../business/storyQualityIndex';
import {
  DEV_REVIEW_SEED_VERSION,
  DEV_SANDBOX_RQI,
  markDevSeedApplied,
} from './reviewDevSandbox';

const PEER_REVIEWS_KEY = 'katha_peer_review_requests';
const REVIEWER_ASSIGNMENTS_KEY = 'katha_reviewer_assignments';
const REVIEWER_POOL_KEY = 'katha_reviewer_pool';
const REVIEWER_SLOT_KEY = 'katha_reviewer_slot';

export interface ReviewDevSeedResult {
  requestId: string;
  assignmentId: string;
  reviewerSlot: string;
  message: string;
}

function blindLabel(requestId: string): string {
  return `Manuscript #${requestId.slice(-6).toUpperCase()}`;
}

function boostReviewerPool(): void {
  try {
    const raw = localStorage.getItem(REVIEWER_POOL_KEY);
    if (!raw) return;
    const pool = JSON.parse(raw) as Array<Record<string, unknown>>;
    const boosted = pool.map((m, i) => {
      const slot = String(m.pool_slot ?? `slot-${i + 1}`);
      if (slot === 'slot-1') {
        return {
          ...m,
          rqi: DEV_SANDBOX_RQI,
          council_level: 'master_reviewer',
          reputation_tier: 'master',
          review_experience_count: 48,
          conduct_score: 96,
          agreement_score: 91,
          is_available: true,
        };
      }
      return { ...m, is_available: true };
    });
    localStorage.setItem(REVIEWER_POOL_KEY, JSON.stringify(boosted));
  } catch { /* ignore */ }
}

/** Wipe demo review state and plant a ready-to-open assignment for slot-1 */
export function seedReviewDevScenario(authorId = 'dev-author'): ReviewDevSeedResult {
  const now = new Date().toISOString();
  const requestId = `pr-dev-${DEV_REVIEW_SEED_VERSION}-${Date.now().toString(36)}`;
  const assignmentId = `asgn-${requestId}-0`;

  boostReviewerPool();
  localStorage.setItem(REVIEWER_SLOT_KEY, 'slot-1');

  const sqiBefore = computeStoryQualityIndex(demoSqiFromTrust(5200));

  const request: PeerReviewRequest = {
    id: requestId,
    author_id: authorId,
    story_id: 'demo-rrr',
    story_title: 'RRR - రాజమౌళి (Dev Review Demo)',
    package_fee_inr: 0,
    mode: 'volunteer',
    status: 'in_review',
    professional_role: 'literary_reviewer',
    story_genre: 'mythology',
    preferred_roles: [],
    double_blind: true,
    escrow_status: 'none',
    reviews_received: 0,
    reviewers_matched: REVIEW_PACKAGE.reviewerCount,
    matching_avg_score: 88,
    sqi_before: sqiBefore,
    payment_status: 'waived',
    created_at: now,
    audit_status: 'pending',
    fraud_risk_score: 8,
  };

  const manuscriptLabel = blindLabel(requestId);

  const readyAssignment: ReviewerAssignment = {
    id: assignmentId,
    request_id: requestId,
    reviewer_pool_id: 'rev-pool-1',
    reviewer_slot: 'slot-1',
    matching_score: 88,
    status: 'accepted',
    manuscript_label: manuscriptLabel,
    professional_role: 'literary_reviewer',
    story_genre: 'mythology',
    mode: 'volunteer',
    payout_inr: 0,
    invited_at: now,
    accepted_at: now,
  };

  const slot2Assignment: ReviewerAssignment = {
    id: `asgn-${requestId}-1`,
    request_id: requestId,
    reviewer_pool_id: 'rev-pool-2',
    reviewer_slot: 'slot-2',
    matching_score: 82,
    status: 'invited',
    manuscript_label: manuscriptLabel,
    professional_role: 'literary_reviewer',
    story_genre: 'mythology',
    mode: 'volunteer',
    payout_inr: 0,
    invited_at: now,
  };

  const slot3Assignment: ReviewerAssignment = {
    id: `asgn-${requestId}-2`,
    request_id: requestId,
    reviewer_pool_id: 'rev-pool-3',
    reviewer_slot: 'slot-3',
    matching_score: 79,
    status: 'invited',
    manuscript_label: manuscriptLabel,
    professional_role: 'literary_reviewer',
    story_genre: 'mythology',
    mode: 'volunteer',
    payout_inr: 0,
    invited_at: now,
  };

  localStorage.setItem(PEER_REVIEWS_KEY, JSON.stringify([request]));
  localStorage.setItem(
    REVIEWER_ASSIGNMENTS_KEY,
    JSON.stringify([readyAssignment, slot2Assignment, slot3Assignment]),
  );

  markDevSeedApplied();

  return {
    requestId,
    assignmentId,
    reviewerSlot: 'slot-1',
    message: `Dev scenario ready. Slot 1 has an accepted review — open the workspace from Reviewer inbox.`,
  };
}

export function resetReviewDevData(): void {
  try {
    localStorage.removeItem(PEER_REVIEWS_KEY);
    localStorage.removeItem(REVIEWER_ASSIGNMENTS_KEY);
    localStorage.removeItem(REVIEWER_POOL_KEY);
    localStorage.removeItem('katha_review_dev_seed_v');
  } catch { /* ignore */ }
}