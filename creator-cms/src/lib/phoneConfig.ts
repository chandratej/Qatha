/**
 * Phone / WhatsApp settings — loaded from platform_config with env overrides.
 * No hardcoded numbers in UI or validation logic.
 */
import { supabase } from './supabase';

export type PhoneConfig = {
  countryCode: string;
  dialPrefix: string;
  nationalLength: number;
  mobileLeadingPattern: string;
  exampleE164: string;
  whatsappBusinessNumber: string;
  regionLabel: string;
};

type PhoneConfigRow = {
  country_code?: string;
  national_length?: number;
  mobile_leading_pattern?: string;
  example_e164?: string;
  whatsapp_business_number?: string;
  region_label?: string;
};

export const DEFAULT_PHONE_CONFIG: PhoneConfig = {
  countryCode: '91',
  dialPrefix: '+91',
  nationalLength: 10,
  mobileLeadingPattern: '[6-9]',
  exampleE164: '+919876543210',
  whatsappBusinessNumber: '919876543210',
  regionLabel: 'Indian',
};

let cached: PhoneConfig | null = null;
let loadPromise: Promise<PhoneConfig> | null = null;

function parseEnvInt(name: string, fallback: number): number {
  const raw = import.meta.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function parseEnvString(name: string, fallback: string): string {
  const raw = import.meta.env[name];
  return typeof raw === 'string' && raw.trim() ? raw.trim() : fallback;
}

function rowToConfig(row: PhoneConfigRow): PhoneConfig {
  const countryCode = String(row.country_code ?? DEFAULT_PHONE_CONFIG.countryCode).replace(/\D/g, '');
  const nationalLength = Number(row.national_length) || DEFAULT_PHONE_CONFIG.nationalLength;
  const mobileLeadingPattern =
    row.mobile_leading_pattern?.trim() || DEFAULT_PHONE_CONFIG.mobileLeadingPattern;

  return {
    countryCode,
    dialPrefix: `+${countryCode}`,
    nationalLength,
    mobileLeadingPattern,
    exampleE164: row.example_e164?.trim() || DEFAULT_PHONE_CONFIG.exampleE164,
    whatsappBusinessNumber:
      row.whatsapp_business_number?.replace(/\D/g, '') ||
      DEFAULT_PHONE_CONFIG.whatsappBusinessNumber,
    regionLabel: row.region_label?.trim() || DEFAULT_PHONE_CONFIG.regionLabel,
  };
}

function configFromEnv(): PhoneConfig {
  const countryCode = parseEnvString('VITE_PHONE_COUNTRY_CODE', DEFAULT_PHONE_CONFIG.countryCode)
    .replace(/\D/g, '');
  const nationalLength = parseEnvInt('VITE_PHONE_NATIONAL_LENGTH', DEFAULT_PHONE_CONFIG.nationalLength);
  const mobileLeadingPattern = parseEnvString(
    'VITE_PHONE_MOBILE_LEADING_PATTERN',
    DEFAULT_PHONE_CONFIG.mobileLeadingPattern,
  );
  const exampleE164 = parseEnvString('VITE_PHONE_EXAMPLE_E164', DEFAULT_PHONE_CONFIG.exampleE164);
  const whatsappBusinessNumber = parseEnvString(
    'VITE_WHATSAPP_BUSINESS_NUMBER',
    parseEnvString('VITE_PHONE_WHATSAPP_BUSINESS_NUMBER', DEFAULT_PHONE_CONFIG.whatsappBusinessNumber),
  ).replace(/\D/g, '');
  const regionLabel = parseEnvString('VITE_PHONE_REGION_LABEL', DEFAULT_PHONE_CONFIG.regionLabel);

  return {
    countryCode,
    dialPrefix: `+${countryCode}`,
    nationalLength,
    mobileLeadingPattern,
    exampleE164,
    whatsappBusinessNumber,
    regionLabel,
  };
}

function applyEnvOverrides(base: PhoneConfig): PhoneConfig {
  const env = configFromEnv();
  const hasEnvOverride = Boolean(
    import.meta.env.VITE_PHONE_COUNTRY_CODE ||
      import.meta.env.VITE_PHONE_NATIONAL_LENGTH ||
      import.meta.env.VITE_PHONE_MOBILE_LEADING_PATTERN ||
      import.meta.env.VITE_PHONE_EXAMPLE_E164 ||
      import.meta.env.VITE_WHATSAPP_BUSINESS_NUMBER ||
      import.meta.env.VITE_PHONE_WHATSAPP_BUSINESS_NUMBER ||
      import.meta.env.VITE_PHONE_REGION_LABEL,
  );
  return hasEnvOverride ? { ...base, ...env } : base;
}

export function buildMobileRegex(cfg: PhoneConfig): RegExp {
  const trailingDigits = Math.max(0, cfg.nationalLength - 1);
  const body = `${cfg.mobileLeadingPattern}\\d{${trailingDigits}}`;
  return new RegExp(`^\\+${cfg.countryCode}${body}$`);
}

export function normalizePhone(input: string, cfg: PhoneConfig = getPhoneConfig()): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === cfg.nationalLength) return `${cfg.dialPrefix}${digits}`;
  if (digits.length === cfg.nationalLength + cfg.countryCode.length && digits.startsWith(cfg.countryCode)) {
    return `+${digits}`;
  }
  if (input.startsWith('+')) return input;
  return digits ? `+${digits}` : cfg.dialPrefix;
}

export function isValidMobile(phone: string, cfg: PhoneConfig = getPhoneConfig()): boolean {
  const normalized = normalizePhone(phone, cfg);
  return buildMobileRegex(cfg).test(normalized);
}

export function phoneValidationMessage(cfg: PhoneConfig = getPhoneConfig()): string {
  const mask = `${cfg.dialPrefix}${'X'.repeat(cfg.nationalLength)}`;
  return `Enter a valid ${cfg.regionLabel} mobile number (${mask}).`;
}

export function getPhoneConfig(): PhoneConfig {
  return cached ?? configFromEnv();
}

export async function loadPhoneConfig(): Promise<PhoneConfig> {
  if (cached) return cached;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    let base = configFromEnv();

    try {
      const { data, error } = await supabase
        .from('platform_config')
        .select('value')
        .eq('key', 'phone')
        .maybeSingle();

      if (!error && data?.value) {
        base = rowToConfig(data.value as PhoneConfigRow);
      }
    } catch {
      /* use env / defaults */
    }

    cached = applyEnvOverrides(base);
    return cached;
  })();

  return loadPromise;
}

export function resetPhoneConfigCache() {
  cached = null;
  loadPromise = null;
}