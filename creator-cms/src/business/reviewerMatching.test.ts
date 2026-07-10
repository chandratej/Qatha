import { describe, expect, it } from 'vitest';
import {
  filterPoolByRoles,
  poolAvailabilitySummary,
  reviewerPayoutEach,
  seedReviewerPool,
  selectAnonymousReviewers,
  validateReviewRequest,
} from './reviewerMatching';
import { REVIEW_PACKAGE } from '../../../packages/shared/reviewer-marketplace';

describe('reviewerMatching', () => {
  const pool = seedReviewerPool();

  it('seeds a pool with enough available reviewers', () => {
    const summary = poolAvailabilitySummary(pool);
    expect(summary.total).toBeGreaterThanOrEqual(10);
    expect(summary.canFulfill).toBe(true);
    expect(summary.avgRqi).toBeGreaterThan(50);
  });

  it('selects anonymous reviewers without exposing identity count', () => {
    const picked = selectAnonymousReviewers(pool);
    expect(picked).toHaveLength(REVIEW_PACKAGE.reviewerCount);
    expect(new Set(picked.map((r) => r.id)).size).toBe(REVIEW_PACKAGE.reviewerCount);
  });

  it('filters by preferred roles when possible', () => {
    const picked = selectAnonymousReviewers(pool, 3, ['mythology_reviewer']);
    expect(picked.length).toBe(3);
    expect(
      picked.some((r) => r.specializations.includes('mythology_reviewer')),
    ).toBe(true);
  });

  it('computes reviewer payout after platform cut', () => {
    expect(reviewerPayoutEach(150)).toBeGreaterThan(35);
  });

  it('validates review request inputs', () => {
    expect(() => validateReviewRequest({
      storyId: '',
      storyTitle: 'T',
      mode: 'paid',
      packageFeeInr: 149,
      preferredRoles: [],
    })).toThrow(/choose a story/i);

    expect(() => validateReviewRequest({
      storyId: 's1',
      storyTitle: 'T',
      mode: 'paid',
      packageFeeInr: 50,
      preferredRoles: [],
    })).toThrow(/fee must/i);
  });

  it('broadens pool when specialization is too narrow', () => {
    const narrow = filterPoolByRoles(pool, ['editorial_council' as never]);
    expect(narrow.length).toBeGreaterThanOrEqual(REVIEW_PACKAGE.reviewerCount);
  });
});