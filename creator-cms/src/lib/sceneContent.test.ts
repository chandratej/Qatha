import { describe, it, expect } from 'vitest';
import { sceneHasContent } from './sceneContent';

describe('sceneHasContent', () => {
  it('returns false for empty or placeholder', () => {
    expect(sceneHasContent('')).toBe(false);
    expect(sceneHasContent('<p>Start writing…</p>')).toBe(false);
  });

  it('returns true for real content', () => {
    expect(sceneHasContent('<p>అమ్మ</p>')).toBe(true);
  });
});