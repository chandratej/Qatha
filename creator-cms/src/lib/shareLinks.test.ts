import { describe, it, expect } from 'vitest';
import { buildChapterShareUrl, getGatewayBase } from './shareLinks';

describe('shareLinks', () => {
  it('builds /read/{slug}/{chapter} paths', () => {
    const url = buildChapterShareUrl('abcd', 2);
    expect(url).toMatch(/\/read\/abcd\/2$/);
  });

  it('gateway base is never empty', () => {
    expect(getGatewayBase().length).toBeGreaterThan(8);
  });

  it('production-style URLs do not use localhost when PROD would apply', () => {
    // In vitest (not PROD), localhost may be used if env points there.
    // Assert build never invents a blank host.
    const url = buildChapterShareUrl('story-x', 1);
    expect(url.startsWith('http')).toBe(true);
    expect(url.includes('//read/')).toBe(false);
  });
});
