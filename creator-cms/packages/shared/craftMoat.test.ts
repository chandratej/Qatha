import { describe, expect, it } from 'vitest';
import {
  CRAFT_MOAT_TIER1,
  CRAFT_MOAT_TIER2_GATED,
  isPhoneticMemoryExport,
  PHONETIC_MEMORY_SCHEMA_VERSION,
  violatesCraftConstitution,
} from './craftMoat';

describe('Craft Moat Constitution §1', () => {
  it('rejects generative / rewrite features', () => {
    expect(violatesCraftConstitution({ producesAuthorText: true })).toBe(true);
    expect(violatesCraftConstitution({ rewritesManuscript: true })).toBe(true);
    expect(violatesCraftConstitution({ generatesSynopsisOrBlurb: true })).toBe(true);
    expect(violatesCraftConstitution({ generatesCoverArt: true })).toBe(true);
  });

  it('allows index / search / structured craft tools', () => {
    expect(violatesCraftConstitution({})).toBe(false);
    expect(violatesCraftConstitution({ producesAuthorText: false })).toBe(false);
  });
});

describe('Craft Moat tiers', () => {
  it('Tier 1 includes structured entities and phonetic memory', () => {
    expect(CRAFT_MOAT_TIER1).toContain('structured_entities');
    expect(CRAFT_MOAT_TIER1).toContain('durable_phonetic_memory');
    expect(CRAFT_MOAT_TIER1).toContain('studio_tab_integrity');
  });

  it('Tier 2 stays gated list (not auto-enabled)', () => {
    expect(CRAFT_MOAT_TIER2_GATED).toContain('continuity_checking');
    expect(CRAFT_MOAT_TIER2_GATED).toContain('cross_story_reuse');
  });

  it('phonetic memory schema version is sync-ready v2', () => {
    expect(PHONETIC_MEMORY_SCHEMA_VERSION).toBe(2);
    expect(isPhoneticMemoryExport({
      schema_version: 2,
      exported_at: new Date().toISOString(),
      corrections: { arun: 'అరుణ్' },
      records: [],
    })).toBe(true);
  });
});
