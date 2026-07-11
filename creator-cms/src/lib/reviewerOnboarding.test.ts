import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  applyToReviewerPool,
  completeReviewerTraining,
  loadReviewerOnboarding,
} from './reviewerOnboarding';

describe('reviewerOnboarding', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('applies and certifies reviewer', () => {
    const applied = applyToReviewerPool('user-1', {
      genres: ['romance'],
      languages: ['telugu'],
      motivation: 'I want to help Telugu authors improve their craft with kind notes.',
    });
    expect(applied.status).toBe('applied');
    const certified = completeReviewerTraining('user-1');
    expect(certified.status).toBe('pending_moderation');
    expect(loadReviewerOnboarding('user-1').trainingCompleted).toBe(true);
  });
});