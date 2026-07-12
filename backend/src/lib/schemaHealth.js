/**
 * PostgREST / Postgres missing-table detection — mirrors creator-cms schemaHealth.ts
 */

export function isStoryMembersTableMissing(error) {
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