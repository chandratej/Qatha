import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  applyToReviewerPool,
  completeReviewerTraining,
  loadReviewerOnboarding,
  submitTrialReviewLocal,
} from './reviewerOnboarding';

describe('reviewerOnboarding', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('applies, completes training, then submits trial for moderation', () => {
    const applied = applyToReviewerPool('user-1', {
      genres: ['romance'],
      languages: ['telugu'],
      motivation: 'I want to help Telugu authors improve their craft with kind notes.',
    });
    expect(applied.status).toBe('applied');

    const trained = completeReviewerTraining('user-1');
    expect(trained.status).toBe('training');
    expect(loadReviewerOnboarding('user-1').trainingCompleted).toBe(true);

    const pending = submitTrialReviewLocal('user-1', {
      strengths: 'Strong voice',
      weaknesses: 'Pacing in act two',
      suggestion: 'Tighten the midpoint',
      rubric_scores: { craft: 4, engagement: 4 },
    });
    expect(pending.status).toBe('pending_moderation');
  });
});