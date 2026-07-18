import { describe, it, expect } from 'vitest';
import { buildChapterContent } from './versionClient';
import { versionTypeLabel } from './types';

describe('versionClient helpers', () => {
  it('buildChapterContent maps scenes', () => {
    const content = buildChapterContent({
      title: 'Ch 1',
      scenes: [{ id: 'a', title: 'Open', content: '<p>Hi</p>', narrativeFormat: 'novel' }],
    });
    expect(content.title).toBe('Ch 1');
    expect(content.scenes?.[0].id).toBe('a');
    expect(content.scenes?.[0].narrativeFormat).toBe('novel');
  });

  it('versionTypeLabel uses business terms', () => {
    expect(versionTypeLabel('AutoCheckpoint')).toBe('Auto checkpoint');
    expect(versionTypeLabel('Manual', true)).toContain('మాన్యువల్');
  });
});
