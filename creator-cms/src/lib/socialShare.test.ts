import { describe, expect, it } from 'vitest';
import { buildShareMessage } from './socialShare';

describe('socialShare (DEC-008)', () => {
  it('builds bilingual WhatsApp-ready message with chapter context', () => {
    const msg = buildShareMessage('లోయ కథ', 'Opening', 1);
    expect(msg).toContain('Opening');
    expect(msg).toContain('Chapter 1');
    expect(msg).toContain('Katha');
    expect(msg).toMatch(/తెలుగు|మనసు/);
    expect(msg).toContain('No ads');
  });

  it('falls back to story title when chapter title missing', () => {
    const msg = buildShareMessage('My Story');
    expect(msg).toContain('My Story');
    expect(msg).not.toContain('Chapter');
  });
});
