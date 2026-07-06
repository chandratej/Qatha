import { isMockMode } from '../lib/mockMode.js';
import { createSupabaseClient, getSupabase } from '../lib/supabase.js';
import { getPublishableKey } from '../lib/supabaseKeys.js';
import { createAppError } from './errorHandler.js';

const MOCK_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MOCK_ADMIN_IDS = new Set(['demo-creator-001']);

let _authClient = null;

function getAuthClient() {
  if (_authClient) return _authClient;
  const url = process.env.SUPABASE_URL;
  const key = getPublishableKey();
  if (!url || !key || url.includes('your-project')) return null;
  _authClient = createSupabaseClient(url, key);
  return _authClient;
}

export function parseMockToken(token) {
  const match = /^mock-token-(.+)-(\d+)$/.exec(token || '');
  if (!match) return null;
  return { userId: match[1], issuedAt: Number(match[2]) };
}

async function loadProfileRole(userId) {
  const sb = getSupabase();
  if (!sb) return 'creator';
  const { data } = await sb.from('profiles').select('role').eq('id', userId).maybeSingle();
  return data?.role || 'creator';
}

/**
 * Resolve identity from Authorization: Bearer <supabase-jwt|mock-token>.
 * Never reads x-creator-id or x-user-id — those headers are ignored for authorization.
 */
export async function resolveAuthFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  if (isMockMode() && token.startsWith('mock-token-')) {
    const parsed = parseMockToken(token);
    if (!parsed || Date.now() - parsed.issuedAt > MOCK_SESSION_MAX_AGE_MS) return null;
    const role = MOCK_ADMIN_IDS.has(parsed.userId) ? 'admin' : 'creator';
    return { userId: parsed.userId, role, token, mock: true };
  }

  const client = getAuthClient();
  if (!client) {
    if (isMockMode()) return null;
    throw createAppError('INTERNAL_ERROR', 'Auth verification unavailable', 503);
  }

  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user?.id) return null;

  const role = await loadProfileRole(user.id);
  return { userId: user.id, role, token, mock: false };
}

export function requireAuth({ optional = false } = {}) {
  return async (req, res, next) => {
    try {
      const auth = await resolveAuthFromRequest(req);
      if (!auth) {
        if (optional) return next();
        return next(createAppError('OTP_REQUIRED', 'Valid session required. Send Authorization: Bearer <token>.', 401));
      }
      req.auth = auth;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Reader progress: JWT in prod; x-user-id only allowed in MOCK_MODE (legacy reader dev). */
export function requireAuthOrMockLegacyUser() {
  return async (req, res, next) => {
    try {
      const auth = await resolveAuthFromRequest(req);
      if (auth) {
        req.auth = auth;
        return next();
      }
      if (isMockMode() && req.headers['x-user-id']) {
        req.auth = { userId: req.headers['x-user-id'], role: 'reader', mock: true };
        return next();
      }
      return next(createAppError('OTP_REQUIRED', 'Authentication required', 401));
    } catch (err) {
      next(err);
    }
  };
}

export function getAuthenticatedUserId(req) {
  if (!req.auth?.userId) {
    throw createAppError('OTP_REQUIRED', 'Authentication required', 401);
  }
  return req.auth.userId;
}