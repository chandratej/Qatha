import { describe, it, expect } from 'vitest';
import { countWordsInPlainText, countWordsInHtml } from './wordCount';

describe('wordCount', () => {
  it('counts latin words', () => {
    expect(countWordsInPlainText('hello world', 'en')).toBe(2);
  });

  it('counts from html content', () => {
    expect(countWordsInHtml('<p>ఒక రోజు</p>', 'te')).toBeGreaterThan(0);
  });
});