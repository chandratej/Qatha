/**
 * Katha Creator Studio — static configuration entry (MVP Phase 1).
 *
 * Per Katha_Configuration_Service_Requirements.md:
 * - Phase 1: structured static config files (no admin portal).
 * - Never store secrets here.
 * - Phase 2+: runtime DB config + feature flags API.
 */

export { APP_CONFIG, type AppConfig } from './app_config';
export { API_CONFIG, type ApiConfig } from './api_config';
export { FEATURE_FLAGS, isFeatureEnabled, type FeatureFlags } from './feature_flags';
export { UI_CONFIG, type UiConfig } from './ui_config';

import { APP_CONFIG } from './app_config';
import { API_CONFIG } from './api_config';
import { FEATURE_FLAGS } from './feature_flags';
import { UI_CONFIG } from './ui_config';

/** Single snapshot for diagnostics / future remote merge. */
export const STATIC_CONFIG = {
  app: APP_CONFIG,
  api: API_CONFIG,
  features: FEATURE_FLAGS,
  ui: UI_CONFIG,
} as const;
