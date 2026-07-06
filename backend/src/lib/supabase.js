import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { isMockMode } from './mockMode.js';
import { getSecretKey } from './supabaseKeys.js';

/** Node.js < 22 has no native WebSocket; realtime-js requires the `ws` transport. */
export const SUPABASE_CLIENT_OPTIONS = {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
};

export function createSupabaseClient(url, key, options = {}) {
  return createClient(url, key, {
    ...SUPABASE_CLIENT_OPTIONS,
    ...options,
    auth: { ...SUPABASE_CLIENT_OPTIONS.auth, ...options.auth },
    realtime: { ...SUPABASE_CLIENT_OPTIONS.realtime, ...options.realtime },
  });
}

let _client = null;

export function getSupabase() {
  if (isMockMode()) return null;

  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = getSecretKey();
    if (!url || !key) return null;
    _client = createSupabaseClient(url, key);
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