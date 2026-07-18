/**
 * Static app configuration (MVP Phase 1).
 * Change values here or via Vite env — no secrets.
 * Secrets stay in environment only (VITE_SUPABASE_*, API keys, JWT, etc.).
 */

export const APP_CONFIG = {
  appName: 'Katha Creator Studio',
  appNameTe: 'కథ క్రియేటర్ స్టూడియో',
  defaultLocale: (import.meta.env.VITE_DEFAULT_LOCALE as 'te' | 'en') || 'te',
  environment: import.meta.env.MODE || 'development',
  version: import.meta.env.VITE_APP_VERSION || '0.22.0',
} as const;

export type AppConfig = typeof APP_CONFIG;
