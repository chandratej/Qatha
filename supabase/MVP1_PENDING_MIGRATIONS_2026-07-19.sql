-- ═══════════════════════════════════════════════════════════════════
-- Katha MVP-1 — consolidated pending migrations (030 → 041)
-- Generated 2026-07-19 after verify-wave-migrations.mjs found 18 gaps
-- against Supabase project qviedmve… (core tables OK through 029).
-- All statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE).
-- Apply: paste entire file into Supabase Dashboard → SQL Editor → Run.
-- Then re-verify: cd MVP/backend && node scripts/verify-wave-migrations.mjs
-- ═══════════════════════════════════════════════════════════════════

-- ────────────────────────── migrations/030_wave2a_review_drafts.sql ──────────────────────────
-- Migration 030: Wave 2a — server-side review workspace drafts (LRC-ARC-01, LRC-05-D6)
-- Literary Council: drafts survive device switch — retention-driving craft loop
-- Security Council: draft_payload scoped to assignment + reviewer slot via API

ALTER TABLE public.peer_review_assignments
  ADD COLUMN IF NOT EXISTS draft_payload JSONB,
  ADD COLUMN IF NOT EXISTS draft_saved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accept_due_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_peer_review_assignments_draft
  ON public.peer_review_assignments(reviewer_slot)
  WHERE draft_payload IS NOT NULL
    AND status IN ('accepted', 'in_review');
-- ────────────────────────── migrations/031_wave2b_review_annotations.sql ──────────────────────────
-- Migration 031: Wave 2b — normalized review annotations + threads + trial review (LRC-06-D4, LRC-09-D3, LRC-02-D5)
-- Literary Council: versioned craft feedback with auditable collaboration threads
-- Legal & Trust: trial review score visible to moderators before pool access

CREATE TABLE IF NOT EXISTS public.review_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.peer_review_requests(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.peer_review_assignments(id) ON DELETE SET NULL,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  reviewer_slot TEXT,
  chapter_ref TEXT,
  scene_ref TEXT,
  paragraph_ref TEXT,
  sentence_ref TEXT,
  passage_ref TEXT,
  anchor_start INT,
  anchor_end INT,
  category TEXT NOT NULL DEFAULT 'other',
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  reason TEXT NOT NULL DEFAULT '',
  recommendation TEXT NOT NULL DEFAULT '',
  expected_impact TEXT NOT NULL DEFAULT '',
  reviewer_confidence INT NOT NULL DEFAULT 75,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'addressed', 'resolved', 'archived')),
  author_resolution TEXT NOT NULL DEFAULT 'pending'
    CHECK (author_resolution IN ('pending', 'accepted', 'rejected', 'deferred')),
  resolved_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_annotations_request ON public.review_annotations(request_id);
CREATE INDEX IF NOT EXISTS idx_review_annotations_story ON public.review_annotations(story_id);

CREATE TABLE IF NOT EXISTS public.annotation_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  annotation_id UUID NOT NULL REFERENCES public.review_annotations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('author', 'reviewer', 'moderator')),
  body TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_annotation_threads_annotation ON public.annotation_threads(annotation_id);

ALTER TABLE public.review_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotation_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS review_annotations_author ON public.review_annotations;
CREATE POLICY review_annotations_author ON public.review_annotations
  FOR SELECT USING (
    request_id IN (SELECT id FROM public.peer_review_requests WHERE author_id = auth.uid())
  );

DROP POLICY IF EXISTS review_annotations_service ON public.review_annotations;
CREATE POLICY review_annotations_service ON public.review_annotations
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS annotation_threads_participant ON public.annotation_threads;
CREATE POLICY annotation_threads_participant ON public.annotation_threads
  FOR SELECT USING (
    annotation_id IN (
      SELECT ra.id FROM public.review_annotations ra
      JOIN public.peer_review_requests pr ON pr.id = ra.request_id
      WHERE pr.author_id = auth.uid()
    )
    OR author_id = auth.uid()
  );

