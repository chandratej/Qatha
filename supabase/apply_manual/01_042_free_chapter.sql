-- 042 free-chapter threshold (safe apply — run alone first)
SET search_path TO public, extensions;

ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS free_chapter_count INT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS free_chapter_count_source TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS free_chapter_cohort TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS ever_reached_performing_at TIMESTAMPTZ;

UPDATE public.stories
  SET free_chapter_count_source = 'auto'
  WHERE free_chapter_count_source IS NULL;

ALTER TABLE public.stories
  ALTER COLUMN free_chapter_count_source SET DEFAULT 'auto';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stories_free_chapter_count_source_check'
  ) THEN
    ALTER TABLE public.stories
      ADD CONSTRAINT stories_free_chapter_count_source_check
      CHECK (free_chapter_count_source IN ('auto', 'override'));
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'constraint stories_free_chapter_count_source_check: %', SQLERRM;
END $$;

ALTER TABLE public.stories
  ALTER COLUMN free_chapter_count_source SET NOT NULL;

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
  FOR EACH ROW EXECUTE PROCEDURE public.stamp_story_ever_reached_performing();

UPDATE public.stories
  SET ever_reached_performing_at = now()
  WHERE trust_level IN ('performing', 'catalyst', 'anchor', 'apex')
    AND ever_reached_performing_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_stories_author_ever_performing
  ON public.stories (author_id)
  WHERE ever_reached_performing_at IS NOT NULL;

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

DROP POLICY IF EXISTS reader_story_sample_locks_service ON public.reader_story_sample_locks;
CREATE POLICY reader_story_sample_locks_service ON public.reader_story_sample_locks
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
