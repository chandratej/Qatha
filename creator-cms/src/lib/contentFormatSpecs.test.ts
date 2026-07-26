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
  it('serialized soft 1500–2500 and hard max 3000', () => {
    expect(SERIALIZED_SOFT_WORD_MIN).toBe(1500);
    expect(SERIALIZED_SOFT_WORD_MAX).toBe(2500);
    expect(SERIALIZED_HARD_WORD_MAX).toBe(3000);
    expect(softWordTargetForContentType('serialized_story')).toEqual({
      min: 1500,
      max: 2500,
      hardMax: 3000,
    });
    expect(softWordTargetForContentType('short_story')).toBeNull();
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
