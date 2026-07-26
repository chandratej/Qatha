/**
 * API / network static configuration (MVP Phase 1).
 * Never store secrets, DB credentials, or signing keys here.
 */

/** Mode B production gateway — used when VITE_GATEWAY_URL is missing in a production build. */
const PRODUCTION_GATEWAY_URL = 'https://gateway-qatha.vercel.app';

function resolveGatewayUrl(): string {
  const fromEnv = String(import.meta.env.VITE_GATEWAY_URL || '').trim().replace(/\/$/, '');
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) return fromEnv;
  // Never ship share links pointing at localhost from a production CMS bundle.
  if (import.meta.env.PROD) return PRODUCTION_GATEWAY_URL;
  // Dev: allow explicit localhost env, else local gateway default.
  if (fromEnv) return fromEnv;
  return 'http://localhost:3000';
}

export const API_CONFIG = {
  /** Backend API base (empty = same origin / Vite proxy). */
  baseUrl: import.meta.env.VITE_API_URL || '',
  /** Reader gateway for share links (never localhost in production builds). */
  gatewayUrl: resolveGatewayUrl(),
  /** Default request timeout ms. */
  timeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 30_000,
  /** Retry count for idempotent GETs. */
  retryCount: Number(import.meta.env.VITE_API_RETRY_COUNT) || 1,
} as const;

export type ApiConfig = typeof API_CONFIG;
