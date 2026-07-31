/**
 * Katha Craft Moat Requirements v1.0 — runtime contract.
 * Source of truth: Worklog/31_JUL_2026/Katha_Craft_Moat_Requirements_v1.md
 *
 * Constitution: Katha never generates or rewrites an author's words.
 * Tier 1: build now. Tier 2: behavior-gated (not implemented until trigger).
 */

/** §1 — If a feature would produce words the author did not write, reject. */
export function violatesCraftConstitution(opts: {
  producesAuthorText?: boolean;
  rewritesManuscript?: boolean;
  generatesSynopsisOrBlurb?: boolean;
  generatesCoverArt?: boolean;
}): boolean {
  return Boolean(
    opts.producesAuthorText
    || opts.rewritesManuscript
    || opts.generatesSynopsisOrBlurb
    || opts.generatesCoverArt,
  );
}

export type CraftEntityType = 'character' | 'location' | 'timeline_note';

/** §3.1 — Minimum structured shape for craft entities (never freeform-only). */
export interface CraftEntityBase {
  id: string;
  /** §3.2 Story-level linkage — not chapter-local ownership. */
  story_id: string;
  type: CraftEntityType;
  name: string;
  /** Structured key/value facts (appearance, when_label, …). */
  attributes: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

/** §3.3 Durable phonetic memory record — portable + server sync without reshape. */
export const PHONETIC_MEMORY_SCHEMA_VERSION = 2 as const;

export type PhoneticMemorySource = 'teach' | 'import' | 'sync' | 'seed';

export interface PhoneticMemoryRecord {
  phonetic_input: string;
  corrected_telugu: string;
  usage_count: number;
  last_used_at: string | null;
  source: PhoneticMemorySource;
  client_updated_at: string;
  schema_version: typeof PHONETIC_MEMORY_SCHEMA_VERSION;
}

export interface PhoneticMemoryExport {
  schema_version: typeof PHONETIC_MEMORY_SCHEMA_VERSION;
  exported_at: string;
  /** Map form for backward-compatible importers. */
  corrections: Record<string, string>;
  /** Full durable records for multi-device LWW sync. */
  records: PhoneticMemoryRecord[];
}

export function isPhoneticMemoryExport(value: unknown): value is PhoneticMemoryExport {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.corrections === 'object' && v.corrections !== null;
}

/** §3.4 / §4 — Tier classification for scheduling. */
export type CraftMoatTier = 1 | 2;

export const CRAFT_MOAT_TIER1 = [
  'structured_entities',
  'story_level_linkage',
  'durable_phonetic_memory',
  'studio_tab_integrity',
] as const;

export const CRAFT_MOAT_TIER2_GATED = [
  'continuity_checking',
  'cross_story_reuse',
  'trust_ladder_in_write_flow',
  'narrative_aware_version_history',
] as const;
