import { describe, expect, it } from 'vitest';
import { deriveLifecycleStage, derivePersona } from './creatorLifecycle';

describe('creatorLifecycle', () => {
  it('derives stage from onboarding signals', () => {
    expect(deriveLifecycleStage({ accountReady: true })).toBe('registered');
    expect(deriveLifecycleStage({ hasStories: true })).toBe('onboarding');
    expect(deriveLifecycleStage({ hasChapters: true })).toBe('first_draft');
    expect(deriveLifecycleStage({ hasPublished: true })).toBe('first_publish');
  });

  it('defaults persona to solo_author', () => {
    expect(derivePersona({})).toBe('solo_author');
    expect(derivePersona({ wantsToReview: true })).toBe('reviewer');
    expect(derivePersona({ wantsToReview: true, hasPublished: true })).toBe('solo_author');
  });
});