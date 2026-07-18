/**
 * API / network static configuration (MVP Phase 1).
 * Never store secrets, DB credentials, or signing keys here.
 */

export const API_CONFIG = {
  /** Backend API base (empty = same origin / Vite proxy). */
  baseUrl: import.meta.env.VITE_API_URL || '',
  /** Reader gateway for share links. */
  gatewayUrl: import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000',
  /** Default request timeout ms. */
  timeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 30_000,
  /** Retry count for idempotent GETs. */
  retryCount: Number(import.meta.env.VITE_API_RETRY_COUNT) || 1,
} as const;

export type ApiConfig = typeof API_CONFIG;
