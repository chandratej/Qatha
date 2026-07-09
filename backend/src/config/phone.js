/**
 * Phone / WhatsApp settings — env overrides with platform_config defaults (migration 013).
 */

const DEFAULTS = {
  country_code: '91',
  national_length: 10,
  mobile_leading_pattern: '[6-9]',
  example_e164: '+919876543210',
  whatsapp_business_number: '919876543210',
  region_label: 'Indian',
};

function parseEnvInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function parseEnvString(name, fallback) {
  const raw = process.env[name];
  return typeof raw === 'string' && raw.trim() ? raw.trim() : fallback;
}

export function getPhoneConfig() {
  const countryCode = parseEnvString('PHONE_COUNTRY_CODE', DEFAULTS.country_code).replace(/\D/g, '');
  const nationalLength = parseEnvInt('PHONE_NATIONAL_LENGTH', DEFAULTS.national_length);
  const mobileLeadingPattern = parseEnvString(
    'PHONE_MOBILE_LEADING_PATTERN',
    DEFAULTS.mobile_leading_pattern,
  );
  const exampleE164 = parseEnvString('PHONE_EXAMPLE_E164', DEFAULTS.example_e164);
  const whatsappBusinessNumber = parseEnvString(
    'WHATSAPP_BUSINESS_NUMBER',
    DEFAULTS.whatsapp_business_number,
  ).replace(/\D/g, '');
  const regionLabel = parseEnvString('PHONE_REGION_LABEL', DEFAULTS.region_label);

  return {
    country_code: countryCode,
    dial_prefix: `+${countryCode}`,
    national_length: nationalLength,
    mobile_leading_pattern: mobileLeadingPattern,
    example_e164: exampleE164,
    whatsapp_business_number: whatsappBusinessNumber,
    region_label: regionLabel,
  };
}

export function buildMobileRegex(cfg = getPhoneConfig()) {
  const trailingDigits = Math.max(0, cfg.national_length - 1);
  const body = `${cfg.mobile_leading_pattern}\\d{${trailingDigits}}`;
  return new RegExp(`^\\+${cfg.country_code}${body}$`);
}

export function normalizePhone(input, cfg = getPhoneConfig()) {
  const digits = String(input || '').replace(/\D/g, '');
  if (digits.length === cfg.national_length) return `${cfg.dial_prefix}${digits}`;
  if (digits.length === cfg.national_length + cfg.country_code.length && digits.startsWith(cfg.country_code)) {
    return `+${digits}`;
  }
  if (String(input).startsWith('+')) return String(input);
  return digits ? `+${digits}` : cfg.dial_prefix;
}

export function isValidMobile(phone, cfg = getPhoneConfig()) {
  return buildMobileRegex(cfg).test(normalizePhone(phone, cfg));
}

export function phoneValidationMessage(cfg = getPhoneConfig()) {
  const mask = `${cfg.dial_prefix}${'X'.repeat(cfg.national_length)}`;
  return `Enter a valid ${cfg.region_label} phone number (${mask}).`;
}