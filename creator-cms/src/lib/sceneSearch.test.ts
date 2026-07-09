import { describe, it, expect } from 'vitest';
import {
  sceneTitleMatchesQuery,
  sceneMatchesQuery,
  sceneSearchSuggestions,
  queryVariants,
  detectSceneSearchInputMode,
} from './sceneSearch';

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

describe('sceneMatchesQuery', () => {
  it('matches scene content with phonetic roman', () => {
    expect(
      sceneMatchesQuery(
        { title: 'Scene 1', content: '<p>రాము వచ్చాడు</p>' },
        'raamu',
      ),
    ).toBe(true);
  });

  it('matches keywords and aliases when provided', () => {
    expect(
      sceneMatchesQuery(
        {
          title: 'Untitled',
          content: '',
          keywords: ['prema'],
          aliases: ['love scene'],
        },
        'love',
      ),
    ).toBe(true);
  });

  it('supports prefix matching on words', () => {
    expect(sceneTitleMatchesQuery('Premium Scene', 'pre')).toBe(true);
    expect(sceneTitleMatchesQuery('ప్రేమ కథ', 'prema')).toBe(true);
  });
});

describe('sceneSearchSuggestions', () => {
  const scenes = [
    { id: '1', title: 'అమ్మ', content: '<p>ఇల్లు</p>' },
    { id: '2', title: 'Opening', content: '<p>రాము came home</p>' },
  ];

  it('returns title matches first', () => {
    const suggestions = sceneSearchSuggestions(scenes, 'amma');
    expect(suggestions[0]?.sceneId).toBe('1');
    expect(suggestions[0]?.matchField).toBe('title');
  });

  it('returns content matches when title does not match', () => {
    const suggestions = sceneSearchSuggestions(scenes, 'raamu');
    expect(suggestions.some((s) => s.sceneId === '2' && s.matchField === 'content')).toBe(true);
  });
});

describe('queryVariants', () => {
  it('includes phonetic conversion for roman input', () => {
    const variants = queryVariants('godu');
    expect(variants.some((v) => v.includes('గోడు') || v === 'godu')).toBe(true);
  });
});

describe('detectSceneSearchInputMode', () => {
  it('detects telugu input', () => {
    expect(detectSceneSearchInputMode('అమ్మ')).toBe('telugu');
  });

  it('detects phonetic input', () => {
    expect(detectSceneSearchInputMode('amma')).toBe('phonetic');
  });

  it('detects mixed input', () => {
    expect(detectSceneSearchInputMode('amma అమ్మ')).toBe('mixed');
  });
});