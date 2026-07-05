import { createAppError } from './errorHandler.js';

export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.auth?.role;
    if (!role) {
      return next(createAppError('OTP_REQUIRED', 'Authentication required', 401));
    }
    const isModerator = role === 'admin' || role === 'moderator';
    const allowed = roles.includes(role) || (roles.includes('moderator') && isModerator);
    if (!allowed) {
      return next(createAppError('INTERNAL_ERROR', 'Insufficient permissions', 403));
    }
    next();
  };
}