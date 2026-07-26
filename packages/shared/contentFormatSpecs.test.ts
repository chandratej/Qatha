/**
 * Run with: npx vitest run packages/shared/contentFormatSpecs.test.ts
 * (from creator-cms or any vitest root that can resolve this path)
 */
import { describe, it, expect } from 'vitest';
import {
  discoveryFormatFromPublishedChapters,
  softWordTargetForContentType,
  DISCOVERY_SERIALIZED_CHAPTER_FLOOR,
  getContentTypeDef,
} from './content-types';

describe('content format specs', () => {
  it('serialized soft target is 800–1500 only', () => {
    expect(softWordTargetForContentType('serialized_story')).toEqual({ min: 800, max: 1500 });
    expect(softWordTargetForContentType('short_story')).toBeNull();
    expect(softWordTargetForContentType('flash_fiction')).toBeNull();
    expect(softWordTargetForContentType('short_story_collection')).toBeNull();
    expect(softWordTargetForContentType('epistolary_chat')).toBeNull();
    expect(softWordTargetForContentType('interactive_branching')).toBeNull();
  });

  it('discovery routes ≥20 as serialized and <20 as collection_eligible', () => {
    expect(DISCOVERY_SERIALIZED_CHAPTER_FLOOR).toBe(20);
    expect(discoveryFormatFromPublishedChapters(20, 'serialized_story')).toBe('serialized');
    expect(discoveryFormatFromPublishedChapters(19, 'serialized_story')).toBe('collection_eligible');
    expect(discoveryFormatFromPublishedChapters(7, 'serialized_story')).toBe('collection_eligible');
    expect(discoveryFormatFromPublishedChapters(1, 'short_story')).toBe('single');
    expect(discoveryFormatFromPublishedChapters(5, 'short_story_collection')).toBe(
      'collection_eligible',
    );
  });

  it('serialized confidence is high; short formats are placeholders', () => {
    expect(getContentTypeDef('serialized_story')?.confidence).toBe('high');
    expect(getContentTypeDef('short_story')?.confidence).toBe('placeholder');
    expect(getContentTypeDef('flash_fiction')?.confidence).toBe('placeholder');
  });
});
