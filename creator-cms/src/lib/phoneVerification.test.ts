import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeIndianPhone, isValidIndianMobile } from './phoneVerification';
import { generateWhatsAppLink } from './whatsappLinks';
import { DEFAULT_PHONE_CONFIG, resetPhoneConfigCache } from './phoneConfig';

describe('phoneVerification', () => {
  beforeEach(() => {
    resetPhoneConfigCache();
  });

  it('normalizes 10-digit national numbers', () => {
    const example = DEFAULT_PHONE_CONFIG.exampleE164;
    const national = example.replace(DEFAULT_PHONE_CONFIG.dialPrefix, '');
    expect(normalizeIndianPhone(national)).toBe(example);
  });

  it('accepts valid mobile numbers', () => {
    expect(isValidIndianMobile(DEFAULT_PHONE_CONFIG.exampleE164)).toBe(true);
    expect(isValidIndianMobile(`${DEFAULT_PHONE_CONFIG.dialPrefix}1234567890`)).toBe(false);
  });
});

describe('whatsappLinks', () => {
  beforeEach(() => {
    resetPhoneConfigCache();
  });

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