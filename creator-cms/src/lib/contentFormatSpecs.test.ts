import { describe, it, expect } from 'vitest';
import {
  discoveryFormatFromPublishedChapters,
  softWordTargetForContentType,
  hardPublishWordBandForContentType,
  DISCOVERY_SERIALIZED_CHAPTER_FLOOR,
  SERIALIZED_SOFT_WORD_MIN,
  SERIALIZED_SOFT_WORD_MAX,
  SERIALIZED_HARD_WORD_MAX,
  getContentTypeDef,
} from '../../../packages/shared/content-types';

describe('content format specs', () => {
  it('serialized soft 800–1200 and hard max 1200 (never legacy 1500)', () => {
    expect(SERIALIZED_SOFT_WORD_MIN).toBe(800);
    expect(SERIALIZED_SOFT_WORD_MAX).toBe(1200);
    expect(SERIALIZED_HARD_WORD_MAX).toBe(1200);
    expect(SERIALIZED_SOFT_WORD_MIN).toBeLessThan(1500);
    expect(softWordTargetForContentType('serialized_story')).toEqual({
      min: 800,
      max: 1200,
      hardMax: 1200,
    });
    expect(hardPublishWordBandForContentType('serialized_story')).toEqual({
      min: 800,
      max: 1200,
      hardMax: 1200,
    });
    // 856 words must clear the hard publish floor
    expect(856).toBeGreaterThanOrEqual(SERIALIZED_SOFT_WORD_MIN);
    expect(getContentTypeDef('serialized_story')?.softWordTargetMin).toBe(800);
    expect(getContentTypeDef('serialized_story')?.minWordsPerChapter).toBe(800);
  });

  it('short story has soft guidance without a hard publish gate', () => {
    // Format Spec: short_story is guided (1k–5k) but not hard-blocked like serialized chapters.
    expect(softWordTargetForContentType('short_story')).toEqual({
      min: 1000,
      max: 5000,
      hardMax: null,
    });
    expect(hardPublishWordBandForContentType('short_story')).toBeNull();
    expect(hardPublishWordBandForContentType('flash_fiction')).toBeNull();
    expect(hardPublishWordBandForContentType('epistolary_chat')).toBeNull();
  });

  it('null content type defaults hard publish band to serialized', () => {
    expect(hardPublishWordBandForContentType(null)).toEqual({
      min: 800,
      max: 1200,
      hardMax: 1200,
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
