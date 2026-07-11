import { createClient } from '@supabase/supabase-js';

// Pure Supabase Auth client (katha-auth-architecture-decision_auth.md)
// Creator CMS: register with Google/email; WhatsApp OTP at publish (JIT) via whatsapp-otp hook.
// Readers use Google + email magic link — phone/WhatsApp OTP is JIT at paywall only.
//
// Mock mode (for creator-cms demo without real Supabase):
//   - Set VITE_MOCK_MODE=true, or leave placeholder URL/keys.
//   - OTP is always 123456. No network calls to Supabase.

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://your-project.supabase.co';
const supabasePublishableKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'your-publishable-key';

function isPlaceholderKey(key: string) {
  return !key || key.includes('your-') || key.includes('anon-key');
}

function envFlag(name: string): boolean | null {
  const value = (import.meta.env[name] as string | undefined)?.trim().toLowerCase();
  if (!value) return null;
  if (['true', '1', 'yes'].includes(value)) return true;
  if (['false', '0', 'no'].includes(value)) return false;
  return null;
}

function hasPlaceholderConfig(): boolean {
  return (
    !supabaseUrl ||
    supabaseUrl.includes('your-project') ||
    supabaseUrl === 'https://your-project.supabase.co' ||
    supabaseUrl.includes('placeholder') ||
    isPlaceholderKey(supabasePublishableKey)
  );
}

const explicitMock = envFlag('VITE_MOCK_MODE');
/** ARC-02: production builds never auto-fallback to mock */
export const isMockMode =
  explicitMock !== null ? explicitMock : import.meta.env.PROD ? false : hasPlaceholderConfig();

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    // Dev: skip auto-refresh to avoid /auth/v1/user 500 loops from stale JWTs
    autoRefreshToken: import.meta.env.PROD,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export default supabase;