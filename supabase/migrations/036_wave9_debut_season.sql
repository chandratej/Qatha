-- CLI migration runner resets search_path per-file; uuid-ossp/pg_trgm live in extensions.
SET search_path TO public, extensions;

-- Migration 036: Debut Season backend (Wave 9 — UI/UX PRD)
-- Tables: debut_seasons, debut_entries, debut_metrics

DO $$ BEGIN
  CREATE TYPE debut_season_status AS ENUM ('draft', 'active', 'closed', 'evaluating', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE debut_eligibility_status AS ENUM ('active', 'graduated', 'disqualified', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.debut_seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status debut_season_status NOT NULL DEFAULT 'active',
  chapter_threshold INT NOT NULL DEFAULT 50 CHECK (chapter_threshold > 0),
  min_words_per_chapter INT NOT NULL DEFAULT 2000 CHECK (min_words_per_chapter > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.debut_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.debut_seasons(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  graduation_date TIMESTAMPTZ,
  eligibility_status debut_eligibility_status NOT NULL DEFAULT 'active',
  total_score NUMERIC(5,2),
  rank INT,
  award_level TEXT,
  UNIQUE (author_id, season_id),
  UNIQUE (story_id, season_id)
);

CREATE TABLE IF NOT EXISTS public.debut_metrics (
  story_id UUID PRIMARY KEY REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_count INT NOT NULL DEFAULT 0 CHECK (chapter_count >= 0),
  total_words INT NOT NULL DEFAULT 0 CHECK (total_words >= 0),
  completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  reader_retention NUMERIC(5,2) NOT NULL DEFAULT 0,
  average_rating NUMERIC(3,2),
  editorial_score NUMERIC(5,2),
  engagement_score NUMERIC(5,2),
  moderation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_debut_seasons_status ON public.debut_seasons(status);
CREATE INDEX IF NOT EXISTS idx_debut_entries_author ON public.debut_entries(author_id);
CREATE INDEX IF NOT EXISTS idx_debut_entries_story ON public.debut_entries(story_id);
CREATE INDEX IF NOT EXISTS idx_debut_entries_season ON public.debut_entries(season_id);

-- Seed active Vasanta cohort when empty
INSERT INTO public.debut_seasons (season_name, start_date, end_date, status, chapter_threshold, min_words_per_chapter)
SELECT
  'Katha Debut Season — Vasanta Q1',
  DATE_TRUNC('quarter', CURRENT_DATE)::DATE,
  (DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months' - INTERVAL '1 day')::DATE,
  'active',
  50,
  2000
WHERE NOT EXISTS (SELECT 1 FROM public.debut_seasons WHERE status = 'active');

-- RLS
ALTER TABLE public.debut_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debut_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debut_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS debut_seasons_public_read ON public.debut_seasons;
CREATE POLICY debut_seasons_public_read ON public.debut_seasons
  FOR SELECT USING (status IN ('active', 'closed', 'evaluating', 'completed'));

DROP POLICY IF EXISTS debut_seasons_service ON public.debut_seasons;
CREATE POLICY debut_seasons_service ON public.debut_seasons
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS debut_entries_author ON public.debut_entries;
CREATE POLICY debut_entries_author ON public.debut_entries
  FOR SELECT USING (author_id = auth.uid());

DROP POLICY IF EXISTS debut_entries_service ON public.debut_entries;
CREATE POLICY debut_entries_service ON public.debut_entries
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS debut_metrics_author ON public.debut_metrics;
CREATE POLICY debut_metrics_author ON public.debut_metrics
  FOR SELECT USING (
    story_id IN (SELECT id FROM public.stories WHERE author_id = auth.uid())
  );

DROP POLICY IF EXISTS debut_metrics_service ON public.debut_metrics;
CREATE POLICY debut_metrics_service ON public.debut_metrics
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');