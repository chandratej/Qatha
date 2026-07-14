import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { isMissingColumnError, isSchemaMissingError } from './schemaHealth';
export interface AuthUser {
  id: string;
  phone: string;
  email?: string;
  role: string;
  display_name: string;
  subscription_status?: string;
  phone_verified?: boolean;
}

const BASE_COLS = 'display_name, role, subscription_status, phone';
const EXT_COLS = `${BASE_COLS}, email, phone_verified_at`;

export type ProfileRow = {
  display_name?: string;
  role?: string;
  subscription_status?: string;
  phone?: string | null;
  email?: string | null;
  phone_verified_at?: string | null;
};

export function profileToAuthUser(
  userId: string,
  session: Session | null,
  profile: ProfileRow | null,
  displayName?: string,
): AuthUser {
  const email = profile?.email || session?.user?.email || undefined;
  const phone = profile?.phone || session?.user?.phone || '';
  return {
    id: userId,
    phone,
    email,
    role: profile?.role || 'creator',
    display_name:
      profile?.display_name ||
      displayName ||
      session?.user?.user_metadata?.full_name ||
      'Creator',
    subscription_status: profile?.subscription_status || 'free',
    phone_verified: Boolean(profile?.phone_verified_at && profile?.phone),
  };
}

export async function fetchCreatorProfile(userId: string) {
  let result = await supabase.from('profiles').select(EXT_COLS).eq('id', userId).maybeSingle();

  if (result.error && isSchemaMissingError(result.error)) {
    return { data: null, error: result.error, schemaMissing: true as const };
  }

  if (result.error && isMissingColumnError(result.error)) {
    result = await supabase.from('profiles').select(BASE_COLS).eq('id', userId).maybeSingle();
  }

  return { ...result, schemaMissing: false as const };
}

export async function ensureCreatorProfile(session: Session, displayName?: string) {
  const userId = session.user.id;
  const email = session.user.email || undefined;
  const penName =
    displayName ||
    session.user.user_metadata?.full_name ||
    (email ? email.split('@')[0] : 'Creator');

  const baseRow = {
    id: userId,
    display_name: penName,
    role: 'creator' as const,
  };

  const profileInsert = email ? { ...baseRow, email } : baseRow;
  let upsert = await supabase
    .from('profiles')
    .upsert(profileInsert as typeof baseRow, { onConflict: 'id' })
    .select(EXT_COLS)
    .single();

  if (upsert.error && isSchemaMissingError(upsert.error)) {
    return { profile: null, error: upsert.error, schemaMissing: true as const };
  }

  if (upsert.error && isMissingColumnError(upsert.error)) {
    upsert = await supabase
      .from('profiles')
      .upsert(baseRow, { onConflict: 'id' })
      .select(BASE_COLS)
      .single();
  }

  if (upsert.error) {
    return { profile: null, error: upsert.error, schemaMissing: false as const };
  }

  const creators = await supabase.from('creators').upsert(
    { id: userId, pen_name: penName },
    { onConflict: 'id' },
  );

  if (creators.error && !isSchemaMissingError(creators.error)) {
    return { profile: upsert.data as ProfileRow, error: creators.error, schemaMissing: false as const };
  }

  return { profile: upsert.data as ProfileRow, error: null, schemaMissing: false as const };
}

/** Ensure creators row exists before story insert (author_id FK). */
export async function ensureCreatorRow(userId: string, penName = 'Creator') {
  const { error } = await supabase.from('creators').upsert(
    { id: userId, pen_name: penName },
    { onConflict: 'id' },
  );
  if (error && !isSchemaMissingError(error)) {
    throw new Error(error.message);
  }
}