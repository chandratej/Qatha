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