import { describe, expect, it } from 'vitest';
import { calculateEscrowSplit, canReleaseEscrow } from './escrow';
import { majorityReviewDecision, weightedRubricScore } from './judging';
import { slugifyTag } from './tagWorkflow';
import { reviewerPayoutEach } from './reviewerMatching';
import { badgeForReaders } from '../../../packages/shared/story-badges';

describe('escrow', () => {
  it('splits entry fee into commission and prize pool', () => {
    const split = calculateEscrowSplit({ entryFeeInr: 199 });
    expect(split.grossInr).toBe(199);
    expect(split.prizePoolInr).toBeGreaterThan(0);
    expect(split.platformInr + split.organizerInr + split.taxInr + split.prizePoolInr).toBeCloseTo(199, 1);
  });

  it('requires all release conditions', () => {
    expect(canReleaseEscrow(['contest_completed'])).toBe(false);
    expect(canReleaseEscrow([
      'contest_completed', 'fraud_validation_passed', 'appeal_window_closed', 'winner_confirmed',
    ])).toBe(true);
  });
});

describe('judging', () => {
  it('computes weighted rubric score', () => {
    const score = weightedRubricScore({
      originality: 10, plot: 8, characters: 9, dialogue: 7, language: 9, ending: 8, overall_impact: 9,
    });
    expect(score).toBeGreaterThan(8);
    expect(score).toBeLessThanOrEqual(10);
  });

  it('majority review decision with 3 reviewers', () => {
    expect(majorityReviewDecision(['accept', 'accept', 'minor_revision'])).toBe('accept');
    expect(majorityReviewDecision(['reject', 'major_revision', 'major_revision'])).toBe('major_revision');
  });
});

describe('tags', () => {
  it('slugifies tag labels', () => {
    expect(slugifyTag('Enemies to Lovers')).toBe('enemies_to_lovers');
  });
});

describe('reviewer payouts', () => {
  it('distributes equally after platform cut', () => {
    expect(reviewerPayoutEach(150)).toBeGreaterThan(35);
  });
});

describe('story badges', () => {
  it('maps readers to badge tier', () => {
    expect(badgeForReaders(0)).toBe('incubation');
    expect(badgeForReaders(2500)).toBe('performing');
  });
});