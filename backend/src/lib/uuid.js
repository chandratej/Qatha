/**
 * Shared UUID helpers — prefer clean 400s over raw Postgres "invalid input syntax".
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value.trim());
}

/**
 * @param {string} value
 * @param {string} [label]
 * @returns {string} trimmed uuid
 * @throws {{ status: number, code: string, message: string }}
 */
export function parseUuidOrThrow(value, label = 'id') {
  const raw = value == null ? '' : String(value).trim();
  if (!isUuid(raw)) {
    const err = new Error(`Invalid ${label}`);
    err.status = 400;
    err.code = 'BAD_REQUEST';
    err.userMessage = `Invalid ${label}`;
    throw err;
  }
  return raw;
}
