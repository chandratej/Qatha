import { describe, it, expect } from 'vitest';
import { findInChapter, replaceAllInChapter, replaceInSceneContent } from './chapterFind';

const scenes = [
  { id: 's1', title: 'రాముడు వస్తాడు', content: '<p>రాముడు అడవిలో నడుస్తున్నాడు.</p>' },
  { id: 's2', title: 'Another beat', content: '<p>అమ్మ ఇంట్లో ఉంది.</p>' },
];

describe('chapterFind', () => {
  it('finds Telugu text directly', () => {
    const matches = findInChapter(scenes, 'రాము');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((m) => m.field === 'title')).toBe(true);
    expect(matches.some((m) => m.field === 'content')).toBe(true);
  });

  it('finds via English phonetic transliteration', () => {
    const matches = findInChapter(scenes, 'raamu');
    expect(matches.some((m) => m.needle.includes('రాము'))).toBe(true);
  });

  it('finds partial roman input rama against రాముడు', () => {
    const matches = findInChapter(scenes, 'rama');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('replaces a single content match in HTML', () => {
    const match = findInChapter(scenes, 'అమ్మ')[0];
    const next = replaceInSceneContent(scenes[1].content, match, 'తల్లి');
    expect(next).toContain('తల్లి');
    expect(next).not.toContain('అమ్మ');
  });

  it('replace all updates every scene occurrence', () => {
    const next = replaceAllInChapter(scenes, 'rama', 'రామా');
    expect(next[0].title).toContain('రామా');
    expect(next[0].content).toContain('రామా');
  });
});