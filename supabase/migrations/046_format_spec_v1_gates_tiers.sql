-- Migration 046: Format Spec v1 — content type, contest no-reentry, tier scaffolding
-- Source: Worklog/27_JUL_2026/Katha_Content_Format_and_Payout_Specification_v1.md

SET search_path TO public, extensions;

-- Interactive Flash Fiction (non-monetized acquisition format)
DO $$ BEGIN
  ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'interactive_flash';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Per-story contest history (anti double-dipping) — Short Story, Flash, Interactive Flash, Collection pieces
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS contest_won_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contest_win_event_id UUID,
  ADD COLUMN IF NOT EXISTS branch_point_count INT;

COMMENT ON COLUMN public.stories.contest_won_at IS
  'Format Spec v1: set when this story wins a contest; blocks re-entry for per-story contest formats.';
COMMENT ON COLUMN public.stories.branch_point_count IS
  'Interactive Flash contest eligibility: require 2–3 branch/choice points.';

-- Cumulative words delivered (for tier volume gate; optional measured cache)
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS cumulative_words_published INT,
  ADD COLUMN IF NOT EXISTS reader_tier TEXT;

COMMENT ON COLUMN public.stories.reader_tier IS
  'bronze|silver|gold|platform — highest tier met (SPI band + word volume). Null if not monetizing.';

CREATE INDEX IF NOT EXISTS idx_stories_contest_won
  ON public.stories (contest_won_at)
  WHERE contest_won_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stories_reader_tier
  ON public.stories (reader_tier)
  WHERE reader_tier IS NOT NULL;
