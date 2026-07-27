/**
 * Format Spec v1 content-type surface tests.
 */
import { describe, it, expect } from 'vitest';
import {
  discoveryFormatFromPublishedChapters,
  softWordTargetForContentType,
  DISCOVERY_SERIALIZED_CHAPTER_FLOOR,
  getContentTypeDef,
} from './content-types';

describe('content format specs (v1)', () => {
  it('serialized soft target is 1500–2500 with hard max 3000', () => {
    expect(softWordTargetForContentType('serialized_story')).toEqual({
      min: 1500,
      max: 2500,
      hardMax: 3000,
    });
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
