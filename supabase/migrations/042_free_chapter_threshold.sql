-- CLI migration runner resets search_path per-file; uuid-ossp/pg_trgm live in extensions.
SET search_path TO public, extensions;

-- 042: Free-chapter threshold auto-tiering (proven vs. unproven story/author)
-- See Worklog/23 JUL 2026/katha-free-chapter-threshold-prompt.md

-- Per-story override + cohort assignment. NULL free_chapter_count means "auto-derive from band".
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS free_chapter_count INT,
  ADD COLUMN IF NOT EXISTS free_chapter_count_source TEXT NOT NULL DEFAULT 'auto'
    CHECK (free_chapter_count_source IN ('auto', 'override')),
  ADD COLUMN IF NOT EXISTS free_chapter_cohort TEXT,
  ADD COLUMN IF NOT EXISTS ever_reached_performing_at TIMESTAMPTZ;

COMMENT ON COLUMN public.stories.free_chapter_count IS
  'Manual override for sample size. NULL = auto-derive (3 if proven, else platform unproven default).';
COMMENT ON COLUMN public.stories.free_chapter_cohort IS
  'A/B cohort key for the unproven tier (e.g. control_5, test_12, test_15). NULL = platform default.';
COMMENT ON COLUMN public.stories.ever_reached_performing_at IS
  'Sticky timestamp — first time this story reached Performing+. Never cleared on demotion; '
  'powers proven-author carryover for the author''s OTHER stories. Never itself reset by band regression.';

-- Stamp ever_reached_performing_at the first time a story crosses into Performing+, and never clear it
-- (a story can fall back to Performing from Apex etc. — that must not un-prove the author's track record).
CREATE OR REPLACE FUNCTION public.stamp_story_ever_reached_performing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trust_level IN ('performing', 'catalyst', 'anchor', 'apex')
     AND NEW.ever_reached_performing_at IS NULL THEN
    NEW.ever_reached_performing_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stamp_story_ever_reached_performing ON public.stories;
CREATE TRIGGER trg_stamp_story_ever_reached_performing
  BEFORE INSERT OR UPDATE OF trust_level ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.stamp_story_ever_reached_performing();

-- Backfill: any story currently Performing+ already has an implicit track record.
UPDATE public.stories
  SET ever_reached_performing_at = now()
  WHERE trust_level IN ('performing', 'catalyst', 'anchor', 'apex')
    AND ever_reached_performing_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_stories_author_ever_performing
  ON public.stories (author_id)
  WHERE ever_reached_performing_at IS NOT NULL;

-- Per-reader sample lock: freezes the free-chapter count a reader is sampling under, so a
-- mid-sample band crossing never moves the paywall point out from under them (Req 3.1).
CREATE TABLE IF NOT EXISTS public.reader_story_sample_locks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  free_chapter_count INT NOT NULL,
  free_chapter_source TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, story_id)
);

ALTER TABLE public.reader_story_sample_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reader owns their sample lock" ON public.reader_story_sample_locks;
CREATE POLICY "reader owns their sample lock" ON public.reader_story_sample_locks
  FOR SELECT USING (auth.uid() = user_id);

-- Writes go through the service role only (server derives + freezes the count).
