import { describe, expect, it } from 'vitest';
import { monetizationEligibilityChecklist } from './monetizationEligibility';

describe('monetizationEligibility (Format Spec v1 / BR-002)', () => {
  it('blocks incubation even with chapters', () => {
    const result = monetizationEligibilityChecklist({
      trustLevel: 'incubation',
      publishedChapterCount: 50,
      freeChapterCount: 3,
      qualityChecksPassed: true,
      hasReaderEngagement: true,
      stabilityWindowMet: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.criteria.find((c) => c.id === 'trust')?.met).toBe(false);
  });

  it('blocks performing serial until 50 published units', () => {
    const result = monetizationEligibilityChecklist({
      trustLevel: 'performing',
      contentTypeId: 'serialized_story',
      publishedChapterCount: 49,
      freeChapterCount: 3,
      qualityChecksPassed: true,
      hasReaderEngagement: true,
      stabilityWindowMet: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.criteria.find((c) => c.id === 'unit_gate')?.met).toBe(false);
  });

  it('passes performing serial at 50 units with all criteria', () => {
    const result = monetizationEligibilityChecklist({
      trustLevel: 'performing',
      contentTypeId: 'serialized_story',
      publishedChapterCount: 50,
      freeChapterCount: 3,
      qualityChecksPassed: true,
      hasReaderEngagement: true,
      stabilityWindowMet: true,
    });
    expect(result.eligible).toBe(true);
    expect(result.readerTier.tier).toBe('bronze');
  });

  it('collection monetizes at 5 stories', () => {
    const early = monetizationEligibilityChecklist({
      trustLevel: 'performing',
      contentTypeId: 'short_story_collection',
      publishedChapterCount: 4,
      freeChapterCount: 1,
      qualityChecksPassed: true,
      hasReaderEngagement: true,
      stabilityWindowMet: true,
    });
    expect(early.eligible).toBe(false);

    const ok = monetizationEligibilityChecklist({
      trustLevel: 'performing',
      contentTypeId: 'short_story_collection',
      publishedChapterCount: 5,
      freeChapterCount: 1,
      qualityChecksPassed: true,
      hasReaderEngagement: true,
      stabilityWindowMet: true,
    });
    expect(ok.eligible).toBe(true);
  });

  it('flash fiction never monetizes', () => {
    const result = monetizationEligibilityChecklist({
      trustLevel: 'apex',
      contentTypeId: 'flash_fiction',
      publishedChapterCount: 1,
      freeChapterCount: 1,
      qualityChecksPassed: true,
      hasReaderEngagement: true,
      stabilityWindowMet: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.criteria.find((c) => c.id === 'format')?.met).toBe(false);
  });
});
