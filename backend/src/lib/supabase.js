import { createClient } from '@supabase/supabase-js';
import { isMockMode } from './mockMode.js';

let _client = null;

export function getSupabase() {
  if (isMockMode()) return null;

  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    _client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _client;
}

/** @deprecated Use getSupabase() — lazy init avoids crash in mock mode */
export const supabase = {
  from: (...args) => {
    const client = getSupabase();
    if (!client) throw new Error('Supabase not configured');
    return client.from(...args);
  },
};