/** Phone / WhatsApp settings for edge functions — env overrides (migration 013). */

export type PhoneConfig = {
  country_code: string;
  dial_prefix: string;
  national_length: number;
  mobile_leading_pattern: string;
  example_e164: string;
  whatsapp_business_number: string;
  region_label: string;
};

const DEFAULTS: PhoneConfig = {
  country_code: '91',
  dial_prefix: '+91',
  national_length: 10,
  mobile_leading_pattern: '[6-9]',
  example_e164: '+919876543210',
  whatsapp_business_number: '919876543210',
  region_label: 'Indian',
};

function parseEnvInt(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function parseEnvString(name: string, fallback: string): string {
  const raw = Deno.env.get(name);
  return raw?.trim() ? raw.trim() : fallback;
}

export function getPhoneConfig(): PhoneConfig {
  const country_code = parseEnvString('PHONE_COUNTRY_CODE', DEFAULTS.country_code).replace(/\D/g, '');
  return {
    country_code,
    dial_prefix: `+${country_code}`,
    national_length: parseEnvInt('PHONE_NATIONAL_LENGTH', DEFAULTS.national_length),
    mobile_leading_pattern: parseEnvString(
      'PHONE_MOBILE_LEADING_PATTERN',
      DEFAULTS.mobile_leading_pattern,
    ),
    example_e164: parseEnvString('PHONE_EXAMPLE_E164', DEFAULTS.example_e164),
    whatsapp_business_number: parseEnvString(
      'WHATSAPP_BUSINESS_NUMBER',
      DEFAULTS.whatsapp_business_number,
    ).replace(/\D/g, ''),
    region_label: parseEnvString('PHONE_REGION_LABEL', DEFAULTS.region_label),
  };
}

export function buildMobileRegex(cfg: PhoneConfig = getPhoneConfig()): RegExp {
  const trailingDigits = Math.max(0, cfg.national_length - 1);
  const body = `${cfg.mobile_leading_pattern}\\d{${trailingDigits}}`;
  return new RegExp(`^\\+${cfg.country_code}${body}$`);
}

export function normalizePhone(input: string, cfg: PhoneConfig = getPhoneConfig()): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === cfg.national_length) return `${cfg.dial_prefix}${digits}`;
  if (digits.length === cfg.national_length + cfg.country_code.length && digits.startsWith(cfg.country_code)) {
    return `+${digits}`;
  }
  if (input.startsWith('+')) return input;
  return digits ? `+${digits}` : cfg.dial_prefix;
}

export function normalizeWhatsAppRecipient(phone: string, cfg: PhoneConfig = getPhoneConfig()): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === cfg.national_length) return `${cfg.country_code}${digits}`;
  if (digits.startsWith(cfg.country_code) && digits.length === cfg.national_length + cfg.country_code.length) {
    return digits;
  }
  return digits;
}

export function toE164FromWhatsAppDigits(sender: string, cfg: PhoneConfig = getPhoneConfig()): string {
  const digits = sender.replace(/\D/g, '');
  if (digits.startsWith(cfg.country_code)) return `+${digits}`;
  return `+${cfg.country_code}${digits}`;
}