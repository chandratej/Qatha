/** User-facing API errors — no developer setup instructions. */

export const CONNECTION_ERROR =
  "We couldn't connect to Katha right now. Check your internet connection and try again.";

export const SESSION_EXPIRED_ERROR =
  'Your session has expired. Please sign in again with your phone number.';

export const GENERIC_ERROR = 'Something went wrong. Please try again in a moment.';

export function mapApiError(payload: {
  code?: string;
  user_message?: string;
  message?: string;
}): string {
  const code = payload.code;
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

  return raw || GENERIC_ERROR;
}

export function isSessionError(message: string | null | undefined): boolean {
  if (!message) return false;
  return (
    message.includes(SESSION_EXPIRED_ERROR) ||
    /sign in again/i.test(message) ||
    /authentication required/i.test(message)
  );
}