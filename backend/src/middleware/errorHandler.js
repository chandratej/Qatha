const ERROR_MAP = {
  NETWORK_OFFLINE: {
    userMessage: 'No connection. Check your internet and try again.',
    action: 'SHOW_OFFLINE_CHAPTERS',
  },
  CHAPTER_NOT_FOUND: {
    userMessage: 'This chapter is no longer available.',
    action: 'SHOW_SIMILAR_STORIES',
  },
  PAYMENT_FAILED: {
    userMessage: 'Payment failed. You have 7 days to fix it.',
    action: 'SHOW_PAYMENT_METHOD',
  },
  PAYWALL_REQUIRED: {
    userMessage: 'Subscribe for ₹99/month to continue reading.',
    action: 'SHOW_PAYWALL',
  },
  OTP_REQUIRED: {
    userMessage: 'Sign in to continue reading.',
    action: 'SHOW_OTP_GATE',
  },
  CONSENT_REQUIRED: {
    userMessage: 'Accept the Privacy Policy and Creator Agreement to continue.',
    action: 'SHOW_LEGAL_CONSENT',
  },
  CONSENT_STORAGE_UNAVAILABLE: {
    userMessage: 'Legal consent storage is not ready. Please try again later.',
    action: 'RETRY',
  },
  CREATOR_BANNED: {
    userMessage: 'This creator is no longer on Katha.',
    action: 'SUGGEST_SIMILAR_CREATORS',
  },
  MODERATION_PENDING: {
    userMessage: 'Your chapter is under review. Usually approved within 1–2 hours.',
    action: 'WAIT',
  },
  // Blueprint Phase 1 security errors
  RATE_LIMITED: {
    userMessage: 'Too many attempts. Please wait before trying again.',
    action: 'WAIT',
  },
  INVALID_OTP: {
    userMessage: 'Invalid or expired OTP. Request a new one.',
    action: 'RETRY_OTP',
  },
  SESSION_MISMATCH: {
    userMessage: 'Security check failed. Please request a fresh OTP.',
    action: 'RETRY_OTP',
  },
  INVALID_PHONE: {
    userMessage: 'Enter a valid phone number.',
    action: 'RETRY',
  },
};

export function createAppError(code, message, status = 400, meta) {
  const mapped = ERROR_MAP[code] || {
    userMessage: message || 'Something went wrong. Please try again.',
    action: 'RETRY',
  };
  const userMessage = message || mapped.userMessage;
  const err = new Error(userMessage);
  err.code = code;
  err.status = status;
  err.userMessage = userMessage;
  err.action = mapped.action;
  if (meta) err.meta = meta;
  return err;
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';

  if (status >= 500) {
    console.error('[Katha API Error]', err.message);
  }

  res.status(status).json({
    status: 'error',
    code,
    user_message: err.userMessage || err.message,
    action: err.action || 'RETRY',
    ...(err.meta || {}),
  });
}