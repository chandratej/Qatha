import { describe, expect, it } from 'vitest';
import { extractCharacterNames, suggestNewCharacters } from './characterDetection';

describe('characterDetection', () => {
  it('extracts Telugu names before speech markers', () => {
    const text = 'రాము అన్నాడు "నేను వెళ్తాను." సీత అంది "చూద్దాం."';
    const names = extractCharacterNames(text);
    expect(names).toContain('రాము');
    expect(names).toContain('సీత');
  });

  it('extracts English names before said', () => {
    const text = 'Arjun said hello. Priya replied with a smile.';
    const names = extractCharacterNames(text);
    expect(names.some((n) => n.toLowerCase() === 'arjun')).toBe(true);
    expect(names.some((n) => n.toLowerCase() === 'priya')).toBe(true);
  });

  it('suggests only names not already in cast', () => {
    const text = 'రాము అన్నాడు. లక్ష్మి అన్నది.';
    const suggestions = suggestNewCharacters(text, ['రాము']);
    expect(suggestions).toContain('లక్ష్మి');
    expect(suggestions).not.toContain('రాము');
  });
});