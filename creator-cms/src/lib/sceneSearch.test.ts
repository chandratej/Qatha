import { describe, it, expect } from 'vitest';
import { sceneTitleMatchesQuery } from './sceneSearch';

describe('sceneTitleMatchesQuery', () => {
  it('matches Telugu title when searching with phonetic roman', () => {
    expect(sceneTitleMatchesQuery('అమ్మ', 'amma')).toBe(true);
  });

  it('matches Telugu title when searching with Telugu text', () => {
    expect(sceneTitleMatchesQuery('అమ్మ', 'అమ్మ')).toBe(true);
  });

  it('matches English title with English query', () => {
    expect(sceneTitleMatchesQuery('Opening Scene', 'opening')).toBe(true);
    expect(sceneTitleMatchesQuery('Opening Scene', 'scene')).toBe(true);
  });

  it('returns all scenes when query is empty', () => {
    expect(sceneTitleMatchesQuery('Anything', '')).toBe(true);
    expect(sceneTitleMatchesQuery('Anything', '   ')).toBe(true);
  });
});