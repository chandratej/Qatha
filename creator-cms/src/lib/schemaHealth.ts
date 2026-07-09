import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type SchemaHealth = {
  ready: boolean;
  reason?: 'schema_missing' | 'degraded';
  detail?: string;
};

export function isSchemaMissingError(error: PostgrestError | null | undefined): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table')
  );
}

/** True when PostgREST reports a missing column (migration partially applied). */
export function isMissingColumnError(error: PostgrestError | null | undefined): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    msg.includes('column') && msg.includes('does not exist') ||
    msg.includes('could not find') && msg.includes('column')
  );
}

export async function checkSchemaHealth(): Promise<SchemaHealth> {
  const { error } = await supabase.from('profiles').select('id').limit(1);

  if (!error) return { ready: true };

  if (isSchemaMissingError(error)) {
    return {
      ready: false,
      reason: 'schema_missing',
      detail: error.message,
    };
  }

  return { ready: false, reason: 'degraded', detail: error.message };
}