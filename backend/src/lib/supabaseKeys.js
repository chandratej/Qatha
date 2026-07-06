/** Resolve Supabase API keys — publishable/secret (current) with legacy anon/service_role fallback. */

function getKeyFromJsonEnv(envName, name = 'default') {
  const raw = process.env[envName];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed[name] ?? parsed.default ?? null;
    }
  } catch {
    // Plain string in local .env — not a JSON key map.
  }
  return null;
}

export function getPublishableKey(name = 'default') {
  return (
    getKeyFromJsonEnv('SUPABASE_PUBLISHABLE_KEYS', name) ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  );
}

export function getSecretKey(name = 'default') {
  return (
    getKeyFromJsonEnv('SUPABASE_SECRET_KEYS', name) ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  );
}

export function isPlaceholderKey(key) {
  if (!key) return true;
  return (
    key.includes('your-') ||
    key === 'your-anon-key' ||
    key === 'your-anon-key-here' ||
    key === 'your-publishable-key' ||
    key === 'your-publishable-key-here' ||
    key === 'your-service-role-key' ||
    key === 'your-secret-key'
  );
}