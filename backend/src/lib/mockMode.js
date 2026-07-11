import { getSecretKey, isPlaceholderKey } from './supabaseKeys.js';

function parseMockFlag() {
  const flag = (process.env.MOCK_MODE || '').trim().toLowerCase();
  if (['false', '0', 'no'].includes(flag)) return false;
  if (['true', '1', 'yes'].includes(flag)) return true;
  return null;
}

export function isMockMode() {
  const explicit = parseMockFlag();
  if (explicit !== null) return explicit;

  // ARC-02: never auto-enable mock in production/staging (Lean Playbook)
  const nodeEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
  if (nodeEnv === 'production' || nodeEnv === 'staging') return false;

  const secretKey = getSecretKey();
  return (
    !process.env.SUPABASE_URL ||
    process.env.SUPABASE_URL === 'http://placeholder' ||
    process.env.SUPABASE_URL.includes('your-project') ||
    !secretKey ||
    isPlaceholderKey(secretKey)
  );
}