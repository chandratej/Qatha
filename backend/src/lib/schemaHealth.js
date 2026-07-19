/**
 * PostgREST / Postgres missing-table detection — mirrors creator-cms schemaHealth.ts
 */

/** PostgREST / Postgres — table or view not in schema cache. */
export function isTableMissingError(error) {
  if (!error) return false;
  const msg = String(error.message || '').toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table')
  );
}

/** @deprecated Use isTableMissingError */
export const isStoryMembersTableMissing = isTableMissingError;

/** Match thrown Error.message from stores (no PostgREST code on plain Error). */
export function isTableMissingMessage(message) {
  if (!message) return false;
  const msg = String(message).toLowerCase();
  return (
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table')
  );
}

export const SCHEMA_FEATURE_PENDING_MESSAGE =
  'This feature is being set up on the server. You can keep writing — your work is safe.';

/** Map any Supabase/PostgREST error to a safe user-facing message (never raw SQL). */
export function toSafeStoreError(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return new Error(fallback);
  if (isTableMissingError(error)) return new Error(SCHEMA_FEATURE_PENDING_MESSAGE);
  const msg = String(error.message || '');
  if (isTableMissingMessage(msg)) return new Error(SCHEMA_FEATURE_PENDING_MESSAGE);
  // Never surface PostgREST/Postgres internals
  if (
    /PGRST|42P01|permission denied|row-level security|violates foreign key|duplicate key|JWT/i.test(msg)
  ) {
    return new Error(fallback);
  }
  // Short, already-friendly messages (validation) may pass through
  if (msg.length <= 120 && !/relation |column |schema /i.test(msg)) {
    return new Error(msg);
  }
  return new Error(fallback);
}