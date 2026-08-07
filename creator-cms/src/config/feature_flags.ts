/**
 * Feature flags — static defaults for MVP Phase 1.
 * Runtime/database-driven flags are Phase 2+.
 *
 * Generative AI is intentionally off for MVP1 (no AI cost surface).
 */

export const FEATURE_FLAGS = {
  /**
   * Generative AI writing / continue — permanently off for craft moat Constitution (§1).
   * Katha never produces words the author did not write.
   */
  aiWriter: false,
  /** AI translation — disabled (Constitution §1). */
  aiTranslation: false,
  /** Local planning notes panels (author-written only; no generative). */
  planningNotes: true,
  /**
   * Marketplace / reviewer pool surfaces — off until schema + staffing ready (P1-21).
   * E2E (perf / strict platform) can re-enable via VITE_FEATURE_MARKETPLACE=true.
   */
  marketplace: import.meta.env.VITE_FEATURE_MARKETPLACE === 'true',
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
  /**
   * Contests / events — off for launch until fully staffed (P1-21).
   * E2E (events-strict) can re-enable via VITE_FEATURE_EVENTS=true.
   */
  events: import.meta.env.VITE_FEATURE_EVENTS === 'true',
  /** Magazine edition placeholder — hide from nav (P1-25). */
  magazine: false,
  /**
   * §3.1–3.2 Craft entities (People cast + Story Bible characters/locations/timeline).
   * On = structured story-linked entities are available in Studio.
   */
  craftEntities: true,
  /**
   * §3.4 Studio tab integrity — hide incomplete inspector tabs rather than show empties.
   * When true, People/Notes tabs only render if a functional slot is provided.
   */
  hideIncompleteStudioTabs: true,
  /**
   * Tier 2 craft surfaces (continuity, cross-story reuse, trust-in-flow, narrative versions).
   * Permanently gated until behavior trigger in Craft Moat §4 — do not enable for beta.
   */
  craftTier2: false,
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return Boolean(FEATURE_FLAGS[flag]);
}
