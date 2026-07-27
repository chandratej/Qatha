/**
 * API / network static configuration (MVP Phase 1).
 * Never store secrets, DB credentials, or signing keys here.
 *
 * Env names (Vite — must be prefixed VITE_ to be baked into the client bundle):
 *   VITE_API_URL      Studio / Node API base, e.g. https://katha-api.onrender.com/api
 *   VITE_GATEWAY_URL  Reader share gateway
 *
 * Vercel: set these under Project → Settings → Environment Variables for Production
 * (and Preview if needed). Names without the VITE_ prefix are invisible to the CMS.
 */

/** Mode B production gateway — used when VITE_GATEWAY_URL is missing in a production build. */
const PRODUCTION_GATEWAY_URL = 'https://gateway-qatha.vercel.app';

/** Production Studio API — used when VITE_API_URL is missing in a production build. */
export const PRODUCTION_STUDIO_API_URL = 'https://katha-api.onrender.com/api';

const DEV_STUDIO_API_URL = 'http://localhost:3001/api';

function resolveGatewayUrl(): string {
  const fromEnv = String(import.meta.env.VITE_GATEWAY_URL || '').trim().replace(/\/$/, '');
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) return fromEnv;
  // Never ship share links pointing at localhost from a production CMS bundle.
  if (import.meta.env.PROD) return PRODUCTION_GATEWAY_URL;
  // Dev: allow explicit localhost env, else local gateway default.
  if (fromEnv) return fromEnv;
  return 'http://localhost:3000';
}

/**
 * Resolve Studio Node API base URL.
 * - Prefer `VITE_API_URL` when set (strip trailing slash).
 * - In production builds, never fall back to localhost (breaks consent + all API calls
 *   when the Vercel env var is missing). Use known Render URL instead.
 * - In dev, default to local API.
 */
export function resolveStudioApiBase(): string {
  const fromEnv = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (fromEnv) {
    // Production builds must not silently call localhost even if env is mis-set.
    if (import.meta.env.PROD && /localhost|127\.0\.0\.1/i.test(fromEnv)) {
      return PRODUCTION_STUDIO_API_URL;
    }
    return fromEnv;
  }
  if (import.meta.env.PROD) return PRODUCTION_STUDIO_API_URL;
  return DEV_STUDIO_API_URL;
}

export const API_CONFIG = {
  /** Backend API base (includes `/api` path prefix). */
  baseUrl: resolveStudioApiBase(),
  /** Reader gateway for share links (never localhost in production builds). */
  gatewayUrl: resolveGatewayUrl(),
  /** Default request timeout ms. */
  timeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 30_000,
  /** Retry count for idempotent GETs. */
  retryCount: Number(import.meta.env.VITE_API_RETRY_COUNT) || 1,
} as const;

export type ApiConfig = typeof API_CONFIG;
