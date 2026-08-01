import { describe, it, expect } from 'vitest';
import {
  countWordsInPlainText,
  countWordsInHtml,
  countWordsForPublishGate,
  countPublishWordsInScenes,
} from './wordCount';

describe('wordCount', () => {
  it('counts latin words', () => {
    expect(countWordsInPlainText('hello world', 'en')).toBe(2);
  });

  it('counts from html content', () => {
    expect(countWordsInHtml('<p>ఒక రోజు</p>', 'te')).toBeGreaterThan(0);
  });

  it('publish gate counts whitespace tokens after stripping HTML', () => {
    expect(countWordsForPublishGate('<p>one two three</p>')).toBe(3);
    expect(countWordsForPublishGate('<p>hello&nbsp;world</p>')).toBe(2);
    expect(countWordsForPublishGate('')).toBe(0);
    const html = Array.from({ length: 856 }, (_, i) => `w${i}`).join(' ');
    expect(countWordsForPublishGate(`<p>${html}</p>`)).toBe(856);
    expect(countWordsForPublishGate(`<p>${html}</p>`) >= 800).toBe(true);
  });

  it('publish gate sums scene HTML consistently', () => {
    expect(
      countPublishWordsInScenes([
        { content: '<p>one two</p>' },
        { content: '<p>three four five</p>' },
      ]),
    ).toBe(5);
  });
});