import { describe, expect, it } from 'vitest';
import { monetizationEligibilityChecklist } from './monetizationEligibility';

describe('monetizationEligibility (BR-002 / DEC-022)', () => {
  it('blocks incubation even with chapters', () => {
    const result = monetizationEligibilityChecklist({
      trustLevel: 'incubation',
      publishedChapterCount: 5,
      freeChapterCount: 3,
      qualityChecksPassed: true,
      hasReaderEngagement: true,
      stabilityWindowMet: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.criteria.find((c) => c.id === 'trust')?.met).toBe(false);
  });

  it('passes performing when all criteria met', () => {
    const result = monetizationEligibilityChecklist({
      trustLevel: 'performing',
      publishedChapterCount: 6,
      freeChapterCount: 3,
      qualityChecksPassed: true,
      hasReaderEngagement: true,
      stabilityWindowMet: true,
    });
    expect(result.eligible).toBe(true);
  });
});
