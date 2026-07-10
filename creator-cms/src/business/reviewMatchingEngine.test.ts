import { describe, expect, it } from 'vitest';
import { computeMatchingScore, rankAndAssignReviewers, type MatchableReviewer } from './reviewMatchingEngine';

const base: MatchableReviewer = {
  id: 'r1',
  genre_expertise: ['romance', 'fantasy'],
  rqi: 78,
  review_experience_count: 8,
  story_trust_level: 'performing',
  is_available: true,
  conduct_score: 85,
};

describe('reviewMatchingEngine', () => {
  it('scores domain expertise highest for genre match', () => {
    const romance = computeMatchingScore(base, { storyGenre: 'romance', authorTrustLevel: 'emerging' });
    const horror = computeMatchingScore(base, { storyGenre: 'horror', authorTrustLevel: 'emerging' });
    expect(romance).toBeGreaterThan(horror);
  });

  it('assigns top three from invitation batch', () => {
    const pool: MatchableReviewer[] = Array.from({ length: 10 }, (_, i) => ({
      ...base,
      id: `r${i}`,
      rqi: 60 + i,
      is_available: true,
    }));
    const { invited, assigned } = rankAndAssignReviewers(pool, {
      storyGenre: 'romance',
      authorTrustLevel: 'emerging',
    });
    expect(invited.length).toBe(6);
    expect(assigned.length).toBe(3);
    expect(assigned[0]!.matchingScore).toBeGreaterThanOrEqual(assigned[2]!.matchingScore);
  });
});