import type { User } from '@supabase/supabase-js';
import { supabase, isMockMode } from './supabase';

function projectRefFromUrl(url: string): string | null {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

/** Remove cached Supabase + CMS auth tokens (fixes recurring /auth/v1/user 500 from stale JWTs). */
export function purgeLocalAuthSession() {
  const ref = projectRefFromUrl(import.meta.env.VITE_SUPABASE_URL as string || '');
  if (ref) {
    localStorage.removeItem(`sb-${ref}-auth-token`);
  }
  localStorage.removeItem('katha_creator_auth');
}

/**
 * Read the logged-in user from the local session only — does not call GET /auth/v1/user.
 * Prefer this over getUser() to avoid server round-trips and 500s from corrupt sessions.
 */
export async function getSessionUser(): Promise<User | null> {
  if (isMockMode) return null;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) return null;
  return session?.user ?? null;
}

export async function requireSessionUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new Error('Authentication required');
  return user;
}

/** Call once on auth errors — clears local tokens without another network user fetch. */
export async function handleAuthFailure() {
  purgeLocalAuthSession();
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
}