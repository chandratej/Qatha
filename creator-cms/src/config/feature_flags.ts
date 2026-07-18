/**
 * Feature flags — static defaults for MVP Phase 1.
 * Runtime/database-driven flags are Phase 2+.
 *
 * Generative AI is intentionally off for MVP1 (no AI cost surface).
 */

export const FEATURE_FLAGS = {
  /** Generative AI writing / continue — disabled MVP1. */
  aiWriter: false,
  /** AI translation — disabled MVP1. */
  aiTranslation: false,
  /** Local planning notes panels (non-generative). */
  planningNotes: false,
  /** Marketplace / reviewer pool surfaces. */
  marketplace: true,
  /** Audio books — not in MVP1. */
  audioBooks: false,
  /** Advanced analytics. */
  analytics: true,
  /** Community feed + author replies (local-first until backend threads). */
  community: true,
  /** In-editor publish schedule. */
  publishSchedule: true,
  /** Narrative OS editor (false forces legacy when VITE_LEGACY_EDITOR=true). */
  narrativeOs: import.meta.env.VITE_LEGACY_EDITOR !== 'true',
  /** Contests / events. */
  events: true,
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return Boolean(FEATURE_FLAGS[flag]);
}