DROP POLICY IF EXISTS annotation_threads_insert ON public.annotation_threads;
CREATE POLICY annotation_threads_insert ON public.annotation_threads
  FOR INSERT WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS annotation_threads_service ON public.annotation_threads;
CREATE POLICY annotation_threads_service ON public.annotation_threads
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trial review fields (LRC-02-D5)
ALTER TABLE public.reviewer_profiles
  ADD COLUMN IF NOT EXISTS training_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_review_payload JSONB,
  ADD COLUMN IF NOT EXISTS trial_review_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS trial_review_submitted_at TIMESTAMPTZ;
-- ────────────────────────── migrations/032_wave3_peer_revision_reputation.sql ──────────────────────────
-- Migration 032: Wave 3 — revision rounds, reputation events, moderation cases
-- LRC-08-D4, LRC-10-D4, LRC-13-D6, LRC-12-D3

ALTER TABLE public.peer_review_requests
  ADD COLUMN IF NOT EXISTS revision_round INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revision_notes TEXT,
  ADD COLUMN IF NOT EXISTS last_resubmitted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.reputation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  delta_rqi NUMERIC(6,2) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reputation_events_profile ON public.reputation_events(profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.moderation_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_type TEXT NOT NULL CHECK (case_type IN ('review_dispute', 'reviewer_conduct', 'appeal', 'fraud_flag')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.peer_review_requests(id) ON DELETE SET NULL,
  reason TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_moderation_cases_status ON public.moderation_cases(status, created_at DESC);

ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reputation_events_self ON public.reputation_events;
CREATE POLICY reputation_events_self ON public.reputation_events
  FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS reputation_events_service ON public.reputation_events;
CREATE POLICY reputation_events_service ON public.reputation_events
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS moderation_cases_service ON public.moderation_cases;
CREATE POLICY moderation_cases_service ON public.moderation_cases
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS moderation_cases_reporter ON public.moderation_cases;
CREATE POLICY moderation_cases_reporter ON public.moderation_cases
  FOR SELECT USING (reporter_id = auth.uid());
-- ────────────────────────── migrations/033_wave5_ai_advisory.sql ──────────────────────────
-- Migration 033: Wave 5 — advisory AI suggestions audit trail (LRC-07-D3)

CREATE TABLE IF NOT EXISTS public.ai_review_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL,
  request_id UUID NOT NULL REFERENCES public.peer_review_requests(id) ON DELETE CASCADE,
  reviewer_slot TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'craft',
  body TEXT NOT NULL,
  evidence TEXT NOT NULL DEFAULT '',
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'ignored')),
  provider TEXT NOT NULL DEFAULT 'heuristic' CHECK (provider IN ('heuristic', 'xai')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_review_suggestions_assignment
  ON public.ai_review_suggestions(assignment_id, status, created_at DESC);

ALTER TABLE public.ai_review_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_review_suggestions_service ON public.ai_review_suggestions;
CREATE POLICY ai_review_suggestions_service ON public.ai_review_suggestions
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
-- ────────────────────────── migrations/034_wave7_agreement_analytics.sql ──────────────────────────
-- Migration 034: Agreement consent + review analytics events (Wave 7)
-- Legal & Trust: agreement version audit (LRC-02-D8, Foundations §1.1)
-- Data Council: reproducible analytics from DB (LRC-17-D3)

ALTER TABLE public.reviewer_profiles
  ADD COLUMN IF NOT EXISTS agreement_version TEXT,
  ADD COLUMN IF NOT EXISTS agreement_accepted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.review_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  request_id UUID REFERENCES public.peer_review_requests(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES public.peer_review_assignments(id) ON DELETE SET NULL,
  actor_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_analytics_events_type
  ON public.review_analytics_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_analytics_events_request
  ON public.review_analytics_events (request_id)
  WHERE request_id IS NOT NULL;
-- ────────────────────────── migrations/035_wave8_satisfaction_audit.sql ──────────────────────────
-- Migration 035: Author satisfaction + annotation stale metadata (Wave 8)
-- Data Council: LRC-17-D5 quality signal
-- Literary Council: LRC-19-D6 version mismatch handling

ALTER TABLE public.peer_review_requests
  ADD COLUMN IF NOT EXISTS author_satisfaction_rating INT
    CHECK (author_satisfaction_rating IS NULL OR author_satisfaction_rating BETWEEN 1 AND 5);
-- ────────────────────────── migrations/036_wave9_debut_season.sql ──────────────────────────
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
-- ────────────────────────── migrations/037_wave10_community_posts.sql ──────────────────────────
-- Wave 10 — Creator community feed (posts + love reactions)

CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'chapter_share'
    CHECK (post_type IN ('chapter_share', 'milestone', 'discussion')),
  body TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 500),
  story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  story_title TEXT,
  chapter_number INT CHECK (chapter_number IS NULL OR chapter_number > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_created
  ON public.community_posts(created_at DESC);

CREATE TABLE IF NOT EXISTS public.community_post_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'love' CHECK (reaction_type = 'love'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_community_reactions_post
  ON public.community_post_reactions(post_id);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_posts_read ON public.community_posts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY community_posts_insert ON public.community_posts
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY community_reactions_read ON public.community_post_reactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY community_reactions_insert ON public.community_post_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY community_reactions_delete ON public.community_post_reactions
  FOR DELETE USING (user_id = auth.uid());
-- ────────────────────────── migrations/038_interactive_content_types.sql ──────────────────────────
-- Wave 25 — Interactive fiction & vernacular chat-fiction content types (PRD Content_Format)

ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'epistolary_chat';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'interactive_branching';
-- ────────────────────────── migrations/039_story_versions.sql ──────────────────────────
-- Story Versioning System (MVP1) — storage-agnostic domain, document table as default adapter
-- Domain concepts: Version, VersionSnapshot, VersionTimeline (immutable history; restore = new version)

CREATE TABLE IF NOT EXISTS public.story_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id TEXT,
  version_number INT NOT NULL CHECK (version_number > 0),
  version_name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version_type TEXT NOT NULL CHECK (version_type IN ('AutoCheckpoint', 'Manual', 'Publish', 'Draft')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Restored', 'Archived')),
  restored_from_id UUID REFERENCES public.story_versions(id) ON DELETE SET NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  word_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_story_versions_story_chapter_time
  ON public.story_versions(story_id, chapter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_story_versions_story_number
  ON public.story_versions(story_id, chapter_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_story_versions_status
  ON public.story_versions(story_id, status);

ALTER TABLE public.story_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS story_versions_creator_all ON public.story_versions;
CREATE POLICY story_versions_creator_all ON public.story_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_id AND s.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_id AND s.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS story_versions_service ON public.story_versions;
CREATE POLICY story_versions_service ON public.story_versions
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE public.story_versions IS
  'Story version history (immutable). Restore creates a new row; never mutates prior content. Storage adapter may be replaced without API change.';

-- ────────────────────────── migrations/040_reader_content_hygiene.sql ──────────────────────────
-- 040: Reader content hygiene
-- 1) Reading time from word-ish plain text (not raw char_length / 1000)
-- 2) Scrub known film-IP phrases from published story descriptions

CREATE OR REPLACE FUNCTION calculate_read_time()
RETURNS TRIGGER AS $$
DECLARE
  plain text;
  words int;
BEGIN
  -- Strip tags roughly, then count whitespace-separated tokens.
  plain := regexp_replace(coalesce(NEW.content, ''), '<[^>]+>', ' ', 'gi');
  plain := regexp_replace(plain, '&nbsp;', ' ', 'gi');
  plain := regexp_replace(plain, '\s+', ' ', 'g');
  plain := btrim(plain);

  IF plain = '' THEN
    words := 0;
  ELSE
    words := array_length(regexp_split_to_array(plain, '\s+'), 1);
  END IF;

  -- ~180 wpm Telugu long-form (matches gateway + backend publish helpers)
  NEW.estimated_read_time_minutes := GREATEST(1, ROUND(words / 180.0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recompute for existing published chapters so list rows stop showing "1 min"
-- when the body is a real manuscript.
UPDATE public.chapters
SET content = content
WHERE status = 'published' AND content IS NOT NULL;

-- Remove known copyrighted film / celebrity IP from reader-facing descriptions.
UPDATE public.stories
SET description = regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          coalesce(description, ''),
          'S\.?\s*S\.?\s*Rajamouli',
          'a celebrated director',
          'gi'
        ),
        'Rajamouli',
        'a celebrated director',
        'gi'
      ),
      'Allu\s*Arjun',
      'a star performer',
      'gi'
    ),
    '\yRRR\y',
    'an epic period drama',
    'g'
  ),
  'రౌద్రం\s*రణం\s*రుధిరం',
  'ఒక ఇతిహాస కథ',
  'g'
)
WHERE description IS NOT NULL
  AND (
    description ~* 'Rajamouli'
    OR description ~ '\yRRR\y'
    OR description ~ 'రౌద్రం\s*రణం\s*రుధిరం'
    OR description ~* 'Allu\s*Arjun'
  );

-- ────────────────────────── migrations/041_mvp1_legal_consent_search.sql ──────────────────────────
-- 041: MVP-1 legal consent + Telugu-aware public search helpers

-- Creator / reader consent records (DPDP — versioned, timestamped)
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  -- e.g. dpdp_privacy_v1 | creator_agreement_v1 | marketing_optional
  policy_version TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT true,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (user_id, consent_type, policy_version)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user
  ON public.user_consents (user_id, accepted_at DESC);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dpdp_consent_version TEXT,
  ADD COLUMN IF NOT EXISTS dpdp_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS creator_agreement_version TEXT,
  ADD COLUMN IF NOT EXISTS creator_agreement_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grievance_contact_seen_at TIMESTAMPTZ;

-- Beta-reader structured feedback (pre-publish optional; also usable post-publish)
CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  invite_id UUID,
  reviewer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_email TEXT,
  category TEXT NOT NULL CHECK (category IN ('typo', 'pacing', 'confusion', 'praise', 'other')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_story
  ON public.beta_feedback (story_id, chapter_number, created_at DESC);

-- Public search: trigram already on chapters; add story title/description search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS search_document TEXT;

UPDATE public.stories
SET search_document = coalesce(title, '') || ' ' || coalesce(description, '')
WHERE search_document IS NULL;

CREATE OR REPLACE FUNCTION public.stories_search_document_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_document := coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stories_search_document ON public.stories;
CREATE TRIGGER trg_stories_search_document
  BEFORE INSERT OR UPDATE OF title, description ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.stories_search_document_trigger();

CREATE INDEX IF NOT EXISTS idx_stories_search_trgm
  ON public.stories USING gin (search_document gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_stories_title_trgm
  ON public.stories USING gin (title gin_trgm_ops);

-- RPC: public story search (Telugu + English substring/trigram — no English-only stemming)
CREATE OR REPLACE FUNCTION public.search_public_stories(q text, lim int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  genre text,
  cover_url text,
  chapter_count int,
  total_readers int,
  rank real
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    s.id,
    s.title,
    s.description,
    s.genre,
    s.cover_url,
    s.chapter_count,
    s.total_readers,
    greatest(
      similarity(coalesce(s.search_document, ''), q),
      similarity(coalesce(s.title, ''), q)
    )::real AS rank
  FROM public.stories s
  WHERE s.is_published = true
    AND (
      s.search_document ILIKE '%' || q || '%'
      OR s.title ILIKE '%' || q || '%'
      OR similarity(coalesce(s.search_document, ''), q) > 0.08
    )
  ORDER BY rank DESC NULLS LAST, s.total_readers DESC NULLS LAST
  LIMIT greatest(1, least(lim, 50));
$$;

GRANT EXECUTE ON FUNCTION public.search_public_stories(text, int) TO anon, authenticated, service_role;
