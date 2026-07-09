import { createClient } from '@supabase/supabase-js';

function resolvePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || ''
  );
}

function resolveSecretKey() {
  return (
    process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || ''
  );
}

export function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = resolvePublishableKey();
  if (!url || !key) throw new Error('Supabase env not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = resolveSecretKey();
  if (!url || !key) throw new Error('Supabase service role not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}