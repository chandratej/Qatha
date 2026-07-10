import { describe, expect, it } from 'vitest';
import { isLikelyOfflineError } from './publishQueue';

describe('publishQueue (DEC-023)', () => {
  it('detects offline-like errors', () => {
    expect(isLikelyOfflineError(new Error('Failed to fetch'))).toBe(true);
    expect(isLikelyOfflineError(new Error('NetworkError when attempting to fetch'))).toBe(true);
    expect(isLikelyOfflineError(new Error('Unauthorized'))).toBe(false);
  });
});
