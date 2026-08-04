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
  it('serialized soft 1000–1500 with no hard publish gate', () => {
    expect(SERIALIZED_SOFT_WORD_MIN).toBe(1000);
    expect(SERIALIZED_SOFT_WORD_MAX).toBe(1500);
    expect(SERIALIZED_HARD_WORD_MAX).toBeNull();
    expect(softWordTargetForContentType('serialized_story')).toEqual({
      min: 1000,
      max: 1500,
      hardMax: null,
    });
    expect(hardPublishWordBandForContentType('serialized_story')).toBeNull();
    expect(getContentTypeDef('serialized_story')?.softWordTargetMin).toBe(1000);
    expect(getContentTypeDef('serialized_story')?.minWordsPerChapter).toBe(1000);
  });

  it('short story has soft guidance without a hard publish gate', () => {
    expect(softWordTargetForContentType('short_story')).toEqual({
      min: 1000,
      max: 5000,
      hardMax: null,
    });
    expect(hardPublishWordBandForContentType('short_story')).toBeNull();
    expect(hardPublishWordBandForContentType('flash_fiction')).toBeNull();
    expect(hardPublishWordBandForContentType('epistolary_chat')).toBeNull();
  });

  it('null content type has no hard publish band (any length OK)', () => {
    expect(hardPublishWordBandForContentType(null)).toBeNull();
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
