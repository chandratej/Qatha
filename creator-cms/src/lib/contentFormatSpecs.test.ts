import { describe, it, expect } from 'vitest';
import {
  discoveryFormatFromPublishedChapters,
  softWordTargetForContentType,
  DISCOVERY_SERIALIZED_CHAPTER_FLOOR,
  SERIALIZED_SOFT_WORD_MIN,
  SERIALIZED_SOFT_WORD_MAX,
  SERIALIZED_HARD_WORD_MAX,
  getContentTypeDef,
} from '../../../packages/shared/content-types';

describe('content format specs', () => {
  it('serialized soft 800–1200 and hard max 1200', () => {
    expect(SERIALIZED_SOFT_WORD_MIN).toBe(800);
    expect(SERIALIZED_SOFT_WORD_MAX).toBe(1200);
    expect(SERIALIZED_HARD_WORD_MAX).toBe(1200);
    expect(softWordTargetForContentType('serialized_story')).toEqual({
      min: 800,
      max: 1200,
      hardMax: 1200,
    });
  });

  it('short story has soft guidance without a hard max', () => {
    // Format Spec: short_story is guided (1k–5k) but not hard-blocked like serialized chapters.
    expect(softWordTargetForContentType('short_story')).toEqual({
      min: 1000,
      max: 5000,
      hardMax: null,
    });
  });

  it('discovery routes ≥20 as serialized', () => {
    expect(DISCOVERY_SERIALIZED_CHAPTER_FLOOR).toBe(20);
    expect(discoveryFormatFromPublishedChapters(20, 'serialized_story')).toBe('serialized');
    expect(discoveryFormatFromPublishedChapters(19, 'serialized_story')).toBe('collection_eligible');
  });

  it('confidence flags match product policy', () => {
    expect(getContentTypeDef('serialized_story')?.confidence).toBe('high');
  });
});
