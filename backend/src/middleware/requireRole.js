import { createAppError } from './errorHandler.js';
import { isMockMode } from '../lib/mockMode.js';

const MOCK_ADMIN_IDS = new Set(['demo-creator-001', 'mock-admin']);

export function requireRole(...roles) {
  return (req, res, next) => {
    const userId = req.headers['x-user-id'] || req.headers['x-creator-id'];
    const role = req.headers['x-user-role'] || 'creator';

    if (isMockMode() && MOCK_ADMIN_IDS.has(userId)) {
      return next();
    }

    if (!roles.includes(role)) {
      return next(createAppError('INTERNAL_ERROR', 'Insufficient permissions', 403));
    }
    next();
  };
}