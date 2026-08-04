/**
 * Format Spec content-type surface tests.
 */
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
} from './content-types';

describe('content format specs (v1)', () => {
  it('serialized soft target is 1000–1500 with no hard max', () => {
    expect(SERIALIZED_SOFT_WORD_MIN).toBe(1000);
    expect(SERIALIZED_SOFT_WORD_MAX).toBe(1500);
    expect(SERIALIZED_HARD_WORD_MAX).toBeNull();
    expect(softWordTargetForContentType('serialized_story')).toEqual({
      min: 1000,
      max: 1500,
      hardMax: null,
    });
    // Length is never a publish barrier
    expect(hardPublishWordBandForContentType('serialized_story')).toBeNull();
    expect(hardPublishWordBandForContentType(null)).toBeNull();
  });

  it('chat and interactive expose soft word bands', () => {
    expect(softWordTargetForContentType('epistolary_chat')).toEqual({
      min: 200,
      max: 500,
      hardMax: null,
    });
    expect(softWordTargetForContentType('interactive_branching')).toEqual({
      min: 150,
      max: 500,
      hardMax: null,
    });
  });

  it('short story is 1000–5000 across 1–3 parts', () => {
    const def = getContentTypeDef('short_story');
    expect(def?.minWordsPerChapter).toBe(1000);
    expect(def?.maxWordsPerChapter).toBe(5000);
    expect(def?.maxChapters).toBe(3);
    expect(def?.nonMonetized).toBe(true);
  });

  it('collection min publish 3; interactive flash exists', () => {
    expect(getContentTypeDef('short_story_collection')?.minChapters).toBe(3);
    expect(getContentTypeDef('interactive_flash')?.id).toBe('interactive_flash');
    expect(getContentTypeDef('interactive_flash')?.nonMonetized).toBe(true);
  });

  it('discovery routes ≥20 as serialized and <20 as collection_eligible', () => {
    expect(DISCOVERY_SERIALIZED_CHAPTER_FLOOR).toBe(20);
    expect(discoveryFormatFromPublishedChapters(20, 'serialized_story')).toBe('serialized');
    expect(discoveryFormatFromPublishedChapters(19, 'serialized_story')).toBe('collection_eligible');
    expect(discoveryFormatFromPublishedChapters(1, 'short_story')).toBe('single');
    expect(discoveryFormatFromPublishedChapters(1, 'interactive_flash')).toBe('single');
    expect(discoveryFormatFromPublishedChapters(5, 'short_story_collection')).toBe(
      'collection_eligible',
    );
  });

  it('serialized confidence is high', () => {
    expect(getContentTypeDef('serialized_story')?.confidence).toBe('high');
    expect(getContentTypeDef('flash_fiction')?.confidence).toBe('high');
  });
});
