-- Migration 015: Story Trust SPI persistence (DEC-021, DEC-022, ADR-002)
-- Live SPI columns + effective share snapshot on earnings.

-- ---------------------------------------------------------------------------
-- Stories: trust ladder state
-- ---------------------------------------------------------------------------

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS trust_level TEXT NOT NULL DEFAULT 'incubation'
    CHECK (trust_level IN (
      'incubation', 'foundation', 'emerging', 'performing',
      'catalyst', 'anchor', 'apex'
    ));

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS spi_score DECIMAL(5, 1) NOT NULL DEFAULT 0
    CHECK (spi_score >= 0 AND spi_score <= 100);

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS spi_components JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS trust_candidate_level TEXT
    CHECK (
      trust_candidate_level IS NULL OR trust_candidate_level IN (
        'incubation', 'foundation', 'emerging', 'performing',
        'catalyst', 'anchor', 'apex'
      )
    );

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS trust_stable_since TIMESTAMPTZ;

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS monetization_eligible BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS spi_computed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_stories_trust_level
  ON public.stories(trust_level);

CREATE INDEX IF NOT EXISTS idx_stories_monetization
  ON public.stories(monetization_eligible)
  WHERE monetization_eligible = TRUE;

-- ---------------------------------------------------------------------------
-- Earnings: snapshot share at payment time (ladder honesty)
-- ---------------------------------------------------------------------------

ALTER TABLE public.earnings_ledger
  ADD COLUMN IF NOT EXISTS effective_share_pct SMALLINT;

ALTER TABLE public.earnings_ledger
  ADD COLUMN IF NOT EXISTS trust_level_at_payment TEXT;

COMMENT ON COLUMN public.stories.trust_level IS 'Story Trust ladder — Performing+ is monetization eligible';
COMMENT ON COLUMN public.stories.spi_score IS 'Story Performance Index 0–100';
COMMENT ON COLUMN public.earnings_ledger.effective_share_pct IS 'Creator share % snapshotted at payment (40×multiplier)';

-- ---------------------------------------------------------------------------
-- Helper: monetization eligibility from trust level
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.story_is_monetization_eligible(p_trust TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_trust IN ('performing', 'catalyst', 'anchor', 'apex');
$$;

-- Keep monetization_eligible in sync when trust_level changes
CREATE OR REPLACE FUNCTION public.sync_story_monetization_eligible()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.monetization_eligible := public.story_is_monetization_eligible(NEW.trust_level);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stories_monetization ON public.stories;
CREATE TRIGGER trg_stories_monetization
  BEFORE INSERT OR UPDATE OF trust_level ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.sync_story_monetization_eligible();

-- Backfill eligibility
UPDATE public.stories
SET monetization_eligible = public.story_is_monetization_eligible(trust_level);
