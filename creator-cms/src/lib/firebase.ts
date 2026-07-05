import { createClient } from '@supabase/supabase-js';

// Pure Supabase Auth client (katha-auth-architecture-decision_auth.md)
// Replaces previous Firebase web SDK usage entirely.
// Phone OTP via Supabase + Send SMS Hook to India CPaaS.
//
// Mock mode (for creator-cms demo without real Supabase):
//   - Set VITE_MOCK_MODE=true, or leave placeholder URL/keys.
//   - OTP is always 123456. No network calls to Supabase.

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://your-project.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'your-anon-key';

export const isMockMode =
  import.meta.env.VITE_MOCK_MODE === 'true' ||
  !supabaseUrl ||
  supabaseUrl.includes('your-project') ||
  supabaseUrl === 'https://your-project.supabase.co' ||
  supabaseUrl.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export default supabase;
