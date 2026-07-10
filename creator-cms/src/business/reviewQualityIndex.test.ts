import { describe, expect, it } from 'vitest';
import { computeReviewQualityIndex } from './reviewQualityIndex';

describe('reviewQualityIndex', () => {
  it('computes weighted RQI', () => {
    const rqi = computeReviewQualityIndex({
      acceptedSuggestionsPct: 80,
      storyImprovementScore: 75,
      readerRetentionImprovementPct: 60,
      editorialAgreementPct: 70,
      authorSatisfactionPct: 85,
      professionalConductPct: 90,
    });
    expect(rqi).toBeGreaterThan(70);
    expect(rqi).toBeLessThanOrEqual(100);
  });
});