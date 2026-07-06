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

  const secretKey = getSecretKey();
  return (
    !process.env.SUPABASE_URL ||
    process.env.SUPABASE_URL === 'http://placeholder' ||
    process.env.SUPABASE_URL.includes('your-project') ||
    !secretKey ||
    isPlaceholderKey(secretKey)
  );
}