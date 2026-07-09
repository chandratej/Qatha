import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_PHONE_CONFIG,
  buildMobileRegex,
  normalizePhone,
  isValidMobile,
  phoneValidationMessage,
  resetPhoneConfigCache,
} from './phoneConfig';

describe('phoneConfig', () => {
  beforeEach(() => {
    resetPhoneConfigCache();
  });

  it('builds regex from config', () => {
    const regex = buildMobileRegex(DEFAULT_PHONE_CONFIG);
    expect(regex.test(DEFAULT_PHONE_CONFIG.exampleE164)).toBe(true);
    expect(regex.test(`${DEFAULT_PHONE_CONFIG.dialPrefix}1234567890`)).toBe(false);
  });

  it('normalizes national digits to E.164', () => {
    const national = DEFAULT_PHONE_CONFIG.exampleE164.replace(DEFAULT_PHONE_CONFIG.dialPrefix, '');
    expect(normalizePhone(national, DEFAULT_PHONE_CONFIG)).toBe(DEFAULT_PHONE_CONFIG.exampleE164);
  });

  it('validates mobile numbers', () => {
    expect(isValidMobile(DEFAULT_PHONE_CONFIG.exampleE164, DEFAULT_PHONE_CONFIG)).toBe(true);
  });

  it('formats validation message from config', () => {
    expect(phoneValidationMessage(DEFAULT_PHONE_CONFIG)).toContain(DEFAULT_PHONE_CONFIG.regionLabel);
    expect(phoneValidationMessage(DEFAULT_PHONE_CONFIG)).toContain(DEFAULT_PHONE_CONFIG.dialPrefix);
  });
});