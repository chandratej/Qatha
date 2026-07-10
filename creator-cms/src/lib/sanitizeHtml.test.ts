import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from './sanitizeHtml';

describe('sanitizeHtml (Cycle 7 moderation)', () => {
  it('strips script tags', () => {
    const dirty = '<p>Hello</p><script>alert(1)</script>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain('Hello');
    expect(clean.toLowerCase()).not.toContain('script');
  });

  it('keeps basic formatting', () => {
    const html = '<p><strong>Telugu</strong> <em>story</em></p>';
    expect(sanitizeHtml(html)).toContain('strong');
  });
});
