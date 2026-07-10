import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getPeerReviewRequests,
  getReviewerPoolSummary,
  requestPeerReview,
} from './platformStore';

const PEER_REVIEWS_KEY = 'katha_peer_review_requests';
const REVIEWER_POOL_KEY = 'katha_reviewer_pool';

function clearStore() {
  localStorage.removeItem(PEER_REVIEWS_KEY);
  localStorage.removeItem(REVIEWER_POOL_KEY);
}

describe('platformStore peer reviews', () => {
  beforeEach(() => clearStore());
  afterEach(() => clearStore());

  it('seeds reviewer pool on first access', () => {
    const summary = getReviewerPoolSummary();
    expect(summary.total).toBeGreaterThanOrEqual(10);
    expect(summary.canFulfill).toBe(true);
    expect(summary.avgRqi).toBeGreaterThan(0);
  });

  it('creates paid peer review request with matched reviewers', () => {
    const { request, payoutEach, matchingAvgScore } = requestPeerReview({
      authorId: 'author-1',
      storyId: 'story-1',
      storyTitle: 'Telugu Romance',
      mode: 'paid',
      packageFeeInr: 149,
      preferredRoles: ['romance_reviewer'],
      professionalRole: 'literary_reviewer',
      storyGenre: 'romance',
      authorTrustLevel: 'emerging',
      authorVerified: true,
      markPaid: true,
    });
    expect(request.reviewers_matched).toBe(3);
    expect(request.payment_status).toBe('paid');
    expect(request.double_blind).toBe(true);
    expect(request.escrow_status).toBe('held');
    expect(matchingAvgScore).toBeGreaterThan(0);
    expect(payoutEach).toBeGreaterThan(0);
    expect(getPeerReviewRequests('author-1')).toHaveLength(1);
  });

  it('creates volunteer review request', () => {
    const { request } = requestPeerReview({
      authorId: 'author-2',
      storyId: 'story-2',
      storyTitle: 'Village Tales',
      mode: 'volunteer',
      packageFeeInr: 0,
    });
    expect(request.mode).toBe('volunteer');
    expect(request.package_fee_inr).toBe(0);
    expect(request.payment_status).toBe('waived');
  });

  it('blocks duplicate active request for same story', () => {
    requestPeerReview({
      authorId: 'author-3',
      storyId: 'story-3',
      storyTitle: 'Once',
      mode: 'volunteer',
      packageFeeInr: 0,
    });
    expect(() => requestPeerReview({
      authorId: 'author-3',
      storyId: 'story-3',
      storyTitle: 'Once',
      mode: 'volunteer',
      packageFeeInr: 0,
    })).toThrow(/already have an active/i);
  });
});