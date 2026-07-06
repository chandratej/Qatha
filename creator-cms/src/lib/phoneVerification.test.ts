import { describe, it, expect } from 'vitest';
import { normalizeIndianPhone, isValidIndianMobile } from './phoneVerification';
import { generateWhatsAppLink } from './whatsappLinks';

describe('phoneVerification', () => {
  it('normalizes 10-digit Indian numbers', () => {
    expect(normalizeIndianPhone('9876543210')).toBe('+919876543210');
  });

  it('accepts valid Indian mobile', () => {
    expect(isValidIndianMobile('+919876543210')).toBe(true);
    expect(isValidIndianMobile('+911234567890')).toBe(false);
  });
});

describe('whatsappLinks', () => {
  it('generates creator toolkit deep link', () => {
    const url = generateWhatsAppLink('creator', 'abc-123', '9199999999999');
    expect(url).toContain('wa.me/9199999999999');
    expect(url).toContain(encodeURIComponent('CLAIM_TOOLKIT_abc-123'));
  });

  it('generates reader unlock map deep link', () => {
    const url = generateWhatsAppLink('reader', 'story-42', '9199999999999');
    expect(url).toContain(encodeURIComponent('UNLOCK_MAP_story-42'));
  });
});