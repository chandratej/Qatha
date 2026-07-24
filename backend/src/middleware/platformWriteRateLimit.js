/**
 * Platform write API rate limiting — LRC-16-D10
 * Security Council: bot abuse protection on reviewer pool mutations.
 *
 * IMPORTANT (P1-15): in-memory sliding window only — correct for a **single API instance**.
 * Multi-instance / horizontal scale needs Redis (or equivalent) shared counters.
 * Do not assume limits hold across processes until that lands.
 */

import { createAppError } from './errorHandler.js';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const DEFAULT_LIMIT = Number(process.env.PLATFORM_WRITE_RATE_LIMIT) || 60;
const DEFAULT_WINDOW_SEC = Number(process.env.PLATFORM_WRITE_RATE_WINDOW_SEC) || 60;

/** @type {Map<string, number[]>} */
const buckets = new Map();

function isDisabled() {
  return process.env.SKIP_PLATFORM_RATE_LIMIT === 'true';
}

function pruneTimestamps(timestamps, windowMs, now) {
  const cutoff = now - windowMs;
  while (timestamps.length > 0 && timestamps[0] <= cutoff) {
    timestamps.shift();
  }
  return timestamps;
}

function resolveKey(req) {
  const userId = req.auth?.userId;
  if (userId) return `user:${userId}`;
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

/**
 * Sliding-window rate limit for platform write endpoints.
 * Returns HTTP 429 (RATE_LIMITED) when exceeded.
 */
export function platformWriteRateLimit(opts = {}) {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const windowSec = opts.windowSec ?? DEFAULT_WINDOW_SEC;
  const windowMs = windowSec * 1000;

  return (req, res, next) => {
    if (isDisabled() || !WRITE_METHODS.has(req.method)) {
      return next();
    }

    const key = resolveKey(req);
    const now = Date.now();
    const timestamps = pruneTimestamps(buckets.get(key) || [], windowMs, now);

    if (timestamps.length >= limit) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((timestamps[0] + windowMs - now) / 1000),
      );
      res.setHeader('Retry-After', String(retryAfterSec));
      return next(createAppError(
        'RATE_LIMITED',
        `Write rate limit exceeded (${limit}/${windowSec}s). Retry in ${retryAfterSec}s.`,
        429,
      ));
    }

    timestamps.push(now);
    buckets.set(key, timestamps);
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - timestamps.length)));
    return next();
  };
}

/** Test helper — reset in-memory buckets */
export function resetPlatformWriteRateLimits() {
  buckets.clear();
}