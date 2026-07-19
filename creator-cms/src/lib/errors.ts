/** User-facing API errors — no developer setup instructions. */

export const CONNECTION_ERROR =
  "We couldn't connect to Katha right now. Check your internet connection and try again.";

export const SESSION_EXPIRED_ERROR = 'Your session has expired. Please sign in again to continue.';

export const GENERIC_ERROR = 'Something went wrong. Please try again in a moment.';

export const SCHEMA_FEATURE_PENDING =
  'This feature is being set up on the server. You can keep writing — your work is safe.';

/** Raw API / Postgres messages when migrations have not been applied yet. */
export function isSchemaTableMissingMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  const msg = message.toLowerCase();
  return (
    msg.includes('could not find the table') ||
    msg.includes('does not exist') ||
    msg.includes('schema cache') ||
    msg.includes('being set up on the server')
  );
}

/** Detect raw PostgREST / Postgres internals that must never reach the UI. */
export function isRawDbErrorMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  return (
    isSchemaTableMissingMessage(message) ||
    /PGRST\d+/i.test(message) ||
    /42P01|permission denied|row-level security|violates foreign key|duplicate key value|JWT/i.test(
      message,
    ) ||
    /relation ["']|column ["']|schema cache/i.test(message)
  );
}

export function friendlyFeatureError(message: string): string {
  if (isSchemaTableMissingMessage(message)) return SCHEMA_FEATURE_PENDING;
  if (isRawDbErrorMessage(message)) return GENERIC_ERROR;
  if (/start the backend|npm run dev|cd backend|ECONNREFUSED/i.test(message)) {
    return CONNECTION_ERROR;
  }
  // Keep short validation messages; strip long stack-like payloads
  if (message.length > 180) return GENERIC_ERROR;
  return message || GENERIC_ERROR;
}

export function mapApiError(payload: {
  code?: string;
  user_message?: string;
  message?: string;
}): string {
  const code = payload.code;
  // Prefer user_message when present, then sanitize either way
  const raw = payload.user_message || payload.message || '';

  if (code === 'OTP_REQUIRED' || /continue reading/i.test(raw)) {
    return SESSION_EXPIRED_ERROR;
  }
  if (code === 'NETWORK_OFFLINE' || /failed to fetch|network/i.test(raw)) {
    return CONNECTION_ERROR;
  }
  if (/start the backend|npm run dev|cd backend/i.test(raw)) {
    return CONNECTION_ERROR;
  }

  if (isSchemaTableMissingMessage(raw)) {
    return SCHEMA_FEATURE_PENDING;
  }
  if (isRawDbErrorMessage(raw)) {
    return GENERIC_ERROR;
  }

  return friendlyFeatureError(raw || GENERIC_ERROR);
}

export function isSessionError(message: string | null | undefined): boolean {
  if (!message) return false;
  return (
    message.includes(SESSION_EXPIRED_ERROR) ||
    /sign in again/i.test(message) ||
    /authentication required/i.test(message)
  );
}