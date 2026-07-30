/**
 * Guards async chapter-load apply so a late fetch never stomps live edits.
 *
 * Root cause pattern (reproduced live):
 * - React Strict Mode / navigation starts load gen N, then gen N+1
 * - Gen N awaits past the first cancelled check (e.g. draft cache)
 * - Gen N+1 finishes, editor opens, user types
 * - Gen N's late resolve calls setScenes and silently wipes keystrokes
 */

export type ChapterLoadApplyDecision =
  | { apply: true }
  | { apply: false; reason: 'stale_generation' | 'cancelled' | 'user_dirty' };

export function shouldApplyChapterLoad(opts: {
  /** True when the effect cleanup ran (unmount or deps change). */
  cancelled: boolean;
  /** Generation id captured when this load started. */
  loadGeneration: number;
  /** Latest generation id for this editor instance (ref.current). */
  currentGeneration: number;
  /**
   * True when the user has unsaved edits relative to the last applied baseline.
   * Blocks apply even if generation somehow matches (defense in depth).
   */
  userDirty?: boolean;
}): ChapterLoadApplyDecision {
  if (opts.cancelled) return { apply: false, reason: 'cancelled' };
  if (opts.loadGeneration !== opts.currentGeneration) {
    return { apply: false, reason: 'stale_generation' };
  }
  if (opts.userDirty) return { apply: false, reason: 'user_dirty' };
  return { apply: true };
}
