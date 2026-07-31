-- Craft Moat Requirements v1.0 — Tier 1 foundations
-- 3.1 Structured entity attributes · 3.2 story linkage (already on FKs) · 3.3 phonetic memory sync fields
-- Safe to re-run.

SET search_path TO public, extensions;

-- ── 3.1 Structured attributes on story-scoped entities ───────────────────
-- Characters: freeform bio remains optional; structured facts live in attributes.
ALTER TABLE public.story_characters
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.story_characters.attributes IS
  'Structured craft facts (appearance, age_band, role, dialect, …). Never generated prose.';

ALTER TABLE public.story_lore_entries
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.story_lore_entries.attributes IS
  'Structured location/world facts keyed by field name. Story-scoped (story_id FK).';

ALTER TABLE public.story_plot_events
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.story_plot_events.attributes IS
  'Structured timeline fields (era, absolute_order, confidence). Story-scoped.';

-- Ensure story linkage is non-nullable (already is) — document as moat invariant
COMMENT ON COLUMN public.story_characters.story_id IS
  'Story-level entity (§3.2). Never chapter-local only.';
COMMENT ON COLUMN public.story_lore_entries.story_id IS
  'Story-level entity (§3.2). Cross-chapter by design.';
COMMENT ON COLUMN public.story_plot_events.story_id IS
  'Story-level timeline entity (§3.2).';

-- ── 3.3 Durable phonetic memory — sync-ready without restructure ─────────
ALTER TABLE public.phonetic_corrections
  ADD COLUMN IF NOT EXISTS usage_count INT NOT NULL DEFAULT 0;

ALTER TABLE public.phonetic_corrections
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

ALTER TABLE public.phonetic_corrections
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'teach'
    CHECK (source IN ('teach', 'import', 'sync', 'seed'));

ALTER TABLE public.phonetic_corrections
  ADD COLUMN IF NOT EXISTS client_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.phonetic_corrections
  ADD COLUMN IF NOT EXISTS schema_version INT NOT NULL DEFAULT 2;

COMMENT ON TABLE public.phonetic_corrections IS
  'Per-writer phonetic memory (§3.3). localStorage is cache; this table is source of truth for multi-device sync.';

CREATE INDEX IF NOT EXISTS idx_phonetic_corrections_client_updated
  ON public.phonetic_corrections(creator_id, client_updated_at DESC);
