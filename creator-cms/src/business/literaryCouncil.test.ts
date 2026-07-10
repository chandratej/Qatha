import { describe, expect, it } from 'vitest';
import { checkPaidReviewEligibility, councilLevelForRqi, normalizeStoryGenre } from './literaryCouncil';

describe('literaryCouncil', () => {
  it('requires emerging trust for paid reviews', () => {
    const blocked = checkPaidReviewEligibility({
      verifiedAuthor: true,
      storyTrustLevel: 'foundation',
      totalReaders: 100,
    });
    expect(blocked.eligible).toBe(false);
    expect(blocked.reasons[0]).toMatch(/Story Trust/i);

    const ok = checkPaidReviewEligibility({
      verifiedAuthor: true,
      storyTrustLevel: 'emerging',
      totalReaders: 500,
    });
    expect(ok.eligible).toBe(true);
  });

  it('maps career levels from RQI and volume', () => {
    expect(councilLevelForRqi(95, 60)).toBe('master_reviewer');
    expect(councilLevelForRqi(65, 5)).toBe('certified_reviewer');
  });

  it('normalizes genre slugs', () => {
    expect(normalizeStoryGenre('Science Fiction')).toBe('sci_fi');
  });
});