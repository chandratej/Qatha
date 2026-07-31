-- Migration 050: Align Debut Season chapter word band with serials (800–1,200).
SET search_path TO public, extensions;

-- New seasons default to the same min as day-to-day serialized chapters.
ALTER TABLE public.debut_seasons
  ALTER COLUMN min_words_per_chapter SET DEFAULT 800;

-- Optional hard max (mirrors packages/shared/debutSeason.ts wordsPerChapter.max).
ALTER TABLE public.debut_seasons
  ADD COLUMN IF NOT EXISTS max_words_per_chapter INT NOT NULL DEFAULT 1200
    CHECK (max_words_per_chapter > 0);

-- Bring existing seasons onto the new band.
UPDATE public.debut_seasons
SET
  min_words_per_chapter = 800,
  max_words_per_chapter = 1200
WHERE min_words_per_chapter <> 800
   OR max_words_per_chapter <> 1200;
