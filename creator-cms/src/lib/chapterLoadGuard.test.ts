import { describe, expect, it } from 'vitest';
import { shouldApplyChapterLoad } from './chapterLoadGuard';

describe('shouldApplyChapterLoad', () => {
  it('allows apply for the active in-flight load', () => {
    expect(
      shouldApplyChapterLoad({
        cancelled: false,
        loadGeneration: 2,
        currentGeneration: 2,
        userDirty: false,
      }),
    ).toEqual({ apply: true });
  });

  it('blocks apply when the effect was cancelled', () => {
    expect(
      shouldApplyChapterLoad({
        cancelled: true,
        loadGeneration: 1,
        currentGeneration: 1,
      }),
    ).toEqual({ apply: false, reason: 'cancelled' });
  });

  it('blocks a late gen-N resolve after gen N+1 already won (silent keystroke-loss race)', () => {
    // User already typing under generation 2; generation 1 finishes late.
    expect(
      shouldApplyChapterLoad({
        cancelled: true, // cleanup of gen 1
        loadGeneration: 1,
        currentGeneration: 2,
        userDirty: true,
      }),
    ).toEqual({ apply: false, reason: 'cancelled' });

    // Even if cancelled flag was missed, generation mismatch still blocks.
    expect(
      shouldApplyChapterLoad({
        cancelled: false,
        loadGeneration: 1,
        currentGeneration: 2,
        userDirty: true,
      }),
    ).toEqual({ apply: false, reason: 'stale_generation' });
  });

  it('blocks apply when user already has dirty edits (defense in depth)', () => {
    expect(
      shouldApplyChapterLoad({
        cancelled: false,
        loadGeneration: 3,
        currentGeneration: 3,
        userDirty: true,
      }),
    ).toEqual({ apply: false, reason: 'user_dirty' });
  });
});
