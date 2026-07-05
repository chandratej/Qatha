import { describe, it, expect } from 'vitest';
import { applyPhoneticToTrailingWord } from './phoneticText';

describe('phoneticText (V2 §7 title fields)', () => {
  it('converts trailing roman word on space', () => {
    const result = applyPhoneticToTrailingWord('amma ');
    expect(result).not.toBe('amma ');
    expect(result.length).toBeGreaterThan(0);
  });

  it('leaves non-roman text unchanged', () => {
    expect(applyPhoneticToTrailingWord('అమ్మ')).toBe('అమ్మ');
  });
});