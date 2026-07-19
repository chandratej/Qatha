import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPeerReviewRequests,
  getReviewerAssignmentsForSlot,
  prepareReviewRequest,
  requestPeerReview,
} from './platformStore';
import { seedReviewDevScenario } from './seedReviewDevData';

vi.mock('./reviewDevSandbox', () => ({
  isReviewDevSandbox: () => true,
  DEV_REVIEW_SEED_VERSION: 3,
  markDevSeedApplied: vi.fn(),
  DEV_SANDBOX_RQI: 94,
}));

const KEYS = [
  'katha_peer_review_requests',
  'katha_reviewer_pool',
  'katha_reviewer_assignments',
  'katha_reviewer_slot',
];

function clearAll() {
  for (const k of KEYS) localStorage.removeItem(k);
}

describe('platformStore dev review requests', () => {
  beforeEach(() => clearAll());
  afterEach(() => clearAll());

  it('can request community review after dev seed for same manuscript', async () => {
    seedReviewDevScenario('author-dev');

    expect(getReviewerAssignmentsForSlot('slot-1').length).toBeGreaterThan(0);

    prepareReviewRequest('author-dev', 'demo-valley-te');

    const { request } = requestPeerReview({
      authorId: 'author-dev',
      storyId: 'demo-valley-te',
      storyTitle: 'Before the Monsoon Demo',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'mythology',
    });

    expect(request.reviewers_matched).toBe(3);
    expect(getPeerReviewRequests('author-dev').length).toBe(1);
    expect(getReviewerAssignmentsForSlot('slot-1').some((a) => a.status === 'invited')).toBe(true);
  });

  it('can request on distinct dev manuscripts back-to-back', () => {
    requestPeerReview({
      authorId: 'author-dev',
      storyId: 'dev-ms-monsoon',
      storyTitle: 'Monsoon',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'romance',
    });
    prepareReviewRequest('author-dev', 'dev-ms-hillfort');
    const { request } = requestPeerReview({
      authorId: 'author-dev',
      storyId: 'dev-ms-hillfort',
      storyTitle: 'Hill Fort',
      mode: 'volunteer',
      packageFeeInr: 0,
      storyGenre: 'mythology',
    });
    expect(request.story_id).toBe('dev-ms-hillfort');
    expect(getPeerReviewRequests('author-dev').length).toBe(2);
  });
});