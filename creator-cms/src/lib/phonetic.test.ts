import { describe, it, expect } from 'vitest';
import { phoneticToTelugu, getPhoneticSuggestions } from './phonetic';

describe('phonetic', () => {
  it('converts common roman input to Telugu', () => {
    const result = phoneticToTelugu('amma');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('amma');
  });

  it('returns suggestions for partial roman words', () => {
    const suggestions = getPhoneticSuggestions('nam');
    expect(Array.isArray(suggestions)).toBe(true);
  });
});